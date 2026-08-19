
from typing import Generator
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, SecurityScopes
from jose import jwt, JWTError
from pydantic import ValidationError
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.config import settings
from app.core.security import hash_pat
from app.db.mongodb import db_client
from app.modules.schemas import UserOut

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_db() -> AsyncIOMotorDatabase:
    return db_client.db

async def get_current_user(
    security_scopes: SecurityScopes,
    db: AsyncIOMotorDatabase = Depends(get_db),
    token: str = Depends(reusable_oauth2)
) -> UserOut:
    if security_scopes.scopes:
        authenticate_value = f'Bearer scope="{security_scopes.scope_str}"'
    else:
        authenticate_value = "Bearer"

    if token.startswith("ai_pat_"):
        # Authenticate via Personal Access Token
        token_hash = hash_pat(token)
        pat = await db.personal_access_tokens.find_one({"token_hash": token_hash})
        
        if not pat:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid personal access token",
                headers={"WWW-Authenticate": authenticate_value},
            )
            
        if pat.get("expires_at"):
            expires_at = pat["expires_at"]
            if isinstance(expires_at, str):
                try:
                    expires_at = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
                except ValueError:
                    pass
            if isinstance(expires_at, datetime):
                if expires_at.tzinfo is not None:
                    expires_at = expires_at.replace(tzinfo=None)
                if datetime.utcnow() > expires_at:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Personal access token expired",
                        headers={"WWW-Authenticate": authenticate_value},
                    )
        
        # Check scopes
        for scope in security_scopes.scopes:
            if scope not in pat.get("scopes", []):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not enough permissions",
                    headers={"WWW-Authenticate": authenticate_value},
                )
                
        user_id = str(pat["user_id"])
        
        # Update last used
        await db.personal_access_tokens.update_one(
            {"_id": pat["_id"]},
            {"$set": {"last_used_at": datetime.utcnow()}}
        )
    else:
        # Authenticate via JWT Session
        try:
            payload = jwt.decode(
                token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
            )
            user_id = payload.get("sub")
        except (JWTError, ValidationError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": authenticate_value},
            )
            
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Check inactivity timeout (only for JWT sessions, as PATs have their own expiration)
    if not token.startswith("ai_pat_") and user.get("last_activity"):
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
                    detail="Session expired due to inactivity",
                    headers={"WWW-Authenticate": authenticate_value},
                )
                
        # Refresh last_activity
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"last_activity": datetime.utcnow()}}
        )
        
    user["_id"] = str(user["_id"])
    return UserOut(**user)
