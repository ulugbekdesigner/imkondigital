"""PLUS/PRO obunani o'z-o'zidan sotib olish — Payme/Click, bir martalik oylik to'lov.

`Donation` naqshiga o'xshab holatni o'zida saqlaydi (escrow kerak emas).
To'lov muvaffaqiyatli bo'lganda `subscriptions/service.py:activate_purchase()`
`Subscription.expires_at`ni 30 kunga uzaytiradi — haqiqiy avtomatik
(karta-eslab-qoluvchi) yechish emas, foydalanuvchi har oy qayta to'laydi
(muddat yaqinlashganda Celery eslatma yuboradi, app/worker/subscription_tasks.py).
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base
from app.models.enums import PaymentStatus


class SubscriptionPurchase(Base):
    __tablename__ = "subscription_purchases"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    plan: Mapped[str] = mapped_column(String(8), nullable=False)  # plus | pro
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # so'm
    provider: Mapped[str | None] = mapped_column(String(16), nullable=True)
    provider_transaction_id: Mapped[str | None] = mapped_column(
        String(64), unique=True, index=True, nullable=True
    )
    status: Mapped[str] = mapped_column(String(16), default=PaymentStatus.PENDING, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
