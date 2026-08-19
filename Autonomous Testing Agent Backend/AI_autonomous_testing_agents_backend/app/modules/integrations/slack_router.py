from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.services.slack_service import SlackService, ConfigurationError
from app.db.mongodb import db_client

router = APIRouter()
slack_service = SlackService()

class ConnectRequest(BaseModel):
    workspaceId: str
    code: Optional[str] = None
    config: Optional[Dict[str, Any]] = None

class ActionRequest(BaseModel):
    workspaceId: str
    
class TestMessageRequest(BaseModel):
    workspaceId: str
    channel: str
    message: str

@router.get("")
async def get_slack_integration(workspaceId: str):
    if db_client.db is None:
        raise HTTPException(status_code=503, detail="Database connection not available")
    try:
        doc = await db_client.db["integrations"].find_one({
            "workspaceId": workspaceId,
            "type": "slack"
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
async def connect_slack(payload: ConnectRequest):
    try:
        if payload.code:
            data = await slack_service.exchange_token(payload.code, payload.workspaceId)
            return {"success": True, "message": "Successfully connected to Slack", "data": data}
        else:
            # Generic save config
            if db_client.db is not None:
                config_updates = {f"config.{k}": v for k, v in (payload.config or {}).items()}
                config_updates["isEnabled"] = True
                await db_client.db["integrations"].update_one(
                    {"workspaceId": payload.workspaceId, "type": "slack"},
                    {"$set": config_updates},
                    upsert=True
                )
            return {"success": True, "message": "Slack configuration saved"}
    except ConfigurationError as e:
        return {"success": False, "configured": False, "message": str(e)}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.delete("")
async def disconnect_slack(workspaceId: str):
    try:
        if db_client.db is not None:
            await db_client.db["integrations"].delete_one({
                "workspaceId": workspaceId,
                "type": "slack"
            })
            await slack_service._log_activity(workspaceId, "disconnect_slack", "System")
        return {"success": True, "message": "Slack disconnected successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/test")
async def test_slack(payload: ActionRequest):
    try:
        is_valid = await slack_service.test_connection(payload.workspaceId)
        if is_valid:
            return {"success": True, "message": "Slack connection is valid"}
        return {"success": False, "message": "Slack connection is invalid or expired"}
    except ConfigurationError as e:
        return {"success": False, "configured": False, "message": str(e)}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/sync")
async def sync_slack(payload: ActionRequest, background_tasks: BackgroundTasks):
    try:
        channels = await slack_service.sync_channels(payload.workspaceId)
        return {"success": True, "message": "Channels synced successfully", "data": channels}
    except ConfigurationError as e:
        return {"success": False, "configured": False, "message": str(e)}
    except Exception as e:
        return {"success": False, "message": str(e)}

@router.post("/send-test")
async def send_test_slack(payload: TestMessageRequest):
    try:
        await slack_service.send_message(payload.workspaceId, payload.channel, payload.message)
        return {"success": True, "message": "Test message sent"}
    except ConfigurationError as e:
        return {"success": False, "configured": False, "message": str(e)}
    except Exception as e:
        return {"success": False, "message": str(e)}
