from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
import logging
from app.db.mongodb import db_client
from app.modules.integrations.services import notify_slack_teams, create_jira_bug, trigger_custom_webhook, report_to_cicd

router = APIRouter()
logger = logging.getLogger(__name__)

class TestRunRequest(BaseModel):
    workspaceId: str
    projectId: str
    testSuiteId: str

async def process_integrations_after_test(workspace_id: str, test_result: dict):
    """
    Background task to process integrations after a test run completes.
    """
    logger.info(f"Processing integrations for workspace {workspace_id}...")
    if db_client.db is None:
        return
        
    try:
        # Fetch all enabled integrations for this workspace
        cursor = db_client.db["integrations"].find({"workspaceId": workspace_id, "isEnabled": True})
        integrations = await cursor.to_list(length=100)
        
        test_status = test_result.get("status", "Passed")
        summary = f"Test Run Completed: {test_status}"
        details = f"Project: {test_result.get('projectId')} | Suite: {test_result.get('testSuiteId')} | Status: {test_status}"
        
        for doc in integrations:
            itype = doc.get("type")
            config = doc.get("config", {})
            
            if itype in ["slack", "teams"]:
                webhook_url = config.get("webhookUrl")
                if webhook_url:
                    await notify_slack_teams(webhook_url, summary, details)
                    
            elif itype == "jira" and test_status == "Failed":
                # Only create bug if test failed
                jira_url = config.get("jiraUrl")
                email = config.get("email")
                token = config.get("token")
                project_key = config.get("projectKey")
                if all([jira_url, email, token, project_key]):
                    await create_jira_bug(jira_url, email, token, project_key, summary, details)
                    
            elif itype == "webhook":
                webhook_url = config.get("webhookUrl")
                secret = config.get("secret")
                if webhook_url:
                    await trigger_custom_webhook(webhook_url, test_result, secret)
                    
            elif itype in ["github", "gitlab", "jenkins"]:
                repo_url = config.get("repoUrl")
                token = config.get("token")
                if repo_url and token:
                    await report_to_cicd(itype, token, repo_url, test_status)
                    
        logger.info("Integration processing complete.")
    except Exception as e:
        logger.error(f"Error processing integrations: {str(e)}")

@router.post("/run")
async def execute_test(payload: TestRunRequest, background_tasks: BackgroundTasks):
    """
    Simulate triggering a test run. Once "done", it triggers integrations via background tasks.
    """
    # 1. Dummy simulation of test execution
    test_result = {
        "workspaceId": payload.workspaceId,
        "projectId": payload.projectId,
        "testSuiteId": payload.testSuiteId,
        "status": "Failed" # Hardcoded to Failed for testing Jira trigger
    }
    
    # 2. Add integration processing to background tasks
    background_tasks.add_task(process_integrations_after_test, payload.workspaceId, test_result)
    
    return {"message": "Test execution started.", "jobId": "job_12345"}
