from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from fastapi import HTTPException, status
from app.modules.workspace.schemas import WorkspaceCreate, WorkspaceMemberCreate

async def create_workspace(db: AsyncIOMotorDatabase, current_user_id: str, workspace_in: WorkspaceCreate):
    import random
    slug = workspace_in.slug
    attempts = 0
    while True:
        existing = await db.workspaces.find_one({"slug": slug})
        if not existing:
            break
        attempts += 1
        if attempts > 5:
            slug = f"{workspace_in.slug}-{random.randint(1000, 9999)}"
        else:
            slug = f"{workspace_in.slug}-{attempts}"
            
    workspace_in.slug = slug

    now = datetime.utcnow()
    workspace_doc = {
        "name": workspace_in.name,
        "slug": workspace_in.slug,
        "description": workspace_in.description,
        "settings": workspace_in.settings,
        "owner_id": ObjectId(current_user_id),
        "created_at": now,
        "updated_at": now
    }

    result = await db.workspaces.insert_one(workspace_doc)
    workspace_id = result.inserted_id

    # Add the creator as the owner in the members collection
    member_doc = {
        "workspace_id": workspace_id,
        "user_id": ObjectId(current_user_id),
        "role": "owner",
        "joined_at": now
    }
    await db.workspace_members.insert_one(member_doc)
    
    workspace_doc["_id"] = str(workspace_id)
    workspace_doc["owner_id"] = str(workspace_doc["owner_id"])
    return workspace_doc

async def get_user_workspaces(db: AsyncIOMotorDatabase, current_user_id: str):
    # Find all workspaces the user is a member of
    cursor = db.workspace_members.find({"user_id": ObjectId(current_user_id)})
    memberships = await cursor.to_list(length=100)
    
    workspace_ids = [m["workspace_id"] for m in memberships]
    
    ws_cursor = db.workspaces.find({"_id": {"$in": workspace_ids}})
    workspaces = await ws_cursor.to_list(length=100)
    
    for ws in workspaces:
        ws["_id"] = str(ws["_id"])
        ws["owner_id"] = str(ws["owner_id"])
        
    return workspaces

async def check_workspace_permission(db: AsyncIOMotorDatabase, current_user_id: str, slug_or_id: str, required_roles: list = ["owner", "admin", "member"]):
    # First find workspace to get ObjectId
    is_object_id = ObjectId.is_valid(slug_or_id)
    query = {"_id": ObjectId(slug_or_id)} if is_object_id else {"slug": slug_or_id}
    
    workspace = await db.workspaces.find_one(query)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")
        
    member = await db.workspace_members.find_one({
        "workspace_id": workspace["_id"],
        "user_id": ObjectId(current_user_id)
    })
    
    if not member or member["role"] not in required_roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions for this workspace.")
        
    return workspace, member

async def get_workspace(db: AsyncIOMotorDatabase, current_user_id: str, slug: str):
    workspace, member = await check_workspace_permission(db, current_user_id, slug)
    workspace["_id"] = str(workspace["_id"])
    workspace["owner_id"] = str(workspace["owner_id"])
    return workspace

async def add_member(db: AsyncIOMotorDatabase, current_user_id: str, slug: str, member_in: WorkspaceMemberCreate):
    workspace, requester = await check_workspace_permission(db, current_user_id, slug, required_roles=["owner", "admin"])
    
    # Find user by email
    user = await db.users.find_one({"email": member_in.email})
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found.")
        
    # Check if already a member
    existing_member = await db.workspace_members.find_one({
        "workspace_id": workspace["_id"],
        "user_id": user["_id"]
    })
    
    if existing_member:
        raise HTTPException(status_code=400, detail="User is already a member of this workspace.")
        
    member_doc = {
        "workspace_id": workspace["_id"],
        "user_id": user["_id"],
        "role": member_in.role,
        "joined_at": datetime.utcnow()
    }
    result = await db.workspace_members.insert_one(member_doc)
    
    member_doc["_id"] = str(result.inserted_id)
    member_doc["workspace_id"] = str(member_doc["workspace_id"])
    member_doc["user_id"] = str(member_doc["user_id"])
    member_doc["name"] = user.get("name", "Unknown User")
    member_doc["email"] = user.get("email", "")
    return member_doc

async def list_members(db: AsyncIOMotorDatabase, current_user_id: str, slug: str):
    workspace, member = await check_workspace_permission(db, current_user_id, slug)
    
    cursor = db.workspace_members.find({"workspace_id": workspace["_id"]})
    members = await cursor.to_list(length=1000)
    
    for m in members:
        user = await db.users.find_one({"_id": m["user_id"]})
        if user:
            m["name"] = user.get("name", "Unknown User")
            m["email"] = user.get("email", "")
            
        m["_id"] = str(m["_id"])
        m["workspace_id"] = str(m["workspace_id"])
        m["user_id"] = str(m["user_id"])
        
    return members

async def delete_workspace(db: AsyncIOMotorDatabase, current_user_id: str, slug: str):
    workspace, requester = await check_workspace_permission(db, current_user_id, slug, required_roles=["owner"])
    
    workspace_id = workspace["_id"]
    
    # Delete workspace
    await db.workspaces.delete_one({"_id": workspace_id})
    
    # Delete workspace members
    await db.workspace_members.delete_many({"workspace_id": workspace_id})
    
    # Optionally cascade delete projects and integrations
    await db.projects.delete_many({"workspaceId": str(workspace_id)})
    await db.integrations.delete_many({"workspaceId": str(workspace_id)})
    
    return {"detail": "Workspace deleted successfully"}
