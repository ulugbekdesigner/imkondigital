"""Pullik daraja sxemalari — KENGAYISH_PLAN_3.md 4.1-bo'lim."""

from datetime import datetime

from pydantic import BaseModel

from app.models.enums import PaymentProvider


class SubscriptionOut(BaseModel):
    plan: str
    granted_by: str | None
    started_at: datetime | None
    expires_at: datetime | None = None


class SubscriptionGrantIn(BaseModel):
    plan: str  # "free" | "plus" | "pro" — "free" bergan qatorni o'chiradi


class SubscriptionCheckoutIn(BaseModel):
    plan: str  # "plus" | "pro" — "free" ruxsat etilmaydi
    provider: PaymentProvider


class SubscriptionCheckoutOut(BaseModel):
    purchase_id: int
    checkout_url: str
