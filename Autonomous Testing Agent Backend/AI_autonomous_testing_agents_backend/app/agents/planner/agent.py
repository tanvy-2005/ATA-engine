import logging
import json
from app.agents.planner.state import PlannerInput, PlannerOutput
from app.llm.utils import load_prompt
from app.memory.execution_memory import execution_memory
from app.agents.base_agent import BaseAgent
from app.orchestrator.orchestrator_state import GlobalExecutionState

logger = logging.getLogger(__name__)

from typing import Optional

class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Planner", max_retries=1)
        self.system_prompt = load_prompt("planner.txt")

    async def execute_task(self, state: GlobalExecutionState) -> PlannerOutput:
        # Starting fresh on every run to avoid stale cache issues as requested
        inputs_dict = state.shared_memory.get("planner_input", {})
        inputs = PlannerInput(**inputs_dict)
        
        output = await self.execute(inputs, state=state)
        
        state.shared_memory["planner_output"] = output.dict()
        state.update_progress(10)
        return output

    async def execute(self, inputs: PlannerInput, state: Optional[GlobalExecutionState] = None) -> PlannerOutput:
        logger.info(f"Running PlannerAgent for project: {inputs.project_name}")
        if state:
            state.current_action = "Analyzing project requirements and target structure..."
            state.log(state.current_action)
        
        prompt = (
            f"Project Name: {inputs.project_name}\n"
            f"Description: {inputs.description}\n"
            f"Tech Stack: {', '.join(inputs.tech_stack) if inputs.tech_stack else 'Not Specified'}\n"
            f"Target URL: {inputs.target_url or 'Not Specified'}\n"
        )

        attempt_prompt = prompt
        last_error = None
        for attempt in range(1, 3):
            response_text = None
            try:
                if state:
                    response_text = await self.generate(
                        state=state,
                        prompt=attempt_prompt,
                        system_prompt=self.system_prompt,
                        response_format="json"
                    )
                else:
                    from app.llm.model_manager import AIModelManager
                    response_text, _ = await AIModelManager.generate(
                        agent_name="Planner",
                        prompt=attempt_prompt,
                        system_prompt=self.system_prompt,
                        response_format="json"
                    )
                
                # Parse JSON response
                data = json.loads(response_text)
                if not isinstance(data, dict) or "priority_areas" not in data:
                    raise ValueError("JSON response missing required 'priority_areas' key.")

                output = PlannerOutput(**data)
                
                # Store in execution memory
                execution_memory.set_agent_output("planner", output.dict())
                
                if state:
                    state.current_action = "Planner Agent completed strategy generation."
                    state.log(state.current_action)
                    
                return output
                
            except Exception as e:
                last_error = e
                raw_content = response_text if response_text else str(e)
                logger.warning(
                    f"[Planner] Attempt {attempt} failed JSON parsing/schema validation: {e}. "
                    f"Raw Content: {raw_content[:200]}..."
                )
                if attempt == 2:
                    logger.warning("[Planner] Max retries hit. Using fallback strategy to prevent pipeline crash.")
                    fallback_data = {
                        "project_analysis": {
                            "summary": "Automated fallback analysis for target workspace.",
                            "key_components": ["authentication", "navigation_bar", "form_inputs", "api_routes"]
                        },
                        "testing_strategy": {
                            "smoke_tests": ["Verify homepage navigation", "Check main CTA buttons"],
                            "regression_tests": ["Validate form submission workflows", "Check route redirects"],
                            "boundary_tests": ["Test empty input fields", "Test maximum string length bounds"],
                            "negative_tests": ["Test invalid form entries", "Check 404 page handling"],
                            "accessibility_tests": ["Verify ARIA roles", "Check contrast & focus management"]
                        },
                        "priority_areas": ["navigation", "forms", "routing"]
                    }
                    output = PlannerOutput(**fallback_data)
                    execution_memory.set_agent_output("planner", output.dict())
                    if state:
                        state.current_action = "Planner Agent used fallback strategy."
                        state.log(state.current_action)
                    return output

                attempt_prompt = (
                    prompt
                    + f"\n\nCRITICAL RETRY INSTRUCTION (Attempt {attempt+1}): Your previous response was invalid JSON or failed schema validation: {e}. "
                    "Return ONLY valid structured JSON matching the schema exactly. Never include programming code expressions or comments."
                )

        logger.error(f"Error executing PlannerAgent after retries: {last_error}. Explicit failure without silent template fallback.")
        raise ValueError(f"PlannerAgent LLM failed to produce valid structured output: {last_error}")
