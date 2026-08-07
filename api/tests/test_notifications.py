"""Notification Center — mavjud oqimlardan hook, ro'yxat/o'qish, Telegram yetkazish."""

import base64
from unittest.mock import patch

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify

settings = get_settings()


async def _make_employer(client: httpx.AsyncClient, db: AsyncSession, phone: str) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone)
    await grant_role(db, phone, RoleCode.EMPLOYER)
    return auth_header(tokens["access_token"])


async def _create_published_vacancy(client: httpx.AsyncClient, hdr: dict[str, str]) -> int:
    company = await client.post("/v1/companies", headers=hdr, json={"name": "Alfa Telekom"})
    company_id = company.json()["id"]
    vacancy = await client.post(
        f"/v1/companies/{company_id}/vacancies",
        headers=hdr,
        json={"title": "Call-markaz operatori", "ladder_step": 1, "work_format": "remote"},
    )
    vacancy_id = vacancy.json()["id"]
    await client.post(f"/v1/vacancies/{vacancy_id}/publish", headers=hdr)
    return vacancy_id


async def _make_instructor(
    client: httpx.AsyncClient, db: AsyncSession, phone: str
) -> dict[str, str]:
    tokens = await register_and_verify(client, phone=phone)
    await grant_role(db, phone, RoleCode.INSTRUCTOR)
    return auth_header(tokens["access_token"])


async def _publish_course_with_lesson(
    client: httpx.AsyncClient, hdr: dict[str, str]
) -> tuple[int, int]:
    course = await client.post(
        "/v1/courses", headers=hdr, json={"title": "Tikuvchilik asoslari", "ladder_step": 1}
    )
    course_id = course.json()["id"]
    module = await client.post(
        f"/v1/courses/{course_id}/modules", headers=hdr, json={"title": "1-modul"}
    )
    module_id = module.json()["id"]
    lesson = await client.post(
        f"/v1/modules/{module_id}/lessons", headers=hdr, json={"title": "Dars 1", "sort": 0}
    )
    lesson_id = lesson.json()["id"]
    await client.post(f"/v1/courses/{course_id}/publish", headers=hdr)
    return course_id, lesson_id


async def _make_client_and_freelancer(
    client: httpx.AsyncClient,
) -> tuple[dict[str, str], dict[str, str], int]:
    client_tokens = await register_and_verify(client, phone="+998913331100")
    freelancer_tokens = await register_and_verify(client, phone="+998913332200")
    fhdr = auth_header(freelancer_tokens["access_token"])
    freelancer_me = (await client.get("/v1/users/me", headers=fhdr)).json()
    chdr = auth_header(client_tokens["access_token"])
    return chdr, fhdr, freelancer_me["id"]


async def _create_and_fund_order(
    client: httpx.AsyncClient, chdr: dict[str, str], freelancer_id: int, txn_id: str
) -> int:
    order_resp = await client.post(
        "/v1/orders",
        headers=chdr,
        json={
            "freelancer_id": freelancer_id,
            "title": "Notifikatsiya testi",
            "description": "t",
            "amount": 50000,
        },
    )
    order_id = order_resp.json()["id"]

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
                "amount": 5_000_000,
                "account": {"order_id": order_id},
            },
        },
    )
    await client.post(
        "/v1/payments/payme",
        headers=hdr,
        json={"id": 2, "method": "PerformTransaction", "params": {"id": txn_id}},
    )
    return order_id


async def test_application_status_change_creates_notification(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998913001100")
    vacancy_id = await _create_published_vacancy(client, hdr)

    learner = await register_and_verify(client, phone="+998913002200")
    lhdr = auth_header(learner["access_token"])
    apply_resp = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )
    application_id = apply_resp.json()["id"]

    await client.post(
        f"/v1/applications/{application_id}/status", headers=hdr, json={"status": "interview"}
    )

    notifications = await client.get("/v1/me/notifications", headers=lhdr)
    body = notifications.json()
    assert body["unread_count"] == 1
    assert body["items"][0]["type"] == "application_status"
    assert body["items"][0]["category"] == "opportunity"
    assert "Suhbatga" in body["items"][0]["title"]


async def test_certificate_issued_creates_notification(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_instructor(client, db, "+998913003300")
    course_id, lesson_id = await _publish_course_with_lesson(client, hdr)

    learner = await register_and_verify(client, phone="+998913004400")
    lhdr = auth_header(learner["access_token"])
    await client.post("/v1/enrollments", headers=lhdr, data={"course_id": course_id})
    await client.post(f"/v1/lessons/{lesson_id}/complete", headers=lhdr)

    notifications = (await client.get("/v1/me/notifications", headers=lhdr)).json()
    assert any(
        n["type"] == "certificate_issued" and n["category"] == "learning"
        for n in notifications["items"]
    )


async def test_order_lifecycle_notifies_counterpart_each_step(client: httpx.AsyncClient) -> None:
    chdr, fhdr, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_and_fund_order(client, chdr, freelancer_id, "notif-txn-1")

    # to'lov -> freelancerga bildirishnoma
    f_notifs = (await client.get("/v1/me/notifications", headers=fhdr)).json()
    assert any("to'lov" in n["title"].lower() for n in f_notifs["items"])

    await client.post(f"/v1/orders/{order_id}/start", headers=fhdr)
    c_notifs = (await client.get("/v1/me/notifications", headers=chdr)).json()
    assert any("boshladi" in n["title"] for n in c_notifs["items"])

    await client.post(
        f"/v1/orders/{order_id}/deliver", headers=fhdr, json={"note": "Tayyor", "file_url": None}
    )
    c_notifs = (await client.get("/v1/me/notifications", headers=chdr)).json()
    assert any("topshirildi" in n["title"].lower() for n in c_notifs["items"])

    await client.post(f"/v1/orders/{order_id}/accept", headers=chdr)
    f_notifs = (await client.get("/v1/me/notifications", headers=fhdr)).json()
    assert any("qabul qilindi" in n["title"].lower() for n in f_notifs["items"])


async def test_order_message_notifies_recipient(client: httpx.AsyncClient) -> None:
    chdr, fhdr, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_and_fund_order(client, chdr, freelancer_id, "notif-txn-2")

    await client.post(
        f"/v1/orders/{order_id}/messages", headers=chdr, json={"body": "Qachon tayyor bo'ladi?"}
    )
    f_notifs = (await client.get("/v1/me/notifications", headers=fhdr)).json()
    assert any(n["type"] == "order_message" for n in f_notifs["items"])


async def test_dispute_open_and_resolve_notify_both_parties(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    chdr, fhdr, freelancer_id = await _make_client_and_freelancer(client)
    order_id = await _create_and_fund_order(client, chdr, freelancer_id, "notif-txn-3")

    await client.post(
        f"/v1/orders/{order_id}/dispute", headers=chdr, json={"reason": "Ish sifatsiz bajarildi"}
    )
    f_notifs = (await client.get("/v1/me/notifications", headers=fhdr)).json()
    assert any("nizo" in n["title"].lower() for n in f_notifs["items"])

    await grant_role(db, "+998913331100", RoleCode.MODERATOR)
    mod_login = await client.post(
        "/v1/auth/login", json={"phone": "+998913331100", "password": "parol12345"}
    )
    mod_hdr = auth_header(mod_login.json()["access_token"])
    await client.post(
        f"/v1/orders/{order_id}/dispute/resolve",
        headers=mod_hdr,
        json={"winner": "freelancer", "resolution": "Dalillar tekshirildi, ish sifatli bajarilgan"},
    )

    f_notifs = (await client.get("/v1/me/notifications", headers=fhdr)).json()
    c_notifs = (await client.get("/v1/me/notifications", headers=chdr)).json()
    assert any("nizo hal qilindi" in n["title"].lower() for n in f_notifs["items"])
    assert any("nizo hal qilindi" in n["title"].lower() for n in c_notifs["items"])


async def test_mark_read_and_mark_all_read(client: httpx.AsyncClient, db: AsyncSession) -> None:
    hdr = await _make_employer(client, db, "+998913005500")
    vacancy_id = await _create_published_vacancy(client, hdr)
    learner = await register_and_verify(client, phone="+998913006600")
    lhdr = auth_header(learner["access_token"])
    apply_resp = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )
    application_id = apply_resp.json()["id"]
    await client.post(
        f"/v1/applications/{application_id}/status", headers=hdr, json={"status": "interview"}
    )
    await client.post(
        f"/v1/applications/{application_id}/status", headers=hdr, json={"status": "accepted"}
    )

    page = (await client.get("/v1/me/notifications", headers=lhdr)).json()
    assert page["unread_count"] == 2
    notif_id = page["items"][0]["id"]

    read = await client.post(f"/v1/me/notifications/{notif_id}/read", headers=lhdr)
    assert read.status_code == 200
    assert read.json()["read_at"] is not None

    page_after = (await client.get("/v1/me/notifications", headers=lhdr)).json()
    assert page_after["unread_count"] == 1

    read_all = await client.post("/v1/me/notifications/read-all", headers=lhdr)
    assert read_all.json()["marked_read"] == 1

    page_final = (await client.get("/v1/me/notifications", headers=lhdr)).json()
    assert page_final["unread_count"] == 0


async def test_cannot_mark_other_users_notification_as_read(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998913007700")
    vacancy_id = await _create_published_vacancy(client, hdr)
    learner = await register_and_verify(client, phone="+998913008800")
    lhdr = auth_header(learner["access_token"])
    apply_resp = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )
    application_id = apply_resp.json()["id"]
    await client.post(
        f"/v1/applications/{application_id}/status", headers=hdr, json={"status": "interview"}
    )
    notif_id = (await client.get("/v1/me/notifications", headers=lhdr)).json()["items"][0]["id"]

    stranger = await register_and_verify(client, phone="+998913009900")
    shdr = auth_header(stranger["access_token"])
    resp = await client.post(f"/v1/me/notifications/{notif_id}/read", headers=shdr)
    assert resp.status_code == 404


async def test_telegram_delivery_triggered_when_linked(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    hdr = await _make_employer(client, db, "+998913011100")
    vacancy_id = await _create_published_vacancy(client, hdr)
    learner = await register_and_verify(client, phone="+998913012200")
    lhdr = auth_header(learner["access_token"])

    link_code_resp = await client.post("/v1/me/telegram/link-code", headers=lhdr)
    code = link_code_resp.json()["code"]
    await client.post(
        "/v1/telegram/confirm-link",
        json={"code": code, "chat_id": 555111},
        headers={"X-Internal-Secret": settings.telegram_internal_secret},
    )

    apply_resp = await client.post(
        f"/v1/vacancies/{vacancy_id}/apply", headers=lhdr, json={"share_disability_profile": False}
    )
    application_id = apply_resp.json()["id"]

    with patch("app.modules.notifications.service.send_telegram_notification.delay") as mock_delay:
        await client.post(
            f"/v1/applications/{application_id}/status", headers=hdr, json={"status": "interview"}
        )
        mock_delay.assert_called_once()
        args, _ = mock_delay.call_args
        assert args[0] == 555111
