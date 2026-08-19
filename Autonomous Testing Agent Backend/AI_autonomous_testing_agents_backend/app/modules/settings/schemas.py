from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class SeverityRules(BaseModel):
    critical: bool = True
    high: bool = True
    medium: bool = False
    low: bool = False

class TestTypeRules(BaseModel):
    smoke: bool = True
    regression: bool = True
    negative: bool = False
    boundary: bool = False
    accessibility: bool = True

class EventTriggers(BaseModel):
    started: bool = False
    completed: bool = True
    failed: bool = True
    criticalFailure: bool = True
    reportGenerated: bool = True
    aiCompleted: bool = False

class DigestIncludes(BaseModel):
    passFail: bool = True
    failedTests: bool = True
    criticalIssues: bool = True
    flakyTests: bool = True
    coverage: bool = True
    duration: bool = False
    aiSuggestions: bool = True
    networkErrors: bool = False

class DigestConfig(BaseModel):
    enabled: bool = True
    frequency: str = "Daily"
    deliveryTime: str = "08:00"
    timezone: str = "Asia/Kolkata"
    includes: DigestIncludes = Field(default_factory=DigestIncludes)

class NotificationSettingsSchema(BaseModel):
    workspaceId: Optional[str] = "default"
    emailNotifications: bool = True
    severity: SeverityRules = Field(default_factory=SeverityRules)
    testTypes: TestTypeRules = Field(default_factory=TestTypeRules)
    events: EventTriggers = Field(default_factory=EventTriggers)
    digest: DigestConfig = Field(default_factory=DigestConfig)

class TestEmailRequest(BaseModel):
    email: Optional[str] = None
