import pytest
from app.services.slack_service import SlackService, ConfigurationError as SlackConfigError
from app.services.microsoft_teams_service import MicrosoftTeamsService, ConfigurationError as TeamsConfigError
from app.core.config import settings
from unittest.mock import patch, AsyncMock

@pytest.mark.asyncio
async def test_slack_unconfigured_error():
    # Force settings to empty
    settings.SLACK_CLIENT_ID = ""
    settings.SLACK_CLIENT_SECRET = ""
    
    service = SlackService()
    
    with pytest.raises(SlackConfigError) as excinfo:
        await service.get_oauth_url("workspace-123")
        
    assert "Slack integration is not configured" in str(excinfo.value)

@pytest.mark.asyncio
async def test_teams_unconfigured_error():
    settings.MS_CLIENT_ID = ""
    settings.MS_CLIENT_SECRET = ""
    
    service = MicrosoftTeamsService()
    
    with pytest.raises(TeamsConfigError) as excinfo:
        await service.get_oauth_url("workspace-123")
        
    assert "Microsoft Teams integration is not configured" in str(excinfo.value)

@pytest.mark.asyncio
@patch('app.services.slack_service.db_client')
async def test_slack_token_encryption(mock_db_client):
    settings.SLACK_CLIENT_ID = "mock_client"
    settings.SLACK_CLIENT_SECRET = "mock_secret"
    
    service = SlackService()
    
    with patch('httpx.AsyncClient.post', new_callable=AsyncMock) as mock_post:
        from unittest.mock import MagicMock
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "ok": True,
            "access_token": "xoxb-secret-token",
            "team": {"name": "Test Team"}
        }
        mock_post.return_value = mock_response
        
        mock_db_client.db = AsyncMock()
        mock_db_client.db.__getitem__.return_value.find_one = AsyncMock(return_value=None)
        mock_db_client.db.__getitem__.return_value.insert_one = AsyncMock()
        
        res = await service.exchange_token("code123", "ws-1")
        assert res["team_name"] == "Test Team"
        
        # Verify db insert was called with encrypted token, not plaintext
        insert_calls = mock_db_client.db.__getitem__.return_value.insert_one.call_args_list
        integration_insert_args = insert_calls[0][0][0]
        assert integration_insert_args["type"] == "slack"
        assert integration_insert_args["access_token"] != "xoxb-secret-token"
        assert len(integration_insert_args["access_token"]) > 20 # Encrypted string
