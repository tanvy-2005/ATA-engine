import logging
import json
from app.agents.generator.state import GeneratorInput, GeneratorOutput, TestCase, TestStep, Assertion

from app.llm.utils import load_prompt
from app.memory.execution_memory import execution_memory

logger = logging.getLogger(__name__)

# Maximum characters we allow for the user-prompt payload sent to the LLM.
# Groq llama-3.3-70b-versatile context window: ~32k tokens, but the FREE tier
# limits request length. We stay well under 6 000 tokens (~24 000 chars).
_MAX_PAYLOAD_CHARS = 24_000


def _trim_explorer_output(data: dict) -> dict:
    """
    Produce a leaner copy of the explorer output while keeping rich deep-crawled
    multi-route information (up to 24,000 chars / ~6,000 tokens for local Ollama).
    """
    import copy
    d = copy.deepcopy(data)

    # Keep essential page info and visited routes
    if "page_info" in d and isinstance(d["page_info"], dict):
        pi = d["page_info"]
        d["page_info"] = {
            "title": pi.get("title", ""),
            "url": pi.get("url", ""),
            "type": pi.get("type", "standard")
        }

    # Remove only bulky binary/snapshot fields
    d.pop("page_state_snapshot", None)
    d.pop("cookies_storage", None)
    d.pop("console_errors", None)
    d.pop("test_data", None)

    # Allow up to 40 links across discovered routes
    if "links" in d and isinstance(d["links"], list):
        clean_links = []
        for l in d["links"][:40]:
            if isinstance(l, dict):
                clean_links.append({
                    "text": str(l.get("text", ""))[:50],
                    "url": str(l.get("url", ""))[:80],
                    "selector": l.get("selector", "")
                })
        d["links"] = clean_links

    # Cap interactive_elements lists with generous limits for deep multi-page coverage
    if "interactive_elements" in d and isinstance(d["interactive_elements"], dict):
        ie = d["interactive_elements"]
        for cat, limit in [("buttons", 40), ("inputs", 40), ("dropdowns", 20), ("checkboxes_radios", 20)]:
            if cat in ie and isinstance(ie[cat], list):
                clean_items = []
                for item in ie[cat][:limit]:
                    if isinstance(item, dict):
                        clean_items.append({
                            "selector": item.get("selector", ""),
                            "text": str(item.get("text") or item.get("label") or item.get("value") or "")[:40],
                            "type": item.get("type", "")
                        })
                ie[cat] = clean_items

    # Allow up to 20 forms across discovered routes
    if "forms" in d and isinstance(d["forms"], list):
        clean_forms = []
        for f in d["forms"][:20]:
            if isinstance(f, dict):
                clean_forms.append({
                    "form_name": f.get("form_name", ""),
                    "method": f.get("method", ""),
                    "fields": [str(x)[:30] for x in f.get("fields", [])[:12]],
                    "submit": f.get("submit", "")
                })
        d["forms"] = clean_forms

    # Simplify DOM structure (keep up to 30 elements)
    if "dom_structure" in d and isinstance(d["dom_structure"], list):
        clean_dom = []
        for item in d["dom_structure"][:30]:
            if isinstance(item, dict):
                clean_dom.append({
                    "element": str(item.get("element", ""))[:60],
                    "children_count": len(item.get("children", []))
                })
        d["dom_structure"] = clean_dom

    # Allow up to 20 validation rules
    if "validation_rules" in d and isinstance(d["validation_rules"], list):
        d["validation_rules"] = d["validation_rules"][:20]

    # Quick check size
    serialised = json.dumps(d)
    if len(serialised) > _MAX_PAYLOAD_CHARS:
        logger.warning(
            f"[Generator] Trimmed explorer output ({len(serialised)} chars) > {_MAX_PAYLOAD_CHARS}. "
            "Applying hard character truncation."
        )
        serialised = serialised[:_MAX_PAYLOAD_CHARS] + "\n... [TRUNCATED FOR TOKEN LIMIT]"
        return serialised

    return d


# Fallback test case generator removed to prevent inventing dummy TC001 data.


from app.agents.base_agent import BaseAgent
from app.orchestrator.orchestrator_state import GlobalExecutionState
from typing import Optional


class GeneratorAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Generator", max_retries=1)
        self.system_prompt = load_prompt("generator.txt")

    async def execute_task(self, state: GlobalExecutionState) -> GeneratorOutput:
        # Check execution memory first to reuse cached outputs and avoid duplicate LLM calls
        existing_gen = execution_memory.get_agent_output("generator")
        if existing_gen and isinstance(existing_gen, dict) and "test_cases" in existing_gen and len(existing_gen["test_cases"]) > 0:
            state.log("GeneratorAgent already completed for this run. Reusing cached test cases.")
            state.shared_memory["generator_output"] = existing_gen
            return GeneratorOutput(**existing_gen)

        explorer_out = state.shared_memory.get("explorer_output", {})
        inputs = GeneratorInput(explorer_output=explorer_out)
        
        output = await self.execute(inputs, state=state)
        
        state.shared_memory["generator_output"] = output.dict()
        state.update_progress(45)
        return output

    async def execute(self, inputs: GeneratorInput, state: Optional[GlobalExecutionState] = None) -> GeneratorOutput:
        logger.info("Running GeneratorAgent to produce test cases...")
        if state:
            state.current_action = "Synthesizing test cases (smoke, edge, boundary)..."
            state.log(state.current_action)

        # Trim the explorer payload BEFORE building the prompt
        trimmed = _trim_explorer_output(inputs.explorer_output)

        if isinstance(trimmed, str):
            payload_str = trimmed
        else:
            payload_str = json.dumps(trimmed, indent=2)

        logger.info(
            f"[Generator] Payload size after trimming: {len(payload_str)} chars "
            f"(~{len(payload_str)//4} tokens)"
        )

        active_scopes = {
            "smoke_testing": True,
            "regression_testing": True,
            "boundary_checks": True,
            "negative_testing": True,
            "accessibility_audit": True,
            "performance_indexing": False
        }

        if state and getattr(state, "project_name", None):
            try:
                from app.db.mongodb import db_client
                from bson import ObjectId
                project_id = state.project_name
                if ObjectId.is_valid(project_id) and db_client.db is not None:
                    project = await db_client.db["projects"].find_one({"_id": ObjectId(project_id)})
                    if project and "active_scopes" in project:
                        active_scopes = project["active_scopes"]
            except Exception as e:
                logger.error(f"[Generator] Failed to fetch project active scopes: {e}")

        test_type = getattr(state, "test_type", "e2e") if state else "e2e"
        repo_url = getattr(state, "repo_url", "Not specified") if state else "Not specified"

        test_type_instructions = ""
        if test_type == "visual":
            test_type_instructions = "FOCUS HEAVILY on visual layout assertions, CSS checks, and responsiveness."
        elif test_type == "fuzzing":
            test_type_instructions = "FOCUS HEAVILY on boundary fuzz payloads, extreme string lengths, and SQL/XSS injections."
        elif test_type == "api_network":
            test_type_instructions = "FOCUS HEAVILY on API route interceptions, network resilience, and latency handling."
        elif test_type == "security":
            test_type_instructions = "FOCUS HEAVILY on security headers, auth bypass, and posture validation."
        elif test_type == "accessibility":
            test_type_instructions = "FOCUS HEAVILY on WCAG 2.1 compliance, aria-labels, and contrast assertions."
        elif test_type == "integration":
            test_type_instructions = "FOCUS HEAVILY on multi-component workflows and data persistence across pages."
        elif test_type == "unit":
            test_type_instructions = "FOCUS on single component, isolated behaviors with targeted assertions."
        elif test_type == "chaos":
            test_type_instructions = "FOCUS HEAVILY on random clicking, unexpected state transitions, and resilience."

        scope_instructions = f"""
Generate executable test cases ONLY for the enabled categories below.
CRITICAL OVERRIDE - CURRENT TEST TYPE: {test_type.upper()}
{test_type_instructions}
Repository: {repo_url}

- Smoke Testing: {active_scopes.get('smoke_testing', True)}
- Regression Testing: {active_scopes.get('regression_testing', True)}
- Boundary & Format Checks: {active_scopes.get('boundary_checks', True)}
- Negative Testing: {active_scopes.get('negative_testing', True)}
- Accessibility Audit: {active_scopes.get('accessibility_audit', True)}
- Performance Indexing: {active_scopes.get('performance_indexing', False)}

DO NOT generate test cases for categories marked False.
"""

        prompt = (
            f"{scope_instructions}\n\n"
            "Explorer sitemap and element inventory (trimmed for token budget):\n"
            f"{payload_str}\n"
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
                        agent_name="Generator",
                        prompt=attempt_prompt,
                        system_prompt=self.system_prompt,
                        response_format="json"
                    )

                data = json.loads(response_text)
                if not isinstance(data, dict) or "test_cases" not in data or not isinstance(data.get("test_cases"), list):
                    raise ValueError("JSON response missing required 'test_cases' list.")

                output = GeneratorOutput(**data)

                # Save test cases to execution memory
                execution_memory.set_test_cases(data.get("test_cases", []))
                execution_memory.set_agent_output("generator", output.dict())
                if state:
                    state.current_action = f"Generated {len(output.test_cases)} executable test cases."
                    state.log(state.current_action)

                return output

            except Exception as e:
                last_error = e
                raw_content = response_text if response_text else str(e)
                logger.warning(
                    f"[Generator] Attempt {attempt} failed JSON parsing/schema validation: {e}. "
                    f"Raw Content: {raw_content[:200]}..."
                )
                attempt_prompt = (
                    prompt
                    + f"\n\nCRITICAL RETRY INSTRUCTION (Attempt {attempt+1}): Your previous response was invalid JSON or failed schema validation: {e}. "
                    "Return ONLY valid structured JSON matching the schema exactly. Never include programming code expressions or comments."
                )

        logger.warning(
            f"Error executing GeneratorAgent LLM after retries: {last_error}. "
            "Generating deterministic baseline E2E test suite from Explorer telemetry..."
        )
        page_info = inputs.explorer_output.get("page_info", {}) if isinstance(inputs.explorer_output, dict) else {}
        target_url = page_info.get("url", "")
        fallback_test_cases = [
            TestCase(
                id="TC-AUTO-01",
                title="Verify Target Website Reachability & HTTP Load",
                category="functional",
                priority="high",
                severity="blocker",
                description="Verify that the target URL resolves and returns a valid page without fatal error codes.",
                steps=[TestStep(step=1, action="navigate", value=target_url)],
                assertions=[Assertion(type="http_status", expected=200)],
                expected_result="Page loads successfully with HTTP status 200."
            ),
            TestCase(
                id="TC-AUTO-02",
                title="Verify Page Title and Core Metadata",
                category="ui",
                priority="medium",
                severity="major",
                description="Check that the page title is present and non-empty.",
                steps=[TestStep(step=1, action="check_title")],
                assertions=[Assertion(type="title_present", expected=True)],
                expected_result="Page has a valid title tag and metadata."
            ),
            TestCase(
                id="TC-AUTO-03",
                title="Verify Discovered Navigation Links Accessibility",
                category="functional",
                priority="high",
                severity="major",
                description="Verify that primary discovered navigation links are reachable and do not redirect to error pages.",
                steps=[TestStep(step=1, action="verify_links")],
                assertions=[Assertion(type="links_valid", expected=True)],
                expected_result="Discovered links respond cleanly without broken references."
            )
        ]
        output = GeneratorOutput(
            page={"title": page_info.get("title", "Target Page"), "url": target_url, "type": page_info.get("type", "standard")},
            summary={"total_test_cases": len(fallback_test_cases), "high_priority": 2, "medium_priority": 1, "low_priority": 0},
            test_cases=fallback_test_cases
        )
        execution_memory.set_test_cases(fallback_test_cases)
        execution_memory.set_agent_output("generator", output.dict())
        return output
