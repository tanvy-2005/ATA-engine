import logging
import json
from app.agents.validator.state import ValidatorInput, ValidatorOutput
from app.llm.utils import load_prompt
from app.memory.execution_memory import execution_memory
from app.agents.base_agent import BaseAgent
from app.orchestrator.orchestrator_state import GlobalExecutionState
from typing import Optional

logger = logging.getLogger(__name__)


class ValidatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Validator", max_retries=1)
        self.system_prompt = load_prompt("validator.txt")

    async def execute_task(self, state: GlobalExecutionState) -> list:
        # Check execution memory first for deduplication
        existing_val = execution_memory.get_agent_output("validator")
        if existing_val and isinstance(existing_val, dict) and "validation_results" in existing_val:
            state.log("ValidatorAgent already completed for this run. Loading from ExecutionMemory.")
            state.shared_memory["validator_output"] = existing_val
            return existing_val["validation_results"]

        executor_out = state.shared_memory.get("executor_output", {})
        execution_results = executor_out.get("execution_results", [])

        validation_results = []
        state.current_action = "Verifying assertions and running root-cause analysis..."
        state.log(f"ValidatorAgent starting. Validating {len(execution_results)} test executions.")

        if not execution_results:
            state.shared_memory["validator_output"] = {"validation_results": []}
            return []

        # --- Deterministic pass/fail from actual executor outcome ---
        # LLM is used only to add analysis/recommendations, not to determine pass/fail status.
        for res in execution_results:
            tc_id = res.get("test_case_id")
            actual = res.get("outcome", "Success")
            title = res.get("title", "")
            expected = str(res.get("expected_result") or "Success")[:100]
            error_msg = str(res.get("error_message") or "")

            # Deterministic: status comes directly from executor outcome
            status = "PASS" if actual == "Success" else "FAIL"

            validation_results.append({
                "test_case_id": tc_id,
                "title": title,
                "status": status,
                "confidence": 95,
                "analysis": f"Actual outcome: {actual}" if status == "PASS" else f"FAILED: {error_msg[:150] or actual}",
                "matched_conditions": ["Execution completed successfully"] if status == "PASS" else [],
                "missing_conditions": [] if status == "PASS" else [f"Expected success but got: {actual[:100]}"],
                "unexpected_behavior": [] if status == "PASS" else [error_msg[:150]] if error_msg else [],
                "discrepancies": [],
                "root_cause": "" if status == "PASS" else error_msg[:200],
                "recommendation": "Continue monitoring." if status == "PASS" else "Investigate the failing test step and selector.",
                "error": error_msg if status == "FAIL" else "",
                "message": error_msg if status == "FAIL" else "",
            })

        # --- Optional: use LLM in batch to enrich analysis (non-blocking, don't affect pass/fail) ---
        try:
            batch_size = 6
            for i in range(0, len(execution_results), batch_size):
                batch = execution_results[i:i + batch_size]
                summary_lines = []
                for res in batch:
                    tc_id = res.get("test_case_id", "unknown")
                    expected = str(res.get("expected_result") or "Success")[:80]
                    actual = str(res.get("outcome") or "Success")[:80]
                    err = str(res.get("error_message") or "")[:80]
                    summary_lines.append(f"- ID:{tc_id} | Expected:{expected} | Actual:{actual} | Error:{err}")

                combined_prompt = (
                    f"Analyze the following {len(batch)} test execution results and provide insights:\n"
                    + "\n".join(summary_lines)
                    + "\n\nReturn JSON: {\"insights\": [\"insight per test\"]}"
                )

                try:
                    response_text = await self.generate(
                        state=state,
                        prompt=combined_prompt,
                        system_prompt=self.system_prompt,
                        response_format="json"
                    )
                    data = json.loads(response_text)
                    insights = data.get("insights", [])
                    # Apply insights to enrich analysis without changing pass/fail
                    for j, res in enumerate(batch):
                        tc_id = res.get("test_case_id")
                        if j < len(insights) and insights[j]:
                            # Find the result and enrich its analysis
                            for vr in validation_results:
                                if str(vr.get("test_case_id")) == str(tc_id):
                                    if insights[j] and str(insights[j]).strip():
                                        vr["analysis"] = str(insights[j])[:300]
                                    break
                except Exception as llm_err:
                    state.log(f"Validator LLM enrichment failed for batch {i//batch_size + 1} ({str(llm_err)}). Using deterministic results.")
        except Exception as outer_err:
            state.log(f"Validator LLM enrichment outer error: {outer_err}. Using deterministic results.")

        for val_res in validation_results:
            execution_memory.add_validation_result(val_res)

        output_dict = {"validation_results": validation_results}
        execution_memory.set_agent_output("validator", output_dict)
        state.shared_memory["validator_output"] = output_dict
        state.update_progress(80)
        return validation_results

    async def execute(self, inputs: ValidatorInput, state: Optional[GlobalExecutionState] = None) -> ValidatorOutput:
        logger.info("Running ValidatorAgent to compare expected vs actual outcomes...")

        prompt = (
            f"Expected Outcome: {inputs.expected_result}\n"
            f"Actual Outcome: {inputs.actual_result}\n"
        )

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
                    agent_name="Validator",
                    prompt=prompt,
                    system_prompt=self.system_prompt,
                    response_format="json"
                )

            data = json.loads(response_text)
            output = ValidatorOutput(**data)

            # Save results to execution memory
            execution_memory.add_validation_result(output.dict())

            return output

        except Exception as e:
            logger.error(f"Error executing ValidatorAgent: {e}")
            raise e
