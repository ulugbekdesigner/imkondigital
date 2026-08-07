"""Xavfsizlik yordamchilari — parol hashing (argon2) va JWT token'lar."""

import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import get_settings

settings = get_settings()
_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def hash_code(code: str) -> str:
    """SMS tasdiqlash kodini hash qiladi (parol bilan bir xil algoritm)."""
    return _hasher.hash(code)


def verify_code(code: str, code_hash: str) -> bool:
    try:
        return _hasher.verify(code_hash, code)
    except VerifyMismatchError:
        return False


def generate_phone_code() -> str:
    """6 xonali tasdiqlash kodi."""
    return f"{secrets.randbelow(1_000_000):06d}"


def create_access_token(user_id: int) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.access_token_expire_minutes)).timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: int) -> tuple[str, str, datetime]:
    """Refresh token yaratadi. Qaytaradi: (token, jti, expires_at)."""
    now = datetime.now(UTC)
    jti = uuid.uuid4().hex
    expires_at = now + timedelta(days=settings.refresh_token_expire_days)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "type": "refresh",
        "jti": jti,
        "iat": int(now.timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)
    return token, jti, expires_at


def decode_token(token: str) -> dict[str, Any]:
    """Token'ni tekshiradi va payload qaytaradi. Xato bo'lsa jwt.PyJWTError ko'taradi."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
