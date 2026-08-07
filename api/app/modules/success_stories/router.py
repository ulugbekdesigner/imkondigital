"""Bitiruvchi hikoyalari endpoint'lari — /v1/admin/success-stories/* va /v1/success-stories."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import require_roles
from app.modules.success_stories import service
from app.schemas.success_story import SuccessStoryIn, SuccessStoryOut, SuccessStoryStatusUpdate

_admin = require_roles(RoleCode.ADMIN)

router = APIRouter(prefix="/admin/success-stories", tags=["success-stories"])


@router.get("", response_model=list[SuccessStoryOut])
async def list_stories(
    _admin_user: User = Depends(_admin), db: AsyncSession = Depends(get_db)
) -> list[SuccessStoryOut]:
    return await service.list_all(db)


@router.post("", response_model=SuccessStoryOut, status_code=201)
async def create_story(
    data: SuccessStoryIn, admin: User = Depends(_admin), db: AsyncSession = Depends(get_db)
) -> SuccessStoryOut:
    return await service.create(db, admin, data)


@router.patch("/{story_id}/status", response_model=SuccessStoryOut)
async def update_status(
    story_id: int,
    data: SuccessStoryStatusUpdate,
    _admin_user: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> SuccessStoryOut:
    return await service.set_status(db, story_id, data.status)


@router.delete("/{story_id}", status_code=204)
async def delete_story(
    story_id: int, _admin_user: User = Depends(_admin), db: AsyncSession = Depends(get_db)
) -> None:
    await service.delete(db, story_id)


public_router = APIRouter(prefix="/success-stories", tags=["success-stories"])


@public_router.get("", response_model=list[SuccessStoryOut])
async def browse_stories(db: AsyncSession = Depends(get_db)) -> list[SuccessStoryOut]:
    return await service.list_published(db)
