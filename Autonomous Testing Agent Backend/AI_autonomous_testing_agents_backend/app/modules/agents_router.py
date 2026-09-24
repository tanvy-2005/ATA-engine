import logging
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
import asyncio

# Import agent inputs & outputs
from app.agents.planner.agent import PlannerAgent, PlannerInput, PlannerOutput
from app.agents.explorer.agent import ExplorerAgent, ExplorerInput, ExplorerOutput
from app.agents.generator.agent import GeneratorAgent, GeneratorInput, GeneratorOutput
from app.agents.validator.agent import ValidatorAgent, ValidatorInput, ValidatorOutput
from app.agents.bug_analyzer.agent import BugAnalyzerAgent, BugAnalyzerInput, BugAnalyzerOutput
from app.agents.reporter.agent import ReporterAgent, ReporterInput, ReporterOutput
from app.orchestrator.workflow import OrchestratorWorkflow
from app.db.mongodb import db_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/agents", tags=["AI Agents"])

# Simple dependency injection functions
def get_planner():
    return PlannerAgent()

def get_explorer():
    return ExplorerAgent()

def get_generator():
    return GeneratorAgent()

def get_validator():
    return ValidatorAgent()

def get_bug_analyzer():
    return BugAnalyzerAgent()

def get_reporter():
    return ReporterAgent()

def get_orchestrator():
    return OrchestratorWorkflow()

@router.post("/planner", response_model=PlannerOutput)
async def run_planner(payload: PlannerInput, agent: PlannerAgent = Depends(get_planner)):
    try:
        return await agent.execute(payload)
    except Exception as e:
        logger.error(f"Planner endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explorer", response_model=ExplorerOutput)
async def run_explorer(payload: ExplorerInput, agent: ExplorerAgent = Depends(get_explorer)):
    try:
        return await agent.execute(payload)
    except Exception as e:
        logger.error(f"Explorer endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generator", response_model=GeneratorOutput)
async def run_generator(payload: GeneratorInput, agent: GeneratorAgent = Depends(get_generator)):
    try:
        return await agent.execute(payload)
    except Exception as e:
        logger.error(f"Generator endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validator", response_model=ValidatorOutput)
async def run_validator(payload: ValidatorInput, agent: ValidatorAgent = Depends(get_validator)):
    try:
        return await agent.execute(payload)
    except Exception as e:
        logger.error(f"Validator endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/bug-analyzer", response_model=BugAnalyzerOutput)
async def run_bug_analyzer(payload: BugAnalyzerInput, agent: BugAnalyzerAgent = Depends(get_bug_analyzer)):
    try:
        return await agent.execute(payload)
    except Exception as e:
        logger.error(f"Bug Analyzer endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reporter", response_model=ReporterOutput)
async def run_reporter(payload: ReporterInput, agent: ReporterAgent = Depends(get_reporter)):
    try:
        return await agent.execute(payload)
    except Exception as e:
        logger.error(f"Reporter endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Global state to keep track of running pipelines and lock URLs in memory to prevent race conditions
active_pipelines: Dict[str, asyncio.Event] = {}
running_urls: Dict[str, str] = {}  # Map: target_url -> execution_id

# Pipeline trigger class
class PipelineTriggerPayload(PlannerInput):
    workspace_id: Optional[str] = None
    force_restart: Optional[bool] = False
    test_type: str = "e2e"
    repo_url: Optional[str] = None

async def execute_pipeline_task(payload: PipelineTriggerPayload, orchestrator: OrchestratorWorkflow, cancel_event: asyncio.Event, execution_id: str):
    try:
        await orchestrator.run_full_pipeline(
            project_name=payload.project_name,
            description=payload.description,
            target_url=payload.target_url,
            cancel_event=cancel_event,
            execution_id=execution_id,
            workspace_id=payload.workspace_id,
            test_type=payload.test_type,
            repo_url=payload.repo_url
        )
    except Exception as e:
        logger.error(f"Background pipeline failed: {e}")
    finally:
        # Cleanup
        active_pipelines.pop(execution_id, None)
        active_pipelines.pop("default_pipeline", None)
        running_urls.pop(payload.target_url, None)
        # Ensure DB lock is released if run is still marked Running
        if db_client.db is not None:
            try:
                from bson.objectid import ObjectId
                from datetime import datetime, timezone
                now_str = datetime.now(timezone.utc).isoformat()
                criteria = {"_id": ObjectId(execution_id)} if ObjectId.is_valid(execution_id) else {"_id": execution_id}
                await db_client.db["runs"].update_one(
                    {**criteria, "status": "Running"},
                    {"$set": {"status": "Failed", "error": "Pipeline execution terminated without completion", "updated_at": now_str}}
                )
            except Exception as e_clean:
                logger.debug(f"Could not release MongoDB running lock: {e_clean}")

@router.post("/run-all")
async def run_full_pipeline(payload: PipelineTriggerPayload, background_tasks: BackgroundTasks, orchestrator: OrchestratorWorkflow = Depends(get_orchestrator)):
    try:
        if not payload.target_url:
            raise HTTPException(status_code=400, detail="target_url is required for full pipeline run.")
        
        from app.tools.playwright import check_site_reachability
        is_reachable, unreach_reason = await check_site_reachability(payload.target_url)
        if not is_reachable:
            if "REDIRECTED:" in unreach_reason:
                final_url = unreach_reason.split("REDIRECTED: ")[1].strip()
                logger.info(f"Target URL {payload.target_url} redirects. Automatically updating target to final URL: {final_url}.")
                payload.target_url = final_url
            else:
                logger.warning(f"Target URL {payload.target_url} is unreachable ({unreach_reason}). Rejecting pipeline run.")
                raise HTTPException(
                    status_code=400,
                    detail="This website is currently unreachable or unresponsive. To ensure accurate analysis, automated testing and PDF report generation have been restricted for this site. Please verify the URL or check the site's availability and try again."
                )
        
        # If force_restart is requested, cancel existing pipeline and release locks first
        if payload.force_restart:
            cancel_event = active_pipelines.get("default_pipeline")
            if cancel_event:
                cancel_event.set()
            running_urls.pop(payload.target_url, None)
            active_pipelines.pop("default_pipeline", None)
            if db_client.db is not None:
                try:
                    await db_client.db["runs"].update_many(
                        {"target_url": payload.target_url, "status": "Running"},
                        {"$set": {"status": "Cancelled"}}
                    )
                except Exception as db_err:
                    logger.debug(f"MongoDB force restart update skipped (offline mode): {db_err}")

        # 1. Memory lock guard: Check if already running in memory to prevent race condition double-launches
        if not payload.force_restart and payload.target_url in running_urls:
            existing_id = running_urls[payload.target_url]
            logger.info(f"Pipeline already running (in-memory lock) for URL {payload.target_url}. Ignoring duplicate request.")
            return {
                "status": "already_running",
                "message": "A pipeline is already running for this target URL.",
                "execution_id": existing_id
            }

        # 2. Database guard: Double safeguard if entry exists in DB (resilient to offline/DNS errors)
        if not payload.force_restart and db_client.db is not None:
            try:
                existing_running = await db_client.db["runs"].find_one({
                    "target_url": payload.target_url,
                    "status": "Running"
                })
                if existing_running:
                    from datetime import datetime, timezone
                    now_utc = datetime.now(timezone.utc)
                    run_time = existing_running.get("updated_at") or existing_running.get("created_at")
                    is_stale = False
                    if run_time and isinstance(run_time, datetime):
                        if (now_utc - run_time).total_seconds() > 600:
                            is_stale = True
                    elif payload.target_url not in running_urls:
                        # If not active in memory and no fresh update, treat DB lock as stale
                        is_stale = True

                    if is_stale:
                        logger.warning(f"Releasing stale DB lock for {payload.target_url} (run_id={existing_running.get('_id')}).")
                        await db_client.db["runs"].update_one(
                            {"_id": existing_running["_id"]},
                            {"$set": {"status": "Cancelled", "error": "Released stale lock after timeout"}}
                        )
                        existing_running = None
                    else:
                        # Sync memory lock
                        running_urls[payload.target_url] = str(existing_running["_id"])
                        logger.info(f"Pipeline already running (DB check) for URL {payload.target_url}. Ignoring duplicate request.")
                        return {
                            "status": "already_running",
                            "message": "A pipeline is already running for this target URL.",
                            "execution_id": str(existing_running["_id"])
                        }
            except Exception as db_err:
                logger.debug(f"MongoDB DB check skipped (running offline/local mode): {db_err}")

        # Create new execution context
        from datetime import datetime, timezone
        from bson.objectid import ObjectId
        
        run_id = ObjectId()
        run_doc = {
            "_id": run_id,
            "project_name": payload.project_name or "Custom Project",
            "target_url": payload.target_url,
            "status": "Running",
            "progress": 0,
            "created_at": datetime.now(timezone.utc),
            "total_tests": 0,
            "passed": 0,
            "failed": 0,
            "duration": "0s"
        }
        
        if db_client.db is not None:
            try:
                await db_client.db["runs"].insert_one(run_doc)
            except Exception as db_err:
                logger.debug(f"MongoDB run insertion skipped (running offline/local mode): {db_err}")
            
        execution_id = str(run_id)
        
        # Set locks
        running_urls[payload.target_url] = execution_id
        cancel_event = asyncio.Event()
        active_pipelines[execution_id] = cancel_event
        active_pipelines["default_pipeline"] = cancel_event

        # Run pipeline safely in background
        background_tasks.add_task(
            execute_pipeline_task,
            payload,
            orchestrator,
            cancel_event,
            execution_id
        )
        return {
            "status": "started", 
            "message": "Pipeline execution started in background. Connecting via WebSocket for logs.",
            "execution_id": execution_id
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Failed to start orchestrator pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status/{execution_id}")
async def get_pipeline_status(execution_id: str, orchestrator: OrchestratorWorkflow = Depends(get_orchestrator)):
    try:
        # Load from active cache or checkpoint file
        state = orchestrator._load_checkpoint(execution_id)
        if not state:
            # Let's search runs database if it was completed earlier
            if db_client.db is not None:
                from bson.objectid import ObjectId
                run = None
                try:
                    run = await db_client.db["runs"].find_one({"_id": ObjectId(execution_id)})
                except Exception:
                    pass
                if not run:
                    try:
                        run = await db_client.db["runs"].find_one({"_id": execution_id})
                    except Exception:
                        pass
                if run:
                    report_doc = None
                    try:
                        report_doc = await db_client.db["reports"].find_one({"execution_id": execution_id})
                        if not report_doc and run.get("report_id") and ObjectId.is_valid(run.get("report_id")):
                            report_doc = await db_client.db["reports"].find_one({"_id": ObjectId(run.get("report_id"))})
                        if report_doc:
                            report_doc["_id"] = str(report_doc.get("_id", ""))
                    except Exception:
                        pass
                    return {
                        "status": run.get("status", "Completed"),
                        "progress": 100,
                        "logs": ["Pipeline execution retrieved from history database."],
                        "agent_states": {},
                        "shared_memory": {
                            "reporter_output": report_doc,
                            "stats": {
                                "total_tests": run.get("total_tests", 0),
                                "passed": run.get("passed", 0),
                                "failed": run.get("failed", 0)
                            }
                        }
                    }
            raise HTTPException(status_code=404, detail="Execution checkpoint not found")
        
        return state.model_dump()
    except Exception as e:
        logger.error(f"Failed to fetch pipeline status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel")
async def cancel_pipeline():
    try:
        cancel_event = active_pipelines.get("default_pipeline")
        if cancel_event:
            cancel_event.set()
        # Immediately release running locks and update database runs so restart/subsequent runs can proceed
        running_urls.clear()
        active_pipelines.pop("default_pipeline", None)
        if db_client.db is not None:
            try:
                await db_client.db["runs"].update_many(
                    {"status": "Running"},
                    {"$set": {"status": "Cancelled"}}
                )
            except Exception as db_err:
                logger.debug(f"MongoDB cancel update skipped (offline mode): {db_err}")
        logger.info("Cancellation signal sent and locks cleared.")
        return {"status": "cancelled", "message": "Pipeline cancellation requested."}
    except Exception as e:
        logger.error(f"Error cancelling pipeline: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/runs")
async def get_runs():
    try:
        if db_client.db is None:
            return []
        
        runs_cursor = db_client.db["runs"].find().sort("created_at", -1).limit(50)
        runs = await runs_cursor.to_list(length=50)
        
        # Convert ObjectId to string for JSON serialization
        for run in runs:
            run["_id"] = str(run["_id"])
            
        return runs
    except Exception as e:
        logger.error(f"Failed to fetch runs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from bson.objectid import ObjectId

@router.get("/reports/{report_id}")
async def get_report(report_id: str):
    try:
        if db_client.db is None:
            raise HTTPException(status_code=503, detail="Database not connected")
        
        report = await db_client.db["reports"].find_one({"_id": ObjectId(report_id)})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
            
        report["_id"] = str(report["_id"])
        return report
    except Exception as e:
        logger.error(f"Failed to fetch report {report_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/reports/{report_id}")
async def delete_report(report_id: str):
    try:
        if db_client.db is None:
            raise HTTPException(status_code=503, detail="Database not connected")
        
        clean_id = report_id.strip().strip('"').strip("'")
        obj_id = None
        if ObjectId.is_valid(clean_id):
            obj_id = ObjectId(clean_id)

        # 1. Gather all potential report ID references
        potential_report_ids = [clean_id]
        if obj_id:
            potential_report_ids.append(obj_id)
            potential_report_ids.append(str(obj_id))

        # Find any matching run first to check if we can resolve other linked IDs
        run_query = {"$or": [
            {"_id": clean_id},
            {"id": clean_id},
            {"report_id": clean_id},
            {"execution_id": clean_id},
            {"run_id": clean_id},
        ]}
        if obj_id:
            run_query["$or"].extend([
                {"_id": obj_id},
                {"id": obj_id},
                {"report_id": obj_id},
                {"report_id": str(obj_id)},
                {"execution_id": obj_id},
                {"run_id": obj_id},
            ])

        runs_cursor = db_client.db["runs"].find(run_query)
        async for run_doc in runs_cursor:
            r_id = run_doc.get("report_id")
            if r_id:
                potential_report_ids.append(r_id)
                if isinstance(r_id, str) and ObjectId.is_valid(r_id):
                    potential_report_ids.append(ObjectId(r_id))
            run_id_val = run_doc.get("_id")
            if run_id_val:
                potential_report_ids.append(run_id_val)
                if isinstance(run_id_val, str) and ObjectId.is_valid(run_id_val):
                    potential_report_ids.append(ObjectId(run_id_val))

        # 2. Delete reports matching any of the gathered report IDs
        report_delete_query = {"$or": []}
        for rid in set(potential_report_ids):
            report_delete_query["$or"].append({"_id": rid})
            report_delete_query["$or"].append({"id": rid})
            report_delete_query["$or"].append({"report_id": rid})
            report_delete_query["$or"].append({"execution_id": rid})
            report_delete_query["$or"].append({"run_id": rid})
        
        deleted_reports = 0
        if report_delete_query["$or"]:
            res_rep = await db_client.db["reports"].delete_many(report_delete_query)
            deleted_reports = res_rep.deleted_count

        # 3. Delete runs matching run query
        res_run = await db_client.db["runs"].delete_many(run_query)
        deleted_runs = res_run.deleted_count
            
        return {
            "status": "success", 
            "message": f"Successfully deleted {deleted_reports} reports and {deleted_runs} run records."
        }
    except Exception as e:
        logger.error(f"Failed to delete report {report_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class BulkDeleteReportsRequest(BaseModel):
    report_ids: list[str]

@router.post("/reports/bulk-delete")
async def bulk_delete_reports(payload: BulkDeleteReportsRequest):
    try:
        if db_client.db is None:
            raise HTTPException(status_code=503, detail="Database not connected")
        deleted_reports = 0
        deleted_runs = 0
        for rid in payload.report_ids:
            clean_id = rid.strip().strip('"').strip("'")
            queries = [{"_id": clean_id}, {"id": clean_id}, {"report_id": clean_id}, {"execution_id": clean_id}]
            if ObjectId.is_valid(clean_id):
                queries.append({"_id": ObjectId(clean_id)})
            res_rep = await db_client.db["reports"].delete_many({"$or": queries})
            deleted_reports += res_rep.deleted_count
            res_run = await db_client.db["runs"].delete_many({"$or": queries})
            deleted_runs += res_run.deleted_count
        return {
            "status": "success",
            "message": f"Successfully deleted {deleted_reports} reports and {deleted_runs} runs."
        }
    except Exception as e:
        logger.error(f"Failed to bulk delete reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tests")
async def get_tests():
    try:
        if db_client.db is None:
            return []
            
        tests_cursor = db_client.db["test_cases"].find().sort("created_at", -1).limit(100)
        tests = await tests_cursor.to_list(length=100)
        
        for test in tests:
            test["_id"] = str(test["_id"])
            if "id" not in test:
                test["id"] = str(test["_id"])
            # Only set status/agent if genuinely missing — never inject dummy project names
            if "status" not in test:
                test["status"] = "PASS"
            if "generated_by_agent" not in test:
                test["generated_by_agent"] = "GeneratorAgent"
            
        return tests
    except Exception as e:
        logger.error(f"Failed to fetch tests: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/tests/{test_id}")
async def delete_test(test_id: str):
    try:
        if db_client.db is None:
            raise HTTPException(status_code=503, detail="Database not connected")
        
        criteria = {}
        if ObjectId.is_valid(test_id):
            criteria = {"$or": [{"_id": ObjectId(test_id)}, {"id": test_id}]}
        else:
            criteria = {"id": test_id}
            
        res = await db_client.db["test_cases"].delete_one(criteria)
        if res.deleted_count == 0:
            res = await db_client.db["test_cases"].delete_one({"_id": test_id})
            
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Test case not found")
        return {"status": "success", "message": "Test case deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete test {test_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import FileResponse

@router.post("/generate-pdf")
async def generate_pdf_post(payload: Dict[str, Any]):
    try:
        from app.tools.pdf_generator import generate_pdf_report
        from app.db.mongodb import db_client
        from bson.objectid import ObjectId

        execution_id = payload.get("execution_id") or payload.get("report_output", {}).get("report_id")

        # --- Resolve execution_id dynamically if missing ---
        import os as _os
        import json as _json
        target_url_param = payload.get("targetUrl") or payload.get("target_url")
        if not execution_id and target_url_param:
            execution_id = running_urls.get(target_url_param)

        # Locate checkpoints directory
        CHECKPOINTS_DIR = _os.path.join(
            _os.path.dirname(_os.path.abspath(__file__)), "..", "..", ".artifacts", "checkpoints"
        )
        if not _os.path.exists(CHECKPOINTS_DIR):
            CHECKPOINTS_DIR = _os.path.join(
                _os.path.dirname(_os.path.abspath(__file__)), "..", "..", "artifacts", "checkpoints"
            )

        # Auto-discover latest checkpoint if execution_id is still missing
        if not execution_id and _os.path.exists(CHECKPOINTS_DIR):
            try:
                cp_files = sorted(
                    [_os.path.join(CHECKPOINTS_DIR, f) for f in _os.listdir(CHECKPOINTS_DIR) if f.endswith(".json")],
                    key=_os.path.getmtime,
                    reverse=True
                )
                for cpf in cp_files:
                    try:
                        with open(cpf, "r", encoding="utf-8") as f_tmp:
                            data_tmp = _json.load(f_tmp)
                        sh_tmp = data_tmp.get("shared_memory") or {}
                        if target_url_param and sh_tmp.get("target_url") == target_url_param:
                            execution_id = _os.path.splitext(_os.path.basename(cpf))[0]
                            break
                    except Exception:
                        continue
                if not execution_id and cp_files:
                    execution_id = _os.path.splitext(_os.path.basename(cp_files[0]))[0]
            except Exception as e_find:
                logger.debug(f"Could not scan checkpoint files: {e_find}")

        # --- 1. ALWAYS enrich payload from local checkpoint (primary source of truth) ---
        if execution_id and _os.path.exists(CHECKPOINTS_DIR):
            checkpoint_path = _os.path.join(CHECKPOINTS_DIR, f"{execution_id}.json")
            if _os.path.exists(checkpoint_path):
                try:
                    with open(checkpoint_path, "r", encoding="utf-8") as f:
                        checkpoint = _json.load(f)
                    shared = checkpoint.get("shared_memory") or {}
                    cp_status = str(checkpoint.get("status") or "").lower()

                    # Block PDF if checkpoint shows the run is still in progress or cancelled/aborted/failed
                    if cp_status in ["cancelled", "aborted", "failed"]:
                        raise HTTPException(
                            status_code=400,
                            detail="This website is currently unreachable or unresponsive. To ensure accurate analysis, automated testing and PDF report generation have been restricted for this site. Please verify the URL or check the site's availability and try again." if cp_status == "failed" else "PDF cannot be generated: pipeline was aborted/cancelled (no report available)."
                        )

                    # Always pull real project/url from checkpoint
                    if checkpoint.get("project_name"):
                        payload["projectName"] = checkpoint["project_name"]
                    if checkpoint.get("target_url"):
                        payload["targetUrl"] = checkpoint["target_url"]

                    # Pull all agent outputs from checkpoint
                    if shared.get("explorer_output"):
                        exp_out = shared["explorer_output"]
                        payload["explorer_output"] = exp_out
                        # Bubble up screenshot URL to top-level so PDF cover page can find it
                        ss_path = (
                            exp_out.get("screenshot_path") or
                            exp_out.get("screenshot") or
                            (exp_out.get("page_state_snapshot") or {}).get("screenshot") or
                            ""
                        )
                        if ss_path:
                            payload["screenshot_path"] = ss_path
                        # Bubble up discovered_links count and page title
                        page_info = exp_out.get("page_info") or {}
                        if page_info.get("title"):
                            payload["page_title"] = page_info["title"]
                        if page_info.get("page_load_time"):
                            payload.setdefault("execution_time", page_info["page_load_time"])
                    if shared.get("validator_output"):
                        val_results = shared["validator_output"].get("validation_results", [])
                        if val_results:
                            payload["validation_results"] = val_results
                    if shared.get("bug_analyzer_output"):
                        bug_analyses = shared["bug_analyzer_output"].get("bug_analyses", [])
                        if bug_analyses:
                            payload["bug_analyses"] = bug_analyses
                    if shared.get("generator_output"):
                        test_cases = shared["generator_output"].get("test_cases", [])
                        if test_cases:
                            payload["test_cases"] = test_cases
                    if shared.get("reporter_output"):
                        rep_out = shared["reporter_output"]
                        for key in ["summary", "execution_statistics", "bug_summary", "failed_test_cases",
                                    "recommendations", "top_issues", "overall_assessment", "overall_status",
                                    "severity_distribution", "executive_summary"]:
                            if key in rep_out and rep_out[key] is not None:
                                payload[key] = rep_out[key]
                    # Also expose bug_summary as bug_analyses if needed
                    if not payload.get("bug_analyses") and payload.get("bug_summary"):
                        payload["bug_analyses"] = payload["bug_summary"]
                    # Always stamp execution_id on the payload
                    payload["execution_id"] = execution_id
                except HTTPException:
                    raise
                except Exception as cp_err:
                    logger.warning(f"Could not load checkpoint {execution_id}: {cp_err}")

        # --- 2. Enrich from MongoDB (secondary source, fills gaps) ---
        if execution_id and db_client.db is not None:
            try:
                run_doc = None
                if ObjectId.is_valid(execution_id):
                    run_doc = await db_client.db["runs"].find_one({"_id": ObjectId(execution_id)})
                if not run_doc:
                    run_doc = await db_client.db["runs"].find_one({"_id": execution_id})

                if run_doc:
                    # Only block if DB explicitly says running, cancelled, or failed
                    db_status = str(run_doc.get("status") or "").lower()
                    if db_status in ["cancelled", "running", "failed"]:
                        raise HTTPException(
                            status_code=400,
                            detail="This website is currently unreachable or unresponsive. To ensure accurate analysis, automated testing and PDF report generation have been restricted for this site. Please verify the URL or check the site's availability and try again." if db_status == "failed" else f"PDF report cannot be generated: pipeline status is '{db_status}'."
                        )
                    # Fill project/url if still missing (checkpoint took precedence above)
                    if run_doc.get("project_name") and not payload.get("projectName"):
                        payload["projectName"] = run_doc["project_name"]
                    if run_doc.get("target_url") and not payload.get("targetUrl"):
                        payload["targetUrl"] = run_doc["target_url"]
                    if run_doc.get("environment") and not payload.get("environment"):
                        payload["environment"] = run_doc["environment"]
                    duration = run_doc.get("duration") or run_doc.get("execution_time")
                    if duration:
                        payload["execution_time"] = duration

                metadata_list = []
                cursor = db_client.db["agent_metadata"].find({"execution_id": execution_id})
                async for doc in cursor:
                    doc["_id"] = str(doc["_id"])
                    metadata_list.append(doc)
                if metadata_list:
                    payload["agent_metadata_list"] = metadata_list

                # Pull report doc from DB if we still don't have reporter data
                report_doc = None
                if ObjectId.is_valid(execution_id):
                    report_doc = await db_client.db["reports"].find_one({"_id": ObjectId(execution_id)})
                if not report_doc:
                    report_doc = await db_client.db["reports"].find_one({"execution_id": execution_id})
                if report_doc:
                    report_doc["_id"] = str(report_doc.get("_id", ""))
                    for key in ["bug_summary", "recommendations", "top_issues", "overall_assessment",
                                "overall_status", "failed_test_cases", "severity_distribution", "summary"]:
                        if key in report_doc and not payload.get(key):
                            payload[key] = report_doc[key]
                    if report_doc.get("bug_summary") and not payload.get("bug_analyses"):
                        payload["bug_analyses"] = report_doc["bug_summary"]
            except HTTPException:
                raise
            except Exception as enrich_err:
                logger.warning(f"Could not enrich PDF payload from DB: {enrich_err}")

        logger.info(f"PDF generation: projectName={payload.get('projectName')}, targetUrl={payload.get('targetUrl')}, "
                    f"tests={len(payload.get('test_cases', []))}, validation={len(payload.get('validation_results', []))}, "
                    f"bugs={len(payload.get('bug_analyses', []))}, overall_status={payload.get('overall_status')}")

        proj_slug = (payload.get('projectName') or 'report').lower().replace(' ', '_').replace('/', '_')
        run_suffix = execution_id or payload.get("report_id") or "run"
        filename = f"{proj_slug}_{str(run_suffix)[:8]}_report.pdf"
        pdf_path = generate_pdf_report(payload, filename=filename)

        # Persist generated PDF path back to MongoDB report and run
        if execution_id and db_client.db is not None:
            try:
                await db_client.db["reports"].update_one(
                    {"execution_id": execution_id},
                    {"$set": {"pdf_path": pdf_path, "pdf_filename": filename}}
                )
                await db_client.db["runs"].update_one(
                    {"_id": ObjectId(execution_id)} if ObjectId.is_valid(execution_id) else {"execution_id": execution_id},
                    {"$set": {"pdf_path": pdf_path, "pdf_filename": filename}}
                )
            except Exception as store_err:
                logger.warning(f"Could not save pdf_path to mongo: {store_err}")

        return FileResponse(
            path=pdf_path,
            filename=filename,
            media_type="application/pdf"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"PDF generation endpoint error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


class AutoRepairInput(BaseModel):
    test_case_id: str
    suggested_repair: str

@router.post("/auto-repair")
async def auto_repair_test(payload: AutoRepairInput):
    """Self-Healing endpoint: parse the suggested fix, patch the locator registry,
    simulate re-running Playwright, and return updated validation results."""
    try:
        from app.tools.auto_repair import run_auto_repair
        logger.info(f"[Self-Healing] Initiating auto-repair for test case: {payload.test_case_id}")
        result = run_auto_repair(
            test_case_id=payload.test_case_id,
            suggested_repair=payload.suggested_repair,
        )
        # Echo repair logs to the application logger so the WS telemetry stream
        # picks them up and the frontend terminal shows real-time progress.
        for log_line in result.get("repair_logs", []):
            logger.info(log_line)
        return result
    except Exception as e:
        logger.error(f"Auto-repair endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
