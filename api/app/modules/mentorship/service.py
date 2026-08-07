"""Ustoz (Mentor) kabineti biznes logikasi — so'rov, qabul/rad, davriy check-in."""

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ladder import user_max_ladder_step
from app.models.enums import MentorshipStatus, NotificationCategory, NotificationType, RoleCode
from app.models.mentorship import MentorCheckin, Mentorship
from app.models.user import Role, User, UserRole
from app.modules.notifications.service import create_notification
from app.schemas.mentorship import (
    MentorCard,
    MentorCheckinOut,
    MentorshipDetail,
    MentorshipOut,
)


async def list_mentors(db: AsyncSession) -> list[MentorCard]:
    rows = (
        (
            await db.execute(
                select(User)
                .join(UserRole, UserRole.user_id == User.id)
                .join(Role, Role.id == UserRole.role_id)
                .where(Role.code == RoleCode.MENTOR)
            )
        )
        .scalars()
        .all()
    )
    return [MentorCard(id=u.id, full_name=u.full_name, username=u.username) for u in rows]


def _require_party(m: Mentorship, user: User) -> None:
    if user.id not in (m.mentor_id, m.mentee_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Bu mentorlik sizniki emas"
        )


async def _to_out(db: AsyncSession, m: Mentorship) -> MentorshipOut:
    mentor = await db.get(User, m.mentor_id)
    mentee = await db.get(User, m.mentee_id)
    assert mentor is not None and mentee is not None
    return MentorshipOut(
        id=m.id,
        mentor_id=m.mentor_id,
        mentor_name=mentor.full_name,
        mentee_id=m.mentee_id,
        mentee_name=mentee.full_name,
        mentee_ladder_step=await user_max_ladder_step(db, m.mentee_id),
        message=m.message,
        status=m.status,
        requested_at=m.requested_at,
        responded_at=m.responded_at,
    )


async def request_mentorship(
    db: AsyncSession, mentee: User, mentor_id: int, message: str | None = None
) -> MentorshipOut:
    if mentor_id == mentee.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="O'zingizdan mentorlik so'ray olmaysiz"
        )
    mentor = await db.get(User, mentor_id)
    if mentor is None or RoleCode.MENTOR not in {r.code for r in mentor.roles}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ustoz topilmadi")

    existing = (
        await db.execute(
            select(Mentorship).where(
                Mentorship.mentor_id == mentor_id, Mentorship.mentee_id == mentee.id
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu ustozga allaqachon so'rov yuborgansiz"
        )

    mentorship = Mentorship(mentor_id=mentor_id, mentee_id=mentee.id, message=message)
    db.add(mentorship)
    await db.flush()
    await create_notification(
        db,
        user_id=mentor_id,
        notif_type=NotificationType.MENTORSHIP,
        category=NotificationCategory.LEARNING,
        title=f"{mentee.full_name} sizdan mentorlik so'radi",
        link_url="/ustoz",
    )
    await db.commit()
    await db.refresh(mentorship)
    return await _to_out(db, mentorship)


async def respond(
    db: AsyncSession, mentor: User, mentorship_id: int, accept: bool
) -> MentorshipOut:
    mentorship = await db.get(Mentorship, mentorship_id)
    if mentorship is None or mentorship.mentor_id != mentor.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentorlik topilmadi")
    if mentorship.status != MentorshipStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu so'rov allaqachon javob berilgan"
        )

    mentorship.status = MentorshipStatus.ACTIVE if accept else MentorshipStatus.DECLINED
    mentorship.responded_at = datetime.now(UTC)
    await create_notification(
        db,
        user_id=mentorship.mentee_id,
        notif_type=NotificationType.MENTORSHIP,
        category=NotificationCategory.LEARNING,
        title=(
            f"{mentor.full_name} so'rovingizni qabul qildi"
            if accept
            else f"{mentor.full_name} so'rovingizni rad etdi"
        ),
        link_url="/ustoz",
    )
    await db.commit()
    await db.refresh(mentorship)
    return await _to_out(db, mentorship)


async def add_checkin(
    db: AsyncSession, mentor: User, mentorship_id: int, note: str
) -> MentorCheckinOut:
    mentorship = await db.get(Mentorship, mentorship_id)
    if mentorship is None or mentorship.mentor_id != mentor.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentorlik topilmadi")
    if mentorship.status != MentorshipStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Faqat faol mentorlikda check-in qo'shiladi",
        )

    checkin = MentorCheckin(mentorship_id=mentorship_id, note=note)
    db.add(checkin)
    await db.flush()
    await create_notification(
        db,
        user_id=mentorship.mentee_id,
        notif_type=NotificationType.MENTORSHIP,
        category=NotificationCategory.LEARNING,
        title=f"{mentor.full_name} yangi check-in qoldirdi",
        body=note,
        link_url="/ustoz",
    )
    await db.commit()
    await db.refresh(checkin)
    return MentorCheckinOut(id=checkin.id, note=checkin.note, created_at=checkin.created_at)


async def my_mentorships(db: AsyncSession, user: User) -> list[MentorshipOut]:
    rows = (
        (
            await db.execute(
                select(Mentorship)
                .where((Mentorship.mentor_id == user.id) | (Mentorship.mentee_id == user.id))
                .order_by(Mentorship.requested_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [await _to_out(db, m) for m in rows]


async def mentorship_detail(db: AsyncSession, user: User, mentorship_id: int) -> MentorshipDetail:
    mentorship = await db.get(Mentorship, mentorship_id)
    if mentorship is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Mentorlik topilmadi")
    _require_party(mentorship, user)

    checkins = (
        (
            await db.execute(
                select(MentorCheckin)
                .where(MentorCheckin.mentorship_id == mentorship_id)
                .order_by(MentorCheckin.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    base = await _to_out(db, mentorship)
    return MentorshipDetail(
        **base.model_dump(),
        checkins=[
            MentorCheckinOut(id=c.id, note=c.note, created_at=c.created_at) for c in checkins
        ],
    )
