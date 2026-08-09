"""Xususiyat bayroqlari - admin CRUD, ochiq resolve, foizli rollout."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from tests.helpers import auth_header, grant_role, register_and_verify


async def test_non_admin_cannot_list_or_update_flags(client: httpx.AsyncClient) -> None:
    tokens = await register_and_verify(client)
    hdr = auth_header(tokens["access_token"])

    listed = await client.get("/v1/feature-flags/admin", headers=hdr)
    assert listed.status_code == 403

    updated = await client.post(
        "/v1/feature-flags/admin/voice_tts",
        headers=hdr,
        json={"enabled": True, "rollout_percent": 100},
    )
    assert updated.status_code == 403


async def test_admin_can_create_and_update_flag(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_tokens = await register_and_verify(client, phone="+998941110001")
    await grant_role(db, "+998941110001", RoleCode.ADMIN)
    admin_hdr = auth_header(admin_tokens["access_token"])

    created = await client.post(
        "/v1/feature-flags/admin/voice_tts",
        headers=admin_hdr,
        json={"enabled": True, "rollout_percent": 50, "description": "O'qib berish"},
    )
    assert created.status_code == 200, created.text
    body = created.json()
    assert body["name"] == "voice_tts"
    assert body["enabled"] is True
    assert body["rollout_percent"] == 50

    listed = await client.get("/v1/feature-flags/admin", headers=admin_hdr)
    assert listed.status_code == 200
    assert any(f["name"] == "voice_tts" for f in listed.json())

    updated = await client.post(
        "/v1/feature-flags/admin/voice_tts",
        headers=admin_hdr,
        json={"enabled": False, "rollout_percent": 0, "description": ""},
    )
    assert updated.status_code == 200
    assert updated.json()["enabled"] is False
    # Bir xil nom bo'yicha yangi qator yaratilmadi - upsert
    listed_after = (await client.get("/v1/feature-flags/admin", headers=admin_hdr)).json()
    assert len([f for f in listed_after if f["name"] == "voice_tts"]) == 1


async def test_public_endpoint_hides_disabled_flag(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_tokens = await register_and_verify(client, phone="+998941110002")
    await grant_role(db, "+998941110002", RoleCode.ADMIN)
    admin_hdr = auth_header(admin_tokens["access_token"])
    await client.post(
        "/v1/feature-flags/admin/ziyo_v2",
        headers=admin_hdr,
        json={"enabled": False, "rollout_percent": 100},
    )

    resolved = await client.get("/v1/feature-flags")
    assert resolved.status_code == 200
    assert resolved.json()["ziyo_v2"] is False


async def test_full_rollout_enabled_for_guest_and_user(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    admin_tokens = await register_and_verify(client, phone="+998941110003")
    await grant_role(db, "+998941110003", RoleCode.ADMIN)
    admin_hdr = auth_header(admin_tokens["access_token"])
    await client.post(
        "/v1/feature-flags/admin/voice_commands",
        headers=admin_hdr,
        json={"enabled": True, "rollout_percent": 100},
    )

    guest_resolved = await client.get("/v1/feature-flags")
    assert guest_resolved.json()["voice_commands"] is True

    user_tokens = await register_and_verify(client, phone="+998941110004")
    user_hdr = auth_header(user_tokens["access_token"])
    user_resolved = await client.get("/v1/feature-flags", headers=user_hdr)
    assert user_resolved.json()["voice_commands"] is True


async def test_partial_rollout_hides_flag_from_guest(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    """Mehmon uchun barqaror xesh yo'q - qisman (100% dan kam) rollout mehmonga
    hech qachon ko'rinmaydi (xavfsiz, izchil boshlang'ich holat)."""
    admin_tokens = await register_and_verify(client, phone="+998941110005")
    await grant_role(db, "+998941110005", RoleCode.ADMIN)
    admin_hdr = auth_header(admin_tokens["access_token"])
    await client.post(
        "/v1/feature-flags/admin/partial_flag",
        headers=admin_hdr,
        json={"enabled": True, "rollout_percent": 50},
    )

    guest_resolved = await client.get("/v1/feature-flags")
    assert guest_resolved.json()["partial_flag"] is False
