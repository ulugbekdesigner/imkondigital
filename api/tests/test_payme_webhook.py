"""Payme merchant webhook — rasmiy JSON-RPC protokoliga mos so'rovlar bilan."""

import base64

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from tests.helpers import auth_header, register_and_verify

settings = get_settings()


def _basic_auth_header() -> dict[str, str]:
    token = base64.b64encode(f"Paycom:{settings.payme_merchant_key}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


async def _create_order(client: httpx.AsyncClient) -> tuple[int, str]:
    """Mijoz va freelancer yaratib, buyurtma ochadi. (order_id, client_headers_token) qaytaradi."""
    client_tokens = await register_and_verify(client, phone="+998901112233")
    freelancer_tokens = await register_and_verify(client, phone="+998907778899")
    fhdr = auth_header(freelancer_tokens["access_token"])
    freelancer_me = (await client.get("/v1/users/me", headers=fhdr)).json()

    chdr = auth_header(client_tokens["access_token"])
    order_resp = await client.post(
        "/v1/orders",
        headers=chdr,
        json={
            "freelancer_id": freelancer_me["id"],
            "title": "Logotip dizayni",
            "description": "3 variant kerak",
            "amount": 150000,
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    return order_resp.json()["id"], client_tokens["access_token"]


async def test_check_perform_transaction_allows_valid_order(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    resp = await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={
            "id": 1,
            "method": "CheckPerformTransaction",
            "params": {"amount": 15_000_000, "account": {"order_id": order_id}},
        },
    )
    assert resp.status_code == 200
    assert resp.json()["result"]["allow"] is True


async def test_check_perform_rejects_wrong_amount(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    resp = await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={
            "id": 1,
            "method": "CheckPerformTransaction",
            "params": {"amount": 999, "account": {"order_id": order_id}},
        },
    )
    body = resp.json()
    assert body["error"]["code"] == -31001


async def test_check_perform_rejects_unknown_order(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={
            "id": 1,
            "method": "CheckPerformTransaction",
            "params": {"amount": 100, "account": {"order_id": 999999}},
        },
    )
    assert resp.json()["error"]["code"] == -31050


async def test_invalid_auth_rejected(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    resp = await client.post(
        "/v1/payments/payme",
        headers={"Authorization": "Basic bm90YXJlYWxrZXk6d3Jvbmc="},  # notarealkey:wrong
        json={
            "id": 1,
            "method": "CheckPerformTransaction",
            "params": {"amount": 15_000_000, "account": {"order_id": order_id}},
        },
    )
    assert resp.json()["error"]["code"] == -32504


async def test_missing_auth_rejected(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/v1/payments/payme",
        json={"id": 1, "method": "CheckPerformTransaction", "params": {}},
    )
    assert resp.json()["error"]["code"] == -32504


async def test_unknown_method_rejected(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={"id": 1, "method": "NotARealMethod", "params": {}},
    )
    assert resp.json()["error"]["code"] == -32601


async def test_full_create_perform_flow_transitions_order_to_funded(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    order_id, client_token = await _create_order(client)
    hdr = _basic_auth_header()

    create = await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={
            "id": 1,
            "method": "CreateTransaction",
            "params": {
                "id": "payme-txn-abc123",
                "time": 1_700_000_000_000,
                "amount": 15_000_000,
                "account": {"order_id": order_id},
            },
        },
    )
    assert create.status_code == 200
    assert create.json()["result"]["state"] == 1

    perform = await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={"id": 2, "method": "PerformTransaction", "params": {"id": "payme-txn-abc123"}},
    )
    assert perform.status_code == 200
    assert perform.json()["result"]["state"] == 2

    order = (await client.get(f"/v1/orders/{order_id}", headers=auth_header(client_token))).json()
    assert order["status"] == "funded"
    assert order["payment_status"] == "paid"


async def test_create_transaction_is_idempotent(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    hdr = _basic_auth_header()
    payload = {
        "id": 1,
        "method": "CreateTransaction",
        "params": {
            "id": "payme-txn-idem",
            "time": 1_700_000_000_000,
            "amount": 15_000_000,
            "account": {"order_id": order_id},
        },
    }
    first = await client.post("/v1/payments/payme", headers=hdr, json=payload)
    second = await client.post("/v1/payments/payme", headers=hdr, json=payload)
    assert first.json()["result"]["transaction"] == second.json()["result"]["transaction"]
    assert second.json()["result"]["state"] == 1


async def test_perform_unknown_transaction_returns_not_found(client: httpx.AsyncClient) -> None:
    resp = await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={"id": 1, "method": "PerformTransaction", "params": {"id": "does-not-exist"}},
    )
    assert resp.json()["error"]["code"] == -31003


async def test_cancel_before_perform_sets_state_minus_one(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    order_id, client_token = await _create_order(client)
    hdr = _basic_auth_header()
    await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={
            "id": 1,
            "method": "CreateTransaction",
            "params": {
                "id": "payme-txn-cancel",
                "time": 1_700_000_000_000,
                "amount": 15_000_000,
                "account": {"order_id": order_id},
            },
        },
    )
    cancel = await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={
            "id": 2,
            "method": "CancelTransaction",
            "params": {"id": "payme-txn-cancel", "reason": 1},
        },
    )
    assert cancel.json()["result"]["state"] == -1

    order = (await client.get(f"/v1/orders/{order_id}", headers=auth_header(client_token))).json()
    assert order["status"] == "cancelled"


async def test_cancel_after_perform_sets_state_minus_two(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    hdr = _basic_auth_header()
    await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={
            "id": 1,
            "method": "CreateTransaction",
            "params": {
                "id": "payme-txn-cancel2",
                "time": 1_700_000_000_000,
                "amount": 15_000_000,
                "account": {"order_id": order_id},
            },
        },
    )
    await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={"id": 2, "method": "PerformTransaction", "params": {"id": "payme-txn-cancel2"}},
    )
    cancel = await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={
            "id": 3,
            "method": "CancelTransaction",
            "params": {"id": "payme-txn-cancel2", "reason": 3},
        },
    )
    assert cancel.json()["result"]["state"] == -2


async def test_check_transaction_reports_current_state(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    hdr = _basic_auth_header()
    await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={
            "id": 1,
            "method": "CreateTransaction",
            "params": {
                "id": "payme-txn-check",
                "time": 1_700_000_000_000,
                "amount": 15_000_000,
                "account": {"order_id": order_id},
            },
        },
    )
    check = await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={"id": 2, "method": "CheckTransaction", "params": {"id": "payme-txn-check"}},
    )
    assert check.json()["result"]["state"] == 1
