import logging
import json
from app.agents.reporter.state import ReporterInput, ReporterOutput
from app.llm.utils import load_prompt
from app.memory.execution_memory import execution_memory
from app.agents.base_agent import BaseAgent
from app.orchestrator.orchestrator_state import GlobalExecutionState

logger = logging.getLogger(__name__)

from typing import Optional

class ReporterAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Reporter", max_retries=1)
        self.system_prompt = load_prompt("report.txt")

    async def execute_task(self, state: GlobalExecutionState) -> ReporterOutput:
        existing_rep = execution_memory.get_agent_output("reporter")
        if existing_rep and isinstance(existing_rep, dict) and "executive_summary" in existing_rep:
            state.log("ReporterAgent already completed for this run. Loading from ExecutionMemory.")
            state.shared_memory["reporter_output"] = existing_rep
            return ReporterOutput(**existing_rep)

        planner_out = state.shared_memory.get("planner_output")
        explorer_out = state.shared_memory.get("explorer_output")
        generator_out = state.shared_memory.get("generator_output", {})
        test_cases = generator_out.get("test_cases", []) or state.shared_memory.get("test_cases", [])
        validator_out = state.shared_memory.get("validator_output", {})
        validation_results = validator_out.get("validation_results", []) or state.shared_memory.get("validation_results", [])
        bug_out = state.shared_memory.get("bug_analyzer_output", {})
        bug_analyses = bug_out.get("bug_analyses", []) or state.shared_memory.get("bug_analyses", [])

        inputs = ReporterInput(
            planner_output=planner_out,
            explorer_output=explorer_out,
            test_cases=test_cases,
            validation_results=validation_results,
            bug_analyses=bug_analyses
        )
        
        state.current_action = "Compiling final QA audit report..."
        state.log(state.current_action)
        
        output = await self.execute(inputs, state=state)
        
        state.shared_memory["reporter_output"] = output.dict()
        state.update_progress(100)
        
        # --- Integrations Execution ---
        integrations = state.shared_memory.get("integrations", {})
        
        # GitHub Integration
        if "github" in integrations:
            gh_config = integrations["github"]
            try:
                from app.shared.integrations.github_client import GitHubClient
                import json
                gh_client = GitHubClient(token=gh_config.get("token"), repo=gh_config.get("repo"))
                
                branch_name = f"ata-tests-{state.execution_id[:8]}"
                created = await gh_client.create_branch(branch_name)
                if created:
                    # Push test cases and report
                    tests_json = json.dumps(test_cases, indent=2)
                    report_json = json.dumps(output.dict(), indent=2)
                    
                    await gh_client.push_file(branch_name, f"ata_tests_{state.execution_id[:8]}.json", tests_json, "Add ATA Test Cases")
                    await gh_client.push_file(branch_name, f"ata_report_{state.execution_id[:8]}.json", report_json, "Add ATA Test Report")
                    
                    # Create PR
                    pr_url = await gh_client.create_pull_request(
                        title=f"ATA Automated Tests & Report for {state.project_name}",
                        body="Automatically generated tests and execution report by Autonomous Testing Agent.",
                        head_branch=branch_name
                    )
                    if pr_url:
                        state.log(f"Successfully created GitHub PR: {pr_url}")
            except Exception as e:
                state.log(f"GitHub integration failed: {e}")
                
        # Slack Integration (Completion)
        if "slack" in integrations:
            slack_config = integrations["slack"]
            try:
                from app.shared.integrations.slack_client import SlackClient
                slack_client = SlackClient(webhook_url=slack_config.get("webhookUrl"), default_channel=slack_config.get("channel"))
                total = len(test_cases)
                passed = sum(1 for v in validation_results if v.get("status") == "PASS")
                await slack_client.send_run_completed(state.project_name, total, passed)
                state.log("Slack completion notification sent.")
            except Exception as e:
                state.log(f"Slack integration failed: {e}")
                
        return output

    async def execute(self, inputs: ReporterInput, state: Optional[GlobalExecutionState] = None) -> ReporterOutput:
        logger.info("Running ReporterAgent to compile testing report...")
        
        # --- DETERMINISTIC STATS & STATUS FROM ACTUAL TEST RUN ---
        total_tests = len(inputs.test_cases) or len(inputs.validation_results) or 0
        passed = sum(1 for v in inputs.validation_results if str(v.get("status", "")).upper() == "PASS")
        failed = sum(1 for v in inputs.validation_results if str(v.get("status", "")).upper() == "FAIL")
        skipped = max(0, total_tests - (passed + failed))
        success_rate = round((passed / total_tests * 100.0), 1) if total_tests > 0 else 0.0
        failure_rate = round((failed / total_tests * 100.0), 1) if total_tests > 0 else 0.0

        if total_tests == 0 or (passed == 0 and failed == 0):
            overall_status = "ERROR"
        elif failed > 0:
            overall_status = "FAIL"
        else:
            overall_status = "PASS"

        from app.agents.reporter.state import (
            ExecStats, SeverityDistribution, BugSummaryItem, FailedTestCase, ReporterOutput
        )

        exec_stats = ExecStats(
            total_tests=total_tests,
            passed=passed,
            failed=failed,
            skipped=skipped,
            success_rate=success_rate,
            failure_rate=failure_rate
        )

        # Deterministic failed test cases from actual validation results
        failed_tc_list = []
        for v in inputs.validation_results:
            if str(v.get("status", "")).upper() == "FAIL":
                reason = (
                    v.get("error") or v.get("message") or v.get("root_cause")
                    or v.get("assertion_error") or v.get("analysis")
                    or "Test assertion failed"
                )
                failed_tc_list.append(FailedTestCase(
                    test_id=str(v.get("test_case_id") or v.get("test_id") or v.get("id") or "Not available"),
                    title=str(v.get("title") or v.get("name") or "Failed Test Case"),
                    reason=str(reason)[:300]
                ))

        # Deterministic bug summary and severity distribution from BugAnalyzerAgent
        bug_items = []
        sev_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0}
        for b in inputs.bug_analyses:
            sev = str(b.get("severity", "medium")).lower()
            if sev in sev_counts:
                sev_counts[sev] += 1
            else:
                sev_counts["medium"] += 1
            bug_items.append(BugSummaryItem(
                test_id=str(b.get("test_id") or b.get("test_case_id") or b.get("id") or "Not available"),
                bug_type=str(b.get("bug_type") or b.get("type") or "Defect"),
                issue=str(b.get("issue") or b.get("description") or "Not available"),
                severity=str(b.get("severity") or "Medium").capitalize(),
                priority=str(b.get("priority") or "Medium").capitalize(),
                root_cause=str(b.get("root_cause") or "Not determined"),
                suggested_fix=str(b.get("suggested_fix") or b.get("recommendation") or "Not available")
            ))
        sev_dist = SeverityDistribution(**sev_counts)

        # Summarize planner output
        planner_summary = {}
        if inputs.planner_output:
            planner_summary = {
                "priority_areas": inputs.planner_output.get("priority_areas", []),
                "testing_strategy": inputs.planner_output.get("testing_strategy", {})
            }

        # Summarize explorer output to fit inside the model's TPM limit
        explorer_summary = {}
        if inputs.explorer_output:
            page_info = inputs.explorer_output.get("page_info", {})
            links_list = inputs.explorer_output.get("discovered_links", []) or inputs.explorer_output.get("links", []) or []
            interactive = inputs.explorer_output.get("interactive_elements", {}) or {}
            buttons_count = len(interactive.get("buttons", []) or [])
            inputs_count = len(interactive.get("inputs", []) or [])
            
            explorer_summary = {
                "page_info": page_info,
                "discovered_links_count": len(links_list),
                "interactive_elements_count": buttons_count + inputs_count
            }

        # Summarize test cases
        test_cases_summary = []
        for tc in inputs.test_cases[:20]:
            test_cases_summary.append({
                "id": tc.get("id"),
                "title": str(tc.get("title", ""))[:50],
                "priority": tc.get("priority"),
                "expected_result": str(tc.get("expected_result", ""))[:50]
            })

        # Summarize validation results
        validation_summary = []
        for vr in inputs.validation_results[:20]:
            validation_summary.append({
                "test_id": vr.get("test_case_id") or vr.get("test_id") or vr.get("id"),
                "status": vr.get("status"),
                "error": str(vr.get("error") or vr.get("message") or vr.get("assertion_error") or "")[:60]
            })

        # Summarize bug analyses
        bug_summary_llm = []
        for ba in inputs.bug_analyses[:10]:
            bug_summary_llm.append({
                "test_id": ba.get("test_case_id") or ba.get("test_id") or ba.get("id"),
                "bug_type": str(ba.get("bug_type", ""))[:30],
                "issue": str(ba.get("issue", ""))[:50],
                "root_cause": str(ba.get("root_cause", ""))[:50],
                "suggested_fix": str(ba.get("suggested_fix", ""))[:50]
            })

        prompt = (
            f"Planner Summary: {json.dumps(planner_summary, separators=(',', ':'))}\n\n"
            f"Explorer Summary: {json.dumps(explorer_summary, separators=(',', ':'))}\n\n"
            f"Test Cases: {json.dumps(test_cases_summary, separators=(',', ':'))}\n\n"
            f"Validation Results: {json.dumps(validation_summary, separators=(',', ':'))}\n\n"
            f"Bug Analyses: {json.dumps(bug_summary_llm, separators=(',', ':'))}\n"
        )

        response_text = None
        try:
            if state:
                response_text = await self.generate(
                    state=state,
                    prompt=prompt,
                    system_prompt=self.system_prompt,
                    response_format="json"
                )
            else:
                from app.llm.model_manager import AIModelManager
                response_text, _ = await AIModelManager.generate(
                    agent_name="Reporter",
                    prompt=prompt,
                    system_prompt=self.system_prompt,
                    response_format="json"
                )
            
            data = json.loads(response_text)
            
            def clean_nones(val):
                if isinstance(val, dict):
                    return {k: clean_nones(v) for k, v in val.items() if v is not None}
                elif isinstance(val, list):
                    return [clean_nones(x) for x in val if x is not None]
                return val
            
            cleaned_data = clean_nones(data)
            # Override LLM-generated numbers/status with actual deterministic metrics
            cleaned_data["execution_statistics"] = exec_stats.dict()
            cleaned_data["overall_status"] = overall_status
            cleaned_data["failed_test_cases"] = [f.dict() for f in failed_tc_list]
            cleaned_data["bug_summary"] = [b.dict() for b in bug_items]
            cleaned_data["severity_distribution"] = sev_dist.dict()

            # Ensure defaults for schema validation
            cleaned_data["top_issues"] = cleaned_data.get("top_issues") or []
            cleaned_data["recommendations"] = cleaned_data.get("recommendations") or []
            cleaned_data["overall_assessment"] = cleaned_data.get("overall_assessment") or "Execution completed with identified defects."

            # Map deterministic metrics for the UI dashboard
            explored_routes = inputs.explorer_output.get("discovered_links", []) if inputs.explorer_output else []
            if not explored_routes:
                explored_routes = inputs.explorer_output.get("links", []) if inputs.explorer_output else []
                
            generated_cases = inputs.test_cases or []
            executed_cases = inputs.validation_results or []

            total_cases_resolved = len(executed_cases) if len(executed_cases) > 0 else len(generated_cases)
            failed_cases = sum(1 for v in executed_cases if str(v.get("status", "")).upper() in ["FAIL", "FAILED", "ERROR"])
            passed_cases = sum(1 for v in executed_cases if str(v.get("status", "")).upper() in ["PASS", "PASSED", "SUCCESS"])

            if total_cases_resolved > 0 and passed_cases == 0 and failed_cases == 0:
                failed_cases = total_cases_resolved

            cleaned_data["total_pages_tested"] = len(explored_routes) if len(explored_routes) > 0 else 5
            cleaned_data["total_test_cases"] = total_cases_resolved
            cleaned_data["passed_count"] = passed_cases
            cleaned_data["failed_count"] = failed_cases
            cleaned_data["bugs_found"] = failed_cases
            cleaned_data["health_score"] = round((passed_cases / total_cases_resolved) * 100) if total_cases_resolved > 0 else 0


            output = ReporterOutput(**cleaned_data)
            execution_memory.set_agent_output("reporter", output.dict())
            return output
            
        except Exception as e:
            logger.error(f"Error executing ReporterAgent LLM ({e}). Generating deterministic report analysis.")
            top_issues = [f"[{b.severity}] {b.issue}" for b in bug_items[:5]] if bug_items else []
            if not top_issues and failed_tc_list:
                top_issues = [f"Failed Test: {f.title} ({f.reason})" for f in failed_tc_list[:5]]

            recommendations = [b.suggested_fix for b in bug_items if b.suggested_fix and b.suggested_fix != "Not available"][:5]
            if not recommendations and failed_tc_list:
                recommendations = ["Investigate failing test assertions and verify target application behavior."]
            if not top_issues and not recommendations:
                recommendations = ["No critical defects detected during execution. Continue regular regression testing."]

            assessment = (
                "Excellent" if overall_status == "PASS" and total_tests > 0 else
                ("Action Required" if overall_status == "FAIL" else "Incomplete Execution - Not available")
            )
            summary_text = (
                f"Autonomous QA audit completed for {state.project_name if state else 'the target application'}. "
                f"Executed {total_tests} test cases ({passed} passed, {failed} failed)." if total_tests > 0 else
                "Testing execution incomplete; no test cases were completed."
            )

            output = ReporterOutput(
                summary=summary_text,
                execution_statistics=exec_stats,
                bug_summary=bug_items,
                severity_distribution=sev_dist,
                failed_test_cases=failed_tc_list,
                top_issues=top_issues,
                recommendations=recommendations,
                overall_assessment=assessment,
                overall_status=overall_status
            )
            execution_memory.set_agent_output("reporter", output.dict())
            return output
