import sys
import logging
import asyncio
import time


from typing import Any, List, Dict
from app.agents.base_agent import BaseAgent
from app.orchestrator.orchestrator_state import GlobalExecutionState
from app.tools.playwright import navigate_to, click_element, fill_input, select_option
from app.tools.console_logs import start_console_monitoring, attach_console_listeners, get_console_logs
from app.tools.network_logs import start_network_monitoring, attach_network_listeners, get_failed_network_logs
from app.tools.screenshot import take_screenshot

logger = logging.getLogger(__name__)


class PipelineAbortError(Exception):
    """Raised when executor detects too many website/selector failures to proceed."""
    pass

class ExecutorAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Executor", max_retries=1)

    async def execute_task(self, state: GlobalExecutionState) -> List[Dict[str, Any]]:
        # Read from shared memory
        generator_output = state.shared_memory.get("generator_output", {})
        test_cases = generator_output.get("test_cases", []) or state.shared_memory.get("test_cases", [])
        
        target_url = state.target_url
        execution_results = []

        state.current_action = "Running Playwright parallel workers..."
        state.log(f"ExecutorAgent starting. Running {len(test_cases)} test cases with 4 parallel workers.")

        from playwright.async_api import async_playwright
        
        if sys.platform == "win32":
            try:
                asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                loop = asyncio.get_event_loop()
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            semaphore = asyncio.Semaphore(4)
            
            async def execute_test_case(tc_dict) -> Dict[str, Any]:
                tc_id = tc_dict.get("id")
                tc_title = tc_dict.get("title")
                steps = tc_dict.get("steps", [])

                state.current_action = f"Executing {tc_id}: {tc_title}..."
                state.log(state.current_action)

                start_time = time.perf_counter()
                actual_outcome = "Success"
                failed_step = None
                error_message = None
                
                async with semaphore:
                    try:
                        context = await browser.new_context(viewport={"width": 1280, "height": 720})
                        try:
                            page = await context.new_page()
                            
                            try:
                                await page.goto(target_url, wait_until="load", timeout=15000)
                            except Exception as e:
                                # fallback to domcontentloaded
                                await page.goto(target_url, wait_until="domcontentloaded", timeout=10000)

                            for step in steps:
                                step_num = step.get("step")
                                action = step.get("action", "").lower()
                                selector = step.get("selector")
                                value = step.get("value")

                                state.log(f"[ACTION] Running TC {tc_id} Step {step_num}: {action} on {selector}")

                                if selector and "navigate" not in action and "goto" not in action:
                                    count = await page.locator(selector).count()
                                    if count == 0:
                                        if value and "click" in action:
                                            selector = f"text='{value}'"
                                        else:
                                            raise Exception(f"Element with selector '{selector}' is missing.")
                                    else:
                                        state.log(f"[VERIFIED] Element with selector '{selector}' matched successfully.")

                                if "click" in action:
                                    if selector:
                                        await page.click(selector, timeout=5000)
                                elif "fill" in action or "type" in action:
                                    if selector and value:
                                        await page.fill(selector, value, timeout=5000)
                                elif "select" in action:
                                    if selector and value:
                                        await page.select_option(selector, value, timeout=5000)
                                elif "navigate" in action or "goto" in action:
                                    url_val = value or selector
                                    if url_val:
                                        await page.goto(url_val)

                                await asyncio.sleep(0.1)
                        finally:
                            await context.close()
                    except Exception as e:
                        logger.warning(f"Test case {tc_id} failed: {e}")
                        state.log(f"[DEFECT] Failed TC {tc_id}: {str(e)}")
                        actual_outcome = f"Failed at step {step.get('step') if 'step' in locals() else 'unknown'}: {str(e)}"
                        failed_step = step.get("step") if 'step' in locals() else None
                        error_message = str(e)

                duration = round(time.perf_counter() - start_time, 2)

                return {
                    "test_case_id": tc_id,
                    "title": tc_title,
                    "outcome": actual_outcome,
                    "duration": duration,
                    "failed_step": failed_step,
                    "error_message": error_message,
                    "console_logs": [],
                    "network_logs": [],
                    "screenshot_path": None,
                    "expected_result": tc_dict.get("expected_result")
                }

            tasks = [execute_test_case(tc) for tc in test_cases]
            execution_results = await asyncio.gather(*tasks)
            await browser.close()
        for r in execution_results:
            state.log(f"Test Case {r['test_case_id']} finished. Duration: {r['duration']}s. Outcome: {r['outcome']}")

        state.shared_memory["executor_output"] = {
            "execution_results": execution_results
        }
        state.update_progress(65)

        # --- Pipeline abort check ---
        # Only abort if the VAST majority of tests failed due to website/selector issues.
        # A 50% threshold was too aggressive — partial failures should still go through
        # Validator, BugAnalyzer, and Reporter so a real report can be generated.
        if execution_results:
            failed_results = [r for r in execution_results if r["outcome"] != "Success"]
            failure_rate = len(failed_results) / len(execution_results)
            if failure_rate > 0.85:
                msg = (
                    f"Executor detected high failures: {len(failed_results)}/{len(execution_results)} "
                    f"test cases failed ({int(failure_rate*100)}% failure rate). "
                    "Proceeding to Validator and BugAnalyzer for deep root-cause analysis."
                )
                state.log(f"[WARN] {msg}")
                logger.warning(msg)
                # raise PipelineAbortError(msg)  # Disabled so pipeline continues

        return execution_results
