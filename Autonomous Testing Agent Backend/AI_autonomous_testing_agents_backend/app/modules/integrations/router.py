import urllib.parse
import httpx
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import RedirectResponse, HTMLResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.db.mongodb import db_client
from app.core.config import settings

router = APIRouter()

from .slack_router import router as slack_router
from .teams_router import router as teams_router

router.include_router(slack_router, prefix="/slack", tags=["integrations-slack"])
router.include_router(teams_router, prefix="/microsoft-teams", tags=["integrations-teams"])

class IntegrationConfig(BaseModel):
    type: str
    workspaceId: str
    config: Dict[str, Any]
    isEnabled: bool = True

class IntegrationResponse(BaseModel):
    id: str
    type: str
    workspaceId: str
    config: Dict[str, Any]
    isEnabled: bool
    created_at: str

@router.get("", response_model=List[IntegrationResponse])
async def get_integrations(workspaceId: str):
    if db_client.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    try:
        cursor = db_client.db["integrations"].find({"workspaceId": workspaceId})
        integrations = await cursor.to_list(length=100)
        
        response = []
        for item in integrations:
            response.append(IntegrationResponse(
                id=str(item["_id"]),
                type=item["type"],
                workspaceId=item["workspaceId"],
                config=item["config"],
                isEnabled=item.get("isEnabled", True),
                created_at=item.get("created_at", datetime.now(timezone.utc).isoformat())
            ))
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=IntegrationResponse)
async def upsert_integration(payload: IntegrationConfig):
    if db_client.db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection not available"
        )
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        # Check if already exists, then update; else insert
        existing = await db_client.db["integrations"].find_one({
            "workspaceId": payload.workspaceId,
            "type": payload.type
        })
        
        doc = payload.dict()
        doc["updated_at"] = now
        
        if existing:
            await db_client.db["integrations"].update_one(
                {"_id": existing["_id"]},
                {"$set": doc}
            )
            inserted_id = str(existing["_id"])
        else:
            doc["created_at"] = now
            result = await db_client.db["integrations"].insert_one(doc)
            inserted_id = str(result.inserted_id)
            
        return IntegrationResponse(
            id=inserted_id,
            type=payload.type,
            workspaceId=payload.workspaceId,
            config=payload.config,
            isEnabled=payload.isEnabled,
            created_at=now
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class GitHubSelectRepoReq(BaseModel):
    workspaceId: str
    repository: str

class GitHubVerifyRequest(BaseModel):
    token: str
    repo: str

class GitHubConnectRequest(BaseModel):
    workspaceId: str
    repository: str
    token: str

class GitHubWorkspaceReq(BaseModel):
    workspaceId: str

@router.get("/github/oauth/authorize")
async def github_oauth_authorize(workspaceId: str = "ws-1"):
    client_id = settings.GITHUB_CLIENT_ID
    redirect_uri = settings.GITHUB_REDIRECT_URI or "http://localhost:8000/api/v1/auth/github/callback"
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": "repo read:user user:email",
        "state": f"integration_{workspaceId}"
    }
    url = f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)

@router.get("/github/oauth/callback")
async def github_oauth_callback(code: str, state: Optional[str] = "ws-1"):
    workspace_id = state or "ws-1"
    token_url = "https://github.com/login/oauth/access_token"
    redirect_uri = "http://localhost:8000/api/v1/integrations/github/oauth/callback"
    
    data = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": redirect_uri
    }
    
    headers = {"Accept": "application/json"}
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post(token_url, data=data, headers=headers)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to retrieve access token from GitHub: {token_res.text}")
        
        tokens = token_res.json()
        access_token = tokens.get("access_token")
        if not access_token:
            error_desc = tokens.get("error_description", "No token returned")
            raise HTTPException(status_code=400, detail=f"GitHub OAuth error: {error_desc}")
            
        user_res = await client.get("https://api.github.com/user", headers={"Authorization": f"Bearer {access_token}", "User-Agent": "ATA-Platform"})
        gh_user = user_res.json() if user_res.status_code == 200 else {}
        
        repos_res = await client.get("https://api.github.com/user/repos?per_page=100&sort=updated", headers={"Authorization": f"Bearer {access_token}", "User-Agent": "ATA-Platform"})
        repos_data = repos_res.json() if repos_res.status_code == 200 and isinstance(repos_res.json(), list) else []
        
        repos_list = []
        for r in repos_data:
            repos_list.append({
                "full_name": r.get("full_name"),
                "default_branch": r.get("default_branch", "main"),
                "private": r.get("private", False)
            })
            
    username = gh_user.get("login", "GitHub User")
    default_repo = repos_list[0]["full_name"] if repos_list else ""
    default_branch = repos_list[0]["default_branch"] if repos_list else "main"
    
    now = datetime.now(timezone.utc).isoformat()
    config = {
        "token": access_token,
        "username": username,
        "organization": username,
        "repository": default_repo,
        "defaultBranch": default_branch,
        "repositories": repos_list
    }
    
    if db_client.db is not None:
        existing = await db_client.db["integrations"].find_one({
            "workspaceId": workspace_id,
            "type": "github"
        })
        doc = {
            "type": "github",
            "workspaceId": workspace_id,
            "config": config,
            "status": "connected",
            "isEnabled": True,
            "updated_at": now
        }
        if existing:
            await db_client.db["integrations"].update_one({"_id": existing["_id"]}, {"$set": doc})
        else:
            doc["created_at"] = now
            await db_client.db["integrations"].insert_one(doc)

    html_content = f"""<!DOCTYPE html>
<html>
<head><title>GitHub Integration Connected</title></head>
<body style="background:#060b13;color:#06b6d4;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
    <div style="font-size:14px;letter-spacing:2px;">CONNECTED TO GITHUB!</div>
    <script>
        if (window.opener) {{
            window.opener.postMessage({{ type: "GITHUB_INTEGRATION_SUCCESS" }}, "*");
            window.close();
        }} else {{
            window.location.href = "http://localhost:5173/integrations/github";
        }}
    </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)

@router.post("/github/select-repo")
async def select_github_repo(payload: GitHubSelectRepoReq):
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    integration = await db_client.db["integrations"].find_one({
        "workspaceId": payload.workspaceId,
        "type": "github"
    })
    if not integration or not integration.get("config"):
        raise HTTPException(status_code=400, detail="GitHub integration not connected.")
    
    cfg = integration["config"]
    repos = cfg.get("repositories", [])
    selected_repo = next((r for r in repos if r.get("full_name") == payload.repository), None)
    default_branch = selected_repo.get("default_branch", "main") if selected_repo else "main"
    
    # If branch not found in cached list, query GitHub API directly
    if not selected_repo:
        from app.shared.integrations.github_client import GitHubClient
        try:
            gh_client = GitHubClient(token=cfg.get("token", ""), repo=payload.repository)
            default_branch = await gh_client.get_default_branch()
        except Exception:
            pass
            
    await db_client.db["integrations"].update_one(
        {"_id": integration["_id"]},
        {"$set": {
            "config.repository": payload.repository,
            "config.defaultBranch": default_branch,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"status": "success", "message": f"Updated repository to {payload.repository} (branch: {default_branch})"}

@router.get("/github")
async def get_github_integration(workspaceId: str):
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    integration = await db_client.db["integrations"].find_one({
        "workspaceId": workspaceId,
        "type": "github"
    })
    if not integration:
        return {
            "type": "github",
            "workspaceId": workspaceId,
            "status": "offline",
            "isEnabled": False,
            "config": {}
        }
    return {
        "id": str(integration["_id"]),
        "type": "github",
        "workspaceId": workspaceId,
        "status": integration.get("status", "connected" if integration.get("isEnabled") else "offline"),
        "isEnabled": integration.get("isEnabled", True),
        "config": integration.get("config", {})
    }

@router.post("/github/connect")
async def connect_github(payload: GitHubConnectRequest):
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    
    from app.shared.integrations.github_client import GitHubClient
    try:
        gh_client = GitHubClient(token=payload.token, repo=payload.repository)
        default_branch = await gh_client.get_default_branch()
        repo_parts = gh_client.repo.split("/")
        owner = repo_parts[0] if len(repo_parts) > 0 else "owner"
        
        now = datetime.now(timezone.utc).isoformat()
        config = {
            "repository": gh_client.repo,
            "defaultBranch": default_branch,
            "token": payload.token.strip(),
            "organization": owner,
            "username": owner
        }
        
        existing = await db_client.db["integrations"].find_one({
            "workspaceId": payload.workspaceId,
            "type": "github"
        })
        
        doc = {
            "type": "github",
            "workspaceId": payload.workspaceId,
            "config": config,
            "status": "connected",
            "isEnabled": True,
            "updated_at": now
        }
        
        if existing:
            await db_client.db["integrations"].update_one(
                {"_id": existing["_id"]},
                {"$set": doc}
            )
            inserted_id = str(existing["_id"])
        else:
            doc["created_at"] = now
            result = await db_client.db["integrations"].insert_one(doc)
            inserted_id = str(result.inserted_id)
            
        return {
            "id": inserted_id,
            "type": "github",
            "workspaceId": payload.workspaceId,
            "status": "connected",
            "isEnabled": True,
            "config": config,
            "message": f"Successfully connected to {gh_client.repo}"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to connect GitHub: {str(e)}")

@router.delete("/github")
async def disconnect_github(workspaceId: str):
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    await db_client.db["integrations"].delete_one({
        "workspaceId": workspaceId,
        "type": "github"
    })
    return {"status": "offline", "message": "GitHub integration disconnected"}

@router.post("/github/test")
async def test_github_connection(payload: GitHubWorkspaceReq):
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    integration = await db_client.db["integrations"].find_one({
        "workspaceId": payload.workspaceId,
        "type": "github"
    })
    if not integration or not integration.get("config"):
        raise HTTPException(status_code=400, detail="GitHub integration not configured for this workspace.")
    
    cfg = integration["config"]
    from app.shared.integrations.github_client import GitHubClient
    try:
        gh_client = GitHubClient(token=cfg.get("token", ""), repo=cfg.get("repository", ""))
        branch = await gh_client.get_default_branch()
        return {"status": "success", "message": f"Connection verified. Default branch: {branch}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection test failed: {str(e)}")

@router.post("/github/sync")
async def sync_github(payload: GitHubWorkspaceReq):
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection unavailable")
    integration = await db_client.db["integrations"].find_one({
        "workspaceId": payload.workspaceId,
        "type": "github"
    })
    if not integration or not integration.get("config"):
        raise HTTPException(status_code=400, detail="GitHub integration not configured.")
    
    cfg = integration["config"]
    from app.shared.integrations.github_client import GitHubClient
    try:
        gh_client = GitHubClient(token=cfg.get("token", ""), repo=cfg.get("repository", ""))
        branch = await gh_client.get_default_branch()
        await db_client.db["integrations"].update_one(
            {"_id": integration["_id"]},
            {"$set": {"config.defaultBranch": branch, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"status": "success", "message": f"Synced repository. Default branch: {branch}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Sync failed: {str(e)}")

@router.post("/github/verify")
async def verify_github_connection(payload: GitHubVerifyRequest):
    from app.shared.integrations.github_client import GitHubClient
    try:
        gh_client = GitHubClient(token=payload.token, repo=payload.repo)
        branch = await gh_client.get_default_branch()
        if branch:
            return {"status": "success", "message": f"Connected successfully. Default branch: {branch}"}
        else:
            raise HTTPException(status_code=400, detail="Repository not found or token lacks access.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Connection failed: {str(e)}")

from fastapi import Request
import json
import hmac
import hashlib

@router.post("/webhooks/github")
async def github_webhook(request: Request):
    signature = request.headers.get("x-hub-signature-256")
    payload = await request.body()
    
    try:
        data = json.loads(payload)
        event_type = request.headers.get("x-github-event")
        
        sha = None
        if event_type == "push":
            sha = data.get("after")
        elif event_type == "pull_request":
            sha = data.get("pull_request", {}).get("head", {}).get("sha")
            
        if not sha:
            return {"status": "ignored", "message": "No commit SHA found in payload"}
            
        repo_name = data.get("repository", {}).get("full_name")
        
        # Find active integration for this repo
        if db_client.db is not None:
            integration = await db_client.db["integrations"].find_one({
                "type": "github", 
                "config.repo": repo_name, 
                "isEnabled": True
            })
            if not integration:
                return {"status": "ignored", "message": "No active integration found for this repo"}
            
            # Find the target project to test
            workspace_id = integration["workspaceId"]
            project = await db_client.db["projects"].find_one({"workspaceId": workspace_id})
            if project:
                import asyncio
                from app.orchestrator.workflow import OrchestratorWorkflow
                workflow = OrchestratorWorkflow()
                
                async def run_bg():
                    # Pass the sha into execution memory/state using execution_id prefix or custom logic
                    # To simplify, we run the pipeline
                    res = await workflow.run_full_pipeline(
                        project_name=project.get("name", "GitHub Auto-Test"),
                        description="Auto-triggered by GitHub push",
                        target_url=project.get("base_url", "http://localhost:3000"),
                        workspace_id=workspace_id
                    )
                    
                # Schedule execution without blocking webhook response
                asyncio.create_task(run_bg())
                return {"status": "success", "message": f"Pipeline triggered for sha {sha}"}

        return {"status": "ignored", "message": "No project configured for this webhook"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
