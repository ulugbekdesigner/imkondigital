"""Psixologik qo'llab-quvvatlash sxemalari — KENGAYISH_PLAN_3.md 7-bo'lim."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import SuccessStoryStatus, SupportResourceCategory


class SupportContentIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    topic: str = Field(min_length=2, max_length=100)
    body_text: str = Field(min_length=10)
    media_url: str | None = None


class SupportContentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    topic: str
    body_text: str
    media_url: str | None
    status: str
    created_at: datetime


class SupportResourceIn(BaseModel):
    name: str = Field(min_length=2, max_length=200)
    category: SupportResourceCategory
    description: str = ""
    phone: str | None = None
    url: str | None = None
    audience_note: str | None = None
    is_free: bool = True
    sort: int = 0


class SupportResourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    category: str
    description: str
    phone: str | None
    url: str | None
    audience_note: str | None
    is_free: bool
    sort: int
    status: str
    created_at: datetime


class SupportStatusUpdate(BaseModel):
    status: SuccessStoryStatus
