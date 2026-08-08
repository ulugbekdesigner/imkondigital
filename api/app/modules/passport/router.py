"""Skills Passport endpoint'lari — /v1/passport/*, /v1/me/certificates, /v1/me/portfolio."""

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.core.db import get_db
from app.models.user import User
from app.modules.auth.deps import get_current_user, get_current_user_optional
from app.modules.passport import service
from app.schemas.passport import (
    CertificateOut,
    PassportOut,
    PortfolioItemOut,
    PortfolioItemUpdate,
    PortfolioStepOut,
)

router = APIRouter(tags=["passport"])


@router.get("/passport/{username}", response_model=PassportOut)
async def public_passport(
    username: str,
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> PassportOut:
    return await service.get_public_passport(db, username, viewer)


@router.get("/me/certificates", response_model=list[CertificateOut])
async def my_certificates(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CertificateOut]:
    return await service.list_my_certificates(db, user)


@router.get("/me/portfolio", response_model=list[PortfolioItemOut])
async def my_portfolio(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PortfolioItemOut]:
    items = await service.list_my_portfolio(db, user)
    return [PortfolioItemOut.model_validate(i) for i in items]


@router.post("/me/portfolio", response_model=PortfolioItemOut, status_code=status.HTTP_201_CREATED)
async def create_portfolio_item(
    title: str = Form(...),
    description: str = Form(""),
    files: list[UploadFile] = File(default=[]),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioItemOut:
    media_urls: list[str] = []
    if files:
        storage.ensure_bucket()
        for f in files:
            if not f.filename:
                continue
            safe_name = storage.validate_upload(f, "attachment")
            key = f"portfolio/{user.id}/{safe_name}"
            media_urls.append(storage.upload_fileobj(f.file, key))
    item = await service.create_portfolio_item(db, user, title, description, media_urls)
    return PortfolioItemOut.model_validate(item)


@router.delete("/me/portfolio/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio_item(
    item_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.delete_portfolio_item(db, user, item_id)


@router.patch("/me/portfolio/{item_id}", response_model=PortfolioItemOut)
async def update_portfolio_item(
    item_id: int,
    data: PortfolioItemUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioItemOut:
    item = await service.update_portfolio_item(db, user, item_id, data)
    return PortfolioItemOut.model_validate(item)


@router.post(
    "/me/portfolio/{item_id}/steps",
    response_model=PortfolioStepOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_portfolio_step(
    item_id: int,
    caption: str = Form(""),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PortfolioStepOut:
    safe_name = storage.validate_upload(file, "attachment")
    storage.ensure_bucket()
    key = f"portfolio/{user.id}/steps/{safe_name}"
    media_url = storage.upload_fileobj(file.file, key)
    step = await service.add_portfolio_step(db, user, item_id, caption, media_url)
    return PortfolioStepOut.model_validate(step)


@router.delete("/me/portfolio/steps/{step_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio_step(
    step_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.delete_portfolio_step(db, user, step_id)
