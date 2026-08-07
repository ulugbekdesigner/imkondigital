"""Telegram bog'lash — link-kod generatsiyasi va bot tomonidan tasdiqlash."""

from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.telegram import generate_link_code, hash_link_code
from app.models.telegram import TelegramLink, TelegramLinkCode
from app.models.user import User

LINK_CODE_EXPIRE_MINUTES = 10


async def create_link_code(db: AsyncSession, user: User) -> tuple[str, int]:
    """(kod, amal qilish muddati daqiqada) qaytaradi."""
    code = generate_link_code()
    db.add(
        TelegramLinkCode(
            user_id=user.id,
            code_hash=hash_link_code(code),
            expires_at=datetime.now(UTC) + timedelta(minutes=LINK_CODE_EXPIRE_MINUTES),
        )
    )
    await db.commit()
    return code, LINK_CODE_EXPIRE_MINUTES


async def is_linked(db: AsyncSession, user_id: int) -> bool:
    link = (
        await db.execute(select(TelegramLink).where(TelegramLink.user_id == user_id))
    ).scalar_one_or_none()
    return link is not None


async def confirm_link(db: AsyncSession, code: str, chat_id: int) -> User:
    """Bot /start <code> qabul qilgach chaqiradi — kodni hisobga bog'laydi."""
    code_hash = hash_link_code(code)
    link_code = (
        await db.execute(
            select(TelegramLinkCode).where(
                TelegramLinkCode.code_hash == code_hash,
                TelegramLinkCode.consumed.is_(False),
                TelegramLinkCode.expires_at > datetime.now(UTC),
            )
        )
    ).scalar_one_or_none()
    if link_code is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kod noto'g'ri yoki muddati o'tgan. Ilovadan yangi kod so'rang.",
        )

    link_code.consumed = True

    existing = (
        await db.execute(select(TelegramLink).where(TelegramLink.user_id == link_code.user_id))
    ).scalar_one_or_none()
    if existing is not None:
        existing.chat_id = chat_id
    else:
        db.add(TelegramLink(user_id=link_code.user_id, chat_id=chat_id))

    await db.commit()

    user = await db.get(User, link_code.user_id)
    assert user is not None
    return user
