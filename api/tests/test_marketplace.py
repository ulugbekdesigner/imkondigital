"""Freelancer Marketplace — gig katalog, buyurtma oqimi, chat, sharh, nizo, RBAC."""

import base64

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify

settings = get_settings()


async def _make_client_and_freelancer(
    client: httpx.AsyncClient,
) -> tuple[dict[str, str], dict[str, str], int, int]:
    """(client_headers, freelancer_headers, client_id, freelancer_id) qaytaradi."""
    client_tokens = await register_and_verify(client, phone="+998901112233")
    freelancer_tokens = await register_and_verify(
        client, phone="+998907778899", full_name="Sardor Freelancer"
    )
    chdr = auth_header(client_tokens["access_token"])
    fhdr = auth_header(freelancer_tokens["access_token"])
    client_me = (await client.get("/v1/users/me", headers=chdr)).json()
    freelancer_me = (await client.get("/v1/users/me", headers=fhdr)).json()
    return chdr, fhdr, client_me["id"], freelancer_me["id"]


async def _create_and_publish_gig(client: httpx.AsyncClient, fhdr: dict[str, str]) -> int:
    resp = await client.post(
        "/v1/gigs",
        headers=fhdr,
        json={
            "title": "Logotip yarataman",
            "description": "Zamonaviy, minimal logotiplar",
            "category": "dizayn",
            "price_from": 100000,
            "delivery_days": 3,
        },
    )
    assert resp.status_code == 201, resp.text
    gig_id = resp.json()["id"]
    pub = await client.post(f"/v1/gigs/{gig_id}/publish", headers=fhdr)
    assert pub.status_code == 200, pub.text
    return gig_id


async def _create_order(
    client: httpx.AsyncClient, chdr: dict[str, str], freelancer_id: int, amount: int = 150000
) -> int:
    resp = await client.post(
        "/v1/orders",
        headers=chdr,
        json={
            "freelancer_id": freelancer_id,
            "title": "Logotip dizayni",
            "description": "3 variant kerak",
            "amount": amount,
        },
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


async def _fund_order(client: httpx.AsyncClient, order_id: int, amount: int, txn_id: str) -> None:
    """Payme oqimi orqali buyurtmani FUNDED holatiga o'tkazadi."""
    token = base64.b64encode(f"Paycom:{settings.payme_merchant_key}".encode()).decode()
    hdr = {"Authorization": f"Basic {token}"}
    await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={
            "id": 1,
            "method": "CreateTransaction",
            "params": {
                "id": txn_id,
                "time": 1_700_000_000_000,
                "amount": amount * 100,
                "account": {"order_id": order_id},
            },
        },
    )
    perform = await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={"id": 2, "method": "PerformTransaction", "params": {"id": txn_id}},
    )
    assert perform.json()["result"]["state"] == 2


# ---------- Gig katalog ----------
async def test_gig_publish_and_catalog_visibility(client: httpx.AsyncClient) -> None:
    _, fhdr, _, _ = await _make_client_and_freelancer(client)
    draft = await client.post(
        "/v1/gigs",
        headers=fhdr,
        json={
            "title": "Bannerlar",
            "description": "Ijtimoiy tarmoq bannerlari",
            "category": "dizayn",
            "price_from": 50000,
            "delivery_days": 2,
        },
    )
    gig_id = draft.json()["id"]

    catalog_before = await client.get("/v1/gigs")
    assert all(item["id"] != gig_id for item in catalog_before.json()["items"])

    await client.post(f"/v1/gigs/{gig_id}/publish", headers=fhdr)
    catalog_after = await client.get("/v1/gigs")
    assert any(item["id"] == gig_id for item in catalog_after.json()["items"])


async def test_gig_publish_forbidden_for_non_owner(client: httpx.AsyncClient) -> None:
    chdr, fhdr, _, _ = await _make_client_and_freelancer(client)
    draft = await client.post(
        "/v1/gigs",
        headers=fhdr,
        json={
            "title": "Video montaj",
            "description": "Reels uchun",
            "category": "video",
            "price_from": 200000,
            "delivery_days": 5,
        },
    )
    gig_id = draft.json()["id"]
    resp = await client.post(f"/v1/gigs/{gig_id}/publish", headers=chdr)
    assert resp.status_code == 403


async def test_new_talent_flag_true_below_threshold(client: httpx.AsyncClient) -> None:
    _, fhdr, _, _freelancer_id = await _make_client_and_freelancer(client)
    gig_id = await _create_and_publish_gig(client, fhdr)
    detail = await client.get(f"/v1/gigs/{gig_id}")
    assert detail.json()["is_new_talent"] is True
    assert detail.json()["freelancer_username"]


async def test_gig_card_has_no_rating_before_any_review(client: httpx.AsyncClient) -> None:
    _, fhdr, _, _ = await _make_client_and_freelancer(client)
    gig_id = await _create_and_publish_gig(client, fhdr)
    detail = await client.get(f"/v1/gigs/{gig_id}")
    body = detail.json()
    assert body["average_rating"] is None
    assert body["review_count"] == 0
    assert body["freelancer_avatar_url"] is None


async def test_gig_card_average_rating_reflects_freelancer_reviews(
    client: httpx.AsyncClient,
) -> None:
    chdr, fhdr, _client_id, freelancer_id = await _make_client_and_freelancer(client)
    gig_id = await _create_and_publish_gig(client, fhdr)
    order_id = await _create_order(client, chdr, freelancer_id)
    await _fund_order(client, order_id, 150000, "rating-txn-1")
    await client.post(f"/v1/orders/{order_id}/start", headers=fhdr)
    await client.post(f"/v1/orders/{order_id}/deliver", headers=fhdr, json={"note": "Tayyor"})
    await client.post(f"/v1/orders/{order_id}/accept", headers=chdr)
    await client.post(
        f"/v1/orders/{order_id}/review", headers=chdr, json={"rating": 4, "text": "Yaxshi"}
    )

    detail = await client.get(f"/v1/gigs/{gig_id}")
    body = detail.json()
    assert body["average_rating"] == 4.0
    assert body["review_count"] == 1


# ---------- Order lifecycle ----------
async def test_full_order_lifecycle_to_review(client: httpx.AsyncClient) -> None:
    chdr, fhdr, _client_id, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)

    order = (await client.get(f"/v1/orders/{order_id}", headers=chdr)).json()
    assert order["status"] == "created"

    checkout = await client.get(
        f"/v1/orders/{order_id}/checkout", params={"provider": "payme"}, headers=chdr
    )
    assert checkout.status_code == 200
    assert checkout.json()["checkout_url"].startswith("https://checkout.paycom.uz")

    await _fund_order(client, order_id, 150000, "lifecycle-txn-1")
    order = (await client.get(f"/v1/orders/{order_id}", headers=chdr)).json()
    assert order["status"] == "funded"

    start = await client.post(f"/v1/orders/{order_id}/start", headers=fhdr)
    assert start.json()["status"] == "in_progress"

    deliver = await client.post(
        f"/v1/orders/{order_id}/deliver",
        headers=fhdr,
        json={"note": "Tayyor bo'ldi", "file_url": "https://files.example.com/logo.zip"},
    )
    assert deliver.json()["status"] == "delivered"

    accept = await client.post(f"/v1/orders/{order_id}/accept", headers=chdr)
    assert accept.json()["status"] == "paid"

    review = await client.post(
        f"/v1/orders/{order_id}/review",
        headers=chdr,
        json={"rating": 5, "text": "Ajoyib ish!"},
    )
    assert review.status_code == 201
    assert review.json()["to_user_id"] == freelancer_id

    duplicate_review = await client.post(
        f"/v1/orders/{order_id}/review",
        headers=chdr,
        json={"rating": 4, "text": "Yana"},
    )
    assert duplicate_review.status_code == 409


async def test_review_before_paid_rejected(client: httpx.AsyncClient) -> None:
    chdr, _fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)
    resp = await client.post(
        f"/v1/orders/{order_id}/review", headers=chdr, json={"rating": 5, "text": "Erta"}
    )
    assert resp.status_code == 409


async def test_start_forbidden_for_non_freelancer(client: httpx.AsyncClient) -> None:
    chdr, _fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)
    await _fund_order(client, order_id, 150000, "start-forbidden-txn")
    resp = await client.post(f"/v1/orders/{order_id}/start", headers=chdr)
    assert resp.status_code == 403


async def test_invalid_transition_rejected_with_409(client: httpx.AsyncClient) -> None:
    chdr, fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)
    # hali FUNDED emas — to'g'ridan-to'g'ri start qilib bo'lmaydi
    resp = await client.post(f"/v1/orders/{order_id}/start", headers=fhdr)
    assert resp.status_code == 409


async def test_client_can_cancel_before_funding(client: httpx.AsyncClient) -> None:
    chdr, _, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)
    resp = await client.post(f"/v1/orders/{order_id}/cancel", headers=chdr)
    assert resp.json()["status"] == "cancelled"


# ---------- Chat ----------
async def test_chat_messages_visible_to_both_parties(client: httpx.AsyncClient) -> None:
    chdr, fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)

    sent = await client.post(
        f"/v1/orders/{order_id}/messages", headers=chdr, json={"body": "Salom, qachon tayyor?"}
    )
    assert sent.status_code == 201

    from_freelancer = await client.get(f"/v1/orders/{order_id}/messages", headers=fhdr)
    assert len(from_freelancer.json()) == 1
    assert from_freelancer.json()[0]["body"] == "Salom, qachon tayyor?"


async def test_chat_forbidden_for_non_party(client: httpx.AsyncClient) -> None:
    chdr, _fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)

    stranger_tokens = await register_and_verify(client, phone="+998909998877")
    shdr = auth_header(stranger_tokens["access_token"])
    resp = await client.get(f"/v1/orders/{order_id}/messages", headers=shdr)
    assert resp.status_code == 403


async def test_chat_message_with_file_upload(client: httpx.AsyncClient) -> None:
    chdr, fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)

    sent = await client.post(
        f"/v1/orders/{order_id}/messages/upload",
        headers=chdr,
        data={"body": "Mana birinchi variant"},
        files={"file": ("logo-v1.png", b"fake png bytes", "image/png")},
    )
    assert sent.status_code == 201, sent.text
    body = sent.json()
    assert body["body"] == "Mana birinchi variant"
    assert body["file_url"] is not None
    # Xavfsizlik uchun saqlash kaliti xom fayl nomidan emas, tasodifiy
    # tokendan yasaladi (app/core/storage.py:validate_upload).
    assert body["file_url"].endswith(".png")

    from_freelancer = await client.get(f"/v1/orders/{order_id}/messages", headers=fhdr)
    assert from_freelancer.json()[0]["file_url"] == body["file_url"]


async def test_chat_upload_forbidden_for_non_party(client: httpx.AsyncClient) -> None:
    chdr, _fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)

    stranger_tokens = await register_and_verify(client, phone="+998909998866")
    shdr = auth_header(stranger_tokens["access_token"])
    resp = await client.post(
        f"/v1/orders/{order_id}/messages/upload",
        headers=shdr,
        data={"body": ""},
        files={"file": ("x.png", b"data", "image/png")},
    )
    assert resp.status_code == 403


# ---------- RBAC on orders ----------
async def test_order_detail_forbidden_for_non_party(client: httpx.AsyncClient) -> None:
    chdr, _fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)

    stranger_tokens = await register_and_verify(client, phone="+998909998877")
    shdr = auth_header(stranger_tokens["access_token"])
    resp = await client.get(f"/v1/orders/{order_id}", headers=shdr)
    assert resp.status_code == 403


async def test_list_my_orders_filters_by_role(client: httpx.AsyncClient) -> None:
    chdr, fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    await _create_order(client, chdr, freelancer_id)

    as_client = await client.get("/v1/me/orders", params={"role": "client"}, headers=chdr)
    assert len(as_client.json()) == 1
    as_freelancer_wrong = await client.get("/v1/me/orders", params={"role": "client"}, headers=fhdr)
    assert len(as_freelancer_wrong.json()) == 0


# ---------- Nizo (dispute) ----------
async def test_dispute_open_and_moderator_resolve_to_freelancer(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    chdr, _fhdr, _client_id, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)
    await _fund_order(client, order_id, 150000, "dispute-txn-1")

    opened = await client.post(
        f"/v1/orders/{order_id}/dispute",
        headers=chdr,
        json={"reason": "Ish sifatsiz bajarildi, talabga javob bermaydi"},
    )
    assert opened.status_code == 201
    assert opened.json()["status"] == "open"

    order = (await client.get(f"/v1/orders/{order_id}", headers=chdr)).json()
    assert order["status"] == "disputed"

    # moderator bo'lmagan foydalanuvchi hal qila olmaydi
    forbidden = await client.post(
        f"/v1/orders/{order_id}/dispute/resolve",
        headers=chdr,
        json={"winner": "freelancer", "resolution": "Hal qilindi"},
    )
    assert forbidden.status_code == 403

    await grant_role(db, "+998901112233", RoleCode.MODERATOR)
    # moderator sifatida qayta login (rol o'zgarishi tokenga yangi so'rovda ta'sir qiladi)
    mod_tokens = await client.post(
        "/v1/auth/login", json={"phone": "+998901112233", "password": "parol12345"}
    )
    mod_hdr = auth_header(mod_tokens.json()["access_token"])

    resolved = await client.post(
        f"/v1/orders/{order_id}/dispute/resolve",
        headers=mod_hdr,
        json={"winner": "freelancer", "resolution": "Ish sifatli bajarilgan, dalillar tekshirildi"},
    )
    assert resolved.status_code == 200
    assert resolved.json()["status"] == "resolved_freelancer"

    order = (await client.get(f"/v1/orders/{order_id}", headers=chdr)).json()
    assert order["status"] == "paid"


async def test_dispute_resolve_to_client_refunds(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    chdr, _fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)
    await _fund_order(client, order_id, 150000, "dispute-txn-2")

    await client.post(
        f"/v1/orders/{order_id}/dispute",
        headers=chdr,
        json={"reason": "Freelancer ishni umuman topshirmadi"},
    )

    await grant_role(db, "+998901112233", RoleCode.MODERATOR)
    mod_tokens = await client.post(
        "/v1/auth/login", json={"phone": "+998901112233", "password": "parol12345"}
    )
    mod_hdr = auth_header(mod_tokens.json()["access_token"])

    resolved = await client.post(
        f"/v1/orders/{order_id}/dispute/resolve",
        headers=mod_hdr,
        json={"winner": "client", "resolution": "Freelancer ishni topshirmagani tasdiqlandi"},
    )
    assert resolved.json()["status"] == "resolved_client"

    order = (await client.get(f"/v1/orders/{order_id}", headers=chdr)).json()
    assert order["status"] == "refunded"


async def test_dispute_cannot_open_twice(client: httpx.AsyncClient) -> None:
    chdr, fhdr, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)
    await _fund_order(client, order_id, 150000, "dispute-txn-3")

    first = await client.post(
        f"/v1/orders/{order_id}/dispute",
        headers=chdr,
        json={"reason": "Birinchi shikoyat matni"},
    )
    assert first.status_code == 201

    second = await client.post(
        f"/v1/orders/{order_id}/dispute",
        headers=fhdr,
        json={"reason": "Ikkinchi shikoyat matni"},
    )
    assert second.status_code == 409


async def test_dispute_cannot_open_before_funding(client: httpx.AsyncClient) -> None:
    chdr, _, _, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_order(client, chdr, freelancer_id)
    resp = await client.post(
        f"/v1/orders/{order_id}/dispute",
        headers=chdr,
        json={"reason": "Hali to'lanmagan buyurtma"},
    )
    assert resp.status_code == 409


async def test_milestone_sum_mismatch_rejected(client: httpx.AsyncClient) -> None:
    chdr, _, _, freelancer_id = await _make_client_and_freelancer(client)
    resp = await client.post(
        "/v1/orders",
        headers=chdr,
        json={
            "freelancer_id": freelancer_id,
            "title": "Sayt yaratish",
            "description": "3 bosqichda",
            "amount": 300000,
            "milestones": [
                {"title": "Dizayn", "amount": 100000},
                {"title": "Frontend", "amount": 100000},
            ],
        },
    )
    assert resp.status_code == 400


async def test_milestones_persisted_and_returned_in_order_detail(
    client: httpx.AsyncClient,
) -> None:
    chdr, _, _, freelancer_id = await _make_client_and_freelancer(client)
    resp = await client.post(
        "/v1/orders",
        headers=chdr,
        json={
            "freelancer_id": freelancer_id,
            "title": "Sayt yaratish",
            "description": "3 bosqichda",
            "amount": 300000,
            "milestones": [
                {"title": "Dizayn", "amount": 100000},
                {"title": "Frontend", "amount": 100000},
                {"title": "Backend", "amount": 100000},
            ],
        },
    )
    order_id = resp.json()["id"]
    detail = (await client.get(f"/v1/orders/{order_id}", headers=chdr)).json()
    assert len(detail["milestones"]) == 3
    assert sum(m["amount"] for m in detail["milestones"]) == 300000
