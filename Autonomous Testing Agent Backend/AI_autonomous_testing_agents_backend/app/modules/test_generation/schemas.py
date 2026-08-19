from pydantic import BaseModel, Field
from typing import List, Optional, Any, Union
from datetime import datetime

# Test Suite Schemas
class TestSuiteBase(BaseModel):
    name: str
    description: Optional[str] = ""
    project_id: Optional[str] = "ws-1"
    project_name: Optional[str] = "Hindustaan Innovation Portal"

class TestSuiteCreate(TestSuiteBase):
    pass

class TestSuiteResponse(TestSuiteBase):
    id: str
    test_cases_count: int = 0
    status: str = "PASS"
    generated_by: str = "GeneratorAgent (AI-v1.4)"
    last_updated: str = "Today"
    created_at: Optional[Union[str, datetime, Any]] = None

# Test Case Schemas
class TestCaseBase(BaseModel):
    title: str
    description: Optional[str] = ""
    preconditions: Optional[str] = ""
    steps: List[str] = []
    expected_result: str
    priority: str = "medium" # high, medium, low
    status: str = "approved" # approved, pending, rejected
    confidence: int = 90

class TestCaseCreate(TestCaseBase):
    suite_id: str
    project_id: Optional[str] = "ws-1"

class TestCaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    preconditions: Optional[str] = None
    steps: Optional[List[str]] = None
    expected_result: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    confidence: Optional[int] = None

class TestCaseResponse(TestCaseBase):
    id: str
    suite_id: Optional[str] = None
    project_id: Optional[str] = None
    is_manually_edited: bool = False
    generated_by: Optional[str] = "GeneratorAgent"
    created_at: Optional[Union[str, datetime, Any]] = None

# Review Queue Schemas
class ReviewActionSchema(BaseModel):
    action: str # approved, rejected, changes_requested
    comments: Optional[str] = None

class BatchReviewSchema(BaseModel):
    review_ids: List[str]
    action: str # approved, rejected

class ReviewItemResponse(BaseModel):
    id: str
    title: str
    suite: str
    description: str
    preconditions: str
    steps: List[str]
    expected_result: str
    priority: str
    confidence: int
    status: str = "pending"
    reviewer_comments: Optional[str] = None
    created_at: Optional[Union[str, datetime, Any]] = None

# AI History Schemas
class AIGenerationHistoryResponse(BaseModel):
    id: str
    date: str
    suite_name: str
    project: str
    generated_count: int
    status: str # completed, failed, in_progress
    duration: str
    target: str
    model: str
    created_at: Optional[Union[str, datetime, Any]] = None

class RegenerateRequestSchema(BaseModel):
    model: Optional[str] = "Gemini 3.5 Flash"
