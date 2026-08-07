"""Psixologik qo'llab-quvvatlash endpoint'lari.

/v1/admin/support/* (admin CRUD) va /v1/support/* (ochiq, published ro'yxat).
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import require_roles
from app.modules.support import service
from app.schemas.support import (
    SupportContentIn,
    SupportContentOut,
    SupportResourceIn,
    SupportResourceOut,
    SupportStatusUpdate,
)

_admin = require_roles(RoleCode.ADMIN)

router = APIRouter(prefix="/admin/support", tags=["support"])


@router.get("/contents", response_model=list[SupportContentOut])
async def list_contents(
    _admin_user: User = Depends(_admin), db: AsyncSession = Depends(get_db)
) -> list[SupportContentOut]:
    return await service.list_all_content(db)


@router.post("/contents", response_model=SupportContentOut, status_code=201)
async def create_content(
    data: SupportContentIn, admin: User = Depends(_admin), db: AsyncSession = Depends(get_db)
) -> SupportContentOut:
    return await service.create_content(db, admin, data)


@router.patch("/contents/{content_id}/status", response_model=SupportContentOut)
async def update_content_status(
    content_id: int,
    data: SupportStatusUpdate,
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> SupportContentOut:
    return await service.set_content_status(db, content_id, data.status)


@router.delete("/contents/{content_id}", status_code=204)
async def delete_content(
    content_id: int, _admin_user: User = Depends(_admin), db: AsyncSession = Depends(get_db)
) -> None:
    await service.delete_content(db, content_id)


@router.get("/resources", response_model=list[SupportResourceOut])
async def list_resources(
    _admin_user: User = Depends(_admin), db: AsyncSession = Depends(get_db)
) -> list[SupportResourceOut]:
    return await service.list_all_resources(db)


@router.post("/resources", response_model=SupportResourceOut, status_code=201)
async def create_resource(
    data: SupportResourceIn, admin: User = Depends(_admin), db: AsyncSession = Depends(get_db)
) -> SupportResourceOut:
    return await service.create_resource(db, admin, data)


@router.patch("/resources/{resource_id}/status", response_model=SupportResourceOut)
async def update_resource_status(
    resource_id: int,
    data: SupportStatusUpdate,
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> SupportResourceOut:
    return await service.set_resource_status(db, resource_id, data.status)


@router.delete("/resources/{resource_id}", status_code=204)
async def delete_resource(
    resource_id: int, _admin_user: User = Depends(_admin), db: AsyncSession = Depends(get_db)
) -> None:
    await service.delete_resource(db, resource_id)


public_router = APIRouter(prefix="/support", tags=["support"])


@public_router.get("/contents", response_model=list[SupportContentOut])
async def browse_contents(db: AsyncSession = Depends(get_db)) -> list[SupportContentOut]:
    return await service.list_published_content(db)


@public_router.get("/resources", response_model=list[SupportResourceOut])
async def browse_resources(db: AsyncSession = Depends(get_db)) -> list[SupportResourceOut]:
    return await service.list_published_resources(db)
