import httpx
import logging
import base64
from typing import Optional

logger = logging.getLogger(__name__)

class JiraClient:
    def __init__(self, host: str, email: str, api_token: str, default_project_key: str):
        self.host = host.rstrip('/')
        self.email = email
        self.api_token = api_token
        self.project_key = default_project_key

        auth_str = f"{self.email}:{self.api_token}"
        encoded_auth = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
        
        self.headers = {
            "Authorization": f"Basic {encoded_auth}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    async def create_bug_issue(self, summary: str, description: str, issue_type: str = "Bug") -> Optional[str]:
        if not self.host or not self.email or not self.api_token or not self.project_key:
            logger.warning("Jira config incomplete, skipping issue creation.")
            return None

        payload = {
            "fields": {
                "project": {
                    "key": self.project_key
                },
                "summary": summary,
                "description": {
                    "type": "doc",
                    "version": 1,
                    "content": [
                        {
                            "type": "paragraph",
                            "content": [
                                {
                                    "text": description,
                                    "type": "text"
                                }
                            ]
                        }
                    ]
                },
                "issuetype": {
                    "name": issue_type
                }
            }
        }

        url = f"{self.host}/rest/api/3/issue"

        try:
            async with httpx.AsyncClient() as client:
                res = await client.post(url, headers=self.headers, json=payload)
                if res.status_code == 201:
                    data = res.json()
                    issue_key = data.get("key")
                    logger.info(f"Successfully created Jira issue: {issue_key}")
                    return issue_key
                else:
                    logger.error(f"Failed to create Jira issue: {res.status_code} {res.text}")
                    return None
        except Exception as e:
            logger.error(f"Jira API exception: {e}")
            return None
