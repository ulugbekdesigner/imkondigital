"""Imtiyozlar Markazi endpoint'lari — /v1/benefits."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.user import User
from app.modules.auth.deps import get_current_user, get_current_user_optional
from app.modules.benefits import service
from app.schemas.benefits import BenefitCard, BenefitCreate, BenefitDetail, BenefitPage

router = APIRouter(prefix="/benefits", tags=["benefits"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_benefit(
    data: BenefitCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    benefit = await service.create_benefit(db, user, data)
    return {"id": benefit.id, "title": benefit.title, "status": benefit.status}


@router.post("/{benefit_id}/publish")
async def publish_benefit(
    benefit_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    benefit = await service.publish_benefit(db, benefit_id, user)
    return {"id": benefit.id, "status": benefit.status}


@router.get("", response_model=BenefitPage)
async def catalog(
    audience: str | None = None,
    provider_type: str | None = None,
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> BenefitPage:
    items = await service.catalog(db, user, audience=audience, provider_type=provider_type)
    return BenefitPage(items=items)


@router.get("/{benefit_id}", response_model=BenefitDetail)
async def benefit_detail(
    benefit_id: int,
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> BenefitDetail:
    return await service.benefit_detail(db, benefit_id, user)


@router.post("/{benefit_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def save_benefit(
    benefit_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.save_benefit(db, benefit_id, user)


@router.post("/{benefit_id}/unsave", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_benefit(
    benefit_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.unsave_benefit(db, benefit_id, user)


@router.get("/me/saved", response_model=list[BenefitCard])
async def my_saved(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[BenefitCard]:
    return await service.my_saved_benefits(db, user)
