"""Jonli darslar sxemalari — KENGAYISH_PLAN_3.md 1.1-bo'lim."""

from datetime import datetime

from pydantic import BaseModel, Field


class LiveLessonIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    description: str = Field(default="", max_length=2000)
    scheduled_at: datetime
    meeting_url: str = Field(min_length=8, max_length=512)


class LiveLessonOut(BaseModel):
    id: int
    course_id: int
    course_title: str
    title: str
    description: str
    scheduled_at: datetime
    meeting_url: str
    is_past: bool
    created_at: datetime
