from pydantic import BaseModel
from app.schemas.user import UserOut

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenResponse(BaseModel):
    token: str
    user: UserOut
