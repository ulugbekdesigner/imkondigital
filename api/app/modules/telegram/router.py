"""Telegram bog'lash endpoint'lari — /v1/me/telegram/*, /v1/telegram/confirm-link.

`confirm-link` — botning o'zi chaqiradi (foydalanuvchi emas), shu sabab JWT
o'rniga umumiy ichki sir (header) bilan tasdiqlanadi (Payme/Click webhook'lari
kabi — o'z protokoli bilan autentifikatsiya).
"""

import hmac

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import get_db
from app.models.user import User
from app.modules.auth.deps import get_current_user
from app.modules.telegram import service
from app.schemas.notifications import (
    TelegramConfirmLinkRequest,
    TelegramLinkCodeOut,
    TelegramLinkStatusOut,
)

settings = get_settings()

router = APIRouter(tags=["telegram"])


@router.post("/me/telegram/link-code", response_model=TelegramLinkCodeOut)
async def create_link_code(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TelegramLinkCodeOut:
    code, expires_in_minutes = await service.create_link_code(db, user)
    return TelegramLinkCodeOut(
        code=code,
        bot_username=settings.telegram_bot_username,
        expires_in_minutes=expires_in_minutes,
    )


@router.get("/me/telegram/status", response_model=TelegramLinkStatusOut)
async def telegram_status(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TelegramLinkStatusOut:
    linked = await service.is_linked(db, user.id)
    return TelegramLinkStatusOut(linked=linked)


@router.post("/telegram/confirm-link")
async def confirm_link(
    data: TelegramConfirmLinkRequest,
    db: AsyncSession = Depends(get_db),
    x_internal_secret: str | None = Header(default=None),
) -> dict[str, bool]:
    if not x_internal_secret or not hmac.compare_digest(
        x_internal_secret, settings.telegram_internal_secret
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ruxsat yo'q")
    await service.confirm_link(db, data.code, data.chat_id)
    return {"ok": True}
