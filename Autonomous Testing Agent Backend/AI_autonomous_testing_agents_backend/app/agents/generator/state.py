from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class GeneratorInput(BaseModel):
    explorer_output: Dict[str, Any] = Field(..., description="Output from the Explorer agent containing page elements and forms")

class PageInfo(BaseModel):
    title: str
    url: str
    type: str

class Summary(BaseModel):
    total_test_cases: int
    high_priority: int
    medium_priority: int
    low_priority: int

class TestStep(BaseModel):
    step: int
    action: str
    selector: Optional[str] = None
    locator_type: Optional[str] = None
    value: Optional[Any] = None

class Assertion(BaseModel):
    type: str
    expected: Optional[Any] = None
    selector: Optional[str] = None

class TestCase(BaseModel):
    id: str
    title: str
    category: Optional[str] = None
    priority: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    preconditions: Optional[List[str]] = Field(default=[])
    test_data: Optional[Dict[str, Any]] = Field(default={})
    steps: List[TestStep] = Field(default=[])
    assertions: Optional[List[Assertion]] = Field(default=[])
    expected_result: Optional[str] = None
    estimated_execution_time: Optional[str] = None

class GeneratorOutput(BaseModel):
    page: PageInfo
    summary: Summary
    test_cases: List[TestCase]


