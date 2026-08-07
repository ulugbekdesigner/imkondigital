"""Pullik modellar — KENGAYISH_PLAN_3.md 4.1-bo'lim ("3 daraja" modeli).

Faqat PLUS/PRO uchun qator yaratiladi — qatori yo'q foydalanuvchi
sukut bo'yicha FREE hisoblanadi (`DisabilityProfile`/`UserStreak`dagi
"kerak bo'lganda yarat" naqshiga o'xshash, lekin bu yerda "qatorsiz
= eng past daraja" ma'nosi borligi uchun ataylab shunday).

Hozircha o'z-o'zidan to'lov qabul qiluvchi (Payme/Click obuna) oqim
YO'Q — bu alohida, kattaroq integratsiya talab qiladi. PRO/PLUS ikki
yo'l bilan beriladi: (1) STIPEND — nogironlik profili tasdiqlanganda
avtomatik (4.1-bo'lim "Muhim himoya qoidasi"), (2) ADMIN — qo'lda
faollashtirish (hozircha to'lov administratsiya orqali).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import SubscriptionGrantedBy, SubscriptionPlan


class Subscription(Base):
    __tablename__ = "subscriptions"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    plan: Mapped[str] = mapped_column(String(8), default=SubscriptionPlan.PLUS, nullable=False)
    granted_by: Mapped[str] = mapped_column(
        String(16), default=SubscriptionGrantedBy.ADMIN, nullable=False
    )
    granted_by_user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
