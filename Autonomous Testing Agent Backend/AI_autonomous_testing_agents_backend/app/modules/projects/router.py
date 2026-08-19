from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone
from bson import ObjectId
from app.db.mongodb import db_client
from app.api.deps import get_current_user_optional
from app.schemas.user import UserOut

router = APIRouter()

class ProjectCreate(BaseModel):
    name: str
    baseUrl: str
    description: Optional[str] = ""
    workspaceId: str = "ws-1"
    environment: str = "Development"
    authRequired: bool = False
    visibility: str = "Private"
    roleAccess: str = "Owner"
    techStack: Optional[str] = ""
    browser: Optional[str] = "Chrome"
    tags: Optional[str] = ""
    priority: Optional[str] = "Medium"
    username: Optional[str] = ""
    password: Optional[str] = ""

class ProjectResponse(BaseModel):
    id: str
    name: str
    baseUrl: str
    description: Optional[str] = ""
    environment: str
    status: str = "Active"
    lastRun: Optional[str] = None
    members: int = 1
    testSuitesCount: int = 0
    testCasesCount: int = 0
    passRate: float = 100.0
    techStack: Optional[str] = ""
    browser: Optional[str] = "Chrome"
    tags: Optional[str] = ""
    priority: Optional[str] = "Medium"
    username: Optional[str] = ""
    password: Optional[str] = ""
    createdBy: Optional[str] = ""
    activeScopes: Optional[dict] = Field(default_factory=lambda: {
        "smoke_testing": True,
        "regression_testing": True,
        "boundary_checks": True,
        "negative_testing": True,
        "accessibility_audit": True,
        "performance_indexing": False
    })

@router.get("", response_model=List[ProjectResponse])
async def get_projects(
    workspaceId: Optional[str] = None,
    current_user: Optional[UserOut] = Depends(get_current_user_optional)
):
    if db_client.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    try:

        query = {}
        if current_user:
            u_id = str(current_user.id)
            u_email = current_user.email
            user_clause = {
                "$or": [
                    {"owner_id": u_id},
                    {"created_by": u_email},
                    {"members_list.user_id": u_id},
                    {"members_list.email": u_email}
                ]
            }
            if workspaceId:
                query = {"$and": [{"workspaceId": workspaceId}, user_clause]}
            else:
                query = user_clause
        elif workspaceId:
            query = {"workspaceId": workspaceId}
        cursor = db_client.db["projects"].find(query).sort("created_at", -1)
        projects = await cursor.to_list(length=100)
        
        response = []
        for p in projects:
            p_name = p.get("name", "")
            p_url = p.get("baseUrl", "")
            
            # Dynamically compute stats from runs and test cases
            runs_query = {
                "$or": [
                    {"projectId": str(p["_id"])},
                    {"project_id": str(p["_id"])}
                ]
            }
            runs_count = await db_client.db["runs"].count_documents(runs_query)
            cases_count = await db_client.db["test_cases"].count_documents(runs_query)
            
            latest_run = await db_client.db["runs"].find_one(
                runs_query,
                sort=[("created_at", -1)]
            )
            last_run_str = p.get("lastRun")
            pass_rate = 0.0 if runs_count == 0 else p.get("passRate", 0.0)
            if latest_run:
                l_time = latest_run.get("created_at") or latest_run.get("updated_at")
                if l_time:
                    last_run_str = str(l_time)[:10]
                tot = latest_run.get("total_tests", 0)
                passed = latest_run.get("passed", 0)
                if tot > 0:
                    pass_rate = round((passed / tot) * 100.0, 1)

            response.append(ProjectResponse(
                id=str(p["_id"]),
                name=p_name,
                baseUrl=p_url,
                description=p.get("description", ""),
                environment=p.get("environment", "Development"),
                status=p.get("status", "Active"),
                lastRun=last_run_str,
                members=p.get("members", 1),
                testSuitesCount=max(runs_count, p.get("testSuitesCount", 0)),
                testCasesCount=max(cases_count, p.get("testCasesCount", 0)),
                passRate=pass_rate,
                techStack=p.get("techStack", "React"),
                browser=p.get("browser", "Chrome"),
                tags=p.get("tags", ""),
                priority=p.get("priority", "Medium"),
                username=p.get("username", ""),
                password=p.get("password", ""),
                createdBy=p.get("created_by") or p.get("username") or "",
                activeScopes=p.get("active_scopes")
            ))
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    if db_client.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    try:
        if not ObjectId.is_valid(project_id):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
            
        p = await db_client.db["projects"].find_one({"_id": ObjectId(project_id)})
        if not p:
            raise HTTPException(status_code=404, detail="Project not found")
            
        return ProjectResponse(
            id=str(p["_id"]),
            name=p["name"],
            baseUrl=p["baseUrl"],
            description=p.get("description", ""),
            environment=p.get("environment", "Development"),
            status=p.get("status", "Active"),
            lastRun=p.get("lastRun"),
            members=p.get("members", 1),
            testSuitesCount=p.get("testSuitesCount", 0),
            testCasesCount=p.get("testCasesCount", 0),
            passRate=p.get("passRate", 100.0),
            techStack=p.get("techStack", ""),
            browser=p.get("browser", "Chrome"),
            tags=p.get("tags", ""),
            priority=p.get("priority", "Medium"),
            username=p.get("username", ""),
            password=p.get("password", ""),
            createdBy=p.get("created_by") or p.get("username") or "",
            activeScopes=p.get("active_scopes")
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}/blueprint")
async def get_project_blueprint(project_id: str):
    if db_client.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    try:
        from bson import ObjectId
        if not ObjectId.is_valid(project_id):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
            
        p = await db_client.db["projects"].find_one({"_id": ObjectId(project_id)})
        if not p:
            raise HTTPException(status_code=404, detail="Project not found")

        # Fetch latest run for metrics
        runs_query = {
            "$or": [
                {"projectId": str(p["_id"])},
                {"project_id": str(p["_id"])}
            ]
        }
        latest_run = await db_client.db["runs"].find_one(
            runs_query,
            sort=[("created_at", -1)]
        )

        avg_duration_sec = latest_run.get("duration_seconds", 165) if latest_run else 0
        duration_minutes = f"{int(avg_duration_sec // 60)}m {int(avg_duration_sec % 60)}s"

        artifacts = latest_run.get("artifacts", {}) if latest_run else {}
        generator_output = artifacts.get("generator_output", {})
        explorer_output = artifacts.get("explorer_output", {})
        
        # Test case suites from Generator
        test_cases = generator_output.get("test_cases", [])
        test_cases_count = len(test_cases)
        
        # Target pages from Explorer
        routes = explorer_output.get("discovered_links", [])
        target_pages_count = len(routes)

        return {
            "project_id": str(p["_id"]),
            "name": p["name"],
            "target_url": p.get("baseUrl"),
            "est_duration": duration_minutes if avg_duration_sec > 0 else "N/A (Run Pending)",
            "est_test_cases_count": f"{test_cases_count} Suites" if test_cases_count > 0 else "0 Suites",
            "target_pages_count": target_pages_count,
            "blueprint_nodes": test_cases,
            "last_run_status": latest_run.get("status", "NOT_STARTED") if latest_run else "NOT_STARTED"
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    current_user: Optional[UserOut] = Depends(get_current_user_optional)
):
    if db_client.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    try:
        name = payload.name
        attempts = 0
        while True:
            existing = await db_client.db["projects"].find_one({
                "name": name,
                "workspaceId": payload.workspaceId
            })
            if not existing:
                break
            attempts += 1
            name = f"{payload.name} ({attempts})"
            
        payload.name = name

        now = datetime.now(timezone.utc).isoformat()
        project_dict = payload.dict()
        project_dict["status"] = "Active"
        project_dict["created_at"] = now
        project_dict["members"] = 1
        project_dict["testSuitesCount"] = 0
        project_dict["testCasesCount"] = 0
        project_dict["passRate"] = 100.0
        creator_email = current_user.email if current_user else ""
        if current_user:
            project_dict["owner_id"] = str(current_user.id)
            project_dict["created_by"] = current_user.email
            project_dict["members_list"] = [{
                "user_id": str(current_user.id),
                "email": current_user.email,
                "role": "owner"
            }]

        result = await db_client.db["projects"].insert_one(project_dict)
        inserted_id = str(result.inserted_id)
        
        return ProjectResponse(
            id=inserted_id,
            name=payload.name,
            baseUrl=payload.baseUrl,
            description=payload.description,
            environment=payload.environment,
            status="Active",
            lastRun=None,
            members=1,
            testSuitesCount=0,
            testCasesCount=0,
            passRate=100.0,
            techStack=payload.techStack,
            browser=payload.browser,
            tags=payload.tags,
            priority=payload.priority,
            username=payload.username,
            password=payload.password,
            createdBy=creator_email
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, payload: ProjectCreate):
    if db_client.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    try:
        from bson import ObjectId
        if not ObjectId.is_valid(project_id):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
            
        project_dict = payload.dict()
        await db_client.db["projects"].update_one(
            {"_id": ObjectId(project_id)},
            {"$set": project_dict}
        )
        return ProjectResponse(
            id=project_id,
            name=payload.name,
            baseUrl=payload.baseUrl,
            description=payload.description,
            environment=payload.environment,
            status="Active",
            lastRun=None,
            members=1,
            testSuitesCount=0,
            testCasesCount=0,
            passRate=100.0,
            techStack=payload.techStack,
            browser=payload.browser,
            tags=payload.tags,
            priority=payload.priority,
            username=payload.username,
            password=payload.password
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{project_id}/scopes")
async def update_project_scopes(project_id: str, payload: dict):
    if db_client.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    try:
        from bson import ObjectId
        if not ObjectId.is_valid(project_id):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
            
        active_scopes = payload.get("active_scopes", {})
        result = await db_client.db["projects"].update_one(
            {"_id": ObjectId(project_id)},
            {"$set": {"active_scopes": active_scopes}}
        )
        return {"status": "success", "active_scopes": active_scopes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{project_id}")
async def delete_project(project_id: str):
    if db_client.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    try:
        if not ObjectId.is_valid(project_id):
            raise HTTPException(status_code=400, detail="Invalid project ID format")
            
        res = await db_client.db["projects"].delete_one({"_id": ObjectId(project_id)})
        if res.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Project not found")
        return {"status": "success", "message": "Project deleted successfully"}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
