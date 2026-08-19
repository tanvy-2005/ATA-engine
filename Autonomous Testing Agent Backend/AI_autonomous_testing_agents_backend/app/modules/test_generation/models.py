from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class TestSuiteModel(BaseModel):
    id: str = Field(default_factory=lambda: "", alias="_id")
    name: str
    description: str = ""
    project_id: str = "ws-1"
    project_name: str = "Hindustaan Innovation Portal"
    status: str = "PASS"
    generated_by: str = "GeneratorAgent (AI-v1.4)"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TestCaseModel(BaseModel):
    id: str = Field(default_factory=lambda: "", alias="_id")
    suite_id: str
    project_id: str = "ws-1"
    title: str
    description: str = ""
    preconditions: str = ""
    steps: List[str] = []
    expected_result: str
    priority: str = "medium"
    status: str = "approved"
    confidence: int = 90
    generated_by: str = "GeneratorAgent"
    is_manually_edited: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class TestReviewItemModel(BaseModel):
    id: str = Field(default_factory=lambda: "", alias="_id")
    project_id: str = "ws-1"
    suite: str
    title: str
    description: str = ""
    preconditions: str = ""
    steps: List[str] = []
    expected_result: str
    priority: str = "medium"
    confidence: int = 85
    status: str = "pending"
    reviewer_comments: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AIGenerationHistoryModel(BaseModel):
    id: str = Field(default_factory=lambda: "", alias="_id")
    project_id: str = "ws-1"
    project_name: str = "Hindustaan Innovation Portal"
    suite_name: str
    target: str = ""
    model: str = "Gemini 3.5 Flash"
    generated_count: int = 0
    status: str = "completed"
    duration: str = "45s"
    created_at: datetime = Field(default_factory=datetime.utcnow)
