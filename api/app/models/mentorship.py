"""Ustoz (Mentor) kabineti — mentorlik so'rovi, holati, davriy check-in yozuvlari."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import MentorshipStatus


class Mentorship(Base):
    __tablename__ = "mentorships"
    __table_args__ = (UniqueConstraint("mentor_id", "mentee_id", name="uq_mentorship"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    mentor_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    mentee_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    status: Mapped[str] = mapped_column(
        String(16), default=MentorshipStatus.PENDING, nullable=False
    )
    # Shogird so'rov yuborayotganda yozgan ixtiyoriy qisqa matn — ustoz qaror
    # qabul qilishdan oldin nima uchun so'rayotganini ko'radi.
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MentorCheckin(Base):
    __tablename__ = "mentor_checkins"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    mentorship_id: Mapped[int] = mapped_column(
        ForeignKey("mentorships.id", ondelete="CASCADE"), index=True, nullable=False
    )
    note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
