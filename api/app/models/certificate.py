"""Sertifikat modeli — Digital Skills Passport verifikatsiyasi uchun.

Kurs 100% tugallanganda avtomatik beriladi (app/modules/courses/service.py).
PDF + QR generatsiyasi app/core/certificates.py da.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Certificate(Base):
    __tablename__ = "certificates"
    __table_args__ = (UniqueConstraint("user_id", "course_id", name="uq_certificate_user_course"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id", ondelete="SET NULL"), nullable=True
    )
    uid: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    pdf_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    qr_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    # Yakuniy baholash (B3) mentor tomonidan READY deb tasdiqlasa o'rnatiladi —
    # Skills Passport'da "Tasdiqlangan" belgisi shu maydonga qarab chiziladi.
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    readiness_pct: Mapped[int | None] = mapped_column(Integer, nullable=True)
