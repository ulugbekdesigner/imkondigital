"""Pullik daraja sxemalari — KENGAYISH_PLAN_3.md 4.1-bo'lim."""

from datetime import datetime

from pydantic import BaseModel


class SubscriptionOut(BaseModel):
    plan: str
    granted_by: str | None
    started_at: datetime | None


class SubscriptionGrantIn(BaseModel):
    plan: str  # "free" | "plus" | "pro" — "free" bergan qatorni o'chiradi
