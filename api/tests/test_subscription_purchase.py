"""PLUS/PRO o'z-o'zidan sotib olish — checkout + Payme/Click webhook orqali faollashtirish.

Naqsh test_donation_payments.py bilan bir xil (account.subscription_purchase_id /
's' prefiksi orqali farqlanadi), lekin bu yerda checkout autentifikatsiya talab
qiladi (donation'dan farqli — mehmon emas, ro'yxatdan o'tgan foydalanuvchi).
"""

import base64
from datetime import UTC, datetime, timedelta

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.payment_sign import click_complete_signature, click_prepare_signature
from app.models.subscription import Subscription
from tests.helpers import auth_header, register_and_verify

settings = get_settings()


def _basic_auth_header() -> dict[str, str]:
    token = base64.b64encode(f"Paycom:{settings.payme_merchant_key}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


async def _make_user(client: httpx.AsyncClient, phone: str) -> tuple[int, dict[str, str]]:
    tokens = await register_and_verify(client, phone=phone)
    hdr = auth_header(tokens["access_token"])
    me = await client.get("/v1/users/me", headers=hdr)
    return int(me.json()["id"]), hdr


async def test_checkout_requires_auth(client: httpx.AsyncClient) -> None:
    resp = await client.post("/v1/subscriptions/checkout", json={"plan": "plus", "provider": "payme"})
    assert resp.status_code == 401


async def test_checkout_rejects_free_plan(client: httpx.AsyncClient) -> None:
    _, hdr = await _make_user(client, "+998911100001")
    resp = await client.post(
        "/v1/subscriptions/checkout", headers=hdr, json={"plan": "free", "provider": "payme"}
    )
    assert resp.status_code == 400


async def test_checkout_returns_payme_and_click_urls(client: httpx.AsyncClient) -> None:
    _, hdr = await _make_user(client, "+998911100002")

    payme = await client.post(
        "/v1/subscriptions/checkout", headers=hdr, json={"plan": "plus", "provider": "payme"}
    )
    assert payme.status_code == 200, payme.text
    assert "checkout.paycom.uz" in payme.json()["checkout_url"]

    click = await client.post(
        "/v1/subscriptions/checkout", headers=hdr, json={"plan": "pro", "provider": "click"}
    )
    assert click.status_code == 200, click.text
    assert "my.click.uz" in click.json()["checkout_url"]


async def test_payme_full_flow_activates_subscription(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_id, hdr = await _make_user(client, "+998911100003")
    checkout = await client.post(
        "/v1/subscriptions/checkout", headers=hdr, json={"plan": "plus", "provider": "payme"}
    )
    purchase_id = checkout.json()["purchase_id"]
    amount_tiyin = settings.subscription_plus_price_som * 100

    create_tx = await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={
            "id": 1,
            "method": "CreateTransaction",
            "params": {
                "id": "sub-tx-1",
                "amount": amount_tiyin,
                "account": {"subscription_purchase_id": purchase_id},
            },
        },
    )
    assert create_tx.json()["result"]["state"] == 1

    perform = await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={"id": 2, "method": "PerformTransaction", "params": {"id": "sub-tx-1"}},
    )
    assert perform.json()["result"]["state"] == 2

    mine = await client.get("/v1/me/subscription", headers=hdr)
    body = mine.json()
    assert body["plan"] == "plus"
    assert body["granted_by"] == "purchase"
    assert body["expires_at"] is not None

    sub = await db.get(Subscription, user_id)
    assert sub is not None
    assert sub.expires_at is not None
    days_left = (sub.expires_at - datetime.now(UTC)).days
    assert 28 <= days_left <= 30


async def test_payme_webhook_idempotent_on_repeat_perform(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_id, hdr = await _make_user(client, "+998911100004")
    checkout = await client.post(
        "/v1/subscriptions/checkout", headers=hdr, json={"plan": "plus", "provider": "payme"}
    )
    purchase_id = checkout.json()["purchase_id"]
    amount_tiyin = settings.subscription_plus_price_som * 100

    await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={
            "id": 1,
            "method": "CreateTransaction",
            "params": {
                "id": "sub-tx-2",
                "amount": amount_tiyin,
                "account": {"subscription_purchase_id": purchase_id},
            },
        },
    )
    await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={"id": 2, "method": "PerformTransaction", "params": {"id": "sub-tx-2"}},
    )
    sub_after_first = await db.get(Subscription, user_id)
    expires_after_first = sub_after_first.expires_at

    # Takroriy PerformTransaction — muddat IKKINCHI marta uzaytirilmasligi kerak
    perform_again = await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={"id": 3, "method": "PerformTransaction", "params": {"id": "sub-tx-2"}},
    )
    assert perform_again.json()["result"]["state"] == 2

    await db.refresh(sub_after_first)
    assert sub_after_first.expires_at == expires_after_first


async def test_renewal_extends_expiry_without_losing_remaining_days(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_id, hdr = await _make_user(client, "+998911100005")
    amount_tiyin = settings.subscription_plus_price_som * 100

    async def _pay(tx_id: str) -> None:
        checkout = await client.post(
            "/v1/subscriptions/checkout", headers=hdr, json={"plan": "plus", "provider": "payme"}
        )
        purchase_id = checkout.json()["purchase_id"]
        await client.post(
            "/v1/payments/payme",
            headers=_basic_auth_header(),
            json={
                "id": 1,
                "method": "CreateTransaction",
                "params": {
                    "id": tx_id,
                    "amount": amount_tiyin,
                    "account": {"subscription_purchase_id": purchase_id},
                },
            },
        )
        await client.post(
            "/v1/payments/payme",
            headers=_basic_auth_header(),
            json={"id": 2, "method": "PerformTransaction", "params": {"id": tx_id}},
        )

    await _pay("sub-tx-renew-1")
    sub = await db.get(Subscription, user_id)
    first_expiry = sub.expires_at

    await _pay("sub-tx-renew-2")
    await db.refresh(sub)
    # Erta yangilash muddatni birinchisidan +30 kun qiladi (hozirgi vaqtdan emas)
    assert sub.expires_at == first_expiry + timedelta(days=30)


async def test_purchasing_plus_does_not_downgrade_existing_pro(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_id, hdr = await _make_user(client, "+998911100006")
    amount_tiyin = settings.subscription_pro_price_som * 100

    checkout = await client.post(
        "/v1/subscriptions/checkout", headers=hdr, json={"plan": "pro", "provider": "payme"}
    )
    purchase_id = checkout.json()["purchase_id"]
    await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={
            "id": 1,
            "method": "CreateTransaction",
            "params": {
                "id": "sub-tx-pro",
                "amount": amount_tiyin,
                "account": {"subscription_purchase_id": purchase_id},
            },
        },
    )
    await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={"id": 2, "method": "PerformTransaction", "params": {"id": "sub-tx-pro"}},
    )

    amount_plus_tiyin = settings.subscription_plus_price_som * 100
    checkout2 = await client.post(
        "/v1/subscriptions/checkout", headers=hdr, json={"plan": "plus", "provider": "payme"}
    )
    purchase_id2 = checkout2.json()["purchase_id"]
    await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={
            "id": 3,
            "method": "CreateTransaction",
            "params": {
                "id": "sub-tx-plus-after-pro",
                "amount": amount_plus_tiyin,
                "account": {"subscription_purchase_id": purchase_id2},
            },
        },
    )
    await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={"id": 4, "method": "PerformTransaction", "params": {"id": "sub-tx-plus-after-pro"}},
    )

    sub = await db.get(Subscription, user_id)
    assert sub.plan == "pro"  # PLUS sotib olish PROni pasaytirmadi
    assert sub.granted_by == "purchase"


async def test_click_prepare_and_complete_activates_subscription(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    user_id, hdr = await _make_user(client, "+998911100007")
    checkout = await client.post(
        "/v1/subscriptions/checkout", headers=hdr, json={"plan": "plus", "provider": "click"}
    )
    purchase_id = checkout.json()["purchase_id"]
    merchant_trans_id = f"s{purchase_id}"
    amount_str = f"{settings.subscription_plus_price_som}.00"

    sign_time = "2026-08-07 12:00:00"
    prepare_sign = click_prepare_signature(
        click_trans_id="7001",
        service_id=settings.click_service_id,
        secret_key=settings.click_secret_key,
        merchant_trans_id=merchant_trans_id,
        amount=amount_str,
        action="0",
        sign_time=sign_time,
    )
    prepare = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "7001",
            "service_id": settings.click_service_id,
            "merchant_trans_id": merchant_trans_id,
            "amount": amount_str,
            "action": "0",
            "sign_time": sign_time,
            "sign_string": prepare_sign,
        },
    )
    prepare_body = prepare.json()
    assert prepare_body["error"] == 0, prepare_body
    merchant_prepare_id = prepare_body["merchant_prepare_id"]
    assert merchant_prepare_id == str(purchase_id)

    complete_sign = click_complete_signature(
        click_trans_id="7001",
        service_id=settings.click_service_id,
        secret_key=settings.click_secret_key,
        merchant_trans_id=merchant_trans_id,
        merchant_prepare_id=merchant_prepare_id,
        amount=amount_str,
        action="1",
        sign_time=sign_time,
    )
    complete = await client.post(
        "/v1/payments/click/complete",
        data={
            "click_trans_id": "7001",
            "service_id": settings.click_service_id,
            "merchant_trans_id": merchant_trans_id,
            "merchant_prepare_id": merchant_prepare_id,
            "amount": amount_str,
            "action": "1",
            "sign_time": sign_time,
            "sign_string": complete_sign,
            "error": "0",
        },
    )
    complete_body = complete.json()
    assert complete_body["error"] == 0, complete_body

    sub = await db.get(Subscription, user_id)
    assert sub is not None
    assert sub.plan == "plus"
    assert sub.granted_by == "purchase"


async def test_click_subscription_transaction_does_not_collide_with_donation_or_order(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    """'s5' (obuna) va 'd5' (xayriya) va '5' (buyurtma) chalkashmasligi kerak."""
    _, hdr = await _make_user(client, "+998911100008")
    checkout = await client.post(
        "/v1/subscriptions/checkout", headers=hdr, json={"plan": "pro", "provider": "click"}
    )
    purchase_id = checkout.json()["purchase_id"]
    merchant_trans_id = f"s{purchase_id}"
    amount_str = f"{settings.subscription_pro_price_som}.00"

    sign_time = "2026-08-07 12:00:00"
    prepare_sign = click_prepare_signature(
        click_trans_id="7100",
        service_id=settings.click_service_id,
        secret_key=settings.click_secret_key,
        merchant_trans_id=merchant_trans_id,
        amount=amount_str,
        action="0",
        sign_time=sign_time,
    )
    prepare = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "7100",
            "service_id": settings.click_service_id,
            "merchant_trans_id": merchant_trans_id,
            "amount": amount_str,
            "action": "0",
            "sign_time": sign_time,
            "sign_string": prepare_sign,
        },
    )
    assert prepare.json()["error"] == 0
    assert prepare.json()["merchant_prepare_id"] == str(purchase_id)
