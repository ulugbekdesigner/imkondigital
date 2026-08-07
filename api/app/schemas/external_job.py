"""Xalqaro ish e'lonlari — KENGAYISH_PLAN_3.md 6-bo'lim, 1-bosqich."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ExternalJobCard(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    source: str
    title: str
    title_uz: str | None
    company_name: str
    tags: list[str]
    location_note: str | None
    source_url: str
    posted_at: datetime | None
    ladder_step: int | None
    match_score: int | None = None


class ExternalJobDetail(ExternalJobCard):
    description: str
    description_uz: str | None


class ExternalJobPage(BaseModel):
    items: list[ExternalJobCard]
    next_cursor: int | None


class ExternalJobSourceResult(BaseModel):
    source: str
    fetched: int
    created: int
    updated: int
    deactivated: int
    translation_failures: int


class ExternalJobSyncResult(BaseModel):
    sources: list[ExternalJobSourceResult]
    synced_at: datetime


class ExternalJobsSyncStatus(BaseModel):
    last_synced_at: datetime | None
    active_count: int
