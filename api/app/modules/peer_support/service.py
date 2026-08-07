"""Peer-support biznes logikasi — inson-insonga yozishma, AI ishtirok etmaydi."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.audit import write_audit_log
from app.models.enums import RoleCode
from app.models.peer_support import PeerSupportPost, PeerSupportReport, PeerSupportRoom
from app.models.user import User
from app.schemas.peer_support import PeerSupportPostOut, PeerSupportRoomOut


def _is_moderator(user: User) -> bool:
    return any(r.code in (RoleCode.MODERATOR, RoleCode.ADMIN) for r in user.roles)


async def list_rooms(db: AsyncSession) -> list[PeerSupportRoomOut]:
    rooms = (
        (await db.execute(select(PeerSupportRoom).order_by(PeerSupportRoom.sort)))
        .scalars()
        .all()
    )
    return [PeerSupportRoomOut.model_validate(r, from_attributes=True) for r in rooms]


def _to_out(post: PeerSupportPost, author_name: str, viewer_id: int) -> PeerSupportPostOut:
    return PeerSupportPostOut(
        id=post.id,
        room_id=post.room_id,
        author_id=post.author_id,
        author_name=author_name,
        body=post.body,
        is_hidden=post.is_hidden,
        hidden_reason=post.hidden_reason,
        is_own=post.author_id == viewer_id,
        created_at=post.created_at,
    )


async def list_room_posts(
    db: AsyncSession, room_id: int, viewer: User
) -> list[PeerSupportPostOut]:
    room = await db.get(PeerSupportRoom, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Davra topilmadi")

    query = (
        select(PeerSupportPost, User.full_name)
        .join(User, User.id == PeerSupportPost.author_id)
        .where(PeerSupportPost.room_id == room_id)
    )
    if not _is_moderator(viewer):
        query = query.where(PeerSupportPost.is_hidden.is_(False))
    query = query.order_by(PeerSupportPost.created_at.asc())

    rows = (await db.execute(query)).all()
    return [_to_out(post, full_name, viewer.id) for post, full_name in rows]


async def create_post(
    db: AsyncSession, room_id: int, author: User, body: str
) -> PeerSupportPostOut:
    room = await db.get(PeerSupportRoom, room_id)
    if room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Davra topilmadi")

    post = PeerSupportPost(room_id=room_id, author_id=author.id, body=body)
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return _to_out(post, author.full_name, author.id)


async def report_post(db: AsyncSession, post_id: int, reporter: User, reason: str) -> None:
    post = await db.get(PeerSupportPost, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post topilmadi")
    db.add(PeerSupportReport(post_id=post_id, reporter_id=reporter.id, reason=reason))
    await db.commit()


async def hide_post(db: AsyncSession, post_id: int, moderator: User, reason: str) -> None:
    post = await db.get(PeerSupportPost, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post topilmadi")
    post.is_hidden = True
    post.hidden_reason = reason
    await write_audit_log(
        db,
        actor_id=moderator.id,
        action="peer_support_post_hidden",
        target_type="peer_support_post",
        target_id=post.id,
        meta={"reason": reason},
    )
    await db.commit()


async def unhide_post(db: AsyncSession, post_id: int, moderator: User) -> None:
    post = await db.get(PeerSupportPost, post_id)
    if post is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post topilmadi")
    post.is_hidden = False
    post.hidden_reason = None
    await write_audit_log(
        db,
        actor_id=moderator.id,
        action="peer_support_post_unhidden",
        target_type="peer_support_post",
        target_id=post.id,
        meta={},
    )
    await db.commit()
