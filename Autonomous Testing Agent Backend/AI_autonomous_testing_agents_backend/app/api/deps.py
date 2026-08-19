from typing import Generator
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.config import settings
from app.db.mongodb import db_client
from app.schemas.user import UserOut

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_db() -> AsyncIOMotorDatabase:
    return db_client.db

async def get_current_user(
    db: AsyncIOMotorDatabase = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> UserOut:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
    except (JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    user = await db.users.find_one({"_id": ObjectId(token_data)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check inactivity timeout
    if user.get("last_activity"):
        last_activity = user["last_activity"]
        if isinstance(last_activity, str):
            try:
                last_activity = datetime.fromisoformat(last_activity.replace("Z", "+00:00"))
            except ValueError:
                pass
        if isinstance(last_activity, datetime):
            if last_activity.tzinfo is not None:
                last_activity = last_activity.replace(tzinfo=None)
            
            if datetime.utcnow() - last_activity > timedelta(minutes=settings.SESSION_INACTIVITY_MINUTES):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED, 
                    detail="Session expired due to inactivity"
                )
                
    # Refresh last_activity
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_activity": datetime.utcnow()}}
    )
        
    user["_id"] = str(user["_id"])
    return UserOut(**user)

from typing import Optional
from fastapi import Request

async def get_current_user_optional(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(get_db)
) -> Optional[UserOut]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = payload.get("sub")
        if not token_data or not ObjectId.is_valid(token_data):
            return None
        user = await db.users.find_one({"_id": ObjectId(token_data)})
        if not user:
            return None
        user["_id"] = str(user["_id"])
        return UserOut(**user)
    except Exception:
        return None

