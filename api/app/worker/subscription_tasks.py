"""PLUS/PRO obuna muddati — kunlik Celery beat vazifalari (4-bo'lim).

Haqiqiy avtomatik (karta-eslab-qoluvchi) yechish yo'q (subscriptions/service.py
docstring'iga qarang) — shu sabab bu ikki vazifa muddatni FAOL kuzatib boradi:
muddati tugagan PURCHASE obunalarni FREE'ga tushiradi, tugashi yaqinlashganlarga
eslatma yuboradi.
"""

import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings
from app.models.enums import NotificationCategory, NotificationType, SubscriptionGrantedBy
from app.models.subscription import Subscription
from app.modules.notifications.service import create_notification
from app.worker.celery_app import celery_app

settings = get_settings()

REMINDER_DAYS_BEFORE = 3


async def _expire_subscriptions() -> int:
    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    now = datetime.now(UTC)
    async with async_sessionmaker(engine)() as db:
        expired = (
            (
                await db.execute(
                    select(Subscription).where(
                        Subscription.granted_by == SubscriptionGrantedBy.PURCHASE,
                        Subscription.expires_at.is_not(None),
                        Subscription.expires_at < now,
                    )
                )
            )
            .scalars()
            .all()
        )
        count = len(expired)
        for sub in expired:
            await db.delete(sub)
        await db.commit()
    await engine.dispose()
    return count


async def _remind_expiring_subscriptions() -> int:
    engine = create_async_engine(settings.database_url, poolclass=NullPool)
    now = datetime.now(UTC)
    window_start = now + timedelta(days=REMINDER_DAYS_BEFORE)
    window_end = window_start + timedelta(days=1)
    async with async_sessionmaker(engine)() as db:
        expiring = (
            (
                await db.execute(
                    select(Subscription).where(
                        Subscription.granted_by == SubscriptionGrantedBy.PURCHASE,
                        Subscription.expires_at.is_not(None),
                        Subscription.expires_at >= window_start,
                        Subscription.expires_at < window_end,
                    )
                )
            )
            .scalars()
            .all()
        )
        for sub in expiring:
            await create_notification(
                db,
                user_id=sub.user_id,
                notif_type=NotificationType.SUBSCRIPTION_EXPIRING,
                category=NotificationCategory.LEARNING,
                title=f"{sub.plan.upper()} obunangiz {REMINDER_DAYS_BEFORE} kunda tugaydi",
                body="Uzluksiz foydalanish uchun /tariflar sahifasida qayta to'lang.",
                link_url="/tariflar",
            )
        await db.commit()
    await engine.dispose()
    return len(expiring)


@celery_app.task(name="expire_subscriptions")  # type: ignore[untyped-decorator]
def expire_subscriptions() -> dict[str, object]:
    count = asyncio.run(_expire_subscriptions())
    return {"expired": count}


@celery_app.task(name="remind_expiring_subscriptions")  # type: ignore[untyped-decorator]
def remind_expiring_subscriptions() -> dict[str, object]:
    count = asyncio.run(_remind_expiring_subscriptions())
    return {"reminded": count}
