"""Imtiyozlar Markazi — shaxsiylashtirilgan davlat/ish beruvchi imtiyozlari."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    ARRAY,
    BigInteger,
    DateTime,
    ForeignKey,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import BenefitAudience, BenefitCategory, BenefitProvider, BenefitStatus


class Benefit(Base):
    __tablename__ = "benefits"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    category: Mapped[str] = mapped_column(
        String(20), default=BenefitCategory.BOSHQA, nullable=False
    )
    provider_type: Mapped[str] = mapped_column(
        String(16), default=BenefitProvider.DAVLAT, nullable=False
    )
    audience: Mapped[str] = mapped_column(String(16), default=BenefitAudience.USER, nullable=False)
    region_id: Mapped[int | None] = mapped_column(ForeignKey("regions.id"), nullable=True)
    disability_categories: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )
    how_to_apply: Mapped[str] = mapped_column(Text, default="", nullable=False)
    external_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default=BenefitStatus.DRAFT, nullable=False)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class UserBenefit(Base):
    __tablename__ = "user_benefits"
    __table_args__ = (UniqueConstraint("user_id", "benefit_id", name="uq_user_benefit"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    benefit_id: Mapped[int] = mapped_column(
        ForeignKey("benefits.id", ondelete="CASCADE"), index=True, nullable=False
    )
    saved_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
