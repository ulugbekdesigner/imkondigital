"""Auth endpoint'lari — /v1/auth/*."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.modules.auth import service
from app.schemas.auth import (
    LoginRequest,
    PasswordResetConfirm,
    RefreshRequest,
    RegisterRequest,
    RegisterResponse,
    TokenResponse,
    VerifyPhoneRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_limit_register = rate_limit("register", limit=5, window_seconds=3600)
_limit_login = rate_limit("login", limit=10, window_seconds=900)
_limit_verify = rate_limit("verify-phone", limit=10, window_seconds=900)
_limit_reset = rate_limit("reset-password", limit=10, window_seconds=3600)


@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(_limit_register)],
)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)) -> RegisterResponse:
    return await service.register(db, data)


@router.post("/verify-phone", response_model=TokenResponse, dependencies=[Depends(_limit_verify)])
async def verify_phone(
    data: VerifyPhoneRequest, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    return await service.verify_phone(db, data)


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(_limit_login)])
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    return await service.login(db, data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    return await service.refresh(db, data.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: RefreshRequest, db: AsyncSession = Depends(get_db)) -> None:
    await service.logout(db, data.refresh_token)


@router.post(
    "/reset-password", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(_limit_reset)]
)
async def reset_password(data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)) -> None:
    await service.reset_password(db, data.token, data.new_password)
