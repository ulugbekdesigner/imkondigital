"""Xayriya to'lovi — Payme/Click webhook orqali (mavjud order oqimi bilan bir xil endpoint,
account.donation_id / 'd' prefiksi orqali farqlanadi). progress-bar va avtomatik
'Moliyalashtirildi' o'tishini tekshiradi.
"""

import base64

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.payment_sign import click_complete_signature, click_prepare_signature
from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify

settings = get_settings()


def _basic_auth_header() -> dict[str, str]:
    token = base64.b64encode(f"Paycom:{settings.payme_merchant_key}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


async def _active_project(
    client: httpx.AsyncClient, db: AsyncSession, phone: str, target_amount: int
) -> tuple[int, dict[str, str]]:
    tokens = await register_and_verify(client, phone=phone, full_name="Donor Fund")
    await grant_role(db, phone, RoleCode.DONOR)
    donor_hdr = auth_header(tokens["access_token"])
    create = await client.post(
        "/v1/donation-projects",
        headers=donor_hdr,
        json={
            "title": "Xorazmlik 20 ayolga SMM kursi",
            "story": "Tavsif matni yetarli uzunlikda",
            "target_amount": target_amount,
        },
    )
    project_id = create.json()["id"]
    await client.patch(
        f"/v1/donation-projects/{project_id}/status", headers=donor_hdr, json={"status": "active"}
    )
    return project_id, donor_hdr


async def _create_donation(client: httpx.AsyncClient, project_id: int, amount: int) -> int:
    donate = await client.post(
        f"/v1/donation-projects/{project_id}/donate",
        json={"amount": amount, "donor_name": "Anvar", "is_anonymous": False, "provider": "payme"},
    )
    assert donate.status_code == 201, donate.text
    return donate.json()["donation_id"]


async def test_payme_full_flow_marks_donation_paid_and_updates_progress(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    project_id, donor_hdr = await _active_project(
        client, db, "+998980000001", target_amount=100_000
    )
    donation_id = await _create_donation(client, project_id, amount=20_000)

    create_tx = await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={
            "id": 5001,
            "method": "CreateTransaction",
            "params": {"id": "ptx-1", "amount": 2_000_000, "account": {"donation_id": donation_id}},
        },
    )
    assert create_tx.json()["result"]["state"] == 1

    perform = await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={"id": 5002, "method": "PerformTransaction", "params": {"id": "ptx-1"}},
    )
    assert perform.json()["result"]["state"] == 2

    project = (await client.get(f"/v1/donation-projects/{project_id}")).json()
    assert project["collected_amount"] == 20_000
    assert project["status"] == "active"  # target 100k, hali to'lmagan

    donations = (
        await client.get(f"/v1/donation-projects/{project_id}/donations", headers=donor_hdr)
    ).json()
    assert len(donations) == 1
    assert donations[0]["donor_name"] == "Anvar"


async def test_payme_reaching_target_marks_project_funded(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    project_id, _ = await _active_project(client, db, "+998980000010", target_amount=20_000)
    donation_id = await _create_donation(client, project_id, amount=20_000)

    await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={
            "id": 1,
            "method": "CreateTransaction",
            "params": {"id": "ptx-2", "amount": 2_000_000, "account": {"donation_id": donation_id}},
        },
    )
    await client.post(
        "/v1/payments/payme",
        headers=_basic_auth_header(),
        json={"id": 2, "method": "PerformTransaction", "params": {"id": "ptx-2"}},
    )

    project = (await client.get(f"/v1/donation-projects/{project_id}")).json()
    assert project["collected_amount"] == 20_000
    assert project["status"] == "funded"


async def test_click_prepare_and_complete_donation(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    project_id, _ = await _active_project(client, db, "+998980000020", target_amount=100_000)
    donation_id = await _create_donation(client, project_id, amount=15_000)
    merchant_trans_id = f"d{donation_id}"

    sign_time = "2026-07-10 12:00:00"
    prepare_sign = click_prepare_signature(
        click_trans_id="9001",
        service_id=settings.click_service_id,
        secret_key=settings.click_secret_key,
        merchant_trans_id=merchant_trans_id,
        amount="15000.00",
        action="0",
        sign_time=sign_time,
    )
    prepare = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "9001",
            "service_id": settings.click_service_id,
            "merchant_trans_id": merchant_trans_id,
            "amount": "15000.00",
            "action": "0",
            "sign_time": sign_time,
            "sign_string": prepare_sign,
        },
    )
    prepare_body = prepare.json()
    assert prepare_body["error"] == 0, prepare_body
    merchant_prepare_id = prepare_body["merchant_prepare_id"]
    assert merchant_prepare_id == str(donation_id)

    complete_sign = click_complete_signature(
        click_trans_id="9001",
        service_id=settings.click_service_id,
        secret_key=settings.click_secret_key,
        merchant_trans_id=merchant_trans_id,
        merchant_prepare_id=merchant_prepare_id,
        amount="15000.00",
        action="1",
        sign_time=sign_time,
    )
    complete = await client.post(
        "/v1/payments/click/complete",
        data={
            "click_trans_id": "9001",
            "service_id": settings.click_service_id,
            "merchant_trans_id": merchant_trans_id,
            "merchant_prepare_id": merchant_prepare_id,
            "amount": "15000.00",
            "action": "1",
            "sign_time": sign_time,
            "sign_string": complete_sign,
            "error": "0",
        },
    )
    complete_body = complete.json()
    assert complete_body["error"] == 0, complete_body

    project = (await client.get(f"/v1/donation-projects/{project_id}")).json()
    assert project["collected_amount"] == 15_000


async def test_click_donation_transaction_does_not_collide_with_order_ids(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    """'d5' (xayriya) va '5' (buyurtma) raqami bir xil bo'lsa ham chalkashmasligi kerak."""
    project_id, _ = await _active_project(client, db, "+998980000030", target_amount=100_000)
    donation_id = await _create_donation(client, project_id, amount=7_000)
    merchant_trans_id = f"d{donation_id}"

    sign_time = "2026-07-10 12:00:00"
    prepare_sign = click_prepare_signature(
        click_trans_id="9100",
        service_id=settings.click_service_id,
        secret_key=settings.click_secret_key,
        merchant_trans_id=merchant_trans_id,
        amount="7000.00",
        action="0",
        sign_time=sign_time,
    )
    prepare = await client.post(
        "/v1/payments/click/prepare",
        data={
            "click_trans_id": "9100",
            "service_id": settings.click_service_id,
            "merchant_trans_id": merchant_trans_id,
            "amount": "7000.00",
            "action": "0",
            "sign_time": sign_time,
            "sign_string": prepare_sign,
        },
    )
    assert prepare.json()["error"] == 0
    assert prepare.json()["merchant_prepare_id"] == str(donation_id)
