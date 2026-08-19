from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")
        return field_schema

class WorkspaceBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    settings: Optional[dict] = {}

class WorkspaceCreate(WorkspaceBase):
    pass

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    settings: Optional[dict] = None

class WorkspaceResponse(WorkspaceBase):
    id: str = Field(alias="_id")
    owner_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class WorkspaceMemberBase(BaseModel):
    email: str
    role: str # "owner", "admin", "member"

class WorkspaceMemberCreate(WorkspaceMemberBase):
    pass

class WorkspaceMemberResponse(BaseModel):
    id: str = Field(alias="_id")
    workspace_id: str
    user_id: str
    role: str
    joined_at: datetime
    name: Optional[str] = None
    email: Optional[str] = None
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
