import logging
import json
import os
import asyncio
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from app.agents.planner.agent import PlannerAgent
from app.agents.explorer.agent import ExplorerAgent
from app.agents.generator.agent import GeneratorAgent
from app.agents.executor.agent import ExecutorAgent, PipelineAbortError
from app.agents.validator.agent import ValidatorAgent
from app.agents.bug_analyzer.agent import BugAnalyzerAgent
from app.agents.reporter.agent import ReporterAgent
from app.agents.memory.agent import MemoryAgent

from app.orchestrator.orchestrator_state import GlobalExecutionState, AgentStatus
from app.memory.session_memory import session_memory
from app.memory.site_memory import site_memory
from app.memory.execution_memory import execution_memory
from app.tools.browser import browser_manager
from app.tools.artifacts import save_artifact
from app.db.mongodb import db_client

logger = logging.getLogger(__name__)

# Directory for state checkpoints
CHECKPOINTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".artifacts", "checkpoints")

class OrchestratorWorkflow:
    def __init__(self):
        self.planner = PlannerAgent()
        self.explorer = ExplorerAgent()
        self.generator = GeneratorAgent()
        self.executor = ExecutorAgent()
        self.validator = ValidatorAgent()
        self.bug_analyzer = BugAnalyzerAgent()
        self.reporter = ReporterAgent()
        self.memory = MemoryAgent()
        self._is_running = False

        # Define sequential pipeline
        self.pipeline = [
            self.planner,
            self.explorer,
            self.generator,
            self.executor,
            self.memory,
            self.validator,
            self.bug_analyzer,
            self.reporter
        ]

    def _save_checkpoint(self, state: GlobalExecutionState):
        """
        Saves the current execution state to disk and MongoDB if available.
        """
        try:
            os.makedirs(CHECKPOINTS_DIR, exist_ok=True)
            checkpoint_path = os.path.join(CHECKPOINTS_DIR, f"{state.execution_id}.json")
            
            # Serialize state
            state_data = state.dict()
            with open(checkpoint_path, "w") as f:
                json.dump(state_data, f, indent=2)
            
            # Save to MongoDB if connected
            if db_client.db is not None:
                async def _save_db():
                    try:
                        await db_client.db["checkpoints"].replace_one(
                            {"execution_id": state.execution_id},
                            state_data,
                            upsert=True
                        )
                    except Exception as db_e:
                        logger.error(f"Failed to save checkpoint to MongoDB: {db_e}")
                asyncio.create_task(_save_db())
        except Exception as e:
            logger.error(f"Failed to save checkpoint: {e}")

    def _load_checkpoint(self, execution_id: str) -> Optional[GlobalExecutionState]:
        """
        Loads the execution state from disk.
        """
        try:
            checkpoint_path = os.path.join(CHECKPOINTS_DIR, f"{execution_id}.json")
            if not os.path.exists(checkpoint_path):
                old_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "artifacts", "checkpoints")
                checkpoint_path = os.path.join(old_dir, f"{execution_id}.json")
            if os.path.exists(checkpoint_path):
                with open(checkpoint_path, "r") as f:
                    data = json.load(f)
                return GlobalExecutionState(**data)
        except Exception as e:
            logger.error(f"Failed to load checkpoint: {e}")
        return None

    async def run_full_pipeline(self, project_name: str, description: str, target_url: str, cancel_event: asyncio.Event = None, execution_id: Optional[str] = None, workspace_id: Optional[str] = None, test_type: str = "e2e", repo_url: Optional[str] = None) -> dict:
        if getattr(self, "_is_running", False):
            logger.warning("Pipeline is already running. Ignoring duplicate request.")
            return {"status": "error", "message": "A pipeline execution is already in progress.", "execution_id": execution_id}
            
        self._is_running = True
        try:
            return await self._run_full_pipeline_internal(project_name, description, target_url, cancel_event, execution_id, workspace_id, test_type, repo_url)
        finally:
            self._is_running = False

    async def _run_full_pipeline_internal(self, project_name: str, description: str, target_url: str, cancel_event: asyncio.Event = None, execution_id: Optional[str] = None, workspace_id: Optional[str] = None, test_type: str = "e2e", repo_url: Optional[str] = None) -> dict:
        """
        Runs the full pipeline:
        Sequentially executes Planner -> Explorer -> Generator -> Executor -> Memory -> Validator -> Bug Analyzer -> Reporter
        Supports resuming from checkpoint if execution_id is provided.
        """
        # Fetch active integrations if workspace_id provided
        integrations_config = {}
        if workspace_id and db_client.db is not None:
            try:
                cursor = db_client.db["integrations"].find({"workspaceId": workspace_id, "isEnabled": True})
                active_integrations = await cursor.to_list(length=10)
                for integration in active_integrations:
                    integrations_config[integration["type"]] = integration["config"]
                logger.info(f"Loaded active integrations: {list(integrations_config.keys())}")
            except Exception as e:
                logger.error(f"Failed to load integrations: {e}")

        # Restore or create state
        state = None
        if execution_id:
            state = self._load_checkpoint(execution_id)
            if state and (
                str(state.target_url or "").rstrip("/") != str(target_url or "").rstrip("/") or
                str(state.project_name or "") != str(project_name or "")
            ):
                logger.warning(
                    f"Checkpoint execution_id={execution_id} is for project '{state.project_name}' ({state.target_url}), "
                    f"but requested run is '{project_name}' ({target_url}). Discarding stale checkpoint to prevent cross-run contamination."
                )
                state = None
            elif state:
                state.log(f"Resuming pipeline from last checkpoint for execution ID: {execution_id}")
                state.status = "Running"

        if not state:
            import uuid
            state = GlobalExecutionState(
                execution_id=execution_id if execution_id else str(uuid.uuid4()),
                project_name=project_name,
                target_url=target_url,
                test_type=test_type,
                repo_url=repo_url
            )
            state.log("Initializing new execution pipeline...")
            # Prep inputs for first agent
            state.shared_memory["planner_input"] = {
                "project_name": project_name,
                "description": description,
                "target_url": target_url,
                "test_type": test_type,
                "repo_url": repo_url
            }
            state.shared_memory["integrations"] = integrations_config
            self._save_checkpoint(state)

        # Ensure clean run-specific snapshot: always clear memory layers or re-scope to (execution_id, target_url)
        # Never reuse previous project's routes, links, forms, buttons, screenshots, tests, scores, recommendations or site metadata.
        session_memory.clear()
        site_memory.start_run(state.target_url, run_id=state.execution_id, project_id=state.project_name)
        execution_memory.start_run(state.execution_id, state.target_url, project_id=state.project_name)

        # Ensure browser is running
        await browser_manager.start()
        start_pipeline_time = time.perf_counter()
        
        # Slack Integration (Start)
        integrations_config = state.shared_memory.get("integrations", {})
        if "slack" in integrations_config and not state.status == "Running": # only on fresh start
            try:
                from app.shared.integrations.slack_client import SlackClient
                slack_cfg = integrations_config["slack"]
                slack_client = SlackClient(slack_cfg.get("webhookUrl"), slack_cfg.get("channel"))
                await slack_client.send_run_started(state.project_name, state.target_url)
            except Exception as e:
                state.log(f"Slack start notification failed: {e}")

        # GitHub Integration (Start)
        if "github" in integrations_config and not state.status == "Running":
            gh_sha = state.shared_memory.get("github_sha")
            if gh_sha:
                try:
                    from app.shared.integrations.github_client import GitHubClient
                    gh_cfg = integrations_config["github"]
                    gh_client = GitHubClient(token=gh_cfg.get("token"), repo=gh_cfg.get("repo"))
                    await gh_client.update_commit_status(
                        sha=gh_sha, 
                        state="pending", 
                        context="AI Test Agent", 
                        description="Autonomous testing in progress..."
                    )
                    state.log("GitHub commit status set to pending.")
                except Exception as e:
                    state.log(f"GitHub start notification failed: {e}")

        try:
            for agent in self.pipeline:
                # Check for cancellation
                if cancel_event and cancel_event.is_set():
                    state.status = "Cancelled"
                    state.log("Pipeline execution cancelled by user request.")
                    self._save_checkpoint(state)
                    return {"status": "cancelled", "execution_id": state.execution_id}

                # Skip if already completed successfully in previous run
                if agent.name in state.completed_agents:
                    state.log(f"Skipping agent '{agent.name}' (already completed successfully).")
                    continue

                state.current_agent = agent.name
                self._save_checkpoint(state)

                try:
                    # Run the agent using the standard BaseAgent interface
                    await agent.run(state)
                    # Update live progress telemetry for UI status queries
                    state.current_stage = str(agent.name).lower()
                    
                    from app.modules.runs_router import sse_event_queues
                    q = sse_event_queues.get(state.execution_id)

                    if agent.name == "Planner":
                        planner_out = state.shared_memory.get("planner_output", {})
                        state.current_action = f"Strategy formulated: Executing {state.test_type} suite on discovered interactive targets"
                        if q: q.put_nowait({"type": "log", "agent": "Planner", "message": state.current_action, "summary": str(planner_out.get("project_analysis", "Plan completed."))})
                    elif agent.name == "Explorer":
                        explorer_out = state.shared_memory.get("explorer_output", {})
                        visited_routes = explorer_out.get("visited_routes", [])
                        state.pages_discovered = len(visited_routes) or 1
                        buttons_len = len(explorer_out.get("interactive_elements", {}).get("buttons", []))
                        forms_len = len(explorer_out.get("forms", []))
                        paths_str = ", ".join(visited_routes) if visited_routes else "/"
                        state.current_action = f"Discovered {state.pages_discovered} routes, {buttons_len} interactive buttons, {forms_len} forms. Target paths: {paths_str}"
                        if q: q.put_nowait({"type": "log", "agent": "Explorer", "message": state.current_action, "summary": str(explorer_out.get("site_map", "Exploration completed."))})
                    elif agent.name == "Generator":
                        gen_out = state.shared_memory.get("generator_output", {})
                        tc_list = gen_out.get("test_cases", [])
                        state.tests_generated = len(tc_list)
                        state.tests_total = state.tests_generated
                        tc_names = ", ".join([tc.get("id", "") for tc in tc_list]) if tc_list else "None"
                        state.current_action = f"Generated {state.tests_generated} test scenarios: {tc_names}"
                        if q: q.put_nowait({"type": "log", "agent": "Generator", "message": state.current_action, "summary": f"Generated {state.tests_generated} test cases."})
                    elif agent.name == "Executor":
                        exec_out = state.shared_memory.get("executor_output", {})
                        state.tests_executed = len(exec_out.get("execution_results", []))
                        state.current_action = f"Executor executed {state.tests_executed}/{state.tests_total} test case(s)."
                        if q: q.put_nowait({"type": "log", "agent": "Executor", "message": state.current_action, "summary": f"Execution finished with {state.tests_executed} tests run."})
                    elif agent.name == "Validator":
                        state.current_action = "Validator completed test outcome verification."
                        if q: q.put_nowait({"type": "log", "agent": "Validator", "message": state.current_action, "summary": "Validation completed."})
                    elif agent.name == "BugAnalyzer":
                        bug_out = state.shared_memory.get("buganalyzer_output", {})
                        defects = len(bug_out.get("bugs", []))
                        state.current_action = f"Identified {defects} defects and potential missing accessibility attributes"
                        if q: q.put_nowait({"type": "log", "agent": "Bug Analyzer", "message": state.current_action, "summary": "Bug analysis completed."})
                    elif agent.name == "Reporter":
                        state.current_stage = "completed"
                        state.current_action = "Reporter generated final QA audit report."
                        if q: q.put_nowait({"type": "log", "agent": "Reporter", "message": state.current_action, "summary": "Final report generated."})
                    self._save_checkpoint(state)
                except PipelineAbortError as abort_err:
                    # Executor intentionally aborted due to high failure rate on target website.
                    # Gracefully stop — do NOT proceed to Validator / BugAnalyzer / Reporter.
                    state.status = "Aborted"
                    state.log(f"[Pipeline] Execution aborted after {agent.name}: {abort_err}")
                    
                    # GUARANTEE MEMORY LAYER EXECUTION ON ABORT
                    state.current_agent = "Memory"
                    try:
                        state.log("Running MemoryLayerAgent to save partial execution snapshots...")
                        await self.memory.run(state)
                        state.current_action = "Memory Agent completed."
                    except Exception as mem_err:
                        state.log(f"MemoryLayerAgent failed during abort: {mem_err}")

                    self._save_checkpoint(state)

                    # Save partial results to MongoDB so the run is still visible
                    if db_client.db is not None:
                        try:
                            now = datetime.now(timezone.utc).isoformat()
                            generator_out = state.shared_memory.get("generator_output", {})
                            test_cases = generator_out.get("test_cases", [])
                            executor_out = state.shared_memory.get("executor_output", {})
                            execution_results = executor_out.get("execution_results", [])
                            total = len(test_cases)
                            failed = sum(1 for r in execution_results if r.get("outcome") != "Success")

                            from bson.objectid import ObjectId
                            run_criteria = {"_id": ObjectId(state.execution_id)} if ObjectId.is_valid(state.execution_id) else {"execution_id": state.execution_id}
                            await db_client.db["runs"].update_one(
                                run_criteria,
                                {"$set": {
                                    "status": "aborted",
                                    "total_tests": total,
                                    "failed": failed,
                                    "passed": total - failed,
                                    "duration": f"{round(time.perf_counter() - start_pipeline_time, 2)}s",
                                    "abort_reason": str(abort_err),
                                    "updated_at": now
                                }},
                                upsert=False
                            )
                        except Exception as db_err:
                            logger.warning(f"Could not persist aborted run data: {db_err}")

                    return {
                        "status": "aborted",
                        "reason": str(abort_err),
                        "execution_id": state.execution_id
                    }
                except Exception as agent_err:
                    state.status = "Failed"
                    state.log(f"Agent '{agent.name}' crashed: {agent_err}")
                    self._save_checkpoint(state)
                    # Stop execution immediately on critical agent failures
                    if agent.name in ["Planner", "Explorer"]:
                        raise agent_err
                    # For other agents, log and propagate
                    raise agent_err

            # Mark overall execution as complete
            state.status = "Completed"
            state.execution_time = round(time.perf_counter() - start_pipeline_time, 2)
            state.log(f"Orchestration pipeline execution finished in {state.execution_time}s")
            self._save_checkpoint(state)

            # Pull outputs from shared memory
            planner_out = state.shared_memory.get("planner_output")
            explorer_out = state.shared_memory.get("explorer_output")
            generator_out = state.shared_memory.get("generator_output", {})
            test_cases = generator_out.get("test_cases", [])
            validator_out = state.shared_memory.get("validator_output", {})
            validation_results = validator_out.get("validation_results", [])
            bug_out = state.shared_memory.get("bug_analyzer_output", {})
            bug_analyses = bug_out.get("bug_analyses", [])
            reporter_out = state.shared_memory.get("reporter_output", {})

            # --- MongoDB Persistence ---
            if db_client.db is not None:
                try:
                    now = datetime.now(timezone.utc).isoformat()
                    # 1. Save Test Cases
                    if test_cases:
                        for tc in test_cases:
                            tc["project_name"] = project_name
                            tc["created_at"] = now
                        await db_client.db["test_cases"].insert_many(test_cases)
                                            # 2. Save Report
                    # --- Normalize status for frontend: pass / fail / incomplete ---
                    def _normalize_status(raw_status: str, failed_count: int, total_count: int) -> str:
                        """Calculate status strictly from actual execution results."""
                        if total_count == 0:
                            return "incomplete/error"
                        if failed_count > 0:
                            return "fail"
                        return "pass"

                    total_count = len(test_cases)
                    passed_count = sum(1 for v in validation_results if v.get("status") == "PASS")
                    failed_count = sum(1 for v in validation_results if v.get("status") == "FAIL")

                    if reporter_out:
                        report_doc = reporter_out.copy()
                        report_doc["execution_id"] = state.execution_id
                        report_doc["project_name"] = project_name
                        report_doc["target_url"] = target_url
                        report_doc["created_at"] = now
                        # Save/replace ONE report per completed run execution_id
                        await db_client.db["reports"].update_one(
                            {"execution_id": state.execution_id},
                            {"$set": report_doc},
                            upsert=True
                        )
                        existing_report = await db_client.db["reports"].find_one({"execution_id": state.execution_id})
                        run_report_id = str(existing_report["_id"]) if existing_report else state.execution_id
                        raw_status = reporter_out.get("overall_status", "pass")
                    else:
                        # No reporter output: still finalize the run with available data
                        run_report_id = None
                        raw_status = "fail" if failed_count > 0 else ("pass" if total_count > 0 else "incomplete/error")

                    normalized_status = _normalize_status(raw_status, failed_count, total_count)

                    # 3. Update Run record in database
                    run_doc = {
                        "project_name": project_name,
                        "target_url": target_url,
                        "status": normalized_status,
                        "total_tests": total_count,
                        "passed": passed_count,
                        "failed": failed_count,
                        "duration": f"{state.execution_time}s",
                        "created_at": now
                    }
                    if run_report_id:
                        run_doc["report_id"] = run_report_id

                    from bson.objectid import ObjectId
                    run_criteria = {}
                    if ObjectId.is_valid(state.execution_id):
                        run_criteria = {"_id": ObjectId(state.execution_id)}
                    else:
                        run_criteria = {"execution_id": state.execution_id}

                    await db_client.db["runs"].update_one(
                        run_criteria,
                        {"$set": run_doc},
                        upsert=True
                    )
                    state.log(f"Persisted run results to MongoDB. Status: {normalized_status}")
                except Exception as mongo_err:
                    state.log(f"Error saving to MongoDB: {mongo_err}")
            
            # Save final report JSON artifact
            if reporter_out:
                save_artifact("final_report.json", reporter_out)
                
                # GitHub Integration (Finish)
                gh_sha = state.shared_memory.get("github_sha")
                if gh_sha and "github" in state.shared_memory.get("integrations", {}):
                    try:
                        from app.shared.integrations.github_client import GitHubClient
                        gh_cfg = state.shared_memory["integrations"]["github"]
                        gh_client = GitHubClient(token=gh_cfg.get("token"), repo=gh_cfg.get("repo"))
                        overall_status = reporter_out.get("overall_status", "failed").lower()
                        gh_state = "success" if overall_status == "passed" else "failure"
                        await gh_client.update_commit_status(
                            sha=gh_sha, 
                            state=gh_state, 
                            context="AI Test Agent", 
                            description=f"Tests {overall_status}."
                        )
                    except Exception as e:
                        logger.error(f"GitHub finish notification failed: {e}")

            # Return backwards compatible response
            return {
                "planner_output": planner_out,
                "explorer_output": explorer_out,
                "test_cases": test_cases,
                "validation_results": validation_results,
                "bug_analyses": bug_analyses,
                "report": reporter_out,
                "execution_id": state.execution_id
            }

        except Exception as pipeline_err:
            logger.error(f"Pipeline execution halted due to error: {pipeline_err}")
            
            # GitHub Integration (Error)
            gh_sha = state.shared_memory.get("github_sha")
            if gh_sha and "github" in state.shared_memory.get("integrations", {}):
                try:
                    from app.shared.integrations.github_client import GitHubClient
                    gh_cfg = state.shared_memory["integrations"]["github"]
                    gh_client = GitHubClient(token=gh_cfg.get("token"), repo=gh_cfg.get("repo"))
                    await gh_client.update_commit_status(
                        sha=gh_sha, 
                        state="error", 
                        context="AI Test Agent", 
                        description="Pipeline execution crashed."
                    )
                except Exception:
                    pass
                    
            # Update database status to failed
            try:
                if db_client.db is not None:
                    from bson.objectid import ObjectId
                    run_criteria = {}
                    if ObjectId.is_valid(state.execution_id):
                        run_criteria = {"_id": ObjectId(state.execution_id)}
                    else:
                        run_criteria = {"execution_id": state.execution_id}
                    await db_client.db["runs"].update_one(
                        run_criteria,
                        {"$set": {"status": "failed", "duration": f"{state.execution_time}s"}},
                        upsert=False
                    )
            except Exception as db_err:
                logger.error(f"Failed to update failed run status: {db_err}")
            return {
                "status": "failed",
                "error": str(pipeline_err),
                "execution_id": state.execution_id
            }

    async def resume_pipeline(self, execution_id: str, description: str = "") -> dict:
        """
        Public entrypoint to resume a stalled/failed run from checkpoint.
        """
        state = self._load_checkpoint(execution_id)
        if not state:
            return {"status": "error", "message": f"Checkpoint for ID {execution_id} not found."}
        
        return await self.run_full_pipeline(
            project_name=state.project_name,
            description=description,
            target_url=state.target_url,
            execution_id=execution_id
        )
