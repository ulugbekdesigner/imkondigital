"""Notification Center — yaratish, ro'yxat, o'qilgan deb belgilash.

`create_notification` boshqa modullardan (employer, marketplace, courses)
tegishli voqealarda chaqiriladi. Telegram bog'langan bo'lsa — Celery navbatiga
yetkazish vazifasi qo'yiladi (navbat vaqtincha ishlamasa ham asosiy amal
muvaffaqiyatli bo'lishi kerak, shu sabab xato jim yutiladi).
"""

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import NotificationCategory
from app.models.notification import Notification
from app.models.telegram import TelegramLink
from app.worker.notification_tasks import send_telegram_notification


async def create_notification(
    db: AsyncSession,
    *,
    user_id: int,
    notif_type: str,
    category: NotificationCategory,
    title: str,
    body: str = "",
    link_url: str | None = None,
) -> Notification:
    notif = Notification(
        user_id=user_id,
        type=notif_type,
        category=category,
        title=title,
        body=body,
        link_url=link_url,
    )
    db.add(notif)
    await db.flush()

    link = (
        await db.execute(select(TelegramLink).where(TelegramLink.user_id == user_id))
    ).scalar_one_or_none()
    if link is not None:
        text = f"{title}\n\n{body}".strip() if body else title
        try:
            send_telegram_notification.delay(link.chat_id, text)
        except Exception:  # Navbat (Redis) vaqtincha ishlamasa ham asosiy amal to'xtamasin
            pass

    return notif


async def list_notifications(db: AsyncSession, user_id: int) -> tuple[list[Notification], int]:
    notifications = (
        (
            await db.execute(
                select(Notification)
                .where(Notification.user_id == user_id)
                .order_by(Notification.created_at.desc())
                .limit(50)
            )
        )
        .scalars()
        .all()
    )
    unread_count = (
        await db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id, Notification.read_at.is_(None)
            )
        )
    ).scalar_one()
    return list(notifications), unread_count


async def mark_read(db: AsyncSession, notification_id: int, user_id: int) -> Notification:
    notif = await db.get(Notification, notification_id)
    if notif is None or notif.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bildirishnoma topilmadi")
    if notif.read_at is None:
        notif.read_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(notif)
    return notif


async def mark_all_read(db: AsyncSession, user_id: int) -> int:
    notifications = (
        (
            await db.execute(
                select(Notification).where(
                    Notification.user_id == user_id, Notification.read_at.is_(None)
                )
            )
        )
        .scalars()
        .all()
    )
    now = datetime.now(UTC)
    for n in notifications:
        n.read_at = now
    await db.commit()
    return len(notifications)
