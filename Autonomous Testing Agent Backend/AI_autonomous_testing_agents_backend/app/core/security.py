
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
import bcrypt
import re
from app.core.config import settings

def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def validate_password(password: str) -> None:
    """Validates a password against the configured policy. Raises ValueError if validation fails."""
    if len(password) < settings.PASSWORD_MIN_LENGTH:
        raise ValueError(f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long")
    
    if settings.PASSWORD_REQUIRE_UPPERCASE and not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
        
    if settings.PASSWORD_REQUIRE_LOWERCASE and not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
        
    if settings.PASSWORD_REQUIRE_NUMBER and not re.search(r"\d", password):
        raise ValueError("Password must contain at least one number")
        
    if settings.PASSWORD_REQUIRE_SPECIAL and not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character")

import secrets
import hashlib

def generate_pat() -> str:
    """Generate a high-entropy Personal Access Token."""
    random_str = secrets.token_urlsafe(32)
    return f"ai_pat_{random_str}"

def hash_pat(token: str) -> str:
    """Hash a PAT using SHA-256 for fast O(1) DB lookup."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
