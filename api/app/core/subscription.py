"""Foydalanuvchining joriy pullik daraja (Subscription) darajasi — markazlashtirilgan

o'qish, chunki AI kvota (ai_quota.py) va boshqa modullar buni bilishi kerak
(app/modules/subscriptions/ esa yaratish/o'zgartirish mas'ul, faqat o'qish
uchun bu yerga qaytadan murojaat qiladi).
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import SubscriptionPlan
from app.models.subscription import Subscription


async def get_plan(db: AsyncSession, user_id: int) -> str:
    """Qatorsiz foydalanuvchi — sukut bo'yicha FREE."""
    sub = await db.get(Subscription, user_id)
    return sub.plan if sub is not None else SubscriptionPlan.FREE
