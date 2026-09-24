from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
import httpx
import urllib.parse
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from pydantic import BaseModel
from jose import jwt, JWTError

from app.api.deps import get_db, get_current_user
from app.core import security
from app.core.config import settings
from app.schemas.user import UserCreate, UserLogin, UserOut, UserInDB
from app.schemas.token import TokenResponse
from app.core.email import send_password_reset_email

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

router = APIRouter()

@router.post("/signup", response_model=UserOut)
async def signup(
    user_in: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Check if user exists
    user = await db.users.find_one({"email": user_in.email})
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    
    # Validate password policy
    try:
        security.validate_password(user_in.password)
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )

    # Hash password and create user object
    hashed_password = security.get_password_hash(user_in.password)
    db_user = UserInDB(
        **user_in.model_dump(exclude={"password"}), 
        hashed_password=hashed_password
    )
    
    # Insert to DB
    result = await db.users.insert_one(db_user.model_dump(by_alias=True, exclude_none=True))
    
    # Return created user
    created_user = await db.users.find_one({"_id": result.inserted_id})
    if not created_user:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    created_user["_id"] = str(created_user["_id"])
    return UserOut(**created_user)

@router.post("/login", response_model=TokenResponse)
async def login(
    user_in: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    user = await db.users.find_one({"email": user_in.email})
    if not user or not security.verify_password(user_in.password, user["hashed_password"]):
        raise HTTPException(
            status_code=400, detail="Incorrect email or password"
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        subject=str(user["_id"]), expires_delta=access_token_expires
    )
    
    user["_id"] = str(user["_id"])
    return TokenResponse(
        token=token,
        user=UserOut(**user)
    )

@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Prevent email enumeration by always returning success
        return {"msg": "If your email is registered, you will receive a password reset link."}
    
    # Generate a short-lived token (15 mins) specifically for reset
    reset_token = security.create_access_token(
        subject=f"reset:{str(user['_id'])}", 
        expires_delta=timedelta(minutes=15)
    )
    
    await send_password_reset_email(request.email, reset_token)
    return {"msg": "If your email is registered, you will receive a password reset link."}

@router.post("/reset-password")
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    try:
        payload = jwt.decode(request.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        sub = payload.get("sub")
        if not sub or not sub.startswith("reset:"):
            raise HTTPException(status_code=400, detail="Invalid token type")
        
        user_id = sub.split("reset:")[1]
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    hashed_password = security.get_password_hash(request.new_password)
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"hashed_password": hashed_password}}
    )
    
    return {"msg": "Password has been reset successfully"}

# --- OAUTH ENDPOINTS ---

@router.get("/google")
async def google_login():
    """
    Redirect the user to Google's OAuth 2.0 authorization screen.
    """
    client_id = settings.GOOGLE_CLIENT_ID
    redirect_uri = settings.GOOGLE_REDIRECT_URI or "http://localhost:8000/api/v1/auth/google/callback"
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account"
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)

@router.get("/google/callback")
async def google_callback(code: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Handle Google OAuth callback: exchange code for tokens, fetch user info, create/login user, and redirect to frontend with JWT.
    """
    token_url = "https://oauth2.googleapis.com/token"
    redirect_uri = settings.GOOGLE_REDIRECT_URI or "http://localhost:8000/api/v1/auth/google/callback"
    
    data = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": redirect_uri
    }
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post(token_url, data=data)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to retrieve token from Google")
        
        tokens = token_res.json()
        access_token_google = tokens.get("access_token")
        
        user_info_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token_google}"}
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to retrieve user info from Google")
        
        google_user = user_info_res.json()
        
    email = google_user.get("email")
    name = google_user.get("name") or email.split("@")[0] if email else "User"
    picture = google_user.get("picture")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")
        
    # Check if user already exists
    user = await db.users.find_one({"email": email})
    if not user:
        # Create user for OAuth sign in
        new_user = {
            "email": email,
            "full_name": name,
            "hashed_password": "",  # OAuth users have no password
            "picture": picture,
            "is_active": True,
            "auth_provider": "google",
            "created_at": datetime.utcnow()
        }
        result = await db.users.insert_one(new_user)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
        
    # Create JWT access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        subject=user_id, expires_delta=access_token_expires
    )
    
    # Redirect to frontend callback URL with token
    frontend_url = f"http://localhost:5173/auth/callback?token={token}&email={urllib.parse.quote(email)}&name={urllib.parse.quote(name)}"
    return RedirectResponse(url=frontend_url)

@router.get("/github")
async def github_login():
    """
    Redirect the user to GitHub's OAuth 2.0 authorization screen.
    """
    client_id = settings.GITHUB_CLIENT_ID
    redirect_uri = settings.GITHUB_REDIRECT_URI or "http://localhost:8000/api/v1/auth/github/callback"
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": "user:email"
    }
    url = f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)

@router.get("/github/callback")
async def github_callback(code: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Handle GitHub OAuth callback: exchange authorization code for token, fetch user info, create/login user, and redirect to frontend.
    """
    token_url = "https://github.com/login/oauth/access_token"
    redirect_uri = settings.GITHUB_REDIRECT_URI or "http://localhost:8000/api/v1/auth/github/callback"
    
    headers = {"Accept": "application/json"}
    data = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": redirect_uri
    }
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post(token_url, data=data, headers=headers)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to retrieve token from GitHub")
        
        tokens = token_res.json()
        access_token_github = tokens.get("access_token")
        if not access_token_github:
            error_desc = tokens.get("error_description", "Invalid authorization code or GitHub OAuth error")
            raise HTTPException(status_code=400, detail=error_desc)
        
        # Fetch GitHub user profile
        user_res = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"Bearer {access_token_github}", "User-Agent": "AI-Testing-Agent"}
        )
        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to retrieve user info from GitHub")
        
        github_user = user_res.json()
        
        email = github_user.get("email")
        if not email:
            # Fetch private user emails if primary email is null
            email_res = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token_github}", "User-Agent": "AI-Testing-Agent"}
            )
            if email_res.status_code == 200:
                emails = email_res.json()
                primary_email = next((e["email"] for e in emails if e.get("primary")), None)
                if primary_email:
                    email = primary_email
                elif emails:
                    email = emails[0].get("email")
                    
    if not email:
        email = f"{github_user.get('login', 'user')}@github.com"
        
    name = github_user.get("name") or github_user.get("login") or "GitHub User"
    picture = github_user.get("avatar_url")
    
    # Check if user already exists
    user = await db.users.find_one({"email": email})
    if not user:
        new_user = {
            "email": email,
            "full_name": name,
            "hashed_password": "",
            "picture": picture,
            "is_active": True,
            "auth_provider": "github",
            "created_at": datetime.utcnow()
        }
        result = await db.users.insert_one(new_user)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        subject=user_id, expires_delta=access_token_expires
    )
    
    frontend_url = f"http://localhost:5173/auth/callback?token={token}&email={urllib.parse.quote(email)}&name={urllib.parse.quote(name)}"
    return RedirectResponse(url=frontend_url)
