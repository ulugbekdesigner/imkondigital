"""Pullik daraja biznes logikasi — grant/revoke + o'qish + o'z-o'zidan sotib olish."""

from collections.abc import Callable
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.payment_sign import build_click_checkout_url, build_payme_checkout_url
from app.models.enums import PaymentProvider, SubscriptionGrantedBy, SubscriptionPlan
from app.models.subscription import Subscription
from app.models.subscription_purchase import SubscriptionPurchase
from app.schemas.subscription import SubscriptionCheckoutOut, SubscriptionOut

settings = get_settings()

RENEWAL_DAYS = 30

_PLAN_PRICES: dict[str, Callable[[], int]] = {
    SubscriptionPlan.PLUS: lambda: settings.subscription_plus_price_som,
    SubscriptionPlan.PRO: lambda: settings.subscription_pro_price_som,
}


async def get_my_subscription(db: AsyncSession, user_id: int) -> SubscriptionOut:
    sub = await db.get(Subscription, user_id)
    if sub is None:
        return SubscriptionOut(plan=SubscriptionPlan.FREE, granted_by=None, started_at=None)
    return SubscriptionOut(
        plan=sub.plan,
        granted_by=sub.granted_by,
        started_at=sub.started_at,
        expires_at=sub.expires_at,
    )


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
        existing.expires_at = None  # ADMIN grant muddatsiz — sotib olingan muddatni bekor qiladi
    await db.commit()
    await db.refresh(existing)
    return SubscriptionOut(
        plan=existing.plan,
        granted_by=existing.granted_by,
        started_at=existing.started_at,
        expires_at=existing.expires_at,
    )


async def create_checkout(
    db: AsyncSession, *, user_id: int, plan: str, provider: PaymentProvider
) -> SubscriptionCheckoutOut:
    """PLUS/PRO uchun Payme/Click checkout havolasi — bir oylik to'lov.

    Haqiqiy karta-eslab-qoluvchi avtomatik yechish EMAS (Payme Cards API
    talab qiladi, alohida katta integratsiya) — foydalanuvchi har oy shu
    oqim orqali qayta to'laydi, muddat yaqinlashganda eslatma keladi
    (app/worker/subscription_tasks.py).
    """
    if plan not in _PLAN_PRICES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Noma'lum daraja")

    amount = _PLAN_PRICES[plan]()
    purchase = SubscriptionPurchase(user_id=user_id, plan=plan, amount=amount)
    db.add(purchase)
    await db.commit()
    await db.refresh(purchase)

    if provider == PaymentProvider.PAYME:
        checkout_url = build_payme_checkout_url(
            merchant_id=settings.payme_merchant_id,
            account_key="subscription_purchase_id",
            account_value=purchase.id,
            amount_sum=amount,
        )
    else:
        checkout_url = build_click_checkout_url(
            service_id=settings.click_service_id,
            merchant_id=settings.click_merchant_id,
            transaction_param=f"s{purchase.id}",
            amount_sum=amount,
            return_url=f"{settings.site_url}/tariflar?thanks=1",
        )

    return SubscriptionCheckoutOut(purchase_id=purchase.id, checkout_url=checkout_url)


async def activate_purchase(db: AsyncSession, purchase: SubscriptionPurchase) -> None:
    """To'lov muvaffaqiyatli bo'lgach chaqiriladi — muddatni 30 kunga uzaytiradi.

    Erta yangilansa (muddat hali tugamagan bo'lsa) qolgan kunlar YO'QOTILMAYDI —
    yangi muddat `max(hozir, joriy expires_at)` dan +30 kun hisoblanadi.
    PRO'dan PLUS'ga "pasaytirib sotib olish" taqiqlanadi (hozirgi daraja PRO
    bo'lsa va PLUS sotib olinsa — muddat uzayadi, lekin daraja PRO qoladi).
    """
    now = datetime.now(UTC)
    sub = await db.get(Subscription, purchase.user_id)
    base = max(now, sub.expires_at) if (sub is not None and sub.expires_at is not None) else now
    new_expires_at = base + timedelta(days=RENEWAL_DAYS)

    if sub is None:
        db.add(
            Subscription(
                user_id=purchase.user_id,
                plan=purchase.plan,
                granted_by=SubscriptionGrantedBy.PURCHASE,
                expires_at=new_expires_at,
            )
        )
    else:
        # PRO > PLUS — pastroq darajani sotib olish joriy PROni pasaytirmaydi,
        # faqat muddatni uzaytiradi.
        rank: dict[str, int] = {
            SubscriptionPlan.FREE: 0,
            SubscriptionPlan.PLUS: 1,
            SubscriptionPlan.PRO: 2,
        }
        if rank.get(purchase.plan, 0) >= rank.get(sub.plan, 0):
            sub.plan = purchase.plan
        sub.granted_by = SubscriptionGrantedBy.PURCHASE
        sub.expires_at = new_expires_at
    await db.flush()
