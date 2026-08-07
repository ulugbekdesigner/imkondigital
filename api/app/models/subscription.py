"""Pullik modellar — KENGAYISH_PLAN_3.md 4.1-bo'lim ("3 daraja" modeli).

Faqat PLUS/PRO uchun qator yaratiladi — qatori yo'q foydalanuvchi
sukut bo'yicha FREE hisoblanadi (`DisabilityProfile`/`UserStreak`dagi
"kerak bo'lganda yarat" naqshiga o'xshash, lekin bu yerda "qatorsiz
= eng past daraja" ma'nosi borligi uchun ataylab shunday).

PRO/PLUS uch yo'l bilan beriladi: (1) STIPEND — nogironlik profili
tasdiqlanganda avtomatik (4.1-bo'lim "Muhim himoya qoidasi"), (2) ADMIN —
qo'lda faollashtirish, (3) PURCHASE — Payme/Click orqali o'z-o'zidan sotib
olingan (`SubscriptionPurchase`, app/modules/payments). `expires_at` faqat
PURCHASE uchun to'ldiriladi — ADMIN/STIPEND muddatsiz (Celery
`expire_subscriptions` faqat PURCHASE qatorlarini tekshiradi).
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
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
