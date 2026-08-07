"""Skills Passport biznes logikasi — sertifikat berish, portfolio, public sahifa."""

from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.certificates import generate_uid, issue_certificate
from app.models.certificate import Certificate
from app.models.course import Course, Submission
from app.models.enums import PassportVisibility, PortfolioSource, RoleCode
from app.models.portfolio import PortfolioItem, PortfolioItemStep
from app.models.user import Region, User
from app.modules.instructor_studio import service as instructor_studio_service
from app.schemas.passport import (
    CertificateOut,
    PassportOut,
    PortfolioItemOut,
    PortfolioItemUpdate,
)


async def issue_certificate_for_completion(
    db: AsyncSession, user: User, course: Course
) -> Certificate | None:
    """Kurs 100% tugallanganda chaqiriladi. Sertifikat allaqachon bo'lsa — qayta bermaydi."""
    existing = (
        await db.execute(
            select(Certificate).where(
                Certificate.user_id == user.id, Certificate.course_id == course.id
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    uid = generate_uid()
    issued_at = datetime.now().strftime("%Y-%m-%d")
    pdf_url, qr_url = issue_certificate(
        uid=uid, full_name=user.full_name, course_title=course.title, issued_at=issued_at
    )
    cert = Certificate(
        user_id=user.id, course_id=course.id, uid=uid, pdf_url=pdf_url, qr_url=qr_url
    )
    db.add(cert)
    await db.flush()
    return cert


async def list_my_certificates(db: AsyncSession, user: User) -> list[CertificateOut]:
    rows = (
        await db.execute(
            select(Certificate, Course.title)
            .join(Course, Course.id == Certificate.course_id, isouter=True)
            .where(Certificate.user_id == user.id)
            .order_by(Certificate.issued_at.desc())
        )
    ).all()
    return [
        CertificateOut(
            uid=c.uid,
            course_id=c.course_id,
            course_title=title,
            pdf_url=c.pdf_url,
            qr_url=c.qr_url,
            issued_at=c.issued_at,
            confirmed_at=c.confirmed_at,
            readiness_pct=c.readiness_pct,
        )
        for c, title in rows
    ]


async def list_my_portfolio(db: AsyncSession, user: User) -> list[PortfolioItem]:
    return list(
        (
            await db.execute(
                select(PortfolioItem)
                .where(PortfolioItem.user_id == user.id)
                .order_by(PortfolioItem.created_at.desc())
            )
        ).scalars()
    )


async def create_portfolio_item(
    db: AsyncSession, user: User, title: str, description: str, media_urls: list[str]
) -> PortfolioItem:
    item = PortfolioItem(
        user_id=user.id,
        title=title,
        description=description,
        media_urls=media_urls,
        source_type=PortfolioSource.MANUAL,
    )
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


async def delete_portfolio_item(db: AsyncSession, user: User, item_id: int) -> None:
    item = await db.get(PortfolioItem, item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topilmadi")
    await db.delete(item)
    await db.commit()


async def _owned_portfolio_item(db: AsyncSession, user: User, item_id: int) -> PortfolioItem:
    item = await db.get(PortfolioItem, item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topilmadi")
    return item


async def update_portfolio_item(
    db: AsyncSession, user: User, item_id: int, data: PortfolioItemUpdate
) -> PortfolioItem:
    """Case-hikoya maydonlarini qisman yangilaydi (Portfolio 2.0, 6.3-bo'lim)."""
    item = await _owned_portfolio_item(db, user, item_id)
    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    return item


async def add_portfolio_step(
    db: AsyncSession, user: User, item_id: int, caption: str, media_url: str
) -> PortfolioItemStep:
    item = await _owned_portfolio_item(db, user, item_id)
    next_sort = len(item.steps)
    step = PortfolioItemStep(
        portfolio_item_id=item.id, caption=caption, media_url=media_url, sort=next_sort
    )
    db.add(step)
    await db.commit()
    await db.refresh(step)
    return step


async def delete_portfolio_step(db: AsyncSession, user: User, step_id: int) -> None:
    step = await db.get(PortfolioItemStep, step_id)
    if step is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topilmadi")
    item = await db.get(PortfolioItem, step.portfolio_item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topilmadi")
    await db.delete(step)
    await db.commit()


async def add_portfolio_from_submission(db: AsyncSession, submission: Submission) -> PortfolioItem:
    """Instructor topshiriqni tasdiqlaganda avtomatik portfolio elementi yaratadi."""
    item = PortfolioItem(
        user_id=submission.user_id,
        title=f"Topshiriq #{submission.assignment_id}",
        description=submission.text,
        media_urls=[submission.file_url] if submission.file_url else [],
        source_type=PortfolioSource.SUBMISSION,
        submission_id=submission.id,
    )
    db.add(item)
    await db.flush()
    return item


async def get_public_passport(db: AsyncSession, username: str, viewer: User | None) -> PassportOut:
    user = (await db.execute(select(User).where(User.username == username))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sahifa topilmadi")

    is_owner = viewer is not None and viewer.id == user.id
    if user.passport_visibility == PassportVisibility.PRIVATE and not is_owner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sahifa topilmadi")

    region_name: str | None = None
    if user.region_id is not None:
        region = await db.get(Region, user.region_id)
        region_name = region.name if region else None

    certificates = await list_my_certificates(db, user)
    portfolio_rows = await list_my_portfolio(db, user)

    generosity_tier: str | None = None
    if any(r.code == RoleCode.INSTRUCTOR for r in user.roles):
        generosity_tier = await instructor_studio_service.get_generosity_tier(db, user.id)

    return PassportOut(
        full_name=user.full_name,
        username=user.username,
        visibility=user.passport_visibility,
        region_name=region_name,
        member_since=user.created_at,
        generosity_tier=generosity_tier,
        certificates=certificates,
        portfolio=[PortfolioItemOut.model_validate(p) for p in portfolio_rows],
    )
