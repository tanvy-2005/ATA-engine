from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List

from app.core.dependencies import get_db, get_current_user
from app.modules.schemas import UserOut
from app.modules.workspace import schemas
from app.modules.workspace import services

router = APIRouter()

@router.post("", response_model=schemas.WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    workspace_in: schemas.WorkspaceCreate,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Create a new workspace."""
    return await services.create_workspace(db, current_user.id, workspace_in)

@router.get("", response_model=List[schemas.WorkspaceResponse])
async def list_workspaces(
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List all workspaces the current user is a member of."""
    return await services.get_user_workspaces(db, current_user.id)

@router.get("/{slug}", response_model=schemas.WorkspaceResponse)
async def get_workspace(
    slug: str,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Get workspace details (requires membership)."""
    return await services.get_workspace(db, current_user.id, slug)

@router.post("/{slug}/members", response_model=schemas.WorkspaceMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_workspace_member(
    slug: str,
    member_in: schemas.WorkspaceMemberCreate,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Add a member to the workspace (requires admin/owner)."""
    return await services.add_member(db, current_user.id, slug, member_in)

@router.get("/{slug}/members", response_model=List[schemas.WorkspaceMemberResponse])
async def list_workspace_members(
    slug: str,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """List all members of the workspace."""
    return await services.list_members(db, current_user.id, slug)

@router.delete("/{slug}", status_code=status.HTTP_200_OK)
async def delete_workspace(
    slug: str,
    current_user: UserOut = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """Delete a workspace (requires owner)."""
    return await services.delete_workspace(db, current_user.id, slug)
