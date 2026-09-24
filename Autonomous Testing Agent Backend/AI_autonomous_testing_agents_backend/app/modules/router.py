import uuid
from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse, HTMLResponse
import httpx
import urllib.parse
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.core.dependencies import get_db, get_current_user
from app.core import security
from app.core.config import settings
from app.core.email import send_verification_email, send_password_reset_email
from app.modules.schemas import UserCreate, UserLogin, UserOut, UserInDB, TokenResponse, VerifyEmailReq, ForgotPasswordReq, ResetPasswordReq, ResendCodeReq

router = APIRouter()

@router.post("/signup", response_model=TokenResponse)
async def signup(
    user_in: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Normalize email to lowercase
    user_in.email = user_in.email.lower()
    
    try:
        security.validate_password(user_in.password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # Check if user exists
    user = await db.users.find_one({"email": user_in.email})
    if user:
        if not user.get("is_verified", False):
            # User previously initiated registration but has not verified their email yet.
            # Refresh verification code and update password.
            import random
            verification_code = str(random.randint(100000, 999999))
            code_expires = datetime.utcnow() + timedelta(minutes=15)
            hashed_password = security.get_password_hash(user_in.password)
            
            await db.users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "name": user_in.name,
                        "hashed_password": hashed_password,
                        "verification_code": verification_code,
                        "code_expires_at": code_expires.isoformat(),
                        "password_last_updated": datetime.utcnow(),
                        "last_activity": datetime.utcnow()
                    }
                }
            )
            
            # Send verification email asynchronously
            await send_verification_email(user_in.email, verification_code)
            
            user["_id"] = str(user["_id"])
            user["name"] = user_in.name
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            token = security.create_access_token(
                subject=str(user["_id"]), expires_delta=access_token_expires
            )
            return TokenResponse(
                token=token,
                user=UserOut(**user),
                verification_code=verification_code
            )
        else:
            raise HTTPException(
                status_code=400,
                detail="The user with this username already exists in the system",
            )
    
    # Generate 6-digit code
    import random
    verification_code = str(random.randint(100000, 999999))
    code_expires = datetime.utcnow() + timedelta(minutes=15)
    
    # Hash password and create user object
    hashed_password = security.get_password_hash(user_in.password)
    db_user = UserInDB(
        **user_in.model_dump(exclude={"password"}), 
        hashed_password=hashed_password,
        verification_code=verification_code,
        code_expires_at=code_expires.isoformat(),
        password_last_updated=datetime.utcnow(),
        last_activity=datetime.utcnow()
    )
    
    # Insert to DB
    result = await db.users.insert_one(db_user.model_dump(by_alias=True, exclude_none=True))
    
    # Send email
    await send_verification_email(user_in.email, verification_code)
    
    # Return created user
    created_user = await db.users.find_one({"_id": result.inserted_id})
    if not created_user:
        raise HTTPException(status_code=500, detail="Failed to create user")
        
    created_user["_id"] = str(created_user["_id"])
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        subject=str(created_user["_id"]), expires_delta=access_token_expires
    )
    return TokenResponse(
        token=token,
        user=UserOut(**created_user),
        verification_code=verification_code
    )

@router.post("/resend-code")
async def resend_code(
    req: ResendCodeReq,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    req.email = req.email.lower()
    user = await db.users.find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="No account found with this email.")
        
    if user.get("is_verified"):
        return {"msg": "This account is already verified."}
        
    import random
    verification_code = str(random.randint(100000, 999999))
    code_expires = datetime.utcnow() + timedelta(minutes=15)
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "verification_code": verification_code,
                "code_expires_at": code_expires.isoformat()
            }
        }
    )
    
    await send_verification_email(req.email, verification_code)
    return {"msg": "Verification code resent successfully", "verification_code": verification_code}

@router.get("/test-email")
async def test_email(to: str):
    import random
    code = str(random.randint(100000, 999999))
    success = await send_verification_email(to, code)
    if success:
        return {"status": "success", "message": f"Verification email with code {code} dispatched to {to}"}
    return {"status": "error", "message": f"Failed to send email to {to}. Check backend console for error details."}
 
@router.post("/login", response_model=TokenResponse)
async def login(
    user_in: UserLogin,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    # Normalize email to lowercase
    user_in.email = user_in.email.lower()
    
    user = await db.users.find_one({"email": user_in.email})
    if not user or not security.verify_password(user_in.password, user["hashed_password"]):
        raise HTTPException(
            status_code=400, detail="Incorrect email or password"
        )
    
    if settings.PASSWORD_EXPIRY_DAYS > 0:
        password_last_updated = user.get("password_last_updated")
        if password_last_updated:
            if isinstance(password_last_updated, str):
                try:
                    password_last_updated = datetime.fromisoformat(password_last_updated.replace("Z", "+00:00"))
                except ValueError:
                    password_last_updated = datetime.utcnow()
            if password_last_updated.tzinfo is not None:
                password_last_updated = password_last_updated.replace(tzinfo=None)
                
            if datetime.utcnow() - password_last_updated > timedelta(days=settings.PASSWORD_EXPIRY_DAYS):
                raise HTTPException(
                    status_code=403, detail="Password has expired. Please reset your password."
                )
        else:
            # For older accounts without this field, don't block them.
            pass
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        subject=str(user["_id"]), expires_delta=access_token_expires
    )
    
    # Update last_activity on login
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_activity": datetime.utcnow()}}
    )
    
    user["_id"] = str(user["_id"])
    return TokenResponse(
        token=token,
        user=UserOut(**user)
    )
 
@router.post("/verify-email")
async def verify_email(
    req: VerifyEmailReq,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    req.email = req.email.lower()
    user = await db.users.find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.get("is_verified"):
        return {"msg": "User already verified"}
        
    if user.get("verification_code") != req.code:
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    expires_at_str = user.get("code_expires_at")
    if expires_at_str:
        expires_at = datetime.fromisoformat(expires_at_str)
        if datetime.utcnow() > expires_at:
            raise HTTPException(status_code=400, detail="Verification code expired")
            
    # Mark as verified and remove code
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"is_verified": True},
            "$unset": {"verification_code": "", "code_expires_at": ""}
        }
    )
    
    return {"msg": "Email verified successfully"}
 
@router.post("/forgot-password")
async def forgot_password(
    req: ForgotPasswordReq,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    req.email = req.email.lower()
    user = await db.users.find_one({"email": req.email})
    if not user:
        # We return success anyway to prevent email enumeration attacks
        return {"msg": "If an account exists with this email, a password reset link has been sent."}
        
    reset_token = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expires": expires_at.isoformat()
            }
        }
    )
    
    await send_password_reset_email(req.email, reset_token)
    return {"msg": "If an account exists with this email, a password reset link has been sent."}

@router.post("/reset-password")
async def reset_password(
    req: ResetPasswordReq,
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    user = await db.users.find_one({"reset_token": req.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    expires_at_str = user.get("reset_token_expires")
    if not expires_at_str:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
        
    expires_at = datetime.fromisoformat(expires_at_str)
    if datetime.utcnow() > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
        
    try:
        security.validate_password(req.new_password)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    hashed_password = security.get_password_hash(req.new_password)
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "hashed_password": hashed_password,
                "password_last_updated": datetime.utcnow()
            },
            "$unset": {
                "reset_token": "",
                "reset_token_expires": ""
            }
        }
    )
    
    return {"msg": "Password has been reset successfully"}

@router.get("/me", response_model=UserOut)
async def get_my_profile(
    current_user: UserOut = Depends(get_current_user)
):
    """
    Protected endpoint to get current user's profile and test session inactivity.
    """
    return current_user

# --- GOOGLE OAUTH ENDPOINTS ---

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
            raise HTTPException(status_code=400, detail=f"Failed to retrieve token from Google: {token_res.text}")
        
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
    name = google_user.get("name") or (email.split("@")[0] if email else "User")
    picture = google_user.get("picture")
    
    if not email:
        raise HTTPException(status_code=400, detail="Email not provided by Google")
        
    # Check if user already exists
    user = await db.users.find_one({"email": email})
    if not user:
        # Create user for OAuth sign in
        new_user = {
            "name": name,
            "email": email,
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
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>Authenticating...</title>
    <style>body {{ background: #060b13; color: #06b6d4; margin: 0; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }}</style>
</head>
<body>
    <div style="font-size: 14px; letter-spacing: 2px;">AUTHENTICATING...</div>
    <script>
        const token = "{token}";
        const user = {{ id: "{user_id}", name: "{name}", email: "{email}" }};
        try {{
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("rememberMe", "true");
        }} catch(e) {{}}
        if (window.opener) {{
            try {{ window.opener.postMessage({{ type: "OAUTH_SUCCESS", token, user }}, "*"); }} catch(e) {{}}
            window.close();
        }} else {{
            window.location.href = "http://localhost:5173/auth/callback?token=" + encodeURIComponent(token) + "&email=" + encodeURIComponent("{email}") + "&name=" + encodeURIComponent("{name}");
        }}
    </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)


# --- GITHUB OAUTH ENDPOINTS ---

@router.get("/github")
async def github_login():
    """
    Redirect the user to GitHub's OAuth 2.0 authorization screen.
    """
    client_id = settings.GITHUB_CLIENT_ID
    if not client_id:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_CLIENT_ID is not configured in backend .env file. Please add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET."
        )
    redirect_uri = settings.GITHUB_REDIRECT_URI or "http://localhost:8000/api/v1/auth/github/callback"
    
    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": "read:user user:email",
        "allow_signup": "true"
    }
    url = f"https://github.com/login/oauth/authorize?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)

@router.get("/github/callback")
async def github_callback(code: str, state: Optional[str] = None, db: AsyncIOMotorDatabase = Depends(get_db)):
    """
    Handle GitHub OAuth callback: exchange code for access token, fetch user info/repos, create/login user or save integration config.
    """
    token_url = "https://github.com/login/oauth/access_token"
    redirect_uri = settings.GITHUB_REDIRECT_URI or "http://localhost:8000/api/v1/auth/github/callback"
    
    data = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": code,
        "redirect_uri": redirect_uri
    }
    
    headers = {"Accept": "application/json"}
    
    async with httpx.AsyncClient() as client:
        token_res = await client.post(token_url, data=data, headers=headers)
        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to retrieve token from GitHub: {token_res.text}")
        
        tokens = token_res.json()
        access_token_github = tokens.get("access_token")
        if not access_token_github:
            error_desc = tokens.get("error_description", "No access token returned from GitHub")
            raise HTTPException(status_code=400, detail=f"GitHub OAuth error: {error_desc}")
        
        user_info_res = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token_github}",
                "User-Agent": "ATA-Platform"
            }
        )
        if user_info_res.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to retrieve user profile from GitHub")
        
        github_user = user_info_res.json()

        # Handle Repository Integration Callback (if state starts with integration_)
        if state and state.startswith("integration_"):
            workspace_id = state.replace("integration_", "")
            repos_res = await client.get(
                "https://api.github.com/user/repos?per_page=100&sort=updated",
                headers={
                    "Authorization": f"Bearer {access_token_github}",
                    "User-Agent": "ATA-Platform"
                }
            )
            repos_data = repos_res.json() if repos_res.status_code == 200 and isinstance(repos_res.json(), list) else []
            repos_list = []
            for r in repos_data:
                repos_list.append({
                    "full_name": r.get("full_name"),
                    "default_branch": r.get("default_branch", "main"),
                    "private": r.get("private", False)
                })
            username = github_user.get("login", "GitHub User")
            default_repo = repos_list[0]["full_name"] if repos_list else ""
            default_branch = repos_list[0]["default_branch"] if repos_list else "main"
            now = datetime.now(timezone.utc).isoformat()
            config = {
                "token": access_token_github,
                "username": username,
                "organization": username,
                "repository": default_repo,
                "defaultBranch": default_branch,
                "repositories": repos_list
            }
            doc = {
                "type": "github",
                "workspaceId": workspace_id,
                "config": config,
                "status": "connected",
                "isEnabled": True,
                "updated_at": now
            }
            integration = await db["integrations"].find_one({"workspaceId": workspace_id, "type": "github"})
            if integration:
                await db["integrations"].update_one({"_id": integration["_id"]}, {"$set": doc})
            else:
                doc["created_at"] = now
                await db["integrations"].insert_one(doc)

            html_content = f"""<!DOCTYPE html>
<html>
<head><title>GitHub Connected</title></head>
<body style="background:#060b13;color:#06b6d4;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
    <div style="font-size:14px;letter-spacing:2px;">CONNECTED TO GITHUB!</div>
    <script>
        if (window.opener) {{
            window.opener.postMessage({{ type: "GITHUB_INTEGRATION_SUCCESS" }}, "*");
            window.close();
        }} else {{
            window.location.href = "http://localhost:5173/integrations/github";
        }}
    </script>
</body>
</html>"""
            return HTMLResponse(content=html_content)

        email = github_user.get("email")
        # If email is not public in primary profile, fetch user's emails list
        if not email:
            emails_res = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {access_token_github}",
                    "User-Agent": "ATA-Platform"
                }
            )
            if emails_res.status_code == 200:
                emails_data = emails_res.json()
                primary_email = next((e["email"] for e in emails_data if e.get("primary")), None)
                email = primary_email or (emails_data[0]["email"] if emails_data and isinstance(emails_data, list) else None)

    # Fallback if email is still not available (e.g. private emails without email list access)
    if not email:
        gh_login = github_user.get("login") or "github_user"
        email = f"{gh_login}@users.noreply.github.com"

    name = github_user.get("name") or github_user.get("login") or (email.split("@")[0] if email else "GitHub User")
    picture = github_user.get("avatar_url")
        
    # Check if user already exists
    user = await db.users.find_one({"email": email})
    if not user:
        # Create user for OAuth sign in
        new_user = {
            "name": name,
            "email": email,
            "hashed_password": "",  # OAuth users have no password
            "avatar": picture,
            "picture": picture,
            "is_active": True,
            "is_verified": True,
            "auth_provider": "github",
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
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <title>Authenticating...</title>
    <style>body {{ background: #060b13; color: #06b6d4; margin: 0; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; }}</style>
</head>
<body>
    <div style="font-size: 14px; letter-spacing: 2px;">AUTHENTICATING...</div>
    <script>
        const token = "{token}";
        const user = {{ id: "{user_id}", name: "{name}", email: "{email}" }};
        try {{
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            localStorage.setItem("rememberMe", "true");
        }} catch(e) {{}}
        if (window.opener) {{
            try {{ window.opener.postMessage({{ type: "OAUTH_SUCCESS", token, user }}, "*"); }} catch(e) {{}}
            window.close();
        }} else {{
            window.location.href = "http://localhost:5173/auth/callback?token=" + encodeURIComponent(token) + "&email=" + encodeURIComponent("{email}") + "&name=" + encodeURIComponent("{name}");
        }}
    </script>
</body>
</html>"""
    return HTMLResponse(content=html_content)

