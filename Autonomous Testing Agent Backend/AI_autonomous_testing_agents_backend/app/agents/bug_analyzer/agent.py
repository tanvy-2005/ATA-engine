import logging
import json
from app.agents.bug_analyzer.state import BugAnalyzerInput, BugAnalyzerOutput, BugAnalysisDetails
from app.llm.utils import load_prompt
from app.memory.execution_memory import execution_memory
from app.agents.base_agent import BaseAgent
from app.orchestrator.orchestrator_state import GlobalExecutionState

logger = logging.getLogger(__name__)

from typing import Optional


class BugAnalyzerAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="BugAnalyzer", max_retries=1)
        self.system_prompt = load_prompt("bug_analyzer.txt")

    async def execute_task(self, state: GlobalExecutionState) -> list:
        existing = execution_memory.get_agent_output("bug_analyzer")
        if existing and isinstance(existing, dict) and "bug_analyses" in existing:
            state.log("BugAnalyzerAgent already completed for this run. Reusing cached analysis.")
            state.shared_memory["bug_analyzer_output"] = existing
            return existing["bug_analyses"]

        val_out = state.shared_memory.get("validator_output", {})
        validation_results = val_out.get("validation_results", [])

        executor_out = state.shared_memory.get("executor_output", {})
        execution_results = executor_out.get("execution_results", [])

        # Also get test cases to enrich title info
        generator_out = state.shared_memory.get("generator_output", {})
        test_cases = generator_out.get("test_cases", [])
        tc_map = {str(tc.get("id", "")): tc for tc in test_cases}

        bug_analyses = []
        state.current_action = "Verifying assertions and running root-cause analysis..."
        state.log("BugAnalyzerAgent starting. Analyzing failures...")

        failed_validations = [v for v in validation_results if v.get("status") == "FAIL"]
        
        if not failed_validations:
            state.log("BugAnalyzerAgent: No failed tests to analyze. Skipping.")
            state.shared_memory["bug_analyzer_output"] = {"bug_analyses": []}
            execution_memory.set_agent_output("bug_analyzer", {"bug_analyses": []})
            state.update_progress(90)
            return []

        for val in failed_validations:
            tc_id = val.get("test_case_id")
            state.log(f"Analyzing failure for Test Case {tc_id}")

            # Find the execution details from executor results
            exec_details = next((res for res in execution_results if str(res.get("test_case_id")) == str(tc_id)), {})
            tc_info = tc_map.get(str(tc_id), {})

            inputs = BugAnalyzerInput(
                test_case_id=str(tc_id),
                title=str(tc_info.get("title", exec_details.get("title", ""))),
                error_message=str(exec_details.get("error_message") or exec_details.get("outcome", "")),
                dom_snapshot="DOM truncated/unavailable",
                console_logs=exec_details.get("console_logs", [])[:3],
                network_logs=exec_details.get("network_logs", [])[:3],
                screenshot_path=exec_details.get("screenshot_path")
            )

            try:
                output = await self.execute(inputs, state=state)
                bug_dict = output.bug_analysis.dict()
                # Ensure test_case_id is set in the bug dict
                bug_dict["test_case_id"] = str(tc_id)
                bug_dict["test_id"] = str(tc_id)
                bug_analyses.append(bug_dict)

                # Integrations: Jira & Slack
                integrations = state.shared_memory.get("integrations", {})

                if "jira" in integrations:
                    try:
                        from app.shared.integrations.jira_client import JiraClient
                        jira_cfg = integrations["jira"]
                        j_client = JiraClient(jira_cfg.get("host"), jira_cfg.get("email"), jira_cfg.get("apiToken"), jira_cfg.get("projectKey"))

                        summary = f"[ATA Bug] Test Case {tc_id} Failed: {bug_dict.get('bug_type', 'Unknown Error')}"
                        desc = f"**Root Cause:**\n{bug_dict.get('root_cause')}\n\n**Issue:**\n{bug_dict.get('issue')}\n\n**Suggested Fix:**\n{bug_dict.get('suggested_fix')}\n\n**Severity:** {bug_dict.get('severity')}"

                        issue_key = await j_client.create_bug_issue(summary, desc)
                        if issue_key:
                            state.log(f"Created Jira Bug: {issue_key}")
                    except Exception as e:
                        state.log(f"Jira integration failed: {e}")

                if "slack" in integrations:
                    try:
                        from app.shared.integrations.slack_client import SlackClient
                        slack_cfg = integrations["slack"]
                        slack_client = SlackClient(slack_cfg.get("webhookUrl"), slack_cfg.get("channel"))
                        await slack_client.send_bug_alert(state.project_name, bug_dict.get("issue", "Unknown bug"))
                    except Exception as e:
                        state.log(f"Slack bug alert failed: {e}")
            except Exception as e:
                state.log(f"Bug analysis LLM call failed for {tc_id}: {str(e)}. Using fallback.")
                err_msg = exec_details.get("error_message") or exec_details.get("outcome") or "Unknown error"
                fallback_bug = {
                    "test_case_id": str(tc_id),
                    "test_id": str(tc_id),
                    "bug_type": "Functional",
                    "issue": f"Test case {tc_id} failed: {err_msg[:200]}",
                    "severity": "High",
                    "priority": "High",
                    "root_cause": f"Execution failure: {err_msg[:200]}",
                    "suggested_fix": "Review the element selectors and verify target application behavior.",
                    "confidence_score": 0.7,
                }
                bug_analyses.append(fallback_bug)
                execution_memory.add_bug_analysis(fallback_bug)

        output_dict = {"bug_analyses": bug_analyses}
        execution_memory.set_agent_output("bug_analyzer", output_dict)
        state.shared_memory["bug_analyzer_output"] = output_dict
        state.update_progress(90)
        return bug_analyses

    async def execute(self, inputs: BugAnalyzerInput, state: Optional[GlobalExecutionState] = None) -> BugAnalyzerOutput:
        logger.info(f"Running BugAnalyzerAgent for Test Case ID: {inputs.test_case_id}")

        console_snippet = json.dumps(inputs.console_logs[:3] if inputs.console_logs else [], separators=(',', ':'))
        network_snippet = json.dumps(inputs.network_logs[:3] if inputs.network_logs else [], separators=(',', ':'))

        prompt = (
            f"Failing Test Case ID: {inputs.test_case_id}\n"
            f"Test Title: {inputs.title or 'Not available'}\n"
            f"Error/Outcome: {inputs.error_message or 'Not available'}\n"
            f"Console logs: {console_snippet}\n"
            f"Failed Network logs: {network_snippet}\n"
            f"Screenshot: {inputs.screenshot_path or 'Not captured'}\n"
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
                    agent_name="BugAnalyzer",
                    prompt=prompt,
                    system_prompt=self.system_prompt,
                    response_format="json"
                )

            data = json.loads(response_text)

            # Normalize: LLM may return nested {"bug_analysis": {...}} or flat dict
            if "bug_analysis" in data and isinstance(data["bug_analysis"], dict):
                bug_data = data["bug_analysis"]
            else:
                bug_data = data

            # Map fields — handle alternative field names from the LLM
            normalized = {
                "test_case_id": str(inputs.test_case_id),
                "bug_type": bug_data.get("bug_type") or bug_data.get("category") or bug_data.get("type") or "Functional",
                "issue": bug_data.get("issue") or bug_data.get("failure_explanation") or bug_data.get("description") or "Test failed",
                "severity": bug_data.get("severity") or "Medium",
                "priority": bug_data.get("priority") or "Medium",
                "root_cause": bug_data.get("root_cause") or "Not determined",
                "suggested_fix": bug_data.get("suggested_fix") or bug_data.get("recommendation") or "Review and fix the identified issue",
                "confidence_score": float(bug_data.get("confidence_score") or bug_data.get("confidence") or 0.8),
            }

            details = BugAnalysisDetails(**normalized)
            output = BugAnalyzerOutput(bug_analysis=details)

            # Save bug analysis to execution memory
            execution_memory.add_bug_analysis(details.dict())
            execution_memory.set_agent_output("bug_analyzer", {"bug_analyses": [details.dict()]})

            return output

        except Exception as e:
            logger.error(f"Error executing BugAnalyzerAgent: {e}")
            raise e
