"""Psixologik qo'llab-quvvatlash — KENGAYISH_PLAN_3.md 7-bo'lim.

Tashxis yo'q, terapiya yo'q — faqat (1) mutaxassis tomonidan tayyorlanadigan
qisqa kontent (SupportContent, admin CRUD orqali to'ldiriladi — bu yerda
HECH QANDAY matn oldindan yozilmagan, CONTRIBUTING.md 2-qoida) va (2) tasdiqlangan
yo'naltirish manbalari (SupportResource — ishonch telefoni/psixolog/NNT/davlat).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import SuccessStoryStatus, SupportResourceCategory


class SupportContent(Base):
    """"Ruhiy kuch" qisqa maslahat — 7.1-bo'lim, 1-qatlam."""

    __tablename__ = "support_contents"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    topic: Mapped[str] = mapped_column(String(100), nullable=False)
    body_text: Mapped[str] = mapped_column(Text, nullable=False)
    media_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[str] = mapped_column(
        String(16), default=SuccessStoryStatus.DRAFT, nullable=False
    )
    # Ba'zi manbalar (masalan davlat ishonch telefoni) shaxsiy admin muallifligi
    # emas, tasdiqlangan platforma fakti sifatida migratsiya orqali seed qilinadi.
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class SupportResource(Base):
    """Professional yo'naltirish — 7.1-bo'lim, 3-qatlam (ishonch telefoni/psixolog/NNT/davlat)."""

    __tablename__ = "support_resources"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(
        String(16), default=SupportResourceCategory.HOTLINE, nullable=False
    )
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    audience_note: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_free: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(
        String(16), default=SuccessStoryStatus.DRAFT, nullable=False
    )
    # Ba'zi manbalar (masalan davlat ishonch telefoni) shaxsiy admin muallifligi
    # emas, tasdiqlangan platforma fakti sifatida migratsiya orqali seed qilinadi.
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
