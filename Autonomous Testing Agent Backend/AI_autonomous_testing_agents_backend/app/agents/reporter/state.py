from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ReporterInput(BaseModel):
    planner_output: Optional[Dict[str, Any]] = Field(default=None)
    explorer_output: Optional[Dict[str, Any]] = Field(default=None)
    test_cases: List[Dict[str, Any]] = Field(default=[])
    validation_results: List[Dict[str, Any]] = Field(default=[])
    bug_analyses: List[Dict[str, Any]] = Field(default=[])

class ExecStats(BaseModel):
    total_tests: int = Field(default=0)
    passed: int = Field(default=0)
    failed: int = Field(default=0)
    skipped: int = Field(default=0)
    success_rate: float = Field(default=0.0)
    failure_rate: float = Field(default=0.0)

class BugSummaryItem(BaseModel):
    test_id: str = Field(default="")
    bug_type: str = Field(default="")
    issue: str = Field(default="")
    severity: str = Field(default="")
    priority: str = Field(default="")
    root_cause: str = Field(default="")
    suggested_fix: str = Field(default="")

class SeverityDistribution(BaseModel):
    critical: int = Field(default=0)
    high: int = Field(default=0)
    medium: int = Field(default=0)
    low: int = Field(default=0)

class FailedTestCase(BaseModel):
    test_id: str = Field(default="")
    title: str = Field(default="")
    reason: str = Field(default="")

class ReporterOutput(BaseModel):
    summary: str
    execution_statistics: ExecStats
    bug_summary: List[BugSummaryItem]
    severity_distribution: SeverityDistribution
    failed_test_cases: List[FailedTestCase]
    top_issues: List[str]
    recommendations: List[str]
    overall_assessment: str
    overall_status: str
    
    total_pages_tested: int = Field(default=1)
    passed_count: int = Field(default=0)
    failed_count: int = Field(default=0)
    bugs_found: int = Field(default=0)

