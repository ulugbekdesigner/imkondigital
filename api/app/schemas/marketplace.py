"""Freelancer Marketplace sxemalari — gig, buyurtma, chat, sharh, nizo."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# --- Gig ---
class GigCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: str = ""
    category: str = Field(min_length=2, max_length=80)
    price_from: int = Field(ge=0)
    delivery_days: int = Field(default=3, ge=1, le=90)


class GigCard(BaseModel):
    id: int
    title: str
    category: str
    price_from: int
    delivery_days: int
    freelancer_id: int
    freelancer_name: str
    freelancer_username: str
    freelancer_avatar_url: str | None
    is_new_talent: bool  # "Yangi iste'dodlar" — kam buyurtma bajargan freelancer
    average_rating: float | None  # freelancerning barcha buyurtmalaridagi o'rtacha sharh bahosi
    review_count: int


class GigDetail(GigCard):
    description: str


class GigPage(BaseModel):
    items: list[GigCard]
    next_cursor: int | None


# --- Milestone ---
class MilestoneIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    amount: int = Field(ge=0)


class MilestoneOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    amount: int
    sort: int


# --- Buyurtma ---
class OrderCreate(BaseModel):
    gig_id: int | None = None
    freelancer_id: int
    title: str = Field(min_length=3, max_length=200)
    description: str = ""
    amount: int = Field(gt=0)
    milestones: list[MilestoneIn] = Field(default_factory=list)


class OrderCard(BaseModel):
    id: int
    title: str
    amount: int
    status: str
    client_id: int
    freelancer_id: int
    client_name: str
    freelancer_name: str
    created_at: datetime


class OrderDetail(OrderCard):
    description: str
    delivered_note: str | None
    delivered_file_url: str | None
    milestones: list[MilestoneOut]
    payment_status: str | None


class DeliverRequest(BaseModel):
    note: str = ""
    file_url: str | None = None


class MessageCreate(BaseModel):
    body: str = ""
    file_url: str | None = None


class MessageOut(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    body: str
    file_url: str | None
    created_at: datetime


# --- Sharh ---
class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: str = ""


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    order_id: int
    from_user_id: int
    to_user_id: int
    rating: int
    text: str
    created_at: datetime


# --- Nizo ---
class DisputeCreate(BaseModel):
    reason: str = Field(min_length=5)


class DisputeOut(BaseModel):
    id: int
    order_id: int
    opened_by: int
    reason: str
    resolution: str | None
    status: str
    created_at: datetime
    resolved_at: datetime | None


class DisputeResolve(BaseModel):
    winner: str = Field(pattern="^(freelancer|client)$")
    resolution: str = Field(min_length=3)


# --- To'lov boshlash (checkout) ---
class CheckoutOut(BaseModel):
    provider: str
    checkout_url: str
