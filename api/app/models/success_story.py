"""Bitiruvchi hikoyalari — bosh sahifa "Tirik Narvon" hero'sida ko'rsatiladi (V2-1)."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import SuccessStoryStatus


class SuccessStory(Base):
    __tablename__ = "success_stories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    step: Mapped[int] = mapped_column(Integer, nullable=False)  # Narvon pog'onasi 0-4
    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    profession: Mapped[str] = mapped_column(String(160), nullable=False)
    quote: Mapped[str] = mapped_column(Text, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), default=SuccessStoryStatus.DRAFT, nullable=False
    )
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
