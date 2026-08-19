from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime, timedelta
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.core.security import generate_pat, hash_pat
from app.modules.schemas import UserOut, PATCreate, PATResponse, PATCreateResponse

router = APIRouter()

@router.post("/", response_model=PATCreateResponse)
async def create_pat(
    pat_in: PATCreate,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    raw_token = generate_pat()
    token_hash = hash_pat(raw_token)
    
    expires_at = None
    if pat_in.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=pat_in.expires_in_days)
        
    now = datetime.utcnow()
    pat_doc = {
        "user_id": ObjectId(current_user.id),
        "name": pat_in.name,
        "token_hash": token_hash,
        "scopes": pat_in.scopes,
        "expires_at": expires_at,
        "created_at": now,
        "last_used_at": None
    }
    
    result = await db.personal_access_tokens.insert_one(pat_doc)
    pat_doc["_id"] = str(result.inserted_id)
    
    # We return the PATCreateResponse which includes the raw token once
    return PATCreateResponse(
        **pat_doc,
        token=raw_token
    )

@router.get("/", response_model=List[PATResponse])
async def list_pats(
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    cursor = db.personal_access_tokens.find({"user_id": ObjectId(current_user.id)})
    pats = await cursor.to_list(length=100)
    
    for pat in pats:
        pat["_id"] = str(pat["_id"])
        
    return pats

@router.delete("/{pat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_pat(
    pat_id: str,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        obj_id = ObjectId(pat_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid PAT ID")
        
    result = await db.personal_access_tokens.delete_one({
        "_id": obj_id,
        "user_id": ObjectId(current_user.id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="PAT not found")
        
    return None
