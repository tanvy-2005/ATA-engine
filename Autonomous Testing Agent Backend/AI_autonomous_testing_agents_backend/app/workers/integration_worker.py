import asyncio
import logging
from datetime import datetime, timezone, timedelta
from app.db.mongodb import db_client
from app.services.slack_service import SlackService
from app.services.microsoft_teams_service import MicrosoftTeamsService

logger = logging.getLogger(__name__)

class IntegrationWorker:
    def __init__(self):
        self.slack_service = SlackService()
        self.teams_service = MicrosoftTeamsService()
        self._running = False
        
    async def start(self):
        self._running = True
        logger.info("Integration worker started.")
        while self._running:
            try:
                await self.refresh_expiring_tokens()
                await self.sync_all_channels()
            except Exception as e:
                logger.error(f"Integration worker error: {e}")
                
            # Run tasks every hour
            await asyncio.sleep(3600)
            
    def stop(self):
        self._running = False
        logger.info("Integration worker stopped.")

    async def refresh_expiring_tokens(self):
        """Finds tokens expiring soon and refreshes them if necessary."""
        if db_client.db is None:
            return
            
        now = datetime.now(timezone.utc)
        threshold = now + timedelta(hours=24)
        
        # Example logic for finding expiring tokens
        # cursor = db_client.db["integrations"].find({
        #     "expires_at": {"$lte": threshold.isoformat()},
        #     "isEnabled": True
        # })
        # async for doc in cursor:
        #    ... implementation for refreshing MS Teams or Slack tokens via refresh_token
        #    ... this would involve exchanging the refresh_token for a new access_token
        pass

    async def sync_all_channels(self):
        """Periodically sync channels for active Slack connections."""
        if db_client.db is None:
            return
            
        cursor = db_client.db["integrations"].find({
            "type": "slack",
            "isEnabled": True
        })
        
        integrations = await cursor.to_list(length=100)
        for integration in integrations:
            workspace_id = integration["workspaceId"]
            try:
                await self.slack_service.sync_channels(workspace_id)
            except Exception as e:
                logger.warning(f"Failed background sync for Slack workspace {workspace_id}: {e}")
