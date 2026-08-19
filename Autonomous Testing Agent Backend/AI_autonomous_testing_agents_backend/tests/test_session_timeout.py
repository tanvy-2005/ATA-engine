import pytest
from datetime import datetime, timedelta
import asyncio
from fastapi.testclient import TestClient
from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from mongomock_motor import AsyncMongoMockClient

from app.main import app
from app.db.mongodb import db_client
from app.core.config import settings
from app.core.dependencies import get_current_user, get_db

# Create a dummy protected route for testing
test_router = APIRouter()
@test_router.get("/dummy-protected")
def dummy_protected(user = Depends(get_current_user)):
    return {"msg": "Success", "user_id": user.id}

app.include_router(test_router, prefix="/api/v1")

client = TestClient(app)

mock_client = AsyncMongoMockClient()
mock_db = mock_client.testing_db

async def override_get_db():
    return mock_db

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_db():
    # Synchronously setup/clear the mock db between tests if possible, 
    # but since it's mongomock we can just drop it
    asyncio.run(mock_db.users.drop())
    yield

@pytest.mark.asyncio
async def test_session_inactivity_timeout():
    # 1. Register a new user
    user_data = {
        "name": "Test User",
        "email": "test_timeout@example.com",
        "password": "Password@123!"
    }
    res = client.post(f"{settings.API_V1_STR}/auth/signup", json=user_data)
    
    # 2. Login to get token
    login_data = {
        "email": "test_timeout@example.com",
        "password": "Password@123!"
    }
    res = client.post(f"{settings.API_V1_STR}/auth/login", json=login_data)
    assert res.status_code == 200
    token = res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Test active session
    res = client.get(f"{settings.API_V1_STR}/dummy-protected", headers=headers)
    assert res.status_code == 200

    # 4. Simulate inactivity by modifying the user's last_activity in the mock DB
    user = await mock_db.users.find_one({"email": "test_timeout@example.com"})
    past_time = datetime.utcnow() - timedelta(minutes=settings.SESSION_INACTIVITY_MINUTES + 5)
    await mock_db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_activity": past_time}}
    )

    # 5. Try authenticated request again - should fail with 401
    res = client.get(f"{settings.API_V1_STR}/dummy-protected", headers=headers)
    assert res.status_code == 401
    assert "Session expired" in res.json()["detail"]

@pytest.mark.asyncio
async def test_active_session_refresh():
    user_data = {
        "name": "Test User 2",
        "email": "test_timeout2@example.com",
        "password": "Password@123!"
    }
    client.post(f"{settings.API_V1_STR}/auth/signup", json=user_data)

    login_data = {
        "email": "test_timeout2@example.com",
        "password": "Password@123!"
    }
    res = client.post(f"{settings.API_V1_STR}/auth/login", json=login_data)
    token = res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Set last activity to 5 mins ago
    user = await mock_db.users.find_one({"email": "test_timeout2@example.com"})
    past_time = datetime.utcnow() - timedelta(minutes=5)
    await mock_db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_activity": past_time}}
    )

    # Make request
    res = client.get(f"{settings.API_V1_STR}/dummy-protected", headers=headers)
    assert res.status_code == 200

    # Check that last_activity was updated to ~now
    user_updated = await mock_db.users.find_one({"email": "test_timeout2@example.com"})
    assert user_updated["last_activity"] > past_time
