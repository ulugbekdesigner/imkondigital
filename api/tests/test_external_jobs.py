"""Xalqaro ish e'lonlari — KENGAYISH_PLAN_3.md 6-bo'lim, 1-bosqich.

Hech qanday test HAQIQIY tashqi API/RSS'ga murojaat qilmaydi — barcha
HTTP javoblar qo'lda tuzilgan (RemoteOK/Remotive/WeWorkRemotely'ning
haqiqiy javob shakli avval qo'lda `curl` bilan tekshirilgan).
"""

from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, patch

import httpx
import pytest
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import RoleCode
from app.models.external_job import ExternalJob
from app.modules.external_jobs.fetchers import (
    RawExternalJob,
    fetch_remoteok,
    fetch_remotive,
    fetch_weworkremotely,
)
from app.modules.external_jobs.service import compute_external_job_match, sync_source
from app.modules.external_jobs.translator import TranslationResult, translate_and_classify
from app.schemas.external_job import ExternalJobSyncResult
from tests.helpers import auth_header, grant_role, register_and_verify


def _response(url: str, *, json: object = None, text: str | None = None) -> httpx.Response:
    request = httpx.Request("GET", url)
    if text is not None:
        return httpx.Response(200, text=text, request=request)
    return httpx.Response(200, json=json, request=request)


class _FakeClient:
    def __init__(self, response: httpx.Response) -> None:
        self._response = response

    async def get(self, *args: object, **kwargs: object) -> httpx.Response:
        return self._response


# --- Fetcher'lar — haqiqiy javob shaklini aks ettiruvchi qo'lda tuzilgan namunalar ---


async def test_fetch_remoteok_skips_legal_notice_row_and_maps_fields() -> None:
    payload = [
        {"legal": "API Terms of Service: ..."},
        {
            "id": "1135555",
            "slug": "remote-ai-intern-certifyos-1135555",
            "position": "AI Intern",
            "company": "CertifyOS",
            "url": "https://remoteOK.com/remote-jobs/remote-ai-intern-certifyos-1135555",
            "tags": ["python", "api"],
            "description": "<p>About <strong>CertifyOS</strong></p>",
            "location": "Worldwide",
            "date": "2026-07-28T08:00:03+00:00",
        },
    ]
    client = _FakeClient(_response("https://remoteok.com/api", json=payload))
    jobs = await fetch_remoteok(client)  # type: ignore[arg-type]

    assert len(jobs) == 1
    job = jobs[0]
    assert job.source == "remoteok"
    assert job.external_id == "1135555"
    assert job.title == "AI Intern"
    assert job.company_name == "CertifyOS"
    assert job.tags == ["python", "api"]
    assert "About CertifyOS" in job.description
    assert "<p>" not in job.description
    assert job.posted_at is not None


async def test_fetch_remotive_maps_fields() -> None:
    payload = {
        "jobs": [
            {
                "id": 2090903,
                "url": "https://remotive.com/remote-jobs/data/data-labeling-2090903",
                "title": "Data Labeling Specialists",
                "company_name": "Workada",
                "tags": ["research", "spreadsheets"],
                "candidate_required_location": "USA",
                "description": "<p>Who We Are</p>",
                "publication_date": "2026-07-26T20:49:11",
            }
        ]
    }
    client = _FakeClient(_response("https://remotive.com/api/remote-jobs", json=payload))
    jobs = await fetch_remotive(client)  # type: ignore[arg-type]

    assert len(jobs) == 1
    job = jobs[0]
    assert job.source == "remotive"
    assert job.external_id == "2090903"
    assert job.title == "Data Labeling Specialists"
    assert job.location_note == "USA"
    assert "Who We Are" in job.description


async def test_fetch_weworkremotely_splits_company_and_position_from_title() -> None:
    rss = """<?xml version="1.0" encoding="UTF-8"?>
    <rss version="2.0"><channel>
      <item>
        <title>Keeper Security: Account Manager</title>
        <link>https://weworkremotely.com/remote-jobs/keeper-security-account-manager</link>
        <guid>https://weworkremotely.com/remote-jobs/keeper-security-account-manager</guid>
        <pubDate>Wed, 29 Jul 2026 07:31:04 +0000</pubDate>
        <region>Anywhere in the World</region>
        <category>DevOps and Sysadmin</category>
        <type>Full-Time</type>
        <skills>sales, b2b</skills>
        <description>&lt;p&gt;Join our team&lt;/p&gt;</description>
      </item>
    </channel></rss>"""
    client = _FakeClient(_response("https://weworkremotely.com/remote-jobs.rss", text=rss))
    jobs = await fetch_weworkremotely(client)  # type: ignore[arg-type]

    assert len(jobs) == 1
    job = jobs[0]
    assert job.source == "weworkremotely"
    assert job.company_name == "Keeper Security"
    assert job.title == "Account Manager"
    assert job.location_note == "Anywhere in the World"
    assert job.tags == ["sales", "b2b"]
    assert "Join our team" in job.description


async def test_fetch_raises_on_http_error() -> None:
    request = httpx.Request("GET", "https://remoteok.com/api")
    error_response = httpx.Response(500, request=request)

    class _ErrorClient:
        async def get(self, *args: object, **kwargs: object) -> httpx.Response:
            return error_response

    with pytest.raises(httpx.HTTPStatusError):
        await fetch_remoteok(_ErrorClient())  # type: ignore[arg-type]


async def test_sync_source_survives_fetcher_http_error(db: AsyncSession) -> None:
    async def failing_fetch(client: object) -> list:
        request = httpx.Request("GET", "https://remoteok.com/api")
        response = httpx.Response(500, request=request)
        raise httpx.HTTPStatusError("boom", request=request, response=response)

    with patch.dict("app.modules.external_jobs.service.FETCHERS", {"remoteok": failing_fetch}):
        result = await sync_source(db, "remoteok", client=None)  # type: ignore[arg-type]

    assert result.fetched == 0
    assert result.created == 0


# --- Tarjima/tasnif ---


async def test_translate_and_classify_parses_valid_json() -> None:
    mock_reply = AsyncMock(
        return_value='{"title_uz": "AI amaliyotchisi", '
        '"description_uz": "Sog\'liqni saqlash sohasida AI infratuzilmasi.", '
        '"ladder_step": 3}'
    )
    with patch("app.modules.external_jobs.translator.generate_ai_reply", new=mock_reply):

        raw = RawExternalJob(
            source="remoteok",
            external_id="1",
            title="AI Intern",
            company_name="CertifyOS",
            description="Healthcare AI infra",
            source_url="https://remoteok.com/x",
        )
        result = await translate_and_classify(raw)

    assert result is not None
    assert result.title_uz == "AI amaliyotchisi"
    assert result.ladder_step == 3


async def test_translate_and_classify_returns_none_on_malformed_json() -> None:
    mock_reply = AsyncMock(return_value="bu JSON emas, oddiy matn")
    with patch("app.modules.external_jobs.translator.generate_ai_reply", new=mock_reply):

        raw = RawExternalJob(
            source="remoteok",
            external_id="1",
            title="AI Intern",
            company_name="CertifyOS",
            description="desc",
            source_url="https://remoteok.com/x",
        )
        result = await translate_and_classify(raw)

    assert result is None


async def test_translate_and_classify_returns_none_on_ai_service_error() -> None:
    """Bitta ishning tarjimasi AI xatosiga uchrasa, BUTUN sinxronizatsiya yiqilmasligi kerak."""
    mock_reply = AsyncMock(
        side_effect=HTTPException(status_code=502, detail="AI xizmati vaqtincha ishlamayapti")
    )
    with patch("app.modules.external_jobs.translator.generate_ai_reply", new=mock_reply):
        raw = RawExternalJob(
            source="remoteok",
            external_id="1",
            title="AI Intern",
            company_name="CertifyOS",
            description="desc",
            source_url="https://remoteok.com/x",
        )
        result = await translate_and_classify(raw)

    assert result is None


async def test_translate_and_classify_clamps_out_of_range_ladder_step() -> None:
    mock_reply = AsyncMock(
        return_value='{"title_uz": "T", "description_uz": "D", "ladder_step": 99}'
    )
    with patch("app.modules.external_jobs.translator.generate_ai_reply", new=mock_reply):

        raw = RawExternalJob(
            source="remoteok",
            external_id="1",
            title="T",
            company_name="C",
            description="D",
            source_url="https://remoteok.com/x",
        )
        result = await translate_and_classify(raw)

    assert result is not None
    assert result.ladder_step == 4


# --- Moslik hisoblagichi (sof funksiya) ---


def test_match_score_full_when_user_meets_requirement() -> None:
    assert compute_external_job_match(job_ladder_step=2, user_max_ladder_step=3) == 100


def test_match_score_partial_when_one_step_below() -> None:
    assert compute_external_job_match(job_ladder_step=3, user_max_ladder_step=2) == 60


def test_match_score_low_when_far_below() -> None:
    assert compute_external_job_match(job_ladder_step=4, user_max_ladder_step=0) == 25


def test_match_score_none_when_job_unclassified() -> None:
    assert compute_external_job_match(job_ladder_step=None, user_max_ladder_step=3) is None


# --- Sinxronizatsiya (upsert/dedup/eskirish) ---


async def test_sync_source_creates_and_translates_new_job(db: AsyncSession) -> None:

    fake_raw = RawExternalJob(
        source="remoteok",
        external_id="9001",
        title="Backend Engineer",
        company_name="Acme",
        description="Build APIs",
        source_url="https://remoteok.com/j/9001",
        tags=["python"],
    )

    async def fake_fetch(client: object) -> list[RawExternalJob]:
        return [fake_raw]

    mock_translate = AsyncMock(
        return_value=TranslationResult(
            title_uz="Backend muhandis", description_uz="API yaratish", ladder_step=3
        )
    )
    with (
        patch.dict("app.modules.external_jobs.service.FETCHERS", {"remoteok": fake_fetch}),
        patch("app.modules.external_jobs.service.translate_and_classify", new=mock_translate),
    ):
        result = await sync_source(db, "remoteok", client=None)  # type: ignore[arg-type]

    assert result.created == 1
    assert result.updated == 0
    stored = (
        await db.execute(
            select(ExternalJob).where(ExternalJob.external_id == "9001")
        )
    ).scalar_one()
    assert stored.title_uz == "Backend muhandis"
    assert stored.ladder_step == 3
    assert stored.is_active is True


async def test_sync_source_updates_existing_without_retranslating(db: AsyncSession) -> None:

    db.add(
        ExternalJob(
            source="remoteok",
            external_id="9002",
            title="Old Title",
            title_uz="Eski sarlavha",
            company_name="Acme",
            description="Old desc",
            description_uz="Eski tavsif",
            ladder_step=2,
            source_url="https://remoteok.com/j/9002",
            fetched_at=datetime.now(UTC) - timedelta(days=5),
        )
    )
    await db.commit()

    fake_raw = RawExternalJob(
        source="remoteok",
        external_id="9002",
        title="Updated Title",
        company_name="Acme",
        description="Updated desc",
        source_url="https://remoteok.com/j/9002",
    )

    async def fake_fetch(client: object) -> list[RawExternalJob]:
        return [fake_raw]

    mock_translate = AsyncMock()
    with (
        patch.dict("app.modules.external_jobs.service.FETCHERS", {"remoteok": fake_fetch}),
        patch("app.modules.external_jobs.service.translate_and_classify", new=mock_translate),
    ):
        result = await sync_source(db, "remoteok", client=None)  # type: ignore[arg-type]

    assert result.created == 0
    assert result.updated == 1
    mock_translate.assert_not_called()
    stored = (
        await db.execute(
            select(ExternalJob).where(ExternalJob.external_id == "9002")
        )
    ).scalar_one()
    assert stored.title == "Updated Title"
    assert stored.title_uz == "Eski sarlavha"  # tarjima o'zgarmadi


async def test_sync_source_deactivates_jobs_not_seen_for_two_weeks(db: AsyncSession) -> None:
    db.add(
        ExternalJob(
            source="remoteok",
            external_id="9003",
            title="Stale Job",
            company_name="Acme",
            description="desc",
            source_url="https://remoteok.com/j/9003",
            is_active=True,
            fetched_at=datetime.now(UTC) - timedelta(days=20),
        )
    )
    await db.commit()

    async def fake_fetch(client: object) -> list:
        return []

    with patch.dict("app.modules.external_jobs.service.FETCHERS", {"remoteok": fake_fetch}):
        result = await sync_source(db, "remoteok", client=None)  # type: ignore[arg-type]

    assert result.deactivated == 1
    stored = (
        await db.execute(
            select(ExternalJob).where(ExternalJob.external_id == "9003")
        )
    ).scalar_one()
    assert stored.is_active is False


# --- Router ---


async def test_catalog_only_returns_active_jobs(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    db.add_all(
        [
            ExternalJob(
                source="remotive",
                external_id="active-1",
                title="Active Job",
                company_name="Acme",
                description="desc",
                source_url="https://remotive.com/j/1",
                is_active=True,
            ),
            ExternalJob(
                source="remotive",
                external_id="inactive-1",
                title="Inactive Job",
                company_name="Acme",
                description="desc",
                source_url="https://remotive.com/j/2",
                is_active=False,
            ),
        ]
    )
    await db.commit()

    resp = await client.get("/v1/external-jobs")
    assert resp.status_code == 200
    titles = [j["title"] for j in resp.json()["items"]]
    assert "Active Job" in titles
    assert "Inactive Job" not in titles


async def test_job_detail_404_for_inactive(client: httpx.AsyncClient, db: AsyncSession) -> None:
    db.add(
        ExternalJob(
            source="remotive",
            external_id="inactive-2",
            title="Inactive",
            company_name="Acme",
            description="desc",
            source_url="https://remotive.com/j/3",
            is_active=False,
        )
    )
    await db.commit()
    job = (
        await db.execute(select(ExternalJob).where(ExternalJob.external_id == "inactive-2"))
    ).scalar_one()

    resp = await client.get(f"/v1/external-jobs/{job.id}")
    assert resp.status_code == 404


async def test_sync_endpoint_requires_admin(client: httpx.AsyncClient, db: AsyncSession) -> None:
    tokens = await register_and_verify(client, phone="+998918001100")
    hdr = auth_header(tokens["access_token"])

    resp = await client.post("/v1/admin/external-jobs/sync", headers=hdr)
    assert resp.status_code == 403


async def test_sync_endpoint_triggers_sync_for_admin(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    tokens = await register_and_verify(client, phone="+998918001101")
    hdr = auth_header(tokens["access_token"])
    await grant_role(db, "+998918001101", RoleCode.ADMIN)

    mock_sync = AsyncMock(
        return_value=ExternalJobSyncResult(sources=[], synced_at=datetime.now(UTC))
    )
    with patch("app.modules.external_jobs.router.service.sync_all_sources", new=mock_sync):
        resp = await client.post("/v1/admin/external-jobs/sync", headers=hdr)

    assert resp.status_code == 200
    mock_sync.assert_awaited_once()


async def test_sync_status_requires_admin(client: httpx.AsyncClient, db: AsyncSession) -> None:
    tokens = await register_and_verify(client, phone="+998918001102")
    hdr = auth_header(tokens["access_token"])

    resp = await client.get("/v1/admin/external-jobs/status", headers=hdr)
    assert resp.status_code == 403


async def test_sync_status_reports_last_synced_at_and_active_count(
    client: httpx.AsyncClient, db: AsyncSession
) -> None:
    tokens = await register_and_verify(client, phone="+998918001103")
    hdr = auth_header(tokens["access_token"])
    await grant_role(db, "+998918001103", RoleCode.ADMIN)

    never_synced = await client.get("/v1/admin/external-jobs/status", headers=hdr)
    assert never_synced.status_code == 200
    assert never_synced.json() == {"last_synced_at": None, "active_count": 0}

    fetched_at = datetime.now(UTC) - timedelta(hours=2)
    db.add_all(
        [
            ExternalJob(
                source="remotive",
                external_id="status-active",
                title="Active",
                company_name="Acme",
                description="desc",
                source_url="https://remotive.com/j/status-active",
                is_active=True,
                fetched_at=fetched_at,
            ),
            ExternalJob(
                source="remotive",
                external_id="status-inactive",
                title="Inactive",
                company_name="Acme",
                description="desc",
                source_url="https://remotive.com/j/status-inactive",
                is_active=False,
                fetched_at=fetched_at,
            ),
        ]
    )
    await db.commit()

    resp = await client.get("/v1/admin/external-jobs/status", headers=hdr)
    assert resp.status_code == 200
    body = resp.json()
    assert body["active_count"] == 1
    assert body["last_synced_at"] is not None
