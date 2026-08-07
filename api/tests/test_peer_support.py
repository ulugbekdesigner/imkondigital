"""Peer-support — davra postlari, shikoyat va moderator yashirish/qaytarish oqimi."""

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from app.models.peer_support import PeerSupportRoom
from tests.helpers import auth_header, grant_role, register_and_verify


async def _make_room(db: AsyncSession, key: str = "test-room") -> int:
    room = PeerSupportRoom(key=key, title="Test davra", description="Tavsif", sort=0)
    db.add(room)
    await db.commit()
    await db.refresh(room)
    return room.id


async def test_list_rooms(client: httpx.AsyncClient, db: AsyncSession) -> None:
    await _make_room(db, "room-list-rooms")
    tokens = await register_and_verify(client, phone="+998917041100")
    hdr = auth_header(tokens["access_token"])

    resp = await client.get("/v1/peer-support/rooms", headers=hdr)
    assert resp.status_code == 200
    assert len(resp.json()) == 1


async def test_create_and_list_posts(client: httpx.AsyncClient, db: AsyncSession) -> None:
    room_id = await _make_room(db, "room-create-list")
    tokens = await register_and_verify(client, phone="+998917042200", full_name="Anvar")
    hdr = auth_header(tokens["access_token"])

    create = await client.post(
        f"/v1/peer-support/rooms/{room_id}/posts",
        headers=hdr,
        json={"body": "Salom, men ham shu bosqichdaman!"},
    )
    assert create.status_code == 201, create.text
    body = create.json()
    assert body["author_name"] == "Anvar"
    assert body["is_own"] is True
    assert body["is_hidden"] is False

    listed = await client.get(f"/v1/peer-support/rooms/{room_id}/posts", headers=hdr)
    assert len(listed.json()) == 1


async def test_hidden_post_invisible_to_regular_users(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    room_id = await _make_room(db, "room-hide-unhide")
    author_tokens = await register_and_verify(client, phone="+998917043300")
    author_hdr = auth_header(author_tokens["access_token"])
    post = (
        await client.post(
            f"/v1/peer-support/rooms/{room_id}/posts",
            headers=author_hdr,
            json={"body": "Bu post keyinroq yashiriladi"},
        )
    ).json()

    mod_tokens = await register_and_verify(client, phone="+998917044400")
    mod_hdr = auth_header(mod_tokens["access_token"])
    await grant_role(db, "+998917044400", RoleCode.MODERATOR)

    hide = await client.post(
        f"/v1/peer-support/posts/{post['id']}/hide",
        headers=mod_hdr,
        json={"reason": "Nomaqbul til"},
    )
    assert hide.status_code == 204

    # Oddiy foydalanuvchi (hatto muallifning o'zi ham) endi ko'rmaydi
    as_author = await client.get(f"/v1/peer-support/rooms/{room_id}/posts", headers=author_hdr)
    assert as_author.json() == []

    # Moderator hamon ko'radi, is_hidden=True bilan
    as_moderator = await client.get(
        f"/v1/peer-support/rooms/{room_id}/posts", headers=mod_hdr
    )
    assert len(as_moderator.json()) == 1
    assert as_moderator.json()[0]["is_hidden"] is True
    assert as_moderator.json()[0]["hidden_reason"] == "Nomaqbul til"

    # Qaytarilgach hammaga yana ko'rinadi
    unhide = await client.post(
        f"/v1/peer-support/posts/{post['id']}/unhide", headers=mod_hdr
    )
    assert unhide.status_code == 204
    again = await client.get(f"/v1/peer-support/rooms/{room_id}/posts", headers=author_hdr)
    assert len(again.json()) == 1


async def test_non_moderator_cannot_hide(client: httpx.AsyncClient, db: AsyncSession) -> None:
    room_id = await _make_room(db, "room-non-moderator")
    tokens = await register_and_verify(client, phone="+998917045500")
    hdr = auth_header(tokens["access_token"])
    post = (
        await client.post(
            f"/v1/peer-support/rooms/{room_id}/posts", headers=hdr, json={"body": "Salom"}
        )
    ).json()

    resp = await client.post(
        f"/v1/peer-support/posts/{post['id']}/hide", headers=hdr, json={"reason": "sabab"}
    )
    assert resp.status_code == 403


async def test_report_post(client: httpx.AsyncClient, db: AsyncSession) -> None:
    room_id = await _make_room(db, "room-report")
    author_tokens = await register_and_verify(client, phone="+998917046600")
    reporter_tokens = await register_and_verify(client, phone="+998917047700")
    author_hdr = auth_header(author_tokens["access_token"])
    reporter_hdr = auth_header(reporter_tokens["access_token"])

    post = (
        await client.post(
            f"/v1/peer-support/rooms/{room_id}/posts", headers=author_hdr, json={"body": "Salom"}
        )
    ).json()

    resp = await client.post(
        f"/v1/peer-support/posts/{post['id']}/report",
        headers=reporter_hdr,
        json={"reason": "Spam"},
    )
    assert resp.status_code == 204
