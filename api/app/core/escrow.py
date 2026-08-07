"""Escrow holat mashinasi — Freelancer Marketplace buyurtma hayotiy sikli.

Sof funksiya: DB yoki tarmoq kerak emas, to'liq deterministik va testlanadigan.

    CREATED --funded--> FUNDED --start--> IN_PROGRESS --deliver--> DELIVERED --accept--> ACCEPTED
    ACCEPTED --*--> PAID
       |                   |                    |                     |
     cancel              dispute              dispute               dispute
       |                   |                    |                     |
       v                   v                    v                     v
   CANCELLED            DISPUTED <-------------------------------------
                            |
                  resolve_freelancer / resolve_client
                            |
                     PAID / REFUNDED

ACCEPTED -> PAID avtomatik (bitta amalda) — accept + payout release birga.
"""

from app.models.enums import OrderStatus

_ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.CREATED: {OrderStatus.FUNDED, OrderStatus.CANCELLED},
    OrderStatus.FUNDED: {OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED, OrderStatus.DISPUTED},
    OrderStatus.IN_PROGRESS: {OrderStatus.DELIVERED, OrderStatus.DISPUTED},
    OrderStatus.DELIVERED: {OrderStatus.ACCEPTED, OrderStatus.DISPUTED},
    OrderStatus.ACCEPTED: {OrderStatus.PAID},
    OrderStatus.DISPUTED: {OrderStatus.PAID, OrderStatus.REFUNDED},
    OrderStatus.PAID: set(),
    OrderStatus.REFUNDED: set(),
    OrderStatus.CANCELLED: set(),
}

# Yakuniy (o'zgarmas) holatlar — bu yerdan hech qayerga o'tib bo'lmaydi
TERMINAL_STATUSES = {OrderStatus.PAID, OrderStatus.REFUNDED, OrderStatus.CANCELLED}


def can_transition(from_status: str, to_status: str) -> bool:
    try:
        src = OrderStatus(from_status)
        dst = OrderStatus(to_status)
    except ValueError:
        return False
    return dst in _ALLOWED_TRANSITIONS.get(src, set())


def is_terminal(status: str) -> bool:
    try:
        return OrderStatus(status) in TERMINAL_STATUSES
    except ValueError:
        return False


class InvalidTransitionError(Exception):
    def __init__(self, from_status: str, to_status: str) -> None:
        self.from_status = from_status
        self.to_status = to_status
        super().__init__(f"'{from_status}' dan '{to_status}' ga o'tish mumkin emas")


def transition(from_status: str, to_status: str) -> str:
    """O'tishni tekshiradi va yangi holatni qaytaradi; noto'g'ri bo'lsa xato ko'taradi."""
    if not can_transition(from_status, to_status):
        raise InvalidTransitionError(from_status, to_status)
    return to_status
