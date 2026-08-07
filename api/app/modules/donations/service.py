"""Ochiq xayriya biznes logikasi — loyiha CRUD, loginsiz ariza/checkout (V2-2)."""

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.payment_sign import build_click_checkout_url, build_payme_checkout_url
from app.models.donation import Donation, DonationProject
from app.models.enums import DonationProjectStatus, PaymentProvider, PaymentStatus, RoleCode
from app.models.user import User
from app.schemas.donation import (
    DonateIn,
    DonateOut,
    DonationOut,
    DonationProjectIn,
    DonationProjectOut,
)

settings = get_settings()

_ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    DonationProjectStatus.DRAFT: {DonationProjectStatus.ACTIVE},
    DonationProjectStatus.ACTIVE: {DonationProjectStatus.COMPLETED},
    DonationProjectStatus.FUNDED: {DonationProjectStatus.COMPLETED},
}

_PUBLIC_STATUSES = (
    DonationProjectStatus.ACTIVE,
    DonationProjectStatus.FUNDED,
    DonationProjectStatus.COMPLETED,
)


def _progress_pct(project: DonationProject) -> int:
    if project.target_amount <= 0:
        return 0
    return min(100, round(project.collected_amount / project.target_amount * 100))


async def _to_out(db: AsyncSession, project: DonationProject) -> DonationProjectOut:
    owner = await db.get(User, project.owner_id)
    assert owner is not None
    donors_count = (
        await db.execute(
            select(func.count())
            .select_from(Donation)
            .where(Donation.project_id == project.id, Donation.status == PaymentStatus.PAID)
        )
    ).scalar_one()
    return DonationProjectOut(
        id=project.id,
        owner_id=project.owner_id,
        owner_name=owner.full_name,
        title=project.title,
        story=project.story,
        target_amount=project.target_amount,
        collected_amount=project.collected_amount,
        progress_pct=_progress_pct(project),
        deadline=project.deadline,
        status=project.status,
        report=project.report,
        donors_count=donors_count,
        created_at=project.created_at,
    )


def _is_owner_or_admin(project: DonationProject, user: User) -> bool:
    if project.owner_id == user.id:
        return True
    return RoleCode.ADMIN in {r.code for r in user.roles}


async def create_project(
    db: AsyncSession, owner: User, data: DonationProjectIn
) -> DonationProjectOut:
    project = DonationProject(
        owner_id=owner.id,
        title=data.title,
        story=data.story,
        target_amount=data.target_amount,
        deadline=data.deadline,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return await _to_out(db, project)


async def list_my_projects(db: AsyncSession, owner: User) -> list[DonationProjectOut]:
    rows = (
        (
            await db.execute(
                select(DonationProject)
                .where(DonationProject.owner_id == owner.id)
                .order_by(DonationProject.id.desc())
            )
        )
        .scalars()
        .all()
    )
    return [await _to_out(db, p) for p in rows]


async def list_public_projects(
    db: AsyncSession, *, status: str | None = None
) -> list[DonationProjectOut]:
    allowed = {s.value for s in _PUBLIC_STATUSES}
    stmt = select(DonationProject).order_by(DonationProject.id.desc())
    if status is not None and status in allowed:
        stmt = stmt.where(DonationProject.status == status)
    else:
        stmt = stmt.where(DonationProject.status.in_(_PUBLIC_STATUSES))
    rows = (await db.execute(stmt)).scalars().all()
    return [await _to_out(db, p) for p in rows]


async def _get_project_or_404(db: AsyncSession, project_id: int) -> DonationProject:
    project = await db.get(DonationProject, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loyiha topilmadi")
    return project


async def project_detail(db: AsyncSession, project_id: int) -> DonationProjectOut:
    project = await _get_project_or_404(db, project_id)
    return await _to_out(db, project)


async def set_project_status(
    db: AsyncSession, user: User, project_id: int, new_status: DonationProjectStatus
) -> DonationProjectOut:
    project = await _get_project_or_404(db, project_id)
    if not _is_owner_or_admin(project, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu loyiha sizniki emas")
    allowed = _ALLOWED_TRANSITIONS.get(project.status, set())
    if new_status.value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{project.status} holatidan {new_status.value}ga o'tib bo'lmaydi",
        )
    project.status = new_status.value
    await db.commit()
    await db.refresh(project)
    return await _to_out(db, project)


async def set_project_report(
    db: AsyncSession, user: User, project_id: int, report: str
) -> DonationProjectOut:
    project = await _get_project_or_404(db, project_id)
    if not _is_owner_or_admin(project, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu loyiha sizniki emas")
    project.report = report
    await db.commit()
    await db.refresh(project)
    return await _to_out(db, project)


async def donate(db: AsyncSession, project_id: int, data: DonateIn) -> DonateOut:
    project = await _get_project_or_404(db, project_id)
    if project.status != DonationProjectStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu loyiha hozir ariza qabul qilmaydi"
        )

    donation = Donation(
        project_id=project.id,
        amount=data.amount,
        donor_name=None if data.is_anonymous else data.donor_name,
        donor_email=data.donor_email,
        is_anonymous=data.is_anonymous,
    )
    db.add(donation)
    await db.commit()
    await db.refresh(donation)

    if data.provider == PaymentProvider.PAYME:
        checkout_url = build_payme_checkout_url(
            merchant_id=settings.payme_merchant_id,
            account_key="donation_id",
            account_value=donation.id,
            amount_sum=donation.amount,
        )
    else:
        checkout_url = build_click_checkout_url(
            service_id=settings.click_service_id,
            merchant_id=settings.click_merchant_id,
            transaction_param=f"d{donation.id}",
            amount_sum=donation.amount,
            return_url=f"{settings.site_url}/xayriya/{project.id}?thanks=1",
        )

    return DonateOut(donation_id=donation.id, checkout_url=checkout_url)


async def get_donation(db: AsyncSession, donation_id: int) -> Donation | None:
    return await db.get(Donation, donation_id)


async def list_project_donations(
    db: AsyncSession, user: User, project_id: int
) -> list[DonationOut]:
    project = await _get_project_or_404(db, project_id)
    if not _is_owner_or_admin(project, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu loyiha sizniki emas")
    rows = (
        (
            await db.execute(
                select(Donation)
                .where(Donation.project_id == project_id, Donation.status == PaymentStatus.PAID)
                .order_by(Donation.id.desc())
            )
        )
        .scalars()
        .all()
    )
    return [
        DonationOut(
            id=d.id,
            amount=d.amount,
            donor_name=None if d.is_anonymous else d.donor_name,
            is_anonymous=d.is_anonymous,
            status=d.status,
            created_at=d.created_at,
        )
        for d in rows
    ]
