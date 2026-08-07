"""AI kunlik kvota nazorati — DB darajasida to'g'ridan-to'g'ri tekshirish."""

import httpx
import pytest
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_quota import check_and_increment_quota
from app.models.enums import AiFeature
from tests.helpers import auth_header, register_and_verify


async def _make_user_id(client: httpx.AsyncClient, phone: str) -> int:
    tokens = await register_and_verify(client, phone=phone)
    me = await client.get("/v1/users/me", headers=auth_header(tokens["access_token"]))
    return int(me.json()["id"])


async def test_quota_increments_and_blocks_at_limit(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_id = await _make_user_id(client, "+998918001100")

    # Sozlamadagi standart: ai_daily_quota_cv_builder=3 (eng kichik limit — tez tekshirish uchun)
    for _ in range(3):
        await check_and_increment_quota(db, user_id, AiFeature.CV_BUILDER)
    await db.commit()

    with pytest.raises(HTTPException) as exc_info:
        await check_and_increment_quota(db, user_id, AiFeature.CV_BUILDER)
    assert exc_info.value.status_code == 429


async def test_quota_is_scoped_per_feature(client: httpx.AsyncClient, db: AsyncSession) -> None:
    user_id = await _make_user_id(client, "+998918002200")

    for _ in range(3):
        await check_and_increment_quota(db, user_id, AiFeature.CV_BUILDER)
    await db.commit()

    # Boshqa xususiyat (career_coach) alohida hisoblanadi — bloklanmaydi
    await check_and_increment_quota(db, user_id, AiFeature.CAREER_COACH)
    await db.commit()


async def test_quota_is_scoped_per_user(client: httpx.AsyncClient, db: AsyncSession) -> None:
    user_a = await _make_user_id(client, "+998918003300")
    user_b = await _make_user_id(client, "+998918004400")

    for _ in range(3):
        await check_and_increment_quota(db, user_a, AiFeature.CV_BUILDER)
    await db.commit()

    # Boshqa foydalanuvchi hali limitga yetmagan
    await check_and_increment_quota(db, user_b, AiFeature.CV_BUILDER)
    await db.commit()
