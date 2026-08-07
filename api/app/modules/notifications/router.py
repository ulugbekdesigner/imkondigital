"""Notification Center endpoint'lari — /v1/me/notifications."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.user import User
from app.modules.auth.deps import get_current_user
from app.modules.notifications import service
from app.schemas.notifications import NotificationOut, NotificationPage

router = APIRouter(prefix="/me/notifications", tags=["notifications"])


@router.get("", response_model=NotificationPage)
async def my_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationPage:
    notifications, unread_count = await service.list_notifications(db, user.id)
    return NotificationPage(
        items=[NotificationOut.model_validate(n) for n in notifications],
        unread_count=unread_count,
    )


@router.post("/{notification_id}/read", response_model=NotificationOut)
async def read_notification(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationOut:
    notif = await service.mark_read(db, notification_id, user.id)
    return NotificationOut.model_validate(notif)


@router.post("/read-all")
async def read_all_notifications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    count = await service.mark_all_read(db, user.id)
    return {"marked_read": count}
