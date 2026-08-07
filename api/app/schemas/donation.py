"""Ochiq xayriya sxemalari — loginsiz ariza (V2-2, B4-bo'lim)."""

from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import DonationProjectStatus, PaymentProvider


class DonationProjectIn(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    story: str = Field(min_length=10)
    target_amount: int = Field(gt=0)
    deadline: date | None = None


class DonationProjectStatusUpdate(BaseModel):
    status: DonationProjectStatus


class DonationProjectReportUpdate(BaseModel):
    report: str = Field(min_length=10)


class DonationProjectOut(BaseModel):
    id: int
    owner_id: int
    owner_name: str
    title: str
    story: str
    target_amount: int
    collected_amount: int
    progress_pct: int
    deadline: date | None
    status: str
    report: str
    donors_count: int
    created_at: datetime


class DonateIn(BaseModel):
    amount: int = Field(gt=0)
    donor_name: str | None = Field(default=None, max_length=160)
    donor_email: EmailStr | None = None
    is_anonymous: bool = False
    provider: PaymentProvider


class DonateOut(BaseModel):
    donation_id: int
    checkout_url: str


class DonationOut(BaseModel):
    id: int
    amount: int
    donor_name: str | None
    is_anonymous: bool
    status: str
    created_at: datetime
