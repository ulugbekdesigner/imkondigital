"""Xususiyat bayroqlari endpoint'lari - /v1/feature-flags/*.

Ochiq (mehmon ham) - GET /feature-flags har foydalanuvchi uchun ALLAQACHON
ANIQLANGAN (resolved) holatni qaytaradi, chunki rollout-foiz hisoblash
mantiqi faqat backendda bir joyda yashashi kerak (frontendda takrorlanmaydi).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import get_current_user_optional, require_roles
from app.modules.feature_flags import service
from app.schemas.feature_flag import FeatureFlagOut, FeatureFlagUpdate

router = APIRouter(prefix="/feature-flags", tags=["feature-flags"])
_admin = require_roles(RoleCode.ADMIN)


@router.get("", response_model=dict[str, bool])
async def public_flags(
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    return await service.resolved_flags(db, viewer)


@router.get("/admin", response_model=list[FeatureFlagOut])
async def admin_list_flags(
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> list[FeatureFlagOut]:
    return await service.list_flags(db)


@router.post("/admin/{name}", response_model=FeatureFlagOut)
async def admin_upsert_flag(
    name: str,
    data: FeatureFlagUpdate,
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> FeatureFlagOut:
    return await service.upsert_flag(db, name, data)
