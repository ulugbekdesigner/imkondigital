"""Public sertifikat tekshirish testi."""

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.certificate import Certificate
from app.models.enums import RoleCode
from app.models.user import User
from tests.helpers import auth_header, grant_role, register_and_verify


async def test_unknown_certificate_returns_404(client: httpx.AsyncClient) -> None:
    resp = await client.get("/v1/verify/nonexistent-uid")
    assert resp.status_code == 404


async def test_valid_certificate_verifies_publicly(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    await register_and_verify(client, phone="+998901112233", full_name="Dilnoza Karimova")
    user = (await db.execute(select(User).where(User.phone == "+998901112233"))).scalar_one()
    db.add(Certificate(user_id=user.id, uid="IMKON-ABC123"))
    await db.commit()

    # Public — token talab qilinmaydi
    resp = await client.get("/v1/verify/IMKON-ABC123")
    assert resp.status_code == 200
    body = resp.json()
    assert body["uid"] == "IMKON-ABC123"
    assert body["full_name"] == "Dilnoza Karimova"
    assert body["issued_at"]
    assert body["course_title"] is None
    assert body["qr_url"] is None
    assert body["pdf_url"] is None


async def test_certificate_includes_course_title_and_assets_when_present(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    instr_tokens = await register_and_verify(client, phone="+998901112244")
    instr_hdr = auth_header(instr_tokens["access_token"])
    await grant_role(db, "+998901112244", RoleCode.INSTRUCTOR)
    course = await client.post(
        "/v1/courses", headers=instr_hdr, json={"title": "Raqamli savodxonlik"}
    )
    course_id = course.json()["id"]

    await register_and_verify(client, phone="+998901112255", full_name="Aziz Karimov")
    user = (await db.execute(select(User).where(User.phone == "+998901112255"))).scalar_one()
    db.add(
        Certificate(
            user_id=user.id,
            course_id=course_id,
            uid="IMKON-XYZ789",
            qr_url="https://cdn.example.com/certificates/IMKON-XYZ789-qr.png",
            pdf_url="https://cdn.example.com/certificates/IMKON-XYZ789.pdf",
        )
    )
    await db.commit()

    resp = await client.get("/v1/verify/IMKON-XYZ789")
    assert resp.status_code == 200
    body = resp.json()
    assert body["course_title"] == "Raqamli savodxonlik"
    assert body["qr_url"] == "https://cdn.example.com/certificates/IMKON-XYZ789-qr.png"
    assert body["pdf_url"] == "https://cdn.example.com/certificates/IMKON-XYZ789.pdf"
