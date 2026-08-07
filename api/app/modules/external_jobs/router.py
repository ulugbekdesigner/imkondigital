"""Xalqaro ish e'lonlari endpoint'lari — /v1/external-jobs."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import get_current_user_optional, require_roles
from app.modules.external_jobs import service
from app.schemas.external_job import (
    ExternalJobDetail,
    ExternalJobPage,
    ExternalJobsSyncStatus,
    ExternalJobSyncResult,
)

router = APIRouter(tags=["external-jobs"])
_admin = require_roles(RoleCode.ADMIN)


@router.get("/external-jobs", response_model=ExternalJobPage)
async def catalog(
    cursor: int | None = None,
    limit: int = 12,
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> ExternalJobPage:
    return await service.list_external_jobs(db, viewer, cursor=cursor, limit=min(limit, 48))


@router.get("/external-jobs/{job_id}", response_model=ExternalJobDetail)
async def detail(
    job_id: int,
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> ExternalJobDetail:
    return await service.get_external_job(db, job_id, viewer)


@router.post("/admin/external-jobs/sync", response_model=ExternalJobSyncResult)
async def sync(
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> ExternalJobSyncResult:
    return await service.sync_all_sources(db)


@router.get("/admin/external-jobs/status", response_model=ExternalJobsSyncStatus)
async def sync_status(
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> ExternalJobsSyncStatus:
    return await service.get_sync_status(db)
