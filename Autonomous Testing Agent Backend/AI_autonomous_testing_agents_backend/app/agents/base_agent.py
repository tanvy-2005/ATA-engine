import time
import asyncio
import logging
from abc import ABC, abstractmethod
from typing import Any, Optional
from datetime import datetime, timezone
from app.orchestrator.orchestrator_state import GlobalExecutionState, AgentStatus
from app.llm.model_manager import AIModelManager

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    def __init__(self, name: str, max_retries: int = 1, timeout_seconds: float = 300.0):
        self.name = name
        self.max_retries = max_retries
        self.timeout_seconds = timeout_seconds

    async def generate(
        self,
        state: GlobalExecutionState,
        prompt: str,
        system_prompt: Optional[str] = None,
        response_format: Optional[str] = None
    ) -> str:
        """
        Route generation call through AIModelManager, log metadata to MongoDB, and state logs.
        """
        from app.db.mongodb import db_client

        content, metadata = await AIModelManager.generate(
            agent_name=self.name,
            prompt=prompt,
            system_prompt=system_prompt,
            response_format=response_format
        )

        metadata["execution_id"] = state.execution_id
        metadata["timestamp"] = datetime.now(timezone.utc).isoformat()

        # Write metadata to MongoDB
        if db_client.db is not None:
            try:
                async def save_metadata():
                    await db_client.db["agent_metadata"].insert_one(metadata.copy())
                asyncio.create_task(save_metadata())
            except Exception as e:
                logger.error(f"Failed to log agent metadata: {e}")

        model_name = metadata.get('model_name') or metadata.get('model') or 'gemini-3.6-flash'
        provider = metadata.get('provider') or 'unknown'
        
        state.log(
            f"Agent '{self.name}' executed model '{model_name}' ({provider}). "
            f"Latency: {metadata.get('latency', 0)}s, Tokens (In/Out): {metadata.get('input_tokens', 0)}/{metadata.get('output_tokens', 0)}"
        )

        return content

    @abstractmethod
    async def execute_task(self, state: GlobalExecutionState) -> Any:
        """
        Concrete agent logic. Reads inputs from state.shared_memory and writes outputs to it.
        """
        pass

    async def run(self, state: GlobalExecutionState) -> Any:
        """
        Standardized execution wrapper that tracks timing, runs retries, 
        and updates the global execution state.
        """
        state.current_agent = self.name
        state.log(f"Agent '{self.name}' execution started")
        state.update_agent_status(self.name, AgentStatus.RUNNING)

        retry_count = 0
        start_time = time.perf_counter()

        while retry_count <= self.max_retries:
            try:
                # Wrap with task execution
                result = await self.execute_task(state)
                
                elapsed = round(time.perf_counter() - start_time, 2)
                state.update_agent_status(
                    self.name, 
                    AgentStatus.SUCCESS, 
                    elapsed=elapsed,
                    retry_count=retry_count
                )
                if self.name not in state.completed_agents:
                    state.completed_agents.append(self.name)
                state.log(f"Agent '{self.name}' completed successfully in {elapsed}s")
                return result
            except Exception as e:
                retry_count += 1
                elapsed = round(time.perf_counter() - start_time, 2)
                
                if retry_count <= self.max_retries:
                    state.log(f"Agent '{self.name}' failed with: {str(e)}. Retrying ({retry_count}/{self.max_retries})...")
                    state.update_agent_status(
                        self.name, 
                        AgentStatus.RETRYING, 
                        error=str(e),
                        retry_count=retry_count, 
                        elapsed=elapsed
                    )
                    # Non-blocking backoff
                    await asyncio.sleep(1)
                else:
                    state.log(f"Agent '{self.name}' failed permanently after {retry_count} retries. Error: {str(e)}")
                    state.update_agent_status(
                        self.name, 
                        AgentStatus.FAILED, 
                        error=str(e),
                        retry_count=retry_count - 1, 
                        elapsed=elapsed
                    )
                    if self.name not in state.failed_agents:
                        state.failed_agents.append(self.name)
                    state.status = "Failed"
                    raise e
