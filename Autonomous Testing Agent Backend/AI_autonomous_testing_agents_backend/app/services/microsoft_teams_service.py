import os
import httpx
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from app.core.config import settings
from app.core.encryption import encrypt_token, decrypt_token
from app.db.mongodb import db_client

logger = logging.getLogger(__name__)

class ConfigurationError(Exception):
    pass

class MicrosoftTeamsService:
    def __init__(self):
        self.client_id = settings.MS_CLIENT_ID
        self.client_secret = settings.MS_CLIENT_SECRET
        self.tenant_id = settings.MS_TENANT_ID or "common"
        self.redirect_uri = settings.MS_REDIRECT_URI
        
    def _check_config(self):
        if not self.client_id or not self.client_secret:
            raise ConfigurationError("Microsoft Teams integration is not configured. Please contact the administrator.")
        
    async def get_oauth_url(self, workspace_id: str) -> str:
        """Generate the OAuth installation URL for Microsoft Teams (Entra ID)."""
        self._check_config()
        scopes = "offline_access ChannelMessage.Send"
        url = (
            f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/authorize?"
            f"client_id={self.client_id}&"
            f"response_type=code&"
            f"redirect_uri={self.redirect_uri}&"
            f"response_mode=query&"
            f"scope={scopes}&"
            f"state={workspace_id}"
        )
        return url

    async def exchange_token(self, code: str, workspace_id: str) -> Dict[str, Any]:
        """Exchange OAuth code for MS Graph tokens."""
        self._check_config()
            
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "redirect_uri": self.redirect_uri,
                    "grant_type": "authorization_code"
                }
            )
            data = response.json()
            
            if "error" in data:
                logger.error(f"MS Teams OAuth Error: {data}")
                raise ValueError(f"Failed to authenticate with Microsoft Teams: {data.get('error_description')}")

            access_token = data.get("access_token")
            refresh_token = data.get("refresh_token")
            expires_in = data.get("expires_in")
            
            now = datetime.now(timezone.utc)
            expires_at = None
            if expires_in:
                expires_at = datetime.fromtimestamp(now.timestamp() + expires_in, tz=timezone.utc).isoformat()
            
            # Encrypt tokens
            enc_access = encrypt_token(access_token)
            enc_refresh = encrypt_token(refresh_token) if refresh_token else None

            # Persist to DB
            if db_client.db is not None:
                integration_data = {
                    "type": "teams",
                    "workspaceId": workspace_id,
                    "isEnabled": True,
                    "config": {
                        "tenant_id": self.tenant_id,
                        "channels": []
                    },
                    "access_token": enc_access,
                    "refresh_token": enc_refresh,
                    "expires_at": expires_at,
                    "updated_at": now.isoformat()
                }
                
                # Upsert
                existing = await db_client.db["integrations"].find_one({
                    "workspaceId": workspace_id,
                    "type": "teams"
                })
                if existing:
                    await db_client.db["integrations"].update_one(
                        {"_id": existing["_id"]},
                        {"$set": integration_data}
                    )
                else:
                    integration_data["created_at"] = now.isoformat()
                    await db_client.db["integrations"].insert_one(integration_data)
                    
                # Activity log
                await self._log_activity(workspace_id, "connect_teams", "System")

            return {"status": "success"}

    async def get_token(self, workspace_id: str) -> Optional[str]:
        """Retrieves and decrypts the active token for a workspace."""
        if db_client.db is None:
            return None
            
        doc = await db_client.db["integrations"].find_one({
            "workspaceId": workspace_id,
            "type": "teams",
            "isEnabled": True
        })
        
        if not doc:
            return None
            
        enc_token = doc.get("access_token")
        if enc_token:
            return decrypt_token(enc_token)
        return None

    async def test_connection(self, workspace_id: str) -> bool:
        """Tests the token validity using Microsoft Graph API"""
        token = await self.get_token(workspace_id)
        if not token:
            raise ValueError("No Microsoft Teams connection found for this workspace")
            
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://graph.microsoft.com/v1.0/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            return res.status_code == 200

    async def send_webhook_message(self, webhook_url: str, title: str, text: str) -> bool:
        """Sends a rich Adaptive Card to an Incoming Webhook."""
        payload = {
            "type": "message",
            "attachments": [
                {
                    "contentType": "application/vnd.microsoft.card.adaptive",
                    "content": {
                        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                        "type": "AdaptiveCard",
                        "version": "1.2",
                        "body": [
                            {
                                "type": "TextBlock",
                                "text": title,
                                "weight": "bolder",
                                "size": "medium"
                            },
                            {
                                "type": "TextBlock",
                                "text": text,
                                "wrap": True
                            }
                        ]
                    }
                }
            ]
        }
        
        async with httpx.AsyncClient() as client:
            res = await client.post(webhook_url, json=payload)
            if res.status_code not in [200, 201, 202]:
                logger.error(f"Failed to post to Teams Webhook: {res.text}")
                raise ValueError("Failed to post message to Microsoft Teams")
            return True
            
    async def _log_activity(self, workspace_id: str, action: str, user: str):
        if db_client.db is not None:
            await db_client.db["activity_logs"].insert_one({
                "workspaceId": workspace_id,
                "provider": "teams",
                "action": action,
                "user": user,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
