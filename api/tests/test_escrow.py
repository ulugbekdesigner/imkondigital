"""Escrow holat mashinasi — har bir o'tish va noto'g'ri o'tish sistematik tekshiriladi."""

import itertools

import pytest

from app.core.escrow import (
    InvalidTransitionError,
    can_transition,
    is_terminal,
    transition,
)
from app.models.enums import OrderStatus

ALL_STATUSES = list(OrderStatus)

VALID_PAIRS = {
    (OrderStatus.CREATED, OrderStatus.FUNDED),
    (OrderStatus.CREATED, OrderStatus.CANCELLED),
    (OrderStatus.FUNDED, OrderStatus.IN_PROGRESS),
    (OrderStatus.FUNDED, OrderStatus.DELIVERED),
    (OrderStatus.FUNDED, OrderStatus.DISPUTED),
    (OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED),
    (OrderStatus.IN_PROGRESS, OrderStatus.DISPUTED),
    (OrderStatus.DELIVERED, OrderStatus.ACCEPTED),
    (OrderStatus.DELIVERED, OrderStatus.DISPUTED),
    (OrderStatus.ACCEPTED, OrderStatus.PAID),
    (OrderStatus.DISPUTED, OrderStatus.PAID),
    (OrderStatus.DISPUTED, OrderStatus.REFUNDED),
}


@pytest.mark.parametrize("src,dst", sorted(VALID_PAIRS, key=lambda p: (p[0], p[1])))
def test_valid_transitions_allowed(src: OrderStatus, dst: OrderStatus) -> None:
    assert can_transition(src, dst) is True
    assert transition(src, dst) == dst


@pytest.mark.parametrize(
    "src,dst",
    [
        pair
        for pair in itertools.product(ALL_STATUSES, ALL_STATUSES)
        if pair not in VALID_PAIRS and pair[0] != pair[1]
    ],
)
def test_all_other_transitions_rejected(src: OrderStatus, dst: OrderStatus) -> None:
    assert can_transition(src, dst) is False
    with pytest.raises(InvalidTransitionError):
        transition(src, dst)


@pytest.mark.parametrize("status", ALL_STATUSES)
def test_self_transition_always_rejected(status: OrderStatus) -> None:
    assert can_transition(status, status) is False


@pytest.mark.parametrize("status", [OrderStatus.PAID, OrderStatus.REFUNDED, OrderStatus.CANCELLED])
def test_terminal_statuses_have_no_outgoing_transitions(status: OrderStatus) -> None:
    assert is_terminal(status) is True
    assert all(not can_transition(status, other) for other in ALL_STATUSES)


@pytest.mark.parametrize(
    "status",
    [
        OrderStatus.CREATED,
        OrderStatus.FUNDED,
        OrderStatus.IN_PROGRESS,
        OrderStatus.DELIVERED,
        OrderStatus.ACCEPTED,
        OrderStatus.DISPUTED,
    ],
)
def test_non_terminal_statuses(status: OrderStatus) -> None:
    assert is_terminal(status) is False


def test_unknown_status_string_rejected() -> None:
    assert can_transition("created", "not-a-real-status") is False
    assert can_transition("bogus", "funded") is False


def test_invalid_transition_error_carries_context() -> None:
    with pytest.raises(InvalidTransitionError) as exc_info:
        transition(OrderStatus.PAID, OrderStatus.FUNDED)
    assert exc_info.value.from_status == OrderStatus.PAID
    assert exc_info.value.to_status == OrderStatus.FUNDED


def test_dispute_can_be_opened_from_any_active_state() -> None:
    for active in (OrderStatus.FUNDED, OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED):
        assert can_transition(active, OrderStatus.DISPUTED) is True


def test_cannot_dispute_before_funding_or_after_terminal() -> None:
    assert can_transition(OrderStatus.CREATED, OrderStatus.DISPUTED) is False
    assert can_transition(OrderStatus.PAID, OrderStatus.DISPUTED) is False
    assert can_transition(OrderStatus.CANCELLED, OrderStatus.DISPUTED) is False
