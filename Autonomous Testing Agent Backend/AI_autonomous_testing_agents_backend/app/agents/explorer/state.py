from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ExplorerInput(BaseModel):
    url: str = Field(..., description="Website URL to navigate and explore")

class PageInfo(BaseModel):
    title: str
    url: str
    page_load_time: float
    status_code: int

class DomStructureElement(BaseModel):
    element: str
    children: List[str]

class InteractiveElements(BaseModel):
    buttons: List[Dict[str, Any]]
    inputs: List[Dict[str, Any]]
    dropdowns: List[Dict[str, Any]]
    checkboxes_radios: List[Dict[str, Any]]

class LinkInfo(BaseModel):
    text: str
    url: str
    selector: str

class FormInfo(BaseModel):
    form_name: str
    method: str
    fields: List[str]
    submit: str

class ValidationRule(BaseModel):
    field: str
    rules: List[str]

class AccessibilityInfo(BaseModel):
    role: str
    aria_label: Optional[str] = None
    alt: Optional[str] = None

class NetworkCall(BaseModel):
    url: str
    method: str

class NetworkInfo(BaseModel):
    api_calls: List[NetworkCall]

class CookiesStorage(BaseModel):
    cookies: List[Dict[str, Any]]
    local_storage: Dict[str, Any]
    session_storage: Dict[str, Any]

class TestData(BaseModel):
    credentials: Dict[str, Any]

class PossibleAction(BaseModel):
    action: str
    target: str

class PageStateSnapshot(BaseModel):
    url: str
    dom: str
    screenshot: str
    elements: Dict[str, Any]
    time: str

class ExplorerOutput(BaseModel):
    page_info: PageInfo
    dom_structure: List[DomStructureElement]
    interactive_elements: InteractiveElements
    links: List[LinkInfo]
    forms: List[FormInfo]
    validation_rules: List[ValidationRule]
    screenshot_path: str
    accessibility: List[AccessibilityInfo]
    network_info: NetworkInfo
    console_errors: List[str]
    cookies_storage: CookiesStorage
    actions_possible: List[PossibleAction]
    page_state_snapshot: PageStateSnapshot
    visited_routes: Optional[List[str]] = None
    status: str


