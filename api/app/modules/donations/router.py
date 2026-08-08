"""Ochiq xayriya endpoint'lari — /v1/donation-projects/* (V2-2, B4-bo'lim).

Ko'pchilik endpoint OCHIQ (loginsiz) — bu bo'limning butun maqsadi shu:
ro'yxatdan o'tish to'siqsiz hissa qo'shish.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import require_roles
from app.modules.donations import service
from app.schemas.donation import (
    DonateIn,
    DonateOut,
    DonationOut,
    DonationProjectIn,
    DonationProjectOut,
    DonationProjectReportUpdate,
    DonationProjectStatusUpdate,
)

_owner = require_roles(RoleCode.ADMIN, RoleCode.DONOR)
# Loginsiz, ochiq endpoint — himoyasiz qoldirilsa, PENDING Donation qatorlari
# bilan jadvalni to'ldirib tashlash mumkin edi.
_limit_donate = rate_limit("donate", limit=10, window_seconds=3600)

router = APIRouter(prefix="/donation-projects", tags=["donations"])


@router.post("", response_model=DonationProjectOut, status_code=201)
async def create_project(
    data: DonationProjectIn,
    owner: User = Depends(_owner),
    db: AsyncSession = Depends(get_db),
) -> DonationProjectOut:
    return await service.create_project(db, owner, data)


@router.get("/mine", response_model=list[DonationProjectOut])
async def my_projects(
    owner: User = Depends(_owner), db: AsyncSession = Depends(get_db)
) -> list[DonationProjectOut]:
    return await service.list_my_projects(db, owner)


@router.get("", response_model=list[DonationProjectOut])
async def browse_projects(
    status: str | None = None, db: AsyncSession = Depends(get_db)
) -> list[DonationProjectOut]:
    return await service.list_public_projects(db, status=status)


@router.get("/{project_id}", response_model=DonationProjectOut)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)) -> DonationProjectOut:
    return await service.project_detail(db, project_id)


@router.patch("/{project_id}/status", response_model=DonationProjectOut)
async def update_status(
    project_id: int,
    data: DonationProjectStatusUpdate,
    user: User = Depends(_owner),
    db: AsyncSession = Depends(get_db),
) -> DonationProjectOut:
    return await service.set_project_status(db, user, project_id, data.status)


@router.patch("/{project_id}/report", response_model=DonationProjectOut)
async def update_report(
    project_id: int,
    data: DonationProjectReportUpdate,
    user: User = Depends(_owner),
    db: AsyncSession = Depends(get_db),
) -> DonationProjectOut:
    return await service.set_project_report(db, user, project_id, data.report)


@router.get("/{project_id}/donations", response_model=list[DonationOut])
async def list_donations(
    project_id: int, user: User = Depends(_owner), db: AsyncSession = Depends(get_db)
) -> list[DonationOut]:
    return await service.list_project_donations(db, user, project_id)


@router.post(
    "/{project_id}/donate",
    response_model=DonateOut,
    status_code=201,
    dependencies=[Depends(_limit_donate)],
)
async def donate(project_id: int, data: DonateIn, db: AsyncSession = Depends(get_db)) -> DonateOut:
    return await service.donate(db, project_id, data)
