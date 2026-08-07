"""Foydalanuvchi endpoint'lari — /v1/users/*."""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.trajectory import build_trajectory
from app.models.user import User
from app.modules.auth.deps import get_current_user
from app.modules.users import service
from app.schemas.export import DataExportOut
from app.schemas.user import (
    DisabilityProfileIn,
    DisabilityProfileOut,
    TrajectoryOut,
    UsernameUpdate,
    UserOut,
    UserUpdate,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
async def get_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    return await service.serialize_user(db, user)


@router.patch("/me", response_model=UserOut)
async def update_me(
    data: UserUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    return await service.update_me(db, user, data)


@router.patch("/me/username", response_model=UserOut)
async def update_username(
    data: UsernameUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    return await service.update_username(db, user, data.username)


@router.post("/me/become-instructor", response_model=UserOut)
async def become_instructor(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    return await service.become_instructor(db, user)


@router.get("/me/trajectory", response_model=TrajectoryOut)
async def my_trajectory(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> TrajectoryOut:
    return await build_trajectory(db, user)


@router.get("/me/disability-profile", response_model=DisabilityProfileOut)
async def get_my_disability_profile(user: User = Depends(get_current_user)) -> DisabilityProfileOut:
    if user.disability_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Nogironlik profili to'ldirilmagan"
        )
    return DisabilityProfileOut.model_validate(user.disability_profile)


@router.post(
    "/me/disability-profile",
    response_model=DisabilityProfileOut,
    status_code=status.HTTP_201_CREATED,
)
async def submit_my_disability_profile(
    data: DisabilityProfileIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DisabilityProfileOut:
    profile = await service.upsert_disability_profile(db, user, data)
    return DisabilityProfileOut.model_validate(profile)


@router.post("/me/disability-profile/document", response_model=DisabilityProfileOut)
async def upload_my_disability_document(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DisabilityProfileOut:
    profile = await service.upload_disability_document(db, user, file)
    return DisabilityProfileOut.model_validate(profile)


@router.get("/me/data-export", response_model=DataExportOut)
async def export_my_data(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DataExportOut:
    return await service.export_my_data(db, user)


@router.post("/me/deactivate", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.deactivate_me(db, user)
