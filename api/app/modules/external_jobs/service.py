"""Xalqaro ish e'lonlari — sinxronizatsiya, ro'yxat, moslik hisoblagichi."""

import asyncio
from datetime import UTC, datetime, timedelta

import httpx
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.course import Course, Enrollment
from app.models.enums import EnrollmentStatus
from app.models.external_job import ExternalJob
from app.models.user import User
from app.modules.external_jobs.fetchers import FETCHERS, RawExternalJob
from app.modules.external_jobs.translator import translate_and_classify
from app.schemas.external_job import (
    ExternalJobCard,
    ExternalJobDetail,
    ExternalJobPage,
    ExternalJobSourceResult,
    ExternalJobsSyncStatus,
    ExternalJobSyncResult,
)

_STALE_AFTER = timedelta(days=14)
_TRANSLATE_DELAY_SECONDS = 0.5


async def _user_max_ladder_step(db: AsyncSession, user_id: int) -> int:
    result = (
        await db.execute(
            select(func.max(Course.ladder_step))
            .select_from(Enrollment)
            .join(Course, Course.id == Enrollment.course_id)
            .where(Enrollment.user_id == user_id, Enrollment.status == EnrollmentStatus.COMPLETED)
        )
    ).scalar_one_or_none()
    return result if result is not None else 0


def compute_external_job_match(
    job_ladder_step: int | None, user_max_ladder_step: int
) -> int | None:
    if job_ladder_step is None:
        return None
    if user_max_ladder_step >= job_ladder_step:
        return 100
    if user_max_ladder_step == job_ladder_step - 1:
        return 60
    return 25


async def _upsert_job(db: AsyncSession, raw: RawExternalJob) -> bool:
    """True — yangi yozuv yaratildi (tarjima kerak); False — mavjud yozuv yangilandi."""
    existing = (
        await db.execute(
            select(ExternalJob).where(
                ExternalJob.source == raw.source, ExternalJob.external_id == raw.external_id
            )
        )
    ).scalar_one_or_none()

    if existing is not None:
        existing.title = raw.title
        existing.company_name = raw.company_name
        existing.description = raw.description
        existing.tags = raw.tags
        existing.location_note = raw.location_note
        existing.source_url = raw.source_url
        existing.posted_at = raw.posted_at
        existing.fetched_at = datetime.now(UTC)
        existing.is_active = True
        return False

    job = ExternalJob(
        source=raw.source,
        external_id=raw.external_id,
        title=raw.title,
        company_name=raw.company_name,
        description=raw.description,
        tags=raw.tags,
        location_note=raw.location_note,
        source_url=raw.source_url,
        posted_at=raw.posted_at,
        is_active=True,
    )
    db.add(job)
    return True


async def sync_source(
    db: AsyncSession, source: str, client: httpx.AsyncClient
) -> ExternalJobSourceResult:
    fetcher = FETCHERS[source]
    try:
        raw_jobs = await fetcher(client)
    except (httpx.HTTPError, ValueError):
        return ExternalJobSourceResult(
            source=source, fetched=0, created=0, updated=0, deactivated=0, translation_failures=0
        )

    created = 0
    updated = 0
    translation_failures = 0
    for raw in raw_jobs:
        is_new = await _upsert_job(db, raw)
        if is_new:
            created += 1
        else:
            updated += 1
    await db.flush()

    if created:
        new_jobs = list(
            (
                await db.execute(
                    select(ExternalJob).where(
                        ExternalJob.source == source,
                        ExternalJob.external_id.in_([r.external_id for r in raw_jobs]),
                        ExternalJob.title_uz.is_(None),
                    )
                )
            )
            .scalars()
            .all()
        )
        raw_by_id = {r.external_id: r for r in raw_jobs}
        for i, job in enumerate(new_jobs):
            matched_raw = raw_by_id.get(job.external_id)
            if matched_raw is None:
                continue
            if i > 0:
                await asyncio.sleep(_TRANSLATE_DELAY_SECONDS)
            translation = await translate_and_classify(matched_raw)
            if translation is None:
                translation_failures += 1
                continue
            job.title_uz = translation.title_uz
            job.description_uz = translation.description_uz
            job.ladder_step = translation.ladder_step

    stale_jobs = (
        (
            await db.execute(
                select(ExternalJob).where(
                    ExternalJob.source == source,
                    ExternalJob.is_active.is_(True),
                    ExternalJob.fetched_at < datetime.now(UTC) - _STALE_AFTER,
                )
            )
        )
        .scalars()
        .all()
    )
    for job in stale_jobs:
        job.is_active = False
    deactivated = len(stale_jobs)

    await db.commit()
    return ExternalJobSourceResult(
        source=source,
        fetched=len(raw_jobs),
        created=created,
        updated=updated,
        deactivated=deactivated,
        translation_failures=translation_failures,
    )


async def sync_all_sources(db: AsyncSession) -> ExternalJobSyncResult:
    results: list[ExternalJobSourceResult] = []
    async with httpx.AsyncClient() as client:
        for source in FETCHERS:
            results.append(await sync_source(db, source, client))
    return ExternalJobSyncResult(sources=results, synced_at=datetime.now(UTC))


async def get_sync_status(db: AsyncSession) -> ExternalJobsSyncStatus:
    last_synced_stmt = select(func.max(ExternalJob.fetched_at))
    last_synced_at = (await db.execute(last_synced_stmt)).scalar_one_or_none()
    active_count = (
        await db.execute(
            select(func.count()).select_from(ExternalJob).where(ExternalJob.is_active.is_(True))
        )
    ).scalar_one()
    return ExternalJobsSyncStatus(last_synced_at=last_synced_at, active_count=active_count)


def _to_card(job: ExternalJob, match_score: int | None) -> ExternalJobCard:
    return ExternalJobCard(
        id=job.id,
        source=job.source,
        title=job.title,
        title_uz=job.title_uz,
        company_name=job.company_name,
        tags=job.tags,
        location_note=job.location_note,
        source_url=job.source_url,
        posted_at=job.posted_at,
        ladder_step=job.ladder_step,
        match_score=match_score,
    )


async def list_external_jobs(
    db: AsyncSession, viewer: User | None, *, cursor: int | None, limit: int
) -> ExternalJobPage:
    stmt = select(ExternalJob).where(ExternalJob.is_active.is_(True))
    if cursor is not None:
        stmt = stmt.where(ExternalJob.id < cursor)
    stmt = stmt.order_by(ExternalJob.id.desc()).limit(limit + 1)

    jobs = list((await db.execute(stmt)).scalars().all())
    has_more = len(jobs) > limit
    jobs = jobs[:limit]

    user_max_step = await _user_max_ladder_step(db, viewer.id) if viewer is not None else 0
    items = [
        _to_card(j, compute_external_job_match(j.ladder_step, user_max_step) if viewer else None)
        for j in jobs
    ]
    next_cursor = jobs[-1].id if has_more and jobs else None
    return ExternalJobPage(items=items, next_cursor=next_cursor)


async def get_external_job(db: AsyncSession, job_id: int, viewer: User | None) -> ExternalJobDetail:
    job = await db.get(ExternalJob, job_id)
    if job is None or not job.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ish e'loni topilmadi")

    user_max_step = await _user_max_ladder_step(db, viewer.id) if viewer is not None else 0
    match_score = compute_external_job_match(job.ladder_step, user_max_step) if viewer else None
    return ExternalJobDetail(
        **_to_card(job, match_score).model_dump(),
        description=job.description,
        description_uz=job.description_uz,
    )
