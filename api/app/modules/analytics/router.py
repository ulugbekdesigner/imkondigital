"""Analitika endpoint'lari — /v1/analytics/* (anonim agregat, rolga qarab)."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.analytics import service
from app.modules.auth.deps import require_roles
from app.schemas.analytics import AdminOverview, DonorOverview, GovOverview, RegistrationsDaily

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/admin/overview", response_model=AdminOverview)
async def admin_overview(
    _admin: User = Depends(require_roles(RoleCode.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> AdminOverview:
    return await service.admin_overview(db)


@router.get("/admin/registrations-daily", response_model=RegistrationsDaily)
async def registrations_daily(
    _admin: User = Depends(require_roles(RoleCode.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> RegistrationsDaily:
    return await service.registrations_daily(db)


@router.get("/donor/overview", response_model=DonorOverview)
async def donor_overview(
    donor: User = Depends(require_roles(RoleCode.DONOR)),
    db: AsyncSession = Depends(get_db),
) -> DonorOverview:
    return await service.donor_overview(db, donor)


@router.get("/gov/overview", response_model=GovOverview)
async def gov_overview(
    _gov: User = Depends(require_roles(RoleCode.GOV)),
    db: AsyncSession = Depends(get_db),
) -> GovOverview:
    return await service.gov_overview(db)


@router.get("/gov/overview/export")
async def export_gov_overview(
    _gov: User = Depends(require_roles(RoleCode.GOV)),
    db: AsyncSession = Depends(get_db),
) -> Response:
    csv_text = await service.export_gov_overview_csv(db)
    return Response(
        content=csv_text,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=milliy-statistika.csv"},
    )
