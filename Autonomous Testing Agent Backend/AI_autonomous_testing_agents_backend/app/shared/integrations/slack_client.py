import httpx
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SlackClient:
    def __init__(self, webhook_url: str, default_channel: str = None):
        self.webhook_url = webhook_url
        self.default_channel = default_channel

    async def send_message(self, text: str, blocks: list = None) -> bool:
        if not self.webhook_url:
            logger.warning("Slack webhook URL not provided, skipping message.")
            return False

        payload: Dict[str, Any] = {"text": text}
        if self.default_channel:
            payload["channel"] = self.default_channel
        if blocks:
            payload["blocks"] = blocks

        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(self.webhook_url, json=payload)
                if res.status_code != 200:
                    logger.error(f"Slack webhook failed: {res.status_code} {res.text}")
                    return False
                return True
        except Exception as e:
            logger.error(f"Slack webhook exception: {e}")
            return False

    async def send_run_started(self, project_name: str, target_url: str):
        msg = f"🚀 *Autonomous Test Run Started*\n*Project:* {project_name}\n*Target URL:* {target_url}"
        await self.send_message(msg)

    async def send_run_completed(self, project_name: str, total_tests: int, passed: int):
        status = "✅ SUCCESS" if total_tests == passed else "⚠️ COMPLETED WITH FAILURES"
        msg = f"{status}\n*Project:* {project_name}\n*Tests Passed:* {passed}/{total_tests}"
        await self.send_message(msg)

    async def send_bug_alert(self, project_name: str, bug_title: str):
        msg = f"🚨 *New Bug Detected!* 🚨\n*Project:* {project_name}\n*Issue:* {bug_title}"
        await self.send_message(msg)
