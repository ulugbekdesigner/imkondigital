"""Auth dependency'lari — joriy foydalanuvchi va rol tekshiruvi (RBAC)."""

from collections.abc import Awaitable, Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import decode_token
from app.models.enums import RoleCode, UserStatus
from app.models.user import User

_bearer = HTTPBearer(auto_error=True)
_bearer_optional = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(credentials.credentials)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Yaroqsiz yoki muddati o'tgan token",
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Access token talab qilinadi"
        )

    user = (
        await db.execute(select(User).where(User.id == int(payload["sub"])))
    ).scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Foydalanuvchi topilmadi"
        )
    if user.status == UserStatus.BLOCKED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob bloklangan")
    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_optional),
    db: AsyncSession = Depends(get_db),
) -> User | None:
    """Token bo'lmasa yoki yaroqsiz bo'lsa None qaytaradi — xato ko'tarmaydi.

    Public sahifalar uchun: mehmon ham, egasi ham kira oladi, lekin egasi
    o'zining maxfiy (private) passportini ko'ra oladi.
    """
    if credentials is None:
        return None
    try:
        payload = decode_token(credentials.credentials)
    except jwt.PyJWTError:
        return None
    if payload.get("type") != "access":
        return None
    return (
        await db.execute(select(User).where(User.id == int(payload["sub"])))
    ).scalar_one_or_none()


def require_roles(*codes: RoleCode) -> Callable[[User], Awaitable[User]]:
    """Berilgan rollardan kamida bittasi bo'lishini talab qiladi."""
    allowed = {c.value for c in codes}

    async def _checker(user: User = Depends(get_current_user)) -> User:
        user_roles = {r.code for r in user.roles}
        if allowed.isdisjoint(user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bu amal uchun ruxsatingiz yo'q",
            )
        return user

    return _checker
