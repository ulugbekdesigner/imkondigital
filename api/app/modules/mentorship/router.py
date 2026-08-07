"""Ustoz (Mentor) kabineti endpoint'lari — /v1/mentors, /v1/mentorships."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.user import User
from app.modules.auth.deps import get_current_user
from app.modules.mentorship import service
from app.schemas.mentorship import (
    MentorCard,
    MentorCheckinCreate,
    MentorCheckinOut,
    MentorshipDetail,
    MentorshipOut,
    MentorshipRequestIn,
    MentorshipRespondIn,
)

router = APIRouter(tags=["mentorship"])


@router.get("/mentors", response_model=list[MentorCard])
async def list_mentors(db: AsyncSession = Depends(get_db)) -> list[MentorCard]:
    return await service.list_mentors(db)


@router.post("/mentorships", response_model=MentorshipOut, status_code=status.HTTP_201_CREATED)
async def request_mentorship(
    data: MentorshipRequestIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorshipOut:
    return await service.request_mentorship(db, user, data.mentor_id, data.message)


@router.get("/me/mentorships", response_model=list[MentorshipOut])
async def my_mentorships(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MentorshipOut]:
    return await service.my_mentorships(db, user)


@router.get("/mentorships/{mentorship_id}", response_model=MentorshipDetail)
async def mentorship_detail(
    mentorship_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorshipDetail:
    return await service.mentorship_detail(db, user, mentorship_id)


@router.post("/mentorships/{mentorship_id}/respond", response_model=MentorshipOut)
async def respond_mentorship(
    mentorship_id: int,
    data: MentorshipRespondIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorshipOut:
    return await service.respond(db, user, mentorship_id, data.accept)


@router.post(
    "/mentorships/{mentorship_id}/checkins",
    response_model=MentorCheckinOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_checkin(
    mentorship_id: int,
    data: MentorCheckinCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MentorCheckinOut:
    return await service.add_checkin(db, user, mentorship_id, data.note)
