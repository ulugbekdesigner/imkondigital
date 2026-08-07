"""Payme Merchant API — JSON-RPC 2.0 webhook handler.

Rasmiy protokol: https://developer.help.paycom.uz/
Metodlar: CheckPerformTransaction, CreateTransaction, PerformTransaction,
CancelTransaction, CheckTransaction, GetStatement.

Holat modeli (Payme tomonidan belgilangan): 1=yaratilgan, 2=bajarilgan,
-1=bekor qilingan (to'lovdan oldin), -2=bekor qilingan (to'lovdan keyin).

Ikki "account" turi qo'llab-quvvatlanadi — `account.order_id` (marketplace
buyurtmasi, `Payment` jadvali orqali) va `account.donation_id` (V2-2 ochiq
xayriya, `Donation` o'zi holatni saqlaydi). Payme uchun bular alohida nomlangan
maydonlar bo'lgani sabab to'qnashuv xavfi yo'q — CheckPerformTransaction/
CreateTransaction shu maydon nomiga qarab tarmoqlanadi; Perform/Cancel/
CheckTransaction esa Payme o'zi bergan `transaction_id` orqali avval Payment,
topilmasa Donation'dan qidiradi (ikkalasi ham shu qiymat fazosida noyob).
"""

import base64
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.donation import Donation
from app.models.enums import OrderStatus, PaymentProvider, PaymentStatus
from app.modules.payments import service

settings = get_settings()

# --- Payme xato kodlari (rasmiy hujjatga mos) ---
ERR_INVALID_AMOUNT = -31001
ERR_ORDER_NOT_FOUND = -31050
ERR_TRANSACTION_NOT_FOUND = -31003
ERR_UNABLE_TO_PERFORM = -31008
ERR_INSUFFICIENT_PRIVILEGE = -32504
ERR_METHOD_NOT_FOUND = -32601
ERR_PARSE_ERROR = -32700

# Payme kuniga: 1 so'm = 100 tiyin
TIYIN_PER_SUM = 100


class PaymeError(Exception):
    def __init__(self, code: int, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(message)


def _rpc_error(request_id: Any, code: int, message: str) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": request_id, "error": {"code": code, "message": message}}


def _rpc_result(request_id: Any, result: dict[str, Any]) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": request_id, "result": result}


def _timestamp_ms(dt: datetime | None) -> int:
    if dt is None:
        return 0
    return int(dt.timestamp() * 1000)


def verify_auth(auth_header: str | None) -> bool:
    """HTTP Basic Auth: login='Paycom', parol=merchant_key."""
    if not auth_header or not auth_header.startswith("Basic "):
        return False
    try:
        decoded = base64.b64decode(auth_header.removeprefix("Basic ")).decode()
        login, _, password = decoded.partition(":")
    except (ValueError, UnicodeDecodeError):
        return False
    return login == "Paycom" and password == settings.payme_merchant_key


def _extract_order_id(params: dict[str, Any], request_id: Any) -> int:
    account = params.get("account", {})
    raw_id = account.get("order_id")
    try:
        return int(raw_id)
    except (TypeError, ValueError) as exc:
        raise PaymeError(ERR_ORDER_NOT_FOUND, "Order not found") from exc


def _extract_donation_id(params: dict[str, Any]) -> int | None:
    account = params.get("account", {})
    raw_id = account.get("donation_id")
    if raw_id is None:
        return None
    try:
        return int(raw_id)
    except (TypeError, ValueError):
        return None


def _is_donation_request(params: dict[str, Any]) -> bool:
    return "donation_id" in params.get("account", {})


async def _check_perform_transaction(
    db: AsyncSession, params: dict[str, Any], request_id: Any
) -> dict[str, Any]:
    if _is_donation_request(params):
        donation_id = _extract_donation_id(params)
        if donation_id is None:
            raise PaymeError(ERR_ORDER_NOT_FOUND, "Donation not found")
        donation = await service.get_donation(db, donation_id)
        if donation is None:
            raise PaymeError(ERR_ORDER_NOT_FOUND, "Donation not found")
        if donation.status != PaymentStatus.PENDING:
            raise PaymeError(ERR_UNABLE_TO_PERFORM, "Donation is not payable")
        if int(params.get("amount", -1)) != donation.amount * TIYIN_PER_SUM:
            raise PaymeError(ERR_INVALID_AMOUNT, "Invalid amount")
        return _rpc_result(request_id, {"allow": True})

    order_id = _extract_order_id(params, request_id)
    order = await service.get_order(db, order_id)
    if order is None:
        raise PaymeError(ERR_ORDER_NOT_FOUND, "Order not found")
    if order.status != OrderStatus.CREATED:
        raise PaymeError(ERR_UNABLE_TO_PERFORM, "Order is not payable")

    expected_tiyin = order.amount * TIYIN_PER_SUM
    if int(params.get("amount", -1)) != expected_tiyin:
        raise PaymeError(ERR_INVALID_AMOUNT, "Invalid amount")

    return _rpc_result(request_id, {"allow": True})


async def _create_transaction(
    db: AsyncSession, params: dict[str, Any], request_id: Any
) -> dict[str, Any]:
    transaction_id = str(params["id"])
    amount = int(params.get("amount", -1))

    existing_payment = await service.find_payment_by_transaction(
        db, PaymentProvider.PAYME, transaction_id
    )
    existing_donation = await service.find_donation_by_transaction(
        db, PaymentProvider.PAYME, transaction_id
    )
    existing = existing_payment or existing_donation
    if existing is not None:
        # Idempotent — bir xil so'rov qayta kelsa, mavjud holatni qaytaramiz
        state = 2 if existing.status == PaymentStatus.PAID else 1
        return _rpc_result(
            request_id,
            {
                "create_time": _timestamp_ms(existing.created_at),
                "transaction": str(existing.id),
                "state": state,
            },
        )

    if _is_donation_request(params):
        donation_id = _extract_donation_id(params)
        if donation_id is None:
            raise PaymeError(ERR_ORDER_NOT_FOUND, "Donation not found")
        donation = await service.get_donation(db, donation_id)
        if donation is None:
            raise PaymeError(ERR_ORDER_NOT_FOUND, "Donation not found")
        if donation.status != PaymentStatus.PENDING:
            raise PaymeError(ERR_UNABLE_TO_PERFORM, "Donation is not payable")
        if amount != donation.amount * TIYIN_PER_SUM:
            raise PaymeError(ERR_INVALID_AMOUNT, "Invalid amount")

        await service.attach_donation_transaction(
            db, donation=donation, provider=PaymentProvider.PAYME, transaction_id=transaction_id
        )
        await db.commit()
        return _rpc_result(
            request_id,
            {
                "create_time": _timestamp_ms(donation.created_at),
                "transaction": str(donation.id),
                "state": 1,
            },
        )

    order_id = _extract_order_id(params, request_id)
    order = await service.get_order(db, order_id)
    if order is None:
        raise PaymeError(ERR_ORDER_NOT_FOUND, "Order not found")
    if order.status != OrderStatus.CREATED:
        raise PaymeError(ERR_UNABLE_TO_PERFORM, "Order is not payable")
    if amount != order.amount * TIYIN_PER_SUM:
        raise PaymeError(ERR_INVALID_AMOUNT, "Invalid amount")

    payment = await service.create_pending_payment(
        db,
        order_id=order_id,
        provider=PaymentProvider.PAYME,
        transaction_id=transaction_id,
        amount_tiyin=amount,
    )
    await db.commit()
    return _rpc_result(
        request_id,
        {
            "create_time": _timestamp_ms(payment.created_at),
            "transaction": str(payment.id),
            "state": 1,
        },
    )


async def _find_payable_by_transaction(db: AsyncSession, transaction_id: str) -> Any:
    payment = await service.find_payment_by_transaction(db, PaymentProvider.PAYME, transaction_id)
    if payment is not None:
        return payment
    return await service.find_donation_by_transaction(db, PaymentProvider.PAYME, transaction_id)


async def _perform_transaction(
    db: AsyncSession, params: dict[str, Any], request_id: Any
) -> dict[str, Any]:
    transaction_id = str(params["id"])
    payable = await _find_payable_by_transaction(db, transaction_id)
    if payable is None:
        raise PaymeError(ERR_TRANSACTION_NOT_FOUND, "Transaction not found")

    if payable.status == PaymentStatus.CANCELLED:
        raise PaymeError(ERR_UNABLE_TO_PERFORM, "Transaction already cancelled")

    if payable.status != PaymentStatus.PAID:
        if isinstance(payable, Donation):
            await service.mark_donation_paid(db, payable)
        else:
            await service.mark_payment_paid(db, payable)
        await db.commit()
        await db.refresh(payable)

    return _rpc_result(
        request_id,
        {
            "transaction": str(payable.id),
            "perform_time": _timestamp_ms(payable.paid_at),
            "state": 2,
        },
    )


async def _cancel_transaction(
    db: AsyncSession, params: dict[str, Any], request_id: Any
) -> dict[str, Any]:
    transaction_id = str(params["id"])
    payable = await _find_payable_by_transaction(db, transaction_id)
    if payable is None:
        raise PaymeError(ERR_TRANSACTION_NOT_FOUND, "Transaction not found")

    was_paid = payable.status == PaymentStatus.PAID
    if payable.status != PaymentStatus.CANCELLED:
        if isinstance(payable, Donation):
            await service.mark_donation_cancelled(db, payable)
        else:
            await service.mark_payment_cancelled(db, payable)
        await db.commit()
        await db.refresh(payable)

    return _rpc_result(
        request_id,
        {
            "transaction": str(payable.id),
            "cancel_time": _timestamp_ms(payable.cancelled_at),
            "state": -2 if was_paid else -1,
        },
    )


async def _check_transaction(
    db: AsyncSession, params: dict[str, Any], request_id: Any
) -> dict[str, Any]:
    transaction_id = str(params["id"])
    payable = await _find_payable_by_transaction(db, transaction_id)
    if payable is None:
        raise PaymeError(ERR_TRANSACTION_NOT_FOUND, "Transaction not found")

    if payable.status == PaymentStatus.PAID:
        state = 2
    elif payable.status == PaymentStatus.CANCELLED:
        state = -1
    else:
        state = 1

    return _rpc_result(
        request_id,
        {
            "create_time": _timestamp_ms(payable.created_at),
            "perform_time": _timestamp_ms(payable.paid_at),
            "cancel_time": _timestamp_ms(payable.cancelled_at),
            "transaction": str(payable.id),
            "state": state,
            "reason": None,
        },
    )


_METHODS = {
    "CheckPerformTransaction": _check_perform_transaction,
    "CreateTransaction": _create_transaction,
    "PerformTransaction": _perform_transaction,
    "CancelTransaction": _cancel_transaction,
    "CheckTransaction": _check_transaction,
}


async def handle_payme_request(
    db: AsyncSession, body: dict[str, Any], auth_header: str | None
) -> dict[str, Any]:
    request_id = body.get("id")
    if not verify_auth(auth_header):
        return _rpc_error(request_id, ERR_INSUFFICIENT_PRIVILEGE, "Insufficient privilege")

    method = body.get("method")
    handler = _METHODS.get(method or "")
    if handler is None:
        return _rpc_error(request_id, ERR_METHOD_NOT_FOUND, "Method not found")

    params = body.get("params", {})
    try:
        return await handler(db, params, request_id)
    except PaymeError as exc:
        return _rpc_error(request_id, exc.code, exc.message)
    except (KeyError, TypeError, ValueError):
        return _rpc_error(request_id, ERR_PARSE_ERROR, "Parse error")
