from pydantic import BaseModel, Field, model_validator
from typing import Dict, Any, List, Optional

def coerce_to_list(val: Any) -> List[str]:
    if isinstance(val, list):
        return [str(item) for item in val]
    if isinstance(val, dict):
        return [f"{k}: {v}" for k, v in val.items()]
    if isinstance(val, str):
        return [val]
    if val is None:
        return []
    return [str(val)]

class PlannerInput(BaseModel):
    project_name: str = Field(..., description="Name of the project")
    description: str = Field(..., description="Description / context of the application")
    tech_stack: Optional[List[str]] = Field(default=[], description="Technologies used")
    target_url: Optional[str] = Field(default=None, description="URL of the target application")
    test_type: str = Field(default="e2e", description="Type of testing to perform")
    repo_url: Optional[str] = Field(default=None, description="Repository URL or context file")

class ProjectAnalysis(BaseModel):
    summary: str
    key_components: List[str]
    project_type: str = "UNKNOWN"
    business_domain: str = "UNKNOWN"
    main_purpose: str = "UNKNOWN"
    primary_users: List[str] = []
    expected_user_journey: List[str] = []

    @model_validator(mode="before")
    @classmethod
    def coerce_lists(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field in ["key_components", "primary_users", "expected_user_journey"]:
                if field in data:
                    data[field] = coerce_to_list(data[field])
        return data

class ModuleInfo(BaseModel):
    name: str
    purpose: str
    business_importance: str
    risk_level: str
    priority: str
    dependencies: List[str] = []

    @model_validator(mode="before")
    @classmethod
    def coerce_lists(cls, data: Any) -> Any:
        if isinstance(data, dict):
            if "dependencies" in data:
                data["dependencies"] = coerce_to_list(data["dependencies"])
        return data

class TestingStrategy(BaseModel):
    smoke_tests: List[str]
    regression_tests: List[str]
    boundary_tests: List[str]
    negative_tests: List[str]
    accessibility_tests: List[str]
    integration_tests: Optional[List[str]] = []
    system_tests: Optional[List[str]] = []
    ui_tests: Optional[List[str]] = []
    functional_tests: Optional[List[str]] = []
    exploratory_tests: Optional[List[str]] = []
    compatibility_tests: Optional[List[str]] = []
    security_tests: Optional[List[str]] = []
    performance_test_suggestions: Optional[List[str]] = []
    api_test_suggestions: Optional[List[str]] = []

    @model_validator(mode="before")
    @classmethod
    def coerce_lists(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field in [
                "smoke_tests", "regression_tests", "boundary_tests", "negative_tests", "accessibility_tests",
                "integration_tests", "system_tests", "ui_tests", "functional_tests", "exploratory_tests",
                "compatibility_tests", "security_tests", "performance_test_suggestions", "api_test_suggestions"
            ]:
                if field in data:
                    data[field] = coerce_to_list(data[field])
        return data

class TestDataRequirements(BaseModel):
    valid_data: List[str] = []
    invalid_data: List[str] = []
    boundary_data: List[str] = []
    special_characters: List[str] = []
    duplicate_data: List[str] = []
    empty_data: List[str] = []
    large_data: List[str] = []

    @model_validator(mode="before")
    @classmethod
    def coerce_lists(cls, data: Any) -> Any:
        if isinstance(data, dict):
            for field in [
                "valid_data", "invalid_data", "boundary_data", "special_characters",
                "duplicate_data", "empty_data", "large_data"
            ]:
                if field in data:
                    data[field] = coerce_to_list(data[field])
        return data

class PlannerOutput(BaseModel):
    project_analysis: ProjectAnalysis
    testing_strategy: TestingStrategy
    priority_areas: List[str]
    
    # New Rich Fields requested in prompt
    business_workflow: Optional[List[str]] = []
    user_workflow: Optional[List[str]] = []
    module_dependency_graph: Optional[Dict[str, List[str]]] = {}
    detected_modules: Optional[List[ModuleInfo]] = []
    critical_user_journeys: Optional[List[str]] = []
    high_risk_areas: Optional[List[str]] = []
    security_sensitive_areas: Optional[List[str]] = []
    functional_requirements: Optional[List[str]] = []
    non_functional_requirements: Optional[List[str]] = []
    test_data_requirements: Optional[TestDataRequirements] = None
    assertions: Optional[List[str]] = []
    explorer_instructions: Optional[List[str]] = []
    generator_instructions: Optional[List[str]] = []
    validator_instructions: Optional[List[str]] = []
    bug_analyzer_instructions: Optional[List[str]] = []
    reporter_instructions: Optional[List[str]] = []

    @model_validator(mode="before")
    @classmethod
    def coerce_lists(cls, data: Any) -> Any:
        if isinstance(data, dict):
            list_fields = [
                "priority_areas", "business_workflow", "user_workflow", "critical_user_journeys",
                "high_risk_areas", "security_sensitive_areas", "functional_requirements",
                "non_functional_requirements", "assertions", "explorer_instructions",
                "generator_instructions", "validator_instructions", "bug_analyzer_instructions",
                "reporter_instructions"
            ]
            for field in list_fields:
                if field in data:
                    data[field] = coerce_to_list(data[field])
        return data
