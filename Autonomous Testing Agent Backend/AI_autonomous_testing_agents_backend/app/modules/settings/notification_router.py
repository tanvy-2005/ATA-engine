from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from datetime import datetime, timezone
from app.db.mongodb import db_client
from app.modules.settings.schemas import NotificationSettingsSchema, TestEmailRequest
from app.modules.settings.services import send_digest_test_email

router = APIRouter()

DEFAULT_SETTINGS = {
    "workspaceId": "ws-1",
    "emailNotifications": True,
    "severity": {
        "critical": True,
        "high": True,
        "medium": False,
        "low": False
    },
    "testTypes": {
        "smoke": True,
        "regression": True,
        "negative": False,
        "boundary": False,
        "accessibility": True
    },
    "events": {
        "started": False,
        "completed": True,
        "failed": True,
        "criticalFailure": True,
        "reportGenerated": True,
        "aiCompleted": False
    },
    "digest": {
        "enabled": True,
        "frequency": "Daily",
        "deliveryTime": "08:00",
        "timezone": "Asia/Kolkata",
        "includes": {
            "passFail": True,
            "failedTests": True,
            "criticalIssues": True,
            "flakyTests": True,
            "coverage": True,
            "duration": False,
            "aiSuggestions": True,
            "networkErrors": False
        }
    }
}

@router.get("", response_model=NotificationSettingsSchema)
async def get_notification_settings(workspaceId: Optional[str] = "ws-1"):
    """
    Retrieve notification settings for a specific workspace. Returns defaults if none configured.
    """
    if db_client.db is None:
        return DEFAULT_SETTINGS
    
    try:
        record = await db_client.db["notification_settings"].find_one({"workspaceId": workspaceId})
        if not record:
            return DEFAULT_SETTINGS
            
        return NotificationSettingsSchema(
            workspaceId=record.get("workspaceId", workspaceId),
            emailNotifications=record.get("emailNotifications", True),
            severity=record.get("severity", DEFAULT_SETTINGS["severity"]),
            testTypes=record.get("testTypes", DEFAULT_SETTINGS["testTypes"]),
            events=record.get("events", DEFAULT_SETTINGS["events"]),
            digest=record.get("digest", DEFAULT_SETTINGS["digest"])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=NotificationSettingsSchema)
async def update_notification_settings(payload: NotificationSettingsSchema):
    """
    Save or update workspace notification settings.
    """
    if db_client.db is None:
        raise HTTPException(status_code=533, detail="Database connection unavailable")
        
    try:
        ws_id = payload.workspaceId or "ws-1"
        now = datetime.now(timezone.utc).isoformat()
        
        doc = payload.dict()
        doc["updated_at"] = now
        
        existing = await db_client.db["notification_settings"].find_one({"workspaceId": ws_id})
        if existing:
            await db_client.db["notification_settings"].update_one(
                {"_id": existing["_id"]},
                {"$set": doc}
            )
        else:
            doc["created_at"] = now
            await db_client.db["notification_settings"].insert_one(doc)
            
        return payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/test-email")
async def send_test_notification_email(req: Optional[TestEmailRequest] = None, workspaceId: Optional[str] = "ws-1"):
    """
    Sends an instant test digest email using current workspace notification settings.
    """
    target_email = req.email if req and req.email else "user@example.com"
    
    # Load settings
    settings = DEFAULT_SETTINGS
    if db_client.db is not None:
        record = await db_client.db["notification_settings"].find_one({"workspaceId": workspaceId})
        if record:
            settings = record

    success = await send_digest_test_email(target_email, settings)
    if success:
        return {"status": "success", "message": f"Test digest email dispatched to {target_email}"}
    else:
        raise HTTPException(status_code=500, detail="Failed to dispatch test email")

@router.delete("")
async def reset_notification_settings(workspaceId: Optional[str] = "ws-1"):
    """
    Resets notification settings for the workspace back to defaults.
    """
    if db_client.db is not None:
        await db_client.db["notification_settings"].delete_one({"workspaceId": workspaceId})
    return DEFAULT_SETTINGS
