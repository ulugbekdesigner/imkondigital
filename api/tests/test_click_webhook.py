"""Click merchant webhook — Prepare/Complete, MD5 imzo va idempotentlik."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.payment_sign import click_complete_signature, click_prepare_signature
from tests.helpers import auth_header, register_and_verify

settings = get_settings()

SERVICE_ID = settings.click_service_id
SECRET_KEY = settings.click_secret_key


async def _create_order(client: httpx.AsyncClient) -> tuple[int, str]:
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
            "title": "Banner dizayni",
            "description": "Instagram uchun",
            "amount": 80000,
        },
    )
    assert order_resp.status_code == 201, order_resp.text
    return order_resp.json()["id"], client_tokens["access_token"]


async def test_prepare_success_returns_merchant_prepare_id(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    sign_time = "2026-07-10 12:00:00"
    sign = click_prepare_signature(
        click_trans_id="1001",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        amount="80000.00",
        action="0",
        sign_time=sign_time,
    )
    resp = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "1001",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order_id),
            "amount": "80000.00",
            "action": "0",
            "sign_time": sign_time,
            "sign_string": sign,
        },
    )
    body = resp.json()
    assert body["error"] == 0
    assert body["merchant_prepare_id"]


async def test_prepare_rejects_bad_signature(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    resp = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "1002",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order_id),
            "amount": "80000.00",
            "action": "0",
            "sign_time": "2026-07-10 12:00:00",
            "sign_string": "notavalidsignature",
        },
    )
    assert resp.json()["error"] == -1


async def test_prepare_rejects_wrong_amount(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    sign_time = "2026-07-10 12:00:00"
    sign = click_prepare_signature(
        click_trans_id="1003",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        amount="1.00",
        action="0",
        sign_time=sign_time,
    )
    resp = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "1003",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order_id),
            "amount": "1.00",
            "action": "0",
            "sign_time": sign_time,
            "sign_string": sign,
        },
    )
    assert resp.json()["error"] == -2


async def test_prepare_rejects_unknown_order(client: httpx.AsyncClient) -> None:
    sign_time = "2026-07-10 12:00:00"
    sign = click_prepare_signature(
        click_trans_id="1004",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id="999999",
        amount="80000.00",
        action="0",
        sign_time=sign_time,
    )
    resp = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "1004",
            "service_id": SERVICE_ID,
            "merchant_trans_id": "999999",
            "amount": "80000.00",
            "action": "0",
            "sign_time": sign_time,
            "sign_string": sign,
        },
    )
    assert resp.json()["error"] == -5


async def test_prepare_is_idempotent(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    sign_time = "2026-07-10 12:00:00"
    sign = click_prepare_signature(
        click_trans_id="1005",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        amount="80000.00",
        action="0",
        sign_time=sign_time,
    )
    data = {
        "click_trans_id": "1005",
        "service_id": SERVICE_ID,
        "merchant_trans_id": str(order_id),
        "amount": "80000.00",
        "action": "0",
        "sign_time": sign_time,
        "sign_string": sign,
    }
    first = await client.post("/v1/payments/click/prepare", data=data)
    second = await client.post("/v1/payments/click/prepare", data=data)
    assert first.json()["merchant_prepare_id"] == second.json()["merchant_prepare_id"]


async def test_full_prepare_complete_flow_transitions_order_to_funded(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    order_id, client_token = await _create_order(client)
    sign_time = "2026-07-10 12:00:00"

    prepare_sign = click_prepare_signature(
        click_trans_id="2001",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        amount="80000.00",
        action="0",
        sign_time=sign_time,
    )
    prepare = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "2001",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order_id),
            "amount": "80000.00",
            "action": "0",
            "sign_time": sign_time,
            "sign_string": prepare_sign,
        },
    )
    merchant_prepare_id = prepare.json()["merchant_prepare_id"]
    assert prepare.json()["error"] == 0

    complete_sign = click_complete_signature(
        click_trans_id="2001",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        merchant_prepare_id=merchant_prepare_id,
        amount="80000.00",
        action="1",
        sign_time=sign_time,
    )
    complete = await client.post(
        "/v1/payments/click/complete",
        data={
            "click_trans_id": "2001",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order_id),
            "merchant_prepare_id": merchant_prepare_id,
            "amount": "80000.00",
            "action": "1",
            "sign_time": sign_time,
            "sign_string": complete_sign,
            "error": "0",
        },
    )
    assert complete.json()["error"] == 0

    order = (await client.get(f"/v1/orders/{order_id}", headers=auth_header(client_token))).json()
    assert order["status"] == "funded"
    assert order["payment_status"] == "paid"


async def test_complete_rejects_wrong_merchant_prepare_id(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    sign_time = "2026-07-10 12:00:00"
    prepare_sign = click_prepare_signature(
        click_trans_id="2002",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        amount="80000.00",
        action="0",
        sign_time=sign_time,
    )
    await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "2002",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order_id),
            "amount": "80000.00",
            "action": "0",
            "sign_time": sign_time,
            "sign_string": prepare_sign,
        },
    )
    complete_sign = click_complete_signature(
        click_trans_id="2002",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        merchant_prepare_id="999999",
        amount="80000.00",
        action="1",
        sign_time=sign_time,
    )
    complete = await client.post(
        "/v1/payments/click/complete",
        data={
            "click_trans_id": "2002",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order_id),
            "merchant_prepare_id": "999999",
            "amount": "80000.00",
            "action": "1",
            "sign_time": sign_time,
            "sign_string": complete_sign,
            "error": "0",
        },
    )
    assert complete.json()["error"] == -6


async def test_complete_is_idempotent(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    sign_time = "2026-07-10 12:00:00"
    prepare_sign = click_prepare_signature(
        click_trans_id="2003",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        amount="80000.00",
        action="0",
        sign_time=sign_time,
    )
    prepare = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "2003",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order_id),
            "amount": "80000.00",
            "action": "0",
            "sign_time": sign_time,
            "sign_string": prepare_sign,
        },
    )
    merchant_prepare_id = prepare.json()["merchant_prepare_id"]
    complete_sign = click_complete_signature(
        click_trans_id="2003",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        merchant_prepare_id=merchant_prepare_id,
        amount="80000.00",
        action="1",
        sign_time=sign_time,
    )
    data = {
        "click_trans_id": "2003",
        "service_id": SERVICE_ID,
        "merchant_trans_id": str(order_id),
        "merchant_prepare_id": merchant_prepare_id,
        "amount": "80000.00",
        "action": "1",
        "sign_time": sign_time,
        "sign_string": complete_sign,
        "error": "0",
    }
    first = await client.post("/v1/payments/click/complete", data=data)
    second = await client.post("/v1/payments/click/complete", data=data)
    assert first.json()["error"] == 0
    assert second.json()["error"] == 0


async def test_complete_with_negative_error_cancels_payment(client: httpx.AsyncClient) -> None:
    order_id, _ = await _create_order(client)
    sign_time = "2026-07-10 12:00:00"
    prepare_sign = click_prepare_signature(
        click_trans_id="2004",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        amount="80000.00",
        action="0",
        sign_time=sign_time,
    )
    prepare = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "2004",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order_id),
            "amount": "80000.00",
            "action": "0",
            "sign_time": sign_time,
            "sign_string": prepare_sign,
        },
    )
    merchant_prepare_id = prepare.json()["merchant_prepare_id"]
    complete_sign = click_complete_signature(
        click_trans_id="2004",
        service_id=SERVICE_ID,
        secret_key=SECRET_KEY,
        merchant_trans_id=str(order_id),
        merchant_prepare_id=merchant_prepare_id,
        amount="80000.00",
        action="1",
        sign_time=sign_time,
    )
    complete = await client.post(
        "/v1/payments/click/complete",
        data={
            "click_trans_id": "2004",
            "service_id": SERVICE_ID,
            "merchant_trans_id": str(order_id),
            "merchant_prepare_id": merchant_prepare_id,
            "amount": "80000.00",
            "action": "1",
            "sign_time": sign_time,
            "sign_string": complete_sign,
            "error": "-1",
        },
    )
    assert complete.json()["error"] == -9
