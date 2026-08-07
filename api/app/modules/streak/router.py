"""Kunlik faollik ketma-ketligi (streak) endpoint'i."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.user import User
from app.modules.auth.deps import get_current_user
from app.modules.streak import service
from app.schemas.streak import StreakOut

router = APIRouter(tags=["streak"])


@router.get("/me/streak", response_model=StreakOut)
async def my_streak(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreakOut:
    return await service.get_streak(db, user)
