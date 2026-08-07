"""Peer-support sxemalari — KENGAYISH_PLAN_3.md 7.1-bo'lim, 2-band."""

from datetime import datetime

from pydantic import BaseModel, Field


class PeerSupportRoomOut(BaseModel):
    id: int
    key: str
    title: str
    description: str


class PeerSupportPostIn(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class PeerSupportPostOut(BaseModel):
    id: int
    room_id: int
    author_id: int
    author_name: str
    body: str
    is_hidden: bool
    hidden_reason: str | None
    is_own: bool
    created_at: datetime


class PeerSupportReportIn(BaseModel):
    reason: str = Field(default="", max_length=300)


class PeerSupportHideIn(BaseModel):
    reason: str = Field(min_length=1, max_length=300)
