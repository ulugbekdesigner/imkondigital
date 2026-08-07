"""Jonli darslar — KENGAYISH_PLAN_3.md 1.1-bo'lim ("Jonli darslar (jadval)").

Ustoz kursi bo'yicha jonli (Zoom/Google Meet) sessiya rejalashtiradi — tashqi
havola bilan, video-hosting bu yerda qilinmaydi (mavjud video infratuzilmasi
faqat oldindan yozilgan darslar uchun).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class LiveLesson(Base):
    __tablename__ = "live_lessons"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id", ondelete="CASCADE"), index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    meeting_url: Mapped[str] = mapped_column(String(512), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
