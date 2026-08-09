"""Xususiyat bayroqlari - ro'yxat, upsert, foydalanuvchi uchun aniqlash (resolve)."""

import zlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.feature_flag import FeatureFlag
from app.models.user import User
from app.schemas.feature_flag import FeatureFlagOut, FeatureFlagUpdate


def _resolve(flag: FeatureFlag, user: User | None) -> bool:
    if not flag.enabled:
        return False
    if flag.rollout_percent >= 100:
        return True
    if flag.rollout_percent <= 0:
        return False
    if user is None:
        # Mehmon uchun barqaror xesh yo'q - faqat to'liq (100%) yoqilganda ko'radi.
        return False
    bucket = zlib.crc32(f"{flag.name}:{user.id}".encode()) % 100
    return bucket < flag.rollout_percent


async def resolved_flags(db: AsyncSession, user: User | None) -> dict[str, bool]:
    rows = (await db.execute(select(FeatureFlag))).scalars().all()
    return {f.name: _resolve(f, user) for f in rows}


async def list_flags(db: AsyncSession) -> list[FeatureFlagOut]:
    rows = (
        (await db.execute(select(FeatureFlag).order_by(FeatureFlag.name))).scalars().all()
    )
    return [FeatureFlagOut.model_validate(f) for f in rows]


async def upsert_flag(db: AsyncSession, name: str, data: FeatureFlagUpdate) -> FeatureFlagOut:
    flag = await db.get(FeatureFlag, name)
    if flag is None:
        flag = FeatureFlag(
            name=name,
            enabled=data.enabled,
            rollout_percent=data.rollout_percent,
            description=data.description,
        )
        db.add(flag)
    else:
        flag.enabled = data.enabled
        flag.rollout_percent = data.rollout_percent
        flag.description = data.description
    await db.commit()
    await db.refresh(flag)
    return FeatureFlagOut.model_validate(flag)
