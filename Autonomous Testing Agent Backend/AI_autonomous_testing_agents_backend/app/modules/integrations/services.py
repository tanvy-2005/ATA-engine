import logging
import httpx
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

async def notify_slack_teams(webhook_url: str, title: str, message: str) -> bool:
    """
    FR-INT-02: Send execution success/failure notifications to Slack or Microsoft Teams.
    """
    logger.info(f"Triggering Notifications integration to URL: {webhook_url}")
    payload = {
        "text": f"*{title}*\n{message}"
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=payload, timeout=10.0)
            response.raise_for_status()
            logger.info("Notification sent successfully.")
            return True
    except Exception as e:
        logger.error(f"Failed to send notification: {str(e)}")
        # We return false but don't crash the test runner
        return False

async def create_jira_bug(jira_url: str, email: str, api_token: str, project_key: str, summary: str, description: str) -> Optional[str]:
    """
    FR-INT-03: Create Jira bugs automatically on failures.
    Returns the created issue key if successful.
    """
    logger.info(f"Triggering Jira integration for project {project_key}")
    
    url = f"{jira_url.rstrip('/')}/rest/api/3/issue"
    auth = (email, api_token)
    
    payload = {
        "fields": {
            "project": { "key": project_key },
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [
                    {
                        "type": "paragraph",
                        "content": [
                            { "type": "text", "text": description }
                        ]
                    }
                ]
            },
            "issuetype": { "name": "Bug" }
        }
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, auth=auth, timeout=15.0)
            response.raise_for_status()
            data = response.json()
            issue_key = data.get("key")
            logger.info(f"Jira bug created successfully: {issue_key}")
            return issue_key
    except Exception as e:
        logger.error(f"Failed to create Jira bug: {str(e)}")
        return None



async def report_to_cicd(provider: str, token: str, repository: str, status: str) -> bool:
    """
    FR-INT-01: Connect with CI/CD tools (GitHub Actions, GitLab CI, Jenkins)
    """
    logger.info(f"Reporting status '{status}' to CI/CD provider '{provider}' for repo '{repository}'")
    # Stub implementation. In reality, would use provider-specific APIs (e.g. GitHub Status API)
    return True
