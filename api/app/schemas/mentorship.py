"""Ustoz (Mentor) kabineti sxemalari."""

from datetime import datetime

from pydantic import BaseModel, Field


class MentorCard(BaseModel):
    id: int
    full_name: str
    username: str


class MentorshipRequestIn(BaseModel):
    mentor_id: int
    message: str | None = Field(default=None, max_length=1000)


class MentorshipRespondIn(BaseModel):
    accept: bool


class MentorCheckinCreate(BaseModel):
    note: str = Field(min_length=3, max_length=2000)


class MentorCheckinOut(BaseModel):
    id: int
    note: str
    created_at: datetime


class MentorshipOut(BaseModel):
    id: int
    mentor_id: int
    mentor_name: str
    mentee_id: int
    mentee_name: str
    mentee_ladder_step: int
    message: str | None
    status: str
    requested_at: datetime
    responded_at: datetime | None


class MentorshipDetail(MentorshipOut):
    checkins: list[MentorCheckinOut]
