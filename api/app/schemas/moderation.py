"""Moderatsiya sxemalari."""

from datetime import datetime

from pydantic import BaseModel


class DisabilityQueueItem(BaseModel):
    """Moderator ko'radigan nogironlik tasdig'i navbati elementi."""

    user_id: int
    full_name: str
    region_name: str | None
    group_type: str | None
    categories: list[str]
    verified_status: str
    submitted_at: datetime
    doc_url: str | None


class ModerateRequest(BaseModel):
    approve: bool
    reason: str | None = None
