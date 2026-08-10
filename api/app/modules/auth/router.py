"""Auth endpoint'lari — /v1/auth/*."""

from typing import Any

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
    TelegramLoginStartRequest,
    TelegramLoginStartResponse,
    TokenResponse,
    VerifyPhoneRequest,
)

router = APIRouter(prefix="/auth", tags=["auth"])

_limit_register = rate_limit("register", limit=5, window_seconds=3600)
_limit_login = rate_limit("login", limit=10, window_seconds=900)
_limit_verify = rate_limit("verify-phone", limit=10, window_seconds=900)
_limit_reset = rate_limit("reset-password", limit=10, window_seconds=3600)
_limit_telegram_start = rate_limit("telegram-login-start", limit=10, window_seconds=900)
# Frontend har 2 soniyada so'raydi, 5 daqiqagacha (~150 so'rov bitta urinishda) —
# limit shuni qamrab olishi, lekin cheklovsiz proksi-suiste'mol qilishga yo'l
# qo'ymasligi kerak.
_limit_telegram_status = rate_limit("telegram-login-status", limit=200, window_seconds=900)
_limit_telegram_finish = rate_limit("telegram-login-finish", limit=20, window_seconds=900)


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


# --- Tezkor Auth (markazlashgan Telegram-orqali kirish) ---
@router.post(
    "/telegram/start",
    response_model=TelegramLoginStartResponse,
    dependencies=[Depends(_limit_telegram_start)],
)
async def start_telegram_login(data: TelegramLoginStartRequest) -> TelegramLoginStartResponse:
    return await service.start_telegram_login(data.return_url)


@router.get("/telegram/status/{session_id}", dependencies=[Depends(_limit_telegram_status)])
async def telegram_login_status(session_id: str) -> dict[str, Any]:
    return await service.telegram_login_status(session_id)


@router.post(
    "/telegram/finish/{session_id}",
    response_model=TokenResponse,
    dependencies=[Depends(_limit_telegram_finish)],
)
async def finish_telegram_login(
    session_id: str, db: AsyncSession = Depends(get_db)
) -> TokenResponse:
    return await service.finish_telegram_login(db, session_id)
