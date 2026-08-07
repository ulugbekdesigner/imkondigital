"""Click Merchant API — Prepare/Complete webhook handler.

Rasmiy protokol: https://docs.click.uz/en/click-api-request-from-click-to-merchant/
action=0 -> Prepare, action=1 -> Complete. Imzo MD5 (app/core/payment_sign.py).

`merchant_trans_id` ikki turdagi "to'lanadigan"ni ifodalaydi: buyurtma
(oddiy raqam, masalan "42") yoki xayriya — V2-2, `d` prefiksi bilan
(masalan "d42") — Click uchun bitta qiymat fazosi bo'lgani sabab shu tarzda
farqlanadi (Payme'da esa alohida "account" maydon nomi orqali).
"""

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.payment_sign import (
    click_complete_signature,
    click_prepare_signature,
    sum_to_tiyin,
    verify_click_signature,
)
from app.models.donation import Donation
from app.models.enums import OrderStatus, PaymentProvider, PaymentStatus
from app.modules.payments import service

settings = get_settings()

# --- Click xato kodlari (rasmiy hujjatga mos) ---
ERR_SUCCESS = 0
ERR_SIGN_FAILED = -1
ERR_INCORRECT_AMOUNT = -2
ERR_ALREADY_PAID = -4
ERR_ORDER_NOT_FOUND = -5
ERR_TRANSACTION_NOT_FOUND = -6
ERR_TRANSACTION_CANCELLED = -9

_DONATION_PREFIX = "d"


def _resp(
    *, click_trans_id: str, merchant_trans_id: str, error: int, error_note: str, **extra: Any
) -> dict[str, Any]:
    return {
        "click_trans_id": click_trans_id,
        "merchant_trans_id": merchant_trans_id,
        "error": error,
        "error_note": error_note,
        **extra,
    }


def _parse_donation_id(merchant_trans_id: str) -> int | None:
    if not merchant_trans_id.startswith(_DONATION_PREFIX):
        return None
    try:
        return int(merchant_trans_id[len(_DONATION_PREFIX) :])
    except ValueError:
        return None


async def _click_prepare_donation(
    db: AsyncSession,
    *,
    click_trans_id: str,
    merchant_trans_id: str,
    donation_id: int,
    form: dict[str, Any],
) -> dict[str, Any]:
    amount = str(form.get("amount", "0"))
    sign_time = str(form.get("sign_time", ""))
    received_sign = str(form.get("sign_string", ""))

    expected_sign = click_prepare_signature(
        click_trans_id=click_trans_id,
        service_id=str(form.get("service_id", "")),
        secret_key=settings.click_secret_key,
        merchant_trans_id=merchant_trans_id,
        amount=amount,
        action="0",
        sign_time=sign_time,
    )
    if not verify_click_signature(received_sign, expected_sign):
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_SIGN_FAILED,
            error_note="SIGN CHECK FAILED",
        )

    donation = await service.get_donation(db, donation_id)
    if donation is None:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_ORDER_NOT_FOUND,
            error_note="Donation not found",
        )
    if donation.status != PaymentStatus.PENDING:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_ALREADY_PAID,
            error_note="Donation is not payable",
        )

    expected_tiyin = donation.amount * 100
    if sum_to_tiyin(amount) != expected_tiyin:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_INCORRECT_AMOUNT,
            error_note="Incorrect amount",
        )

    existing = await service.find_donation_by_transaction(db, PaymentProvider.CLICK, click_trans_id)
    if existing is not None:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_SUCCESS,
            error_note="Success",
            merchant_prepare_id=str(existing.id),
        )

    await service.attach_donation_transaction(
        db, donation=donation, provider=PaymentProvider.CLICK, transaction_id=click_trans_id
    )
    await db.commit()

    return _resp(
        click_trans_id=click_trans_id,
        merchant_trans_id=merchant_trans_id,
        error=ERR_SUCCESS,
        error_note="Success",
        merchant_prepare_id=str(donation.id),
    )


async def handle_click_prepare(db: AsyncSession, form: dict[str, Any]) -> dict[str, Any]:
    click_trans_id = str(form.get("click_trans_id", ""))
    merchant_trans_id = str(form.get("merchant_trans_id", ""))

    donation_id = _parse_donation_id(merchant_trans_id)
    if donation_id is not None:
        return await _click_prepare_donation(
            db,
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            donation_id=donation_id,
            form=form,
        )

    amount = str(form.get("amount", "0"))
    sign_time = str(form.get("sign_time", ""))
    received_sign = str(form.get("sign_string", ""))

    expected_sign = click_prepare_signature(
        click_trans_id=click_trans_id,
        service_id=str(form.get("service_id", "")),
        secret_key=settings.click_secret_key,
        merchant_trans_id=merchant_trans_id,
        amount=amount,
        action="0",
        sign_time=sign_time,
    )
    if not verify_click_signature(received_sign, expected_sign):
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_SIGN_FAILED,
            error_note="SIGN CHECK FAILED",
        )

    try:
        order_id = int(merchant_trans_id)
    except ValueError:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_ORDER_NOT_FOUND,
            error_note="Order not found",
        )

    order = await service.get_order(db, order_id)
    if order is None:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_ORDER_NOT_FOUND,
            error_note="Order not found",
        )
    if order.status != OrderStatus.CREATED:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_ALREADY_PAID,
            error_note="Order is not payable",
        )

    expected_tiyin = order.amount * 100
    if sum_to_tiyin(amount) != expected_tiyin:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_INCORRECT_AMOUNT,
            error_note="Incorrect amount",
        )

    existing = await service.find_payment_by_transaction(db, PaymentProvider.CLICK, click_trans_id)
    if existing is not None:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_SUCCESS,
            error_note="Success",
            merchant_prepare_id=str(existing.id),
        )

    payment = await service.create_pending_payment(
        db,
        order_id=order_id,
        provider=PaymentProvider.CLICK,
        transaction_id=click_trans_id,
        amount_tiyin=sum_to_tiyin(amount),
    )
    await db.commit()

    return _resp(
        click_trans_id=click_trans_id,
        merchant_trans_id=merchant_trans_id,
        error=ERR_SUCCESS,
        error_note="Success",
        merchant_prepare_id=str(payment.id),
    )


async def _find_payable_by_click_transaction(db: AsyncSession, click_trans_id: str) -> Any:
    payment = await service.find_payment_by_transaction(db, PaymentProvider.CLICK, click_trans_id)
    if payment is not None:
        return payment
    return await service.find_donation_by_transaction(db, PaymentProvider.CLICK, click_trans_id)


async def handle_click_complete(db: AsyncSession, form: dict[str, Any]) -> dict[str, Any]:
    click_trans_id = str(form.get("click_trans_id", ""))
    merchant_trans_id = str(form.get("merchant_trans_id", ""))
    merchant_prepare_id = str(form.get("merchant_prepare_id", ""))
    amount = str(form.get("amount", "0"))
    sign_time = str(form.get("sign_time", ""))
    received_sign = str(form.get("sign_string", ""))
    click_error = int(form.get("error", 0))

    expected_sign = click_complete_signature(
        click_trans_id=click_trans_id,
        service_id=str(form.get("service_id", "")),
        secret_key=settings.click_secret_key,
        merchant_trans_id=merchant_trans_id,
        merchant_prepare_id=merchant_prepare_id,
        amount=amount,
        action="1",
        sign_time=sign_time,
    )
    if not verify_click_signature(received_sign, expected_sign):
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_SIGN_FAILED,
            error_note="SIGN CHECK FAILED",
        )

    payable = await _find_payable_by_click_transaction(db, click_trans_id)
    if payable is None or str(payable.id) != merchant_prepare_id:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_TRANSACTION_NOT_FOUND,
            error_note="Transaction not found",
        )

    if payable.status == PaymentStatus.CANCELLED:
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_TRANSACTION_CANCELLED,
            error_note="Transaction cancelled",
        )

    is_donation = isinstance(payable, Donation)

    # Click o'zi xato bergan bo'lsa (masalan mijoz bekor qildi) — biz ham bekor qilamiz
    if click_error < 0:
        if is_donation:
            await service.mark_donation_cancelled(db, payable)
        else:
            await service.mark_payment_cancelled(db, payable)
        await db.commit()
        return _resp(
            click_trans_id=click_trans_id,
            merchant_trans_id=merchant_trans_id,
            error=ERR_TRANSACTION_CANCELLED,
            error_note="Transaction cancelled",
            merchant_confirm_id=str(payable.id),
        )

    if payable.status != PaymentStatus.PAID:
        if is_donation:
            await service.mark_donation_paid(db, payable)
        else:
            await service.mark_payment_paid(db, payable)
        await db.commit()

    return _resp(
        click_trans_id=click_trans_id,
        merchant_trans_id=merchant_trans_id,
        error=ERR_SUCCESS,
        error_note="Success",
        merchant_confirm_id=str(payable.id),
    )
