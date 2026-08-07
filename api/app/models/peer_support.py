"""Peer-support — tengdosh-ko'magi suhbat davralari, KENGAYISH_PLAN_3.md 7.1-bo'lim, 2-band.

Bu AI EMAS — real inson-insonga suhbat (Ziyo psixolog rolini o'ynamasligi
kabi, bu yerda ham AI hech qanday "javob" yozmaydi, faqat foydalanuvchilar
o'zaro yozadi). Xavfsizlik: RoleCode.MODERATOR post'ni yashira oladi
(is_hidden), foydalanuvchi shikoyat qoldira oladi (PeerSupportReport).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class PeerSupportRoom(Base):
    """Mavzu bo'yicha qat'iy belgilangan davralar — ladder/nogironlik bo'yicha

    avtomatik guruhlash ATAYLAB qilinmagan (CONTRIBUTING.md 6-qoida: disability_profiles
    maxfiy, rozilik tekshiruvisiz guruhlash uchun ishlatilmaydi).
    """

    __tablename__ = "peer_support_rooms"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    key: Mapped[str] = mapped_column(String(40), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    sort: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class PeerSupportPost(Base):
    __tablename__ = "peer_support_posts"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    room_id: Mapped[int] = mapped_column(
        ForeignKey("peer_support_rooms.id", ondelete="CASCADE"), index=True, nullable=False
    )
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    body: Mapped[str] = mapped_column(Text, nullable=False)
    is_hidden: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    hidden_reason: Mapped[str | None] = mapped_column(String(300), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class PeerSupportReport(Base):
    __tablename__ = "peer_support_reports"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    post_id: Mapped[int] = mapped_column(
        ForeignKey("peer_support_posts.id", ondelete="CASCADE"), index=True, nullable=False
    )
    reporter_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    reason: Mapped[str] = mapped_column(String(300), default="", nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
