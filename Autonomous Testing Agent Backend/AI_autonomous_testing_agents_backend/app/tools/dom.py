import logging
import re
from bs4 import BeautifulSoup
from app.tools.browser import browser_manager

logger = logging.getLogger(__name__)

async def extract_interactive_elements() -> dict:
    """
    Extract advanced structure, element details, validation rules, credentials, accessibility, and possible actions.
    """
    async def _extract():
        page = await browser_manager.get_page()
        html = await page.content()
        soup = BeautifulSoup(html, "html.parser")
        
        # Remove script and style elements to avoid clutter
        for script in soup(["script", "style"]):
            script.decompose()

        elements = {
            "buttons": [],
            "inputs": [],
            "dropdowns": [],
            "checkboxes_radios": []
        }

        # 1. DOM Structure
        dom_structure = []
        for container in soup.find_all(["form", "div", "nav", "header"]):
            container_id = container.get("id") or (container.get("class")[0] if container.get("class") else None)
            if not container_id:
                continue
            children = []
            for child in container.find_all(["button", "input", "select", "a"]):
                child_id = child.get("id") or child.get("name") or (child.get("class")[0] if child.get("class") else None)
                if child_id:
                    children.append(child_id)
            if children:
                dom_structure.append({
                    "element": container_id,
                    "children": list(set(children))
                })

        # 2. Buttons
        for btn in soup.find_all(["button", "input"]):
            if btn.name == "input" and btn.get("type") not in ["button", "submit", "reset"]:
                continue
            btn_text = btn.get_text().strip() or btn.get("value") or btn.get("placeholder") or ""
            btn_id = btn.get("id") or ""
            btn_class = " ".join(btn.get("class") or [])
            if btn_id:
                btn_selector = f"#{btn_id}"
            elif btn.name == "button" and btn_text:
                btn_selector = f"button:has-text('{btn_text}')"
            elif btn_class:
                btn_selector = f"{btn.name}.{btn_class.replace(' ', '.')}"
            else:
                btn_selector = btn.name
            elements["buttons"].append({
                "type": "button",
                "text": btn_text,
                "id": btn_id,
                "class": btn_class,
                "selector": btn_selector,
                "xpath": f"//{btn.name}[@id='{btn_id}']" if btn_id else f"//{btn.name}",
                "role": btn.get("role") or "button",
                "visibility": True,
                "enabled": btn.get("disabled") is None,
                "action": "click"
            })

        # 3. Input Fields
        for inp in soup.find_all("input"):
            if inp.get("type") in ["button", "submit", "reset", "checkbox", "radio"]:
                continue
            inp_id = inp.get("id") or ""
            inp_class = " ".join(inp.get("class") or [])
            inp_name = inp.get("name") or ""
            
            if inp_id:
                inp_selector = f"#{inp_id}"
            elif inp_name:
                inp_selector = f"input[name='{inp_name}']"
            elif inp.get("placeholder"):
                inp_selector = f"input[placeholder='{inp.get('placeholder')}']"
            else:
                inp_type = inp.get("type") or "text"
                inp_selector = f"input[type='{inp_type}']"
            elements["inputs"].append({
                "type": inp.get("type") or "text",
                "name": inp_name,
                "placeholder": inp.get("placeholder") or "",
                "required": "required" in inp.attrs or inp.get("required") is not None,
                "selector": inp_selector,
                "default_value": inp.get("value") or "",
                "min_length": inp.get("minlength"),
                "max_length": inp.get("maxlength"),
                "pattern": inp.get("pattern"),
                "visible": True,
                "enabled": inp.get("disabled") is None,
                "editable": inp.get("readonly") is None
            })

        # 4. Checkboxes / Radios
        for check in soup.find_all("input", type=["checkbox", "radio"]):
            check_id = check.get("id") or ""
            elements["checkboxes_radios"].append({
                "type": check.get("type"),
                "id": check_id,
                "label": check.get("name") or check_id or "",
                "checked": "checked" in check.attrs or check.get("checked") is not None,
                "visible": True,
                "enabled": check.get("disabled") is None
            })

        # 5. Dropdowns
        for sel in soup.find_all("select"):
            sel_id = sel.get("id") or ""
            sel_name = sel.get("name") or ""
            options = [opt.get_text().strip() for opt in sel.find_all("option")]
            
            if sel_id:
                selector = f"#{sel_id}"
            elif sel_name:
                selector = f"select[name='{sel_name}']"
            else:
                selector = "select"
                
            elements["dropdowns"].append({
                "type": "select",
                "id": sel_id,
                "name": sel_name,
                "selector": selector,
                "options": options,
                "visible": True,
                "enabled": sel.get("disabled") is None
            })

        # 6. Links / Navigation
        links = []
        for link in soup.find_all("a", href=True):
            href = link["href"]
            if not href or href.startswith("#") or href.startswith("javascript:"):
                continue
            link_id = link.get("id")
            link_class = " ".join(link.get("class") or [])
            text = link.get_text().strip() or link.get("title") or ""
            
            if link_id:
                selector = f"#{link_id}"
            elif text:
                # Escape single quotes in text
                escaped_text = text.replace("'", "\\'")
                selector = f"a:has-text('{escaped_text}')"
            elif link_class:
                selector = f"a.{link_class.replace(' ', '.')}"
            else:
                selector = "a"
                
            links.append({
                "text": text or "link",
                "url": href,
                "selector": selector
            })

        # 7. Forms Information
        forms = []
        for form in soup.find_all("form"):
            fields = [inp.get("name") or inp.get("id") for inp in form.find_all("input") if inp.get("name") or inp.get("id")]
            submit_btn = form.find("button", type="submit") or form.find("input", type="submit")
            submit_id = submit_btn.get("id") or submit_btn.get("name") or "submit" if submit_btn else ""
            forms.append({
                "form_name": form.get("id") or form.get("name") or "unnamed_form",
                "method": form.get("method") or "GET",
                "fields": fields,
                "submit": submit_id
            })

        # 8. Validation Rules
        validation_rules = []
        for inp in soup.find_all("input"):
            rules = []
            if "required" in inp.attrs or inp.get("required") is not None:
                rules.append("required")
            if inp.get("minlength"):
                rules.append(f"minLength:{inp.get('minlength')}")
            if inp.get("maxlength"):
                rules.append(f"maxLength:{inp.get('maxlength')}")
            if inp.get("pattern"):
                rules.append(f"pattern:{inp.get('pattern')}")
            if rules:
                validation_rules.append({
                    "field": inp.get("name") or inp.get("id") or "unnamed",
                    "rules": rules
                })

        # 9. Accessibility
        accessibility = []
        for el in soup.find_all(["input", "button", "select", "a", "img"]):
            role = el.get("role") or el.name
            if el.name == "input":
                role = el.get("type") or "textbox"
            elif el.name == "img":
                role = "img"
            accessibility.append({
                "role": role,
                "aria_label": el.get("aria-label") or el.get("placeholder") or el.get("alt") or el.get_text().strip() or None,
                "alt": el.get("alt") or None
            })

        # 10. Test Data / Credentials Extraction
        text_content = soup.get_text()
        usernames = re.findall(r"\b[a-zA-Z0-9_]+_user\b", text_content)
        passwords = re.findall(r"\bsecret_[a-zA-Z0-9_]+\b", text_content)
        credentials = {
            "usernames": list(set(usernames)) if usernames else ["standard_user"],
            "password": passwords[0] if passwords else "secret_sauce"
        }

        # 11. Possible Actions
        actions_possible = []
        for inp in elements["inputs"]:
            actions_possible.append({
                "action": "type",
                "target": inp["name"]
            })
        for btn in elements["buttons"]:
            actions_possible.append({
                "action": "click",
                "target": btn["id"] or btn["selector"]
            })

        return {
            "dom_structure": dom_structure,
            "interactive_elements": elements,
            "links": links,
            "forms": forms,
            "validation_rules": validation_rules,
            "accessibility": accessibility,
            "test_data": {"credentials": credentials},
            "actions_possible": actions_possible
        }

    return await browser_manager.run_async(_extract())


