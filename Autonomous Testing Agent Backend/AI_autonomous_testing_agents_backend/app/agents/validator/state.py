from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class ValidatorInput(BaseModel):
    expected_result: str = Field(..., description="The expected outcome of the test step")
    actual_result: str = Field(..., description="The actual outcome observed during execution (HTML, log, text)")

class ValidationResult(BaseModel):
    status: str = Field(..., description="PASS / FAIL / PARTIAL_PASS / BLOCKED")
    confidence: int = Field(..., description="Confidence score between 0 and 100")
    analysis: str = Field(..., description="Explanation of validation logic")
    matched_conditions: List[str] = Field(default=[])
    missing_conditions: List[str] = Field(default=[])
    unexpected_behavior: List[str] = Field(default=[])
    discrepancies: List[str] = Field(default=[])
    root_cause: Optional[str] = ""
    recommendation: str
    final_verdict: Optional[str] = ""

class ValidatorOutput(BaseModel):
    validation_result: ValidationResult

