"""Moderatsiya endpoint'lari — /v1/moderation/* (faqat moderator/admin)."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.db import get_db
from app.models.enums import RoleCode, VerifiedStatus
from app.models.user import DisabilityProfile, Region, User
from app.modules.auth.deps import require_roles
from app.modules.users import service
from app.schemas.moderation import DisabilityQueueItem, ModerateRequest

router = APIRouter(prefix="/moderation", tags=["moderation"])

# Barcha endpoint'lar moderator yoki admin talab qiladi
_moderator = require_roles(RoleCode.MODERATOR, RoleCode.ADMIN)


async def _region_name(db: AsyncSession, region_id: int | None) -> str | None:
    if region_id is None:
        return None
    region = await db.get(Region, region_id)
    return region.name if region else None


@router.get(
    "/disability-profiles",
    response_model=list[DisabilityQueueItem],
    dependencies=[Depends(_moderator)],
)
async def pending_disability_profiles(
    db: AsyncSession = Depends(get_db),
) -> list[DisabilityQueueItem]:
    rows = (
        (
            await db.execute(
                select(DisabilityProfile)
                .where(DisabilityProfile.verified_status == VerifiedStatus.PENDING)
                .options(selectinload(DisabilityProfile.user))
                .order_by(DisabilityProfile.submitted_at)
            )
        )
        .scalars()
        .all()
    )
    return [
        DisabilityQueueItem(
            user_id=p.user_id,
            full_name=p.user.full_name,
            region_name=await _region_name(db, p.user.region_id),
            group_type=p.group_type,
            categories=p.categories,
            verified_status=p.verified_status,
            submitted_at=p.submitted_at,
            doc_url=p.doc_url,
        )
        for p in rows
    ]


@router.post(
    "/disability-profiles/{user_id}/verify",
    response_model=DisabilityQueueItem,
)
async def verify_disability_profile(
    user_id: int,
    data: ModerateRequest,
    moderator: User = Depends(_moderator),
    db: AsyncSession = Depends(get_db),
) -> DisabilityQueueItem:
    profile = await service.moderate_disability_profile(
        db, moderator, user_id, data.approve, data.reason
    )
    user = await db.get(User, user_id)
    assert user is not None  # profil mavjud bo'lsa user ham mavjud (FK)
    return DisabilityQueueItem(
        user_id=profile.user_id,
        full_name=user.full_name,
        region_name=await _region_name(db, user.region_id),
        group_type=profile.group_type,
        categories=profile.categories,
        verified_status=profile.verified_status,
        submitted_at=profile.submitted_at,
        doc_url=profile.doc_url,
    )
