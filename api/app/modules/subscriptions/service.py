"""Pullik daraja biznes logikasi — grant/revoke + o'qish."""

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import SubscriptionGrantedBy, SubscriptionPlan
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionOut


async def get_my_subscription(db: AsyncSession, user_id: int) -> SubscriptionOut:
    sub = await db.get(Subscription, user_id)
    if sub is None:
        return SubscriptionOut(plan=SubscriptionPlan.FREE, granted_by=None, started_at=None)
    return SubscriptionOut(plan=sub.plan, granted_by=sub.granted_by, started_at=sub.started_at)


async def grant_stipend(db: AsyncSession, user_id: int) -> None:
    """Nogironlik profili tasdiqlanganda avtomatik PLUS — 4.1-bo'lim

    "Muhim himoya qoidasi": nogironligi bor tasdiqlangan foydalanuvchi uchun
    PLUS darajasi donor fondi hisobidan avtomatik ochiladi. Foydalanuvchi
    ADMIN tomonidan allaqachon PRO'ga o'tkazilgan bo'lsa, bu daraja
    pasaytirilmaydi (faqat qatorsiz bo'lsa yoki hozirgi FREE bo'lsa yaratiladi).
    """
    existing = await db.get(Subscription, user_id)
    if existing is not None and existing.plan == SubscriptionPlan.PRO:
        return
    if existing is None:
        db.add(
            Subscription(
                user_id=user_id,
                plan=SubscriptionPlan.PLUS,
                granted_by=SubscriptionGrantedBy.STIPEND,
            )
        )
    else:
        existing.plan = SubscriptionPlan.PLUS
        existing.granted_by = SubscriptionGrantedBy.STIPEND
    # Committing is the caller's responsibility (same transaction as the
    # disability-profile verification it's triggered from).


async def admin_set_plan(
    db: AsyncSession, user_id: int, plan: str, admin_id: int
) -> SubscriptionOut:
    if plan not in {SubscriptionPlan.FREE, SubscriptionPlan.PLUS, SubscriptionPlan.PRO}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Noma'lum daraja")

    existing = await db.get(Subscription, user_id)
    if plan == SubscriptionPlan.FREE:
        if existing is not None:
            await db.delete(existing)
            await db.commit()
        return SubscriptionOut(plan=SubscriptionPlan.FREE, granted_by=None, started_at=None)

    if existing is None:
        existing = Subscription(
            user_id=user_id,
            plan=plan,
            granted_by=SubscriptionGrantedBy.ADMIN,
            granted_by_user_id=admin_id,
        )
        db.add(existing)
    else:
        existing.plan = plan
        existing.granted_by = SubscriptionGrantedBy.ADMIN
        existing.granted_by_user_id = admin_id
    await db.commit()
    await db.refresh(existing)
    return SubscriptionOut(
        plan=existing.plan, granted_by=existing.granted_by, started_at=existing.started_at
    )
