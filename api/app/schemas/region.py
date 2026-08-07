"""Hudud sahifalari — KENGAYISH_PLAN_3.md 8-bo'lim."""

from __future__ import annotations

from pydantic import BaseModel

from app.schemas.employer import VacancyCard


class RegionOut(BaseModel):
    id: int
    name: str
    slug: str


class RegionStats(BaseModel):
    open_vacancies: int
    published_benefits: int
    registered_users: int
    placed_count: int


class RegionCard(RegionOut):
    stats: RegionStats


class RegionDetail(RegionOut):
    stats: RegionStats
    vacancies_preview: list[VacancyCard]
