import base64
from cryptography.fernet import Fernet
from typing import Optional
from app.core.config import settings

def get_fernet() -> Fernet:
    """
    Returns a Fernet instance using the ENCRYPTION_KEY from environment.
    If the key is not set, a dummy fallback is used for development (warning: not for production).
    The key must be 32 url-safe base64-encoded bytes.
    """
    key = settings.ENCRYPTION_KEY
    if not key:
        # Fallback dummy key - strictly for local development if unconfigured
        key = base64.urlsafe_b64encode(b"0123456789abcdef0123456789abcdef").decode("utf-8")
    
    return Fernet(key.encode("utf-8"))

def encrypt_token(token: str) -> Optional[str]:
    """Encrypts a token securely at rest."""
    if not token:
        return None
    try:
        fernet = get_fernet()
        return fernet.encrypt(token.encode("utf-8")).decode("utf-8")
    except Exception as e:
        import logging
        logging.error(f"Failed to encrypt token: {e}")
        return None

def decrypt_token(encrypted_token: str) -> Optional[str]:
    """Decrypts a previously encrypted token."""
    if not encrypted_token:
        return None
    try:
        fernet = get_fernet()
        return fernet.decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
    except Exception as e:
        import logging
        logging.error(f"Failed to decrypt token: {e}")
        return None
