"""Hudud endpoint'lari — /v1/regions."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.modules.regions import service
from app.schemas.region import RegionCard, RegionDetail, RegionOut

router = APIRouter(prefix="/regions", tags=["regions"])


@router.get("", response_model=list[RegionOut])
async def list_regions(db: AsyncSession = Depends(get_db)) -> list[RegionOut]:
    return await service.list_regions(db)


@router.get("/with-stats", response_model=list[RegionCard])
async def list_regions_with_stats(db: AsyncSession = Depends(get_db)) -> list[RegionCard]:
    return await service.list_regions_with_stats(db)


@router.get("/{slug}", response_model=RegionDetail)
async def region_detail(slug: str, db: AsyncSession = Depends(get_db)) -> RegionDetail:
    return await service.get_region_detail(db, slug)
