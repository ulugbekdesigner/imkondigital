"""Foydalanuvchi, nogironlik profili va trayektoriya sxemalari."""

import re
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.enums import DisabilityGroup, Gender, PassportVisibility


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    phone: str
    email: str | None
    full_name: str
    username: str
    passport_visibility: str
    region_id: int | None
    birth_date: date | None
    gender: str | None
    avatar_url: str | None
    status: str
    created_at: datetime
    roles: list[str] = Field(default_factory=list)
    # Nogironlik tasdig'i holati — tafsilotlar EMAS, faqat holat (maxfiylik).
    disability_verified_status: str | None = None
    # Raqamli Narvon pog'onasi (0-4) — /me/trajectory'dagi 15-bosqichli
    # "Trayektoriya" bilan ARALASHTIRMASLIK, ular butunlay boshqa ko'rsatkich.
    ladder_step: int = 0


class UserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=2, max_length=160)
    email: str | None = None
    region_id: int | None = None
    birth_date: date | None = None
    gender: Gender | None = None
    avatar_url: str | None = None
    passport_visibility: PassportVisibility | None = None


_USERNAME_RE = re.compile(r"^[a-z0-9_]{3,40}$")


class UsernameUpdate(BaseModel):
    username: str

    @field_validator("username")
    @classmethod
    def _valid(cls, v: str) -> str:
        v = v.lower()
        if not _USERNAME_RE.match(v):
            raise ValueError(
                "Username 3-40 belgi, faqat lotin harflari, raqam va _ bo'lishi mumkin"
            )
        return v


class DisabilityProfileIn(BaseModel):
    group_type: DisabilityGroup | None = None
    categories: list[str] = Field(default_factory=list)
    work_conditions: dict[str, Any] = Field(default_factory=dict)


class DisabilityProfileOut(BaseModel):
    """Maxfiy tafsilotlar — faqat egasi yoki ruxsat berilgan rollarga."""

    model_config = ConfigDict(from_attributes=True)

    group_type: str | None
    categories: list[str]
    work_conditions: dict[str, Any]
    verified_status: str
    verified_at: datetime | None
    rejection_reason: str | None
    doc_url: str | None


class TrajectoryStep(BaseModel):
    number: int  # 1..15
    phase: str  # A..E
    title: str
    status: str  # done | current | locked


class TrajectoryOut(BaseModel):
    current_step: int
    steps: list[TrajectoryStep]
