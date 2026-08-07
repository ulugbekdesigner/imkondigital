"""Bitiruvchi hikoyalari — admin CRUD + ochiq (published) ro'yxat."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.enums import SuccessStoryStatus
from app.models.success_story import SuccessStory
from app.models.user import User
from app.schemas.success_story import SuccessStoryIn, SuccessStoryOut


async def create(db: AsyncSession, admin: User, data: SuccessStoryIn) -> SuccessStoryOut:
    story = SuccessStory(**data.model_dump(), created_by=admin.id)
    db.add(story)
    await db.commit()
    await db.refresh(story)
    return SuccessStoryOut.model_validate(story)


async def list_all(db: AsyncSession) -> list[SuccessStoryOut]:
    rows = (await db.execute(select(SuccessStory).order_by(SuccessStory.step))).scalars().all()
    return [SuccessStoryOut.model_validate(r) for r in rows]


async def set_status(
    db: AsyncSession, story_id: int, new_status: SuccessStoryStatus
) -> SuccessStoryOut:
    story = await db.get(SuccessStory, story_id)
    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hikoya topilmadi")
    story.status = new_status.value
    await db.commit()
    await db.refresh(story)
    return SuccessStoryOut.model_validate(story)


async def delete(db: AsyncSession, story_id: int) -> None:
    story = await db.get(SuccessStory, story_id)
    if story is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hikoya topilmadi")
    await db.delete(story)
    await db.commit()


async def list_published(db: AsyncSession) -> list[SuccessStoryOut]:
    rows = (
        (
            await db.execute(
                select(SuccessStory)
                .where(SuccessStory.status == SuccessStoryStatus.PUBLISHED)
                .order_by(SuccessStory.step)
            )
        )
        .scalars()
        .all()
    )
    return [SuccessStoryOut.model_validate(r) for r in rows]
