import logging
import json
from app.agents.base_agent import BaseAgent
from app.orchestrator.orchestrator_state import GlobalExecutionState

logger = logging.getLogger(__name__)

class MemoryAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Memory", max_retries=1)

    async def execute_task(self, state: GlobalExecutionState) -> dict:
        from app.memory.execution_memory import execution_memory
        existing = execution_memory.get_agent_output("memory") or state.shared_memory.get("memory_output")
        if existing and isinstance(existing, dict) and "compressed_context" in existing:
            state.log("MemoryAgent already completed for this run. Reusing cached context.")
            state.shared_memory["memory_output"] = existing
            return existing

        state.log("MemoryAgent starting. Compressing execution logs & structuring context...")
        
        # Read the console logs and previous outputs
        explorer_out = state.shared_memory.get("explorer_output", {})
        executor_out = state.shared_memory.get("executor_output", {})
        execution_results = executor_out.get("execution_results", [])
        
        # Aggregate logs to summarize (cap at 15 to stay within token limits)
        logs_to_summarize = [
            f"Test Case: {res.get('test_case_id')} | Outcome: {res.get('outcome')} | Error: {str(res.get('error_message', 'None'))[:50]}"
            for res in execution_results[:15]
        ]
        
        prompt = (
            f"Target URL: {state.target_url}\n"
            f"Crawled Routes: {', '.join(explorer_out.get('discovered_links', [])[:5])}\n"
            f"Execution Results Logs:\n" + "\n".join(logs_to_summarize) + "\n"
        )
        
        system_prompt = (
            "You are the Memory Agent. Your task is to compress the test execution context, "
            "summarize the logs, and structure the shared memory. "
            "You MUST output valid JSON with keys: "
            "'compressed_context', 'execution_log_summary', 'key_highlights', 'suggested_focus_areas'."
        )

        try:
            response_text = await self.generate(
                state=state,
                prompt=prompt,
                system_prompt=system_prompt,
                response_format="json"
            )
            
            output_data = json.loads(response_text)
            
            # Store in shared memory
            state.shared_memory["memory_output"] = output_data
            
            # Add to state logs
            state.log(f"Memory Agent compressed context. Key Highlight: {output_data.get('key_highlights', ['None'])[0]}")
            state.update_progress(70)
            return output_data
            
        except Exception as e:
            logger.error(f"Error executing MemoryAgent: {e}")
            # Fallback output
            fallback = {
                "compressed_context": "Fallback execution compression.",
                "execution_log_summary": "Failed to run summarization LLM step.",
                "key_highlights": ["Execution logs completed."],
                "suggested_focus_areas": ["Manual regression testing recommended."]
            }
            state.shared_memory["memory_output"] = fallback
            state.update_progress(70)
            return fallback
