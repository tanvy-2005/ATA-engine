from enum import Enum
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import uuid

class AgentStatus(str, Enum):
    IDLE = "Idle"
    RUNNING = "Running"
    SUCCESS = "Success"
    WARNING = "Warning"
    FAILED = "Failed"
    RETRYING = "Retrying"
    SKIPPED = "Skipped"

class AgentState(BaseModel):
    status: AgentStatus = AgentStatus.IDLE
    execution_time: float = 0.0
    retry_count: int = 0
    error_object: Optional[str] = None
    logs: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class GlobalExecutionState(BaseModel):
    execution_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_name: str
    target_url: str
    test_type: str = "e2e"
    repo_url: Optional[str] = None
    status: str = "Running" # Running, Completed, Failed, Cancelled, Aborted
    current_agent: Optional[str] = None
    current_stage: str = "init"
    pages_discovered: int = 0
    pages_total: Optional[int] = None
    tests_generated: int = 0
    tests_executed: int = 0
    tests_total: int = 0
    current_action: str = "Initializing pipeline..."
    started_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_agents: List[str] = Field(default_factory=list)
    failed_agents: List[str] = Field(default_factory=list)
    agent_states: Dict[str, AgentState] = Field(default_factory=dict)
    shared_memory: Dict[str, Any] = Field(default_factory=dict)
    logs: List[str] = Field(default_factory=list)
    execution_time: float = 0.0
    progress: int = 0

    def log(self, message: str):
        timestamp = datetime.now(timezone.utc).isoformat()
        log_entry = f"[{timestamp}] {message}"
        self.logs.append(log_entry)
        self.last_updated_at = timestamp
        
        try:
            from app.modules.runs_router import sse_event_queues
            q = sse_event_queues.get(self.execution_id)
            if q:
                q.put_nowait({"currentAction": message})
        except Exception:
            pass

    def update_progress(self, value: int):
        self.progress = value
        self.log(f"Pipeline progress updated: {value}%")

    def update_agent_status(self, agent_name: str, status: AgentStatus, error: Optional[str] = None, retry_count: int = 0, elapsed: float = 0.0, meta: Optional[Dict[str, Any]] = None):
        if agent_name not in self.agent_states:
            self.agent_states[agent_name] = AgentState()
        
        state = self.agent_states[agent_name]
        state.status = status
        state.execution_time = elapsed
        state.retry_count = retry_count
        if error:
            state.error_object = error
        if meta:
            state.metadata.update(meta)
        
        self.last_updated_at = datetime.now(timezone.utc).isoformat()
        self.log(f"Agent '{agent_name}' status updated to {status.value} (Retries: {retry_count}, Time: {elapsed}s)")
