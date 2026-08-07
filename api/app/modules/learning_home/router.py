"""'Mening yo'lim' endpoint'i — /v1/me/learning-home."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.user import User
from app.modules.auth.deps import get_current_user
from app.modules.learning_home import service
from app.schemas.learning_home import LearningHomeOut

router = APIRouter(tags=["learning-home"])


@router.get("/me/learning-home", response_model=LearningHomeOut)
async def learning_home(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LearningHomeOut:
    return await service.get_learning_home(db, user)
