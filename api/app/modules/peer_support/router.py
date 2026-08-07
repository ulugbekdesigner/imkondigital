"""Peer-support endpoint'lari — /v1/peer-support/*."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import get_current_user, require_roles
from app.modules.peer_support import service
from app.schemas.peer_support import (
    PeerSupportHideIn,
    PeerSupportPostIn,
    PeerSupportPostOut,
    PeerSupportReportIn,
    PeerSupportRoomOut,
)

router = APIRouter(prefix="/peer-support", tags=["peer-support"])
_moderator = require_roles(RoleCode.MODERATOR, RoleCode.ADMIN)
_limit_post = rate_limit("peer-support-post", limit=20, window_seconds=3600)


@router.get("/rooms", response_model=list[PeerSupportRoomOut])
async def list_rooms(
    _user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PeerSupportRoomOut]:
    return await service.list_rooms(db)


@router.get("/rooms/{room_id}/posts", response_model=list[PeerSupportPostOut])
async def list_room_posts(
    room_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PeerSupportPostOut]:
    return await service.list_room_posts(db, room_id, user)


@router.post(
    "/rooms/{room_id}/posts",
    response_model=PeerSupportPostOut,
    status_code=201,
    dependencies=[Depends(_limit_post)],
)
async def create_post(
    room_id: int,
    data: PeerSupportPostIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PeerSupportPostOut:
    return await service.create_post(db, room_id, user, data.body)


@router.post("/posts/{post_id}/report", status_code=204)
async def report_post(
    post_id: int,
    data: PeerSupportReportIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.report_post(db, post_id, user, data.reason)


@router.post("/posts/{post_id}/hide", status_code=204)
async def hide_post(
    post_id: int,
    data: PeerSupportHideIn,
    moderator: User = Depends(_moderator),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.hide_post(db, post_id, moderator, data.reason)


@router.post("/posts/{post_id}/unhide", status_code=204)
async def unhide_post(
    post_id: int,
    moderator: User = Depends(_moderator),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.unhide_post(db, post_id, moderator)
