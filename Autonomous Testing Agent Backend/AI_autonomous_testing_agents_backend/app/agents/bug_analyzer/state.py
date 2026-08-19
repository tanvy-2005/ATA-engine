from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional


class BugAnalyzerInput(BaseModel):
    test_case_id: str = Field(..., description="The ID of the failing test case")
    dom_snapshot: Optional[str] = Field(default="", description="The HTML DOM snapshot of the failure page")
    console_logs: Optional[List[Dict[str, Any]]] = Field(default=[], description="List of captured console logs")
    network_logs: Optional[List[Dict[str, Any]]] = Field(default=[], description="List of captured failed network requests")
    screenshot_path: Optional[str] = Field(default=None, description="Path to captured screenshot image")
    title: Optional[str] = Field(default="", description="Title of the failing test case")
    error_message: Optional[str] = Field(default="", description="Error message from executor")


class BugAnalysisDetails(BaseModel):
    test_case_id: str = Field(default="")
    bug_type: str = Field(default="Functional", description="Functional / UI / Security / Performance / Network")
    issue: str = Field(default="", description="Detailed issue description")
    severity: str = Field(default="Medium", description="Low / Medium / High / Critical")
    priority: str = Field(default="Medium", description="Low / Medium / High")
    root_cause: str = Field(default="", description="Root cause of the bug")
    suggested_fix: str = Field(default="", description="Actionable recommended fix")
    confidence_score: float = Field(default=0.8)


class BugAnalyzerOutput(BaseModel):
    bug_analysis: BugAnalysisDetails

    class Config:
        arbitrary_types_allowed = True
