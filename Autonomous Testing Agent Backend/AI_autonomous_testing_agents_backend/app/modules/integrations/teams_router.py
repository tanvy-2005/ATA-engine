from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.microsoft_teams_service import MicrosoftTeamsService, ConfigurationError
from app.db.mongodb import db_client

router = APIRouter()
teams_service = MicrosoftTeamsService()

class ConnectRequest(BaseModel):
    workspaceId: str
    code: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class ActionRequest(BaseModel):
    workspaceId: str
    
class TestMessageRequest(BaseModel):
    workspaceId: str
    webhook_url: str
    title: str = "Test Notification"
    message: str = "This is a test notification from Autonomous Testing Agent."

@router.get("")
async def get_teams_integration(workspaceId: str):
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    try:
        doc = await db_client.db["integrations"].find_one({
            "workspaceId": workspaceId,
            "type": "teams"
        })
        if not doc:
            return {"success": True, "data": None}
            
        return {
            "success": True,
            "data": {
                "id": str(doc["_id"]),
                "workspaceId": doc["workspaceId"],
                "isEnabled": doc.get("isEnabled", False),
                "config": doc.get("config", {})
            }
        }
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/connect")
async def connect_teams(payload: ConnectRequest):
    try:
        if payload.code:
            data = await teams_service.exchange_token(payload.code, payload.workspaceId)
            return {"success": True, "message": "Successfully connected to Microsoft Teams", "data": data}
        else:
            # Generic save config
            if db_client.db is not None:
                await db_client.db["integrations"].update_one(
                    {"workspaceId": payload.workspaceId, "type": "teams"},
                    {"$set": {"config": payload.config or {}, "isEnabled": True}},
                    upsert=True
                )
            return {"success": True, "message": "Microsoft Teams configuration saved"}
    except ConfigurationError as e:
        return {"success": False, "configured": False, "message": str(e)}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.delete("")
async def disconnect_teams(workspaceId: str):
    try:
        if db_client.db is not None:
            await db_client.db["integrations"].delete_one({
                "workspaceId": workspaceId,
                "type": "teams"
            })
            await teams_service._log_activity(workspaceId, "disconnect_teams", "System")
        return {"success": True, "message": "Microsoft Teams disconnected successfully"}
    except ConfigurationError as e:
        return {"success": False, "configured": False, "message": str(e)}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/test")
async def test_teams(payload: ActionRequest):
    try:
        is_valid = await teams_service.test_connection(payload.workspaceId)
        if is_valid:
            return {"success": True, "message": "Microsoft Teams connection is valid"}
        return {"success": False, "message": "Microsoft Teams connection is invalid or expired"}
    except ConfigurationError as e:
        return {"success": False, "configured": False, "message": str(e)}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/send-test")
async def send_test_teams(payload: TestMessageRequest):
    try:
        await teams_service.send_webhook_message(payload.webhook_url, payload.title, payload.message)
        return {"success": True, "message": "Test message sent to Teams"}
    except ConfigurationError as e:
        return {"success": False, "configured": False, "message": str(e)}
    except Exception as e:
        return {"success": False, "message": str(e)}
