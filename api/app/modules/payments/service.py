"""To'lov servisi — Payme/Click webhooklari uchun umumiy DB operatsiyalari.

Uchta mustaqil "to'lanadigan" tur bor: marketplace `Order` (escrow, `Payment`
jadvali orqali), `Donation` (V2-2, holatni o'zida saqlaydi — escrow kerak
emas, bitta martalik to'lov) va `SubscriptionPurchase` (4-bo'lim, PLUS/PRO
oylik to'lov — xuddi Donation kabi holatni o'zida saqlaydi). Uchalasi bir xil
Payme/Click webhook orqali o'tadi (app/modules/payments/payme.py, click.py)
— shu sabab barchasi shu yerda, lekin bir-biriga bog'liq emas.
"""

from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.escrow import can_transition
from app.models.donation import Donation, DonationProject
from app.models.enums import (
    DonationProjectStatus,
    NotificationCategory,
    NotificationType,
    OrderStatus,
    PaymentStatus,
)
from app.models.marketplace import Order, Payment
from app.models.subscription_purchase import SubscriptionPurchase
from app.modules.notifications.service import create_notification


async def get_order(db: AsyncSession, order_id: int) -> Order | None:
    return await db.get(Order, order_id)


async def find_payment_by_transaction(
    db: AsyncSession, provider: str, transaction_id: str
) -> Payment | None:
    return (
        await db.execute(
            select(Payment).where(
                Payment.provider == provider, Payment.provider_transaction_id == transaction_id
            )
        )
    ).scalar_one_or_none()


async def get_payment_for_order(db: AsyncSession, order_id: int) -> Payment | None:
    return (
        await db.execute(select(Payment).where(Payment.order_id == order_id))
    ).scalar_one_or_none()


async def create_pending_payment(
    db: AsyncSession, *, order_id: int, provider: str, transaction_id: str, amount_tiyin: int
) -> Payment:
    payment = Payment(
        order_id=order_id,
        amount=amount_tiyin,
        provider=provider,
        provider_transaction_id=transaction_id,
        status=PaymentStatus.PENDING,
    )
    db.add(payment)
    await db.flush()
    return payment


async def mark_payment_paid(db: AsyncSession, payment: Payment) -> None:
    if payment.status == PaymentStatus.PAID:
        return  # idempotent — takroriy webhook xavfsiz
    payment.status = PaymentStatus.PAID
    payment.paid_at = datetime.now(UTC)

    order = await db.get(Order, payment.order_id)
    if order is not None and can_transition(order.status, OrderStatus.FUNDED):
        order.status = OrderStatus.FUNDED
        await create_notification(
            db,
            user_id=order.freelancer_id,
            notif_type=NotificationType.ORDER_STATUS,
            category=NotificationCategory.OPPORTUNITY,
            title="Buyurtma uchun to'lov qabul qilindi",
            body=order.title,
            link_url=f"/buyurtmalarim/{order.id}",
        )
    await db.flush()


async def mark_payment_cancelled(db: AsyncSession, payment: Payment) -> None:
    if payment.status == PaymentStatus.CANCELLED:
        return
    payment.status = PaymentStatus.CANCELLED
    payment.cancelled_at = datetime.now(UTC)

    order = await db.get(Order, payment.order_id)
    if order is not None and can_transition(order.status, OrderStatus.CANCELLED):
        order.status = OrderStatus.CANCELLED
    await db.flush()


# --- Donation (V2-2 — "Ochiq Xayriya") ---


async def get_donation(db: AsyncSession, donation_id: int) -> Donation | None:
    return await db.get(Donation, donation_id)


async def find_donation_by_transaction(
    db: AsyncSession, provider: str, transaction_id: str
) -> Donation | None:
    return (
        await db.execute(
            select(Donation).where(
                Donation.provider == provider, Donation.provider_transaction_id == transaction_id
            )
        )
    ).scalar_one_or_none()


async def attach_donation_transaction(
    db: AsyncSession, *, donation: Donation, provider: str, transaction_id: str
) -> None:
    donation.provider = provider
    donation.provider_transaction_id = transaction_id
    await db.flush()


async def mark_donation_paid(db: AsyncSession, donation: Donation) -> None:
    if donation.status == PaymentStatus.PAID:
        return  # idempotent — takroriy webhook xavfsiz
    donation.status = PaymentStatus.PAID
    donation.paid_at = datetime.now(UTC)

    project = await db.get(DonationProject, donation.project_id)
    if project is not None:
        project.collected_amount += donation.amount
        if (
            project.status == DonationProjectStatus.ACTIVE
            and project.collected_amount >= project.target_amount
        ):
            project.status = DonationProjectStatus.FUNDED
    await db.flush()


async def mark_donation_cancelled(db: AsyncSession, donation: Donation) -> None:
    if donation.status == PaymentStatus.CANCELLED:
        return
    donation.status = PaymentStatus.CANCELLED
    donation.cancelled_at = datetime.now(UTC)
    await db.flush()


# --- SubscriptionPurchase (4-bo'lim — PLUS/PRO o'z-o'zidan sotib olish) ---


async def get_subscription_purchase(db: AsyncSession, purchase_id: int) -> SubscriptionPurchase | None:
    return await db.get(SubscriptionPurchase, purchase_id)


async def find_subscription_purchase_by_transaction(
    db: AsyncSession, provider: str, transaction_id: str
) -> SubscriptionPurchase | None:
    return (
        await db.execute(
            select(SubscriptionPurchase).where(
                SubscriptionPurchase.provider == provider,
                SubscriptionPurchase.provider_transaction_id == transaction_id,
            )
        )
    ).scalar_one_or_none()


async def attach_subscription_purchase_transaction(
    db: AsyncSession, *, purchase: SubscriptionPurchase, provider: str, transaction_id: str
) -> None:
    purchase.provider = provider
    purchase.provider_transaction_id = transaction_id
    await db.flush()


async def mark_subscription_purchase_paid(db: AsyncSession, purchase: SubscriptionPurchase) -> None:
    if purchase.status == PaymentStatus.PAID:
        return  # idempotent — takroriy webhook xavfsiz
    purchase.status = PaymentStatus.PAID
    purchase.paid_at = datetime.now(UTC)

    from app.modules.subscriptions.service import activate_purchase  # aylanma import'dan qochish

    await activate_purchase(db, purchase)
    await create_notification(
        db,
        user_id=purchase.user_id,
        notif_type=NotificationType.SUBSCRIPTION_ACTIVATED,
        category=NotificationCategory.LEARNING,
        title=f"{purchase.plan.upper()} obuna faollashtirildi",
        body="Keyingi to'lov muddati /tariflar sahifasida ko'rinadi.",
        link_url="/tariflar",
    )
    await db.flush()


async def mark_subscription_purchase_cancelled(db: AsyncSession, purchase: SubscriptionPurchase) -> None:
    if purchase.status == PaymentStatus.CANCELLED:
        return
    purchase.status = PaymentStatus.CANCELLED
    purchase.cancelled_at = datetime.now(UTC)
    await db.flush()
