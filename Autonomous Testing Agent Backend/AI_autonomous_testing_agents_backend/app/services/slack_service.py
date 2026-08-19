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

class SlackService:
    def __init__(self):
        self.client_id = settings.SLACK_CLIENT_ID
        self.client_secret = settings.SLACK_CLIENT_SECRET
        self.bot_token = settings.SLACK_BOT_TOKEN
        self.redirect_uri = settings.SLACK_REDIRECT_URI
        
    def _check_config(self):
        if not self.client_id or not self.client_secret:
            raise ConfigurationError("Slack integration is not configured. Please contact the administrator.")
        
    async def get_oauth_url(self, workspace_id: str) -> str:
        """Generate the OAuth installation URL for Slack."""
        self._check_config()
        scopes = "chat:write,channels:read,groups:read"
        # We can pass workspace_id as state
        url = (
            f"https://slack.com/oauth/v2/authorize?"
            f"client_id={self.client_id}&"
            f"scope={scopes}&"
            f"state={workspace_id}"
        )
        if self.redirect_uri:
            url += f"&redirect_uri={self.redirect_uri}"
        return url

    async def exchange_token(self, code: str, workspace_id: str) -> Dict[str, Any]:
        """Exchange OAuth code for tokens."""
        self._check_config()
            
        async with httpx.AsyncClient() as client:
            payload = {
                "client_id": self.client_id,
                "client_secret": self.client_secret,
                "code": code
            }
            if self.redirect_uri:
                payload["redirect_uri"] = self.redirect_uri
                
            response = await client.post(
                "https://slack.com/api/oauth.v2.access",
                data=payload
            )
            data = response.json()
            
            if not data.get("ok"):
                logger.error(f"Slack OAuth Error: {data}")
                raise ValueError(f"Failed to authenticate with Slack: {data.get('error')}")

            # Extract tokens
            access_token = data.get("access_token")
            # Slack uses bot tokens usually, and they don't always expire (unless rotating is enabled).
            refresh_token = data.get("refresh_token")
            expires_in = data.get("expires_in")
            
            now = datetime.now(timezone.utc)
            expires_at = None
            if expires_in:
                expires_at = datetime.fromtimestamp(now.timestamp() + expires_in, tz=timezone.utc).isoformat()
            
            # Encrypt tokens
            enc_access = encrypt_token(access_token)
            enc_refresh = encrypt_token(refresh_token) if refresh_token else None

            # Fetch additional team info via team.info
            team_name = data.get("team", {}).get("name")
            team_id = data.get("team", {}).get("id")
            
            team_res = await client.get(
                f"https://slack.com/api/team.info?team={team_id}",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            team_data = team_res.json()
            if team_data.get("ok"):
                team_name = team_data.get("team", {}).get("name", team_name)

            # Persist to DB
            if db_client.db is not None:
                integration_data = {
                    "type": "slack",
                    "workspaceId": workspace_id,
                    "isEnabled": True,
                    "config": {
                        "team_id": team_id,
                        "team_name": team_name,
                        "bot_user_id": data.get("bot_user_id"),
                        "installed_user": data.get("authed_user", {}).get("id"),
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
                    "type": "slack"
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
                await self._log_activity(workspace_id, "connect_slack", "System")

            return {"team_name": data.get("team", {}).get("name")}

    async def get_token(self, workspace_id: str) -> Optional[str]:
        """Retrieves and decrypts the active token for a workspace."""
        if db_client.db is None:
            return None
            
        doc = await db_client.db["integrations"].find_one({
            "workspaceId": workspace_id,
            "type": "slack",
            "isEnabled": True
        })
        
        if not doc:
            return self.bot_token # fallback to env if configured globally
            
        enc_token = doc.get("access_token")
        if enc_token:
            return decrypt_token(enc_token)
        return self.bot_token

    async def test_connection(self, workspace_id: str) -> bool:
        """Tests the token validity using auth.test"""
        token = await self.get_token(workspace_id)
        if not token:
            raise ValueError("workspace_not_found: No Slack connection found for this workspace")
            
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://slack.com/api/auth.test",
                headers={"Authorization": f"Bearer {token}"}
            )
            data = res.json()
            if not data.get("ok"):
                error = data.get("error")
                if error == "invalid_auth":
                    raise ValueError("invalid_auth: The Slack token is invalid or revoked.")
                elif error == "token_revoked":
                    raise ValueError("token_revoked: The Slack token was revoked.")
                raise ValueError(f"Slack auth error: {error}")
                
            # Verify scopes
            headers = res.headers
            granted_scopes = headers.get("x-oauth-scopes", "")
            required_scopes = ["chat:write", "channels:read", "groups:read", "team:read", "users:read"]
            granted_scopes_list = [s.strip() for s in granted_scopes.split(",")]
            
            missing_scopes = [s for s in required_scopes if s not in granted_scopes_list]
            if missing_scopes:
                raise ValueError(f"missing_scope: Missing required scopes: {', '.join(missing_scopes)}")
                
            return True

    async def sync_channels(self, workspace_id: str) -> list:
        """Fetches the list of channels the bot can see."""
        token = await self.get_token(workspace_id)
        if not token:
            raise ValueError("workspace_not_found: No Slack connection found")
            
        async with httpx.AsyncClient() as client:
            res = await client.get(
                "https://slack.com/api/conversations.list?types=public_channel,private_channel",
                headers={"Authorization": f"Bearer {token}"}
            )
            data = res.json()
            if not data.get("ok"):
                error = data.get("error")
                logger.error(f"Slack sync channels error: {data}")
                if error == "invalid_auth":
                    raise ValueError("invalid_auth: Authentication failed. Please reconnect Slack.")
                elif error == "missing_scope":
                    raise ValueError("missing_scope: Missing required scopes to read channels.")
                raise ValueError(f"network_error: {error}")
                
            channels = [{"id": c["id"], "name": c["name"]} for c in data.get("channels", [])]
            
            # Update DB config
            if db_client.db is not None:
                await db_client.db["integrations"].update_one(
                    {"workspaceId": workspace_id, "type": "slack"},
                    {"$set": {"config.channels": channels, "updated_at": datetime.now(timezone.utc).isoformat()}}
                )
            
            # Activity log
            await self._log_activity(workspace_id, "sync_slack_channels", "System")
                
            return channels

    async def send_message(self, workspace_id: str, channel: str, text: str, blocks: list = None) -> bool:
        """Sends a message or rich blocks to a specified channel."""
        token = await self.get_token(workspace_id)
        if not token:
            raise ValueError("workspace_not_found: No Slack connection found")
            
        # Format the test message
        formatted_text = f"🧪 ATA Test Notification\n\nSlack integration is working correctly.\n\nWorkspace: {workspace_id}\nChannel: <#{channel}>\nTime: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\nProject: Autonomous Testing Agent\n\n{text}"
            
        payload = {"channel": channel, "text": formatted_text}
        if blocks:
            payload["blocks"] = blocks
            
        async with httpx.AsyncClient() as client:
            res = await client.post(
                "https://slack.com/api/chat.postMessage",
                headers={"Authorization": f"Bearer {token}"},
                json=payload
            )
            data = res.json()
            if not data.get("ok"):
                error = data.get("error")
                logger.error(f"Failed to post Slack message: {data}")
                if error == "not_in_channel":
                    raise ValueError("not_in_channel: The Slack bot has not been invited to this channel.")
                elif error == "channel_not_found":
                    raise ValueError("channel_not_found: The selected channel could not be found.")
                raise ValueError(f"network_error: {error}")
            return True
            
    async def _log_activity(self, workspace_id: str, action: str, user: str):
        if db_client.db is not None:
            await db_client.db["activity_logs"].insert_one({
                "workspaceId": workspace_id,
                "provider": "slack",
                "action": action,
                "user": user,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
