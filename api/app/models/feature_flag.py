"""Xususiyat bayroqlari (feature flags) - yangi funksiyalarni xavfsiz, bosqichma-
bosqich yoqish uchun (avval admin, keyin foizli rollout, keyin 100%).

UPDATE_5.0 E1-bo'lim: har yangi funksiya shu bayroq ostida chiqadi - muammo
chiqsa deploy shart emas, faqat bayroq o'chiriladi.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class FeatureFlag(Base):
    __tablename__ = "feature_flags"

    name: Mapped[str] = mapped_column(String(64), primary_key=True)
    enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    # 0-100: enabled=true bo'lganda nechchi foiz foydalanuvchiga yoqilishi
    # (barqaror, foydalanuvchi ID xeshiga asoslangan taqsimot).
    rollout_percent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


__all__ = ["FeatureFlag"]
