import logging
import traceback
import time
from datetime import datetime
from app.agents.explorer.state import (
    ExplorerInput, ExplorerOutput, PageInfo, DomStructureElement,
    InteractiveElements, LinkInfo, FormInfo, ValidationRule,
    AccessibilityInfo, NetworkInfo, NetworkCall, CookiesStorage,
    TestData, PossibleAction, PageStateSnapshot
)
from app.tools.playwright import navigate_to
from app.tools.dom import extract_interactive_elements
from app.tools.screenshot import take_screenshot
from app.tools.browser import browser_manager
from app.tools.console_logs import start_console_monitoring, attach_console_listeners, get_console_logs, detach_console_listeners
from app.tools.network_logs import detach_network_listeners
from app.memory.site_memory import site_memory
from app.memory.execution_memory import execution_memory

from app.agents.base_agent import BaseAgent
from app.orchestrator.orchestrator_state import GlobalExecutionState
from typing import Optional

logger = logging.getLogger(__name__)


class ExplorerAgent(BaseAgent):
    def __init__(self):
        super().__init__(name="Explorer", max_retries=3)

    async def execute_task(self, state: GlobalExecutionState) -> ExplorerOutput:
        # Starting fresh on every run to avoid stale cache issues as requested
        url = state.shared_memory.get("planner_output", {}).get("target_url") or state.target_url
        inputs = ExplorerInput(url=url)
        
        output = await self.execute(inputs, state=state)
        
        state.shared_memory["explorer_output"] = output.dict()
        state.update_progress(25)
        return output

    async def execute(self, inputs: ExplorerInput, state: Optional[GlobalExecutionState] = None) -> ExplorerOutput:
        logger.info("[Explorer] Starting")
        if state:
            state.current_action = "Launching browser and navigating to target URL..."
            state.log(state.current_action)
            
        try:
            # Prepare logs and listener monitoring
            start_console_monitoring()
            await browser_manager.get_page()  # Ensure page context exists
            await attach_console_listeners()

            # 1. Navigate and capture metadata/timing/cookies/storage/network
            nav_data = await navigate_to(inputs.url)
            
            # Restrict analysis if site is unreachable or redirected to another URL
            err_msg = str(nav_data.get("error") or nav_data.get("error_message") or "").lower()
            status_code = nav_data.get("status_code", 0)
            if "redirected:" in err_msg or status_code in (301, 302, 303, 307, 308):
                redirect_msg = "This URL redirects to another web address. To ensure accurate analysis, automated testing is restricted to the exact URL provided and will not analyze redirected pages. Please enter the direct, final URL you wish to analyze."
                logger.error(f"[Explorer] {redirect_msg} (Status: {status_code})")
                if state:
                    state.log(f"[ERROR] {redirect_msg}")
                    state.status = "Failed"
                raise RuntimeError(redirect_msg)
            elif err_msg or status_code == 0 or (status_code >= 400 and status_code not in (401, 403, 405, 429)):
                unreached_msg = "This website is currently unreachable or unresponsive. To ensure accurate analysis, automated testing and PDF report generation have been restricted for this site. Please verify the URL or check the site's availability and try again."
                logger.error(f"[Explorer] {unreached_msg} (Status: {status_code}, Error: {err_msg})")
                if state:
                    state.log(f"[ERROR] {unreached_msg}")
                    state.status = "Failed"
                raise RuntimeError(unreached_msg)
            
            # 2. Extract DOM details
            if state:
                state.current_action = "Extracting DOM, forms, and interactive element maps..."
                state.log(state.current_action)
            logger.info("[Explorer] Extracting DOM")
            logger.info("[Explorer] Extracting Links")
            logger.info("[Explorer] Extracting Forms")
            elements = await extract_interactive_elements()
            
            async def get_page_details():
                page = await browser_manager.get_page()
                title = await page.title()
                try:
                    # Try context-level accessibility snapshot (Modern Playwright)
                    axtree = await page.context.accessibility.snapshot(page=page)
                except AttributeError:
                    # Fallback to direct element mapping
                    axtree = await page.evaluate("""() => {
                        const items = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role]'));
                        return items.map(el => `<${el.tagName.toLowerCase()} role="${el.getAttribute('role') || ''}">${el.innerText || el.value || ''}</${el.tagName.toLowerCase()}>`).join('\\n');
                    }""")
                return title, str(axtree)

            title, axtree_str = await browser_manager.run_async(get_page_details())
            
            # --- DEEP MULTI-ROUTE CRAWLING ---
            # Automatically crawl discovered internal routes/pages so we inspect "everything deep"
            visited_routes = [inputs.url]
            try:
                import urllib.parse
                base_parsed = urllib.parse.urlparse(inputs.url)
                base_domain = base_parsed.netloc
                internal_links = []
                for link_obj in elements.get("links", []):
                    href = link_obj.get("url", "").strip()
                    if not href or href.startswith(("#", "javascript:", "mailto:", "tel:")):
                        continue
                    if any(href.lower().endswith(ext) for ext in [".png", ".jpg", ".jpeg", ".pdf", ".svg", ".zip"]):
                        continue
                    parsed_href = urllib.parse.urlparse(href)
                    if (not parsed_href.netloc or parsed_href.netloc == base_domain) and parsed_href.path and parsed_href.path != "/":
                        full_route = urllib.parse.urljoin(inputs.url, href)
                        if full_route not in visited_routes and full_route not in internal_links:
                            internal_links.append(full_route)

                # Crawl up to 4 distinct internal routes deep
                for route_url in internal_links[:4]:
                    logger.info(f"[Explorer] Deep analyzing internal route: {route_url}")
                    if state:
                        state.current_action = f"Deep analyzing route: {route_url}"
                        state.log(state.current_action)
                    try:
                        sub_nav = await navigate_to(route_url)
                        sub_elements = await extract_interactive_elements()
                        visited_routes.append(route_url)

                        # Merge discovered buttons, inputs, dropdowns, checkboxes
                        for btn in sub_elements["interactive_elements"].get("buttons", []):
                            if btn not in elements["interactive_elements"]["buttons"]:
                                elements["interactive_elements"]["buttons"].append(btn)
                        for inp in sub_elements["interactive_elements"].get("inputs", []):
                            if inp not in elements["interactive_elements"]["inputs"]:
                                elements["interactive_elements"]["inputs"].append(inp)
                        for dd in sub_elements["interactive_elements"].get("dropdowns", []):
                            if dd not in elements["interactive_elements"]["dropdowns"]:
                                elements["interactive_elements"]["dropdowns"].append(dd)
                        for cb in sub_elements["interactive_elements"].get("checkboxes_radios", []):
                            if cb not in elements["interactive_elements"]["checkboxes_radios"]:
                                elements["interactive_elements"]["checkboxes_radios"].append(cb)

                        # Merge forms, links, accessibility
                        for frm in sub_elements.get("forms", []):
                            if frm not in elements["forms"]:
                                elements["forms"].append(frm)
                        for lnk in sub_elements.get("links", []):
                            if lnk not in elements["links"]:
                                elements["links"].append(lnk)
                        for acc in sub_elements.get("accessibility", []):
                            if acc not in elements["accessibility"]:
                                elements["accessibility"].append(acc)

                        # Merge network calls
                        nav_data["api_calls"].extend(sub_nav.get("api_calls", []))
                    except Exception as sub_e:
                        logger.warning(f"[Explorer] Could not deep crawl route {route_url}: {sub_e}")

                # Return browser to primary URL for screenshot & snapshot
                if len(visited_routes) > 1:
                    await navigate_to(inputs.url)
            except Exception as crawl_err:
                logger.warning(f"[Explorer] Multi-route crawling warning: {crawl_err}")

            # 3. Take screenshot
            screenshot_path = await take_screenshot(name="explorer_page")
            
            # 4. Process console errors
            raw_console_logs = get_console_logs()
            console_errors = [f"[{log['type'].upper()}] {log['text']}" for log in raw_console_logs]

            # 5. Build structured components
            page_info = PageInfo(
                title=title,
                url=inputs.url,
                page_load_time=nav_data["page_load_time"],
                status_code=nav_data["status_code"]
            )
            
            dom_structure = [
                DomStructureElement(element=item["element"], children=item["children"])
                for item in elements["dom_structure"]
            ]
            
            interactive_elements = InteractiveElements(
                buttons=elements["interactive_elements"]["buttons"],
                inputs=elements["interactive_elements"]["inputs"],
                dropdowns=elements["interactive_elements"]["dropdowns"],
                checkboxes_radios=elements["interactive_elements"]["checkboxes_radios"]
            )
            
            links = [
                LinkInfo(text=item["text"], url=item["url"], selector=item["selector"])
                for item in elements["links"]
            ]
            
            forms = [
                FormInfo(form_name=item["form_name"], method=item["method"], fields=item["fields"], submit=item["submit"])
                for item in elements["forms"]
            ]
            
            validation_rules = [
                ValidationRule(field=item["field"], rules=item["rules"])
                for item in elements["validation_rules"]
            ]
            
            accessibility = [
                AccessibilityInfo(role=item["role"], aria_label=item.get("aria_label"), alt=item.get("alt"))
                for item in elements["accessibility"]
            ]
            
            network_info = NetworkInfo(
                api_calls=[NetworkCall(url=item["url"], method=item["method"]) for item in nav_data["api_calls"]]
            )
            
            cookies_storage = CookiesStorage(
                cookies=nav_data["cookies"],
                local_storage=nav_data["local_storage"],
                session_storage=nav_data["session_storage"]
            )
            
            test_data = TestData(credentials=elements["test_data"]["credentials"])
            
            actions_possible = [
                PossibleAction(action=item["action"], target=item["target"])
                for item in elements["actions_possible"]
            ]
            
            page_state_snapshot = PageStateSnapshot(
                url=inputs.url,
                dom=axtree_str,
                screenshot=screenshot_path,
                elements=elements["interactive_elements"],
                time=datetime.now().isoformat()
            )

            # -------------------------------------------------------------------
            # Secondary LLM call: AI summary of the page (non-critical)
            # This enriches shared_memory["explorer_summary"] but never crashes
            # the main Explorer pipeline if the LLM fails or returns bad JSON.
            # -------------------------------------------------------------------
            import json
            prompt_summary = (
                f"Page Title: {title}\n"
                f"URL: {inputs.url}\n"
                f"Buttons: {len(interactive_elements.buttons)}, Inputs: {len(interactive_elements.inputs)}, "
                f"Forms: {len(forms)}, Links: {len(links)}\n"
                f"Validation Rules: {len(validation_rules)}\n"
                f"Console Errors: {', '.join(console_errors[:5]) if console_errors else 'None'}\n"
                f"\nReturn ONLY a raw JSON object (no markdown, no explanation) with these exact keys:\n"
                f'{{"summary": "...", "detected_technologies": ["..."], "navigation_analysis": {{"navigation_flow": "..."}}}}'
            )
            _summary_system = (
                "You are a webpage analyzer. Output ONLY valid JSON with keys: "
                "'summary' (string), 'detected_technologies' (array of strings), "
                "'navigation_analysis' (object with 'navigation_flow' string). "
                "No markdown. No code fences. No explanations. Only JSON."
            )
            summary_json_text = None
            try:
                if state:
                    summary_json_text = await self.generate(
                        state=state,
                        prompt=prompt_summary,
                        system_prompt=_summary_system,
                        response_format="json"
                    )
                else:
                    from app.llm.model_manager import AIModelManager
                    summary_json_text, _ = await AIModelManager.generate(
                        agent_name="Explorer",
                        prompt=prompt_summary,
                        system_prompt=_summary_system,
                        response_format="json"
                    )
                parsed_summary = json.loads(summary_json_text)
                if state:
                    state.shared_memory["explorer_summary"] = parsed_summary
                logger.info("[Explorer] Page summary LLM call succeeded.")
            except Exception as le:
                # Non-critical: just log a warning and continue with a safe fallback
                logger.warning(f"[Explorer] Page summary LLM call failed (non-fatal): {le}")
                fallback_summary = {
                    "summary": f"Page '{title}' at {inputs.url} explored successfully.",
                    "detected_technologies": [],
                    "navigation_analysis": {"navigation_flow": "Direct single-page navigation."}
                }
                if state:
                    state.shared_memory["explorer_summary"] = fallback_summary

            output = ExplorerOutput(
                page_info=page_info,
                dom_structure=dom_structure,
                interactive_elements=interactive_elements,
                links=links,
                forms=forms,
                validation_rules=validation_rules,
                screenshot_path=screenshot_path,
                accessibility=accessibility,
                network_info=network_info,
                console_errors=console_errors,
                cookies_storage=cookies_storage,
                test_data=test_data,
                actions_possible=actions_possible,
                page_state_snapshot=page_state_snapshot,
                visited_routes=visited_routes,
                status="success"
            )
            
            # Save to memory layers
            site_memory.save_sitemap(output.dict())
            for vr in visited_routes:
                site_memory.mark_visited(vr)
            execution_memory.set_agent_output("explorer", output.dict())
            
            logger.info("[Explorer] Returning JSON")
            logger.info("[Explorer] Finished")
            return output

        except Exception as e:
            tb = traceback.format_exc()
            logger.error(f"Error executing ExplorerAgent:\n{tb}")
            raise e
        finally:
            try:
                await detach_console_listeners()
                await detach_network_listeners()
            except Exception:
                pass
