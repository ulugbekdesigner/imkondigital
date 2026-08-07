"""Xalqaro ish e'lonlari (qonuniy agregatsiya) — KENGAYISH_PLAN_3.md 6-bo'lim, 1-bosqich."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class ExternalJob(Base):
    """Ochiq API/RSS'dan olingan ish e'loni — biz vositachi emas, `source_url`ga yo'naltiramiz."""

    __tablename__ = "external_jobs"
    __table_args__ = (UniqueConstraint("source", "external_id", name="uq_external_job"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    external_id: Mapped[str] = mapped_column(String(200), nullable=False)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    title_uz: Mapped[str | None] = mapped_column(String(300), nullable=True)
    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    description_uz: Mapped[str | None] = mapped_column(Text, nullable=True)
    ladder_step: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tags: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    location_note: Mapped[str | None] = mapped_column(String(200), nullable=True)
    source_url: Mapped[str] = mapped_column(String(600), nullable=False)
    posted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    fetched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


__all__ = ["ExternalJob"]
