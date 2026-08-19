from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
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

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    hashed_password: str
    avatar: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    verification_code: Optional[str] = None
    code_expires_at: Optional[str] = None
    password_last_updated: Optional[datetime] = None
    last_activity: Optional[datetime] = None
    reset_token: Optional[str] = None
    reset_token_expires: Optional[str] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserOut(UserBase):
    id: str = Field(alias="_id")
    avatar: Optional[str] = None
    is_verified: bool = False
    
    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenResponse(BaseModel):
    token: str
    user: UserOut

class VerifyEmailReq(BaseModel):
    email: EmailStr
    code: str

class ForgotPasswordReq(BaseModel):
    email: EmailStr

class ResetPasswordReq(BaseModel):
    token: str
    new_password: str

class PATCreate(BaseModel):
    name: str
    scopes: list[str]
    expires_in_days: Optional[int] = None

class PATResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    scopes: list[str]
    expires_at: Optional[datetime] = None
    created_at: datetime
    last_used_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}

class PATCreateResponse(PATResponse):
    token: str
