import asyncio
import json
import logging
from typing import Any, Dict
from pydantic import BaseModel
from fastapi import APIRouter, Request, BackgroundTasks, Depends
from sse_starlette.sse import EventSourceResponse

from app.orchestrator.workflow import OrchestratorWorkflow
from app.modules.agents_router import get_orchestrator, active_pipelines, running_urls, PipelineTriggerPayload

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/runs", tags=["runs"])

class StartRunRequest(BaseModel):
    projectId: str
    targetUrl: str
    pipelineType: str = "8-Stage Orchestration Suite"
    executionMode: str = "parallel"
    workers: int = 4
    modelProvider: str | None = None

@router.post("/start", status_code=202)
async def start_run(req: StartRunRequest, background_tasks: BackgroundTasks, orchestrator: OrchestratorWorkflow = Depends(get_orchestrator)):
    from datetime import datetime, timezone
    from app.memory.session_memory import session_memory
    
    if req.modelProvider:
        session_memory.set("model_override", req.modelProvider)

    from bson.objectid import ObjectId
    from app.db.mongodb import db_client
    
    run_id = ObjectId()
    execution_id = str(run_id)
    
    # Simple db init logic
    run_doc = {
        "_id": run_id,
        "project_name": req.projectId,
        "target_url": req.targetUrl,
        "status": "INITIALIZING",
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
        except Exception as e:
            logger.debug(f"DB insert failed: {e}")
            
    payload = PipelineTriggerPayload(
        project_name=req.projectId,
        description="Autonomous testing run",
        target_url=req.targetUrl,
        workspace_id=None,
        force_restart=False
    )
    
    cancel_event = asyncio.Event()
    active_pipelines[execution_id] = cancel_event
    running_urls[req.targetUrl] = execution_id
    
    from app.modules.agents_router import execute_pipeline_task
    background_tasks.add_task(
        execute_pipeline_task,
        payload,
        orchestrator,
        cancel_event,
        execution_id
    )
    
    return {
        "runId": execution_id,
        "status": "INITIALIZING",
        "sseEndpoint": f"/api/v1/runs/{execution_id}/stream"
    }

async def sse_event_generator(request: Request, run_id: str, orchestrator: OrchestratorWorkflow):
    """
    Streams live telemetry events from the global execution state to the client.
    """
    # Wait slightly to ensure run initializes
    await asyncio.sleep(1)
    
    while True:
        if await request.is_disconnected():
            logger.info("Client disconnected from SSE.")
            break
            
        state = orchestrator._load_checkpoint(run_id)
        if state:
            status = state.status.upper()
            progress_percent = state.progress
            if status in ["COMPLETED", "FAILED", "ABORTED", "CANCELLED"]:
                progress_percent = 100
                
            # Extract execution results
            executor_results = state.shared_memory.get("executor_output", {}).get("results", [])
            fail_count = sum(1 for r in executor_results if r.get("status") in ["FAILED", "ERROR"])
            pass_count = sum(1 for r in executor_results if r.get("status") in ["PASSED", "SUCCESS"])

            # If all test cases failed during execution (6 failed, 0 passed)
            if len(executor_results) > 0 and pass_count == 0 and fail_count == 0:
                fail_count = len(executor_results)

            event_data = {
                "stage": status if status in ["COMPLETED", "FAILED"] else state.current_stage.upper() if state.current_stage else "INITIALIZING",
                "progressPercent": progress_percent,
                "activeWorkers": 4, # Parallel
                "passCount": pass_count,
                "failCount": fail_count,
                "targetPages": state.pages_discovered,
                "generatedCases": state.tests_generated,
                "currentAction": state.current_action or "System initialized. Ready to execute.",
                "vncStreamUrl": f"wss://sandbox.internal/vnc/{run_id}",
                "agents": [
                    {
                        "agentId": aid.lower().replace(" ", "_"),
                        "status": astate.status.value,
                        "progress": 100 if astate.status.value.lower() in ["success", "completed"] else (50 if astate.status.value.lower() == "running" else 0),
                        "elapsedTime": round(astate.execution_time)
                    }
                    for aid, astate in state.agent_states.items()
                ]
            }
            
            yield json.dumps(event_data)
            
            if status in ["COMPLETED", "FAILED", "ABORTED", "CANCELLED"]:
                break
                
        await asyncio.sleep(0.1)  # 100ms debouncing (10 FPS)
        
@router.get("/{run_id}/stream")
async def run_stream(request: Request, run_id: str, orchestrator: OrchestratorWorkflow = Depends(get_orchestrator)):
    return EventSourceResponse(sse_event_generator(request, run_id, orchestrator))
