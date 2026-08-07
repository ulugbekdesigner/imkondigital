"""Psixologik qo'llab-quvvatlash — admin CRUD + ochiq (published) ro'yxat.

success_stories/service.py bilan bir xil naqsh — ikkita mustaqil resurs turi
(kontent va yo'naltirish manbalari) uchun.
"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import SuccessStoryStatus
from app.models.support import SupportContent, SupportResource
from app.models.user import User
from app.schemas.support import (
    SupportContentIn,
    SupportContentOut,
    SupportResourceIn,
    SupportResourceOut,
)


# --- SupportContent ("Ruhiy kuch") ---
async def create_content(
    db: AsyncSession, admin: User, data: SupportContentIn
) -> SupportContentOut:
    content = SupportContent(**data.model_dump(), created_by=admin.id)
    db.add(content)
    await db.commit()
    await db.refresh(content)
    return SupportContentOut.model_validate(content)


async def list_all_content(db: AsyncSession) -> list[SupportContentOut]:
    rows = (
        (await db.execute(select(SupportContent).order_by(SupportContent.created_at.desc())))
        .scalars()
        .all()
    )
    return [SupportContentOut.model_validate(r) for r in rows]


async def set_content_status(
    db: AsyncSession, content_id: int, new_status: SuccessStoryStatus
) -> SupportContentOut:
    content = await db.get(SupportContent, content_id)
    if content is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kontent topilmadi")
    content.status = new_status.value
    await db.commit()
    await db.refresh(content)
    return SupportContentOut.model_validate(content)


async def delete_content(db: AsyncSession, content_id: int) -> None:
    content = await db.get(SupportContent, content_id)
    if content is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kontent topilmadi")
    await db.delete(content)
    await db.commit()


async def list_published_content(db: AsyncSession) -> list[SupportContentOut]:
    rows = (
        (
            await db.execute(
                select(SupportContent)
                .where(SupportContent.status == SuccessStoryStatus.PUBLISHED)
                .order_by(SupportContent.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [SupportContentOut.model_validate(r) for r in rows]


# --- SupportResource (yo'naltirish manbalari) ---
async def create_resource(
    db: AsyncSession, admin: User, data: SupportResourceIn
) -> SupportResourceOut:
    resource = SupportResource(**data.model_dump(), created_by=admin.id)
    db.add(resource)
    await db.commit()
    await db.refresh(resource)
    return SupportResourceOut.model_validate(resource)


async def list_all_resources(db: AsyncSession) -> list[SupportResourceOut]:
    rows = (
        (await db.execute(select(SupportResource).order_by(SupportResource.sort)))
        .scalars()
        .all()
    )
    return [SupportResourceOut.model_validate(r) for r in rows]


async def set_resource_status(
    db: AsyncSession, resource_id: int, new_status: SuccessStoryStatus
) -> SupportResourceOut:
    resource = await db.get(SupportResource, resource_id)
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manba topilmadi")
    resource.status = new_status.value
    await db.commit()
    await db.refresh(resource)
    return SupportResourceOut.model_validate(resource)


async def delete_resource(db: AsyncSession, resource_id: int) -> None:
    resource = await db.get(SupportResource, resource_id)
    if resource is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Manba topilmadi")
    await db.delete(resource)
    await db.commit()


async def list_published_resources(db: AsyncSession) -> list[SupportResourceOut]:
    rows = (
        (
            await db.execute(
                select(SupportResource)
                .where(SupportResource.status == SuccessStoryStatus.PUBLISHED)
                .order_by(SupportResource.sort)
            )
        )
        .scalars()
        .all()
    )
    return [SupportResourceOut.model_validate(r) for r in rows]
