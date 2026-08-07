"""Imtiyozlar Markazi biznes logikasi — CRUD (moderator), shaxsiylashtirilgan katalog, saqlash."""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.benefits_match import is_relevant_to_user
from app.models.benefits import Benefit, UserBenefit
from app.models.enums import BenefitAudience, BenefitStatus, NotificationCategory, NotificationType
from app.models.notification import Notification
from app.models.user import Region, User
from app.modules.notifications.service import create_notification
from app.schemas.benefits import BenefitCard, BenefitCreate, BenefitDetail
from app.worker.notification_tasks import fan_out_benefit_notification


def _require_moderator(user: User) -> None:
    codes = {r.code for r in user.roles}
    if codes.isdisjoint({"moderator", "admin"}):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Bu amal uchun ruxsatingiz yo'q"
        )


async def create_benefit(db: AsyncSession, moderator: User, data: BenefitCreate) -> Benefit:
    _require_moderator(moderator)
    benefit = Benefit(
        title=data.title,
        description=data.description,
        category=data.category,
        provider_type=data.provider_type,
        audience=data.audience,
        region_id=data.region_id,
        disability_categories=data.disability_categories,
        how_to_apply=data.how_to_apply,
        external_url=data.external_url,
        expires_at=data.expires_at,
        status=BenefitStatus.DRAFT,
        created_by=moderator.id,
    )
    db.add(benefit)
    await db.commit()
    await db.refresh(benefit)
    return benefit


async def publish_benefit(db: AsyncSession, benefit_id: int, moderator: User) -> Benefit:
    _require_moderator(moderator)
    benefit = await db.get(Benefit, benefit_id)
    if benefit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imtiyoz topilmadi")
    # Faqat DRAFT->PUBLISHED o'tishida bir marta fan-out qilinadi — aks holda
    # allaqachon chop etilgan imtiyozni qayta "nashr etish" (masalan qayta-qayta
    # bosilgan tugma yoki takroriy so'rov) har safar BARCHA mos foydalanuvchiga
    # yana bildirishnoma yuborardi (haqiqiy production xatosi shu tarzda topildi
    # — bitta imtiyoz uchun minglab takroriy bildirishnoma yig'ilib qolgan edi).
    already_published = benefit.status == BenefitStatus.PUBLISHED
    benefit.status = BenefitStatus.PUBLISHED
    await db.commit()
    await db.refresh(benefit)

    if not already_published:
        try:
            fan_out_benefit_notification.delay(benefit.id)
        except Exception:  # Navbat (Redis) vaqtincha ishlamasa ham nashr muvaffaqiyatli bo'lsin
            pass

    return benefit


async def fan_out_benefit_matches(db: AsyncSession, benefit: Benefit) -> int:
    """Yangi imtiyoz e'lon qilinganda, mos foydalanuvchilarga "Davlat

    yangiliklari" toifasida bildirishnoma yuboradi (KENGAYISH_PLAN_3.md
    2.2-bo'lim, "Hozir — integratsiyasiz" bosqichi). Sof `is_relevant_to_user`
    mantiqidan foydalanadi — katalog sahifasidagi moslik hisobi bilan bir xil
    qoida. Faqat `audience=user` (shaxsiy) imtiyozlar uchun ishlaydi.
    """
    if benefit.audience != BenefitAudience.USER:
        return 0

    link_url = f"/imtiyozlar/{benefit.id}"
    # Himoya qatlami: `publish_benefit` endi faqat bir marta chaqiradi, lekin
    # bu funksiya boshqa yo'l bilan (masalan navbat qayta ishga tushishi) yana
    # chaqirilsa ham, allaqachon xabar olgan foydalanuvchiga ikkinchi marta
    # yubormaslik kerak — bitta imtiyoz uchun bir foydalanuvchiga bitta xabar.
    already_notified_ids = set(
        (
            await db.execute(
                select(Notification.user_id).where(
                    Notification.type == NotificationType.BENEFIT_MATCH,
                    Notification.link_url == link_url,
                )
            )
        )
        .scalars()
        .all()
    )

    notified = 0
    users = (await db.execute(select(User))).scalars().all()
    for user in users:
        if user.id in already_notified_ids:
            continue
        user_categories = user.disability_profile.categories if user.disability_profile else []
        if not is_relevant_to_user(
            benefit_region_id=benefit.region_id,
            benefit_disability_categories=benefit.disability_categories,
            user_region_id=user.region_id,
            user_disability_categories=user_categories,
        ):
            continue
        await create_notification(
            db,
            user_id=user.id,
            notif_type=NotificationType.BENEFIT_MATCH,
            category=NotificationCategory.GOVERNMENT,
            title=f"Sizga mos yangi imtiyoz: {benefit.title}",
            body=benefit.description[:200],
            link_url=link_url,
        )
        notified += 1
    await db.commit()
    return notified


async def _saved_ids(db: AsyncSession, user_id: int) -> set[int]:
    rows = (
        await db.execute(select(UserBenefit.benefit_id).where(UserBenefit.user_id == user_id))
    ).scalars()
    return set(rows)


async def _to_card(
    db: AsyncSession, b: Benefit, *, is_relevant: bool | None, is_saved: bool
) -> BenefitCard:
    region = await db.get(Region, b.region_id) if b.region_id is not None else None
    return BenefitCard(
        id=b.id,
        title=b.title,
        category=b.category,
        provider_type=b.provider_type,
        audience=b.audience,
        region_id=b.region_id,
        region_name=region.name if region else None,
        disability_categories=b.disability_categories,
        status=b.status,
        is_relevant_to_me=is_relevant,
        is_saved=is_saved,
        expires_at=b.expires_at,
        created_at=b.created_at,
    )


def _relevance(benefit: Benefit, user: User | None) -> bool | None:
    if user is None or benefit.audience != BenefitAudience.USER:
        return None
    user_categories = user.disability_profile.categories if user.disability_profile else []
    return is_relevant_to_user(
        benefit_region_id=benefit.region_id,
        benefit_disability_categories=benefit.disability_categories,
        user_region_id=user.region_id,
        user_disability_categories=user_categories,
    )


async def catalog(
    db: AsyncSession, user: User | None, *, audience: str | None, provider_type: str | None = None
) -> list[BenefitCard]:
    stmt = select(Benefit).where(Benefit.status == BenefitStatus.PUBLISHED)
    if audience:
        stmt = stmt.where(Benefit.audience == audience)
    if provider_type:
        stmt = stmt.where(Benefit.provider_type == provider_type)
    benefits = (await db.execute(stmt.order_by(Benefit.created_at.desc()))).scalars().all()

    saved_ids = await _saved_ids(db, user.id) if user else set()
    cards = [
        await _to_card(db, b, is_relevant=_relevance(b, user), is_saved=b.id in saved_ids)
        for b in benefits
    ]
    cards.sort(key=lambda c: not (c.is_relevant_to_me or False))
    return cards


async def benefit_detail(db: AsyncSession, benefit_id: int, user: User | None) -> BenefitDetail:
    benefit = await db.get(Benefit, benefit_id)
    if benefit is None or benefit.status != BenefitStatus.PUBLISHED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imtiyoz topilmadi")

    is_saved = user is not None and benefit.id in (await _saved_ids(db, user.id))
    card = await _to_card(db, benefit, is_relevant=_relevance(benefit, user), is_saved=is_saved)
    return BenefitDetail(
        **card.model_dump(),
        description=benefit.description,
        how_to_apply=benefit.how_to_apply,
        external_url=benefit.external_url,
    )


async def save_benefit(db: AsyncSession, benefit_id: int, user: User) -> None:
    benefit = await db.get(Benefit, benefit_id)
    if benefit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imtiyoz topilmadi")
    existing = (
        await db.execute(
            select(UserBenefit).where(
                UserBenefit.user_id == user.id, UserBenefit.benefit_id == benefit_id
            )
        )
    ).scalar_one_or_none()
    if existing is None:
        db.add(UserBenefit(user_id=user.id, benefit_id=benefit_id))
        await db.commit()


async def unsave_benefit(db: AsyncSession, benefit_id: int, user: User) -> None:
    existing = (
        await db.execute(
            select(UserBenefit).where(
                UserBenefit.user_id == user.id, UserBenefit.benefit_id == benefit_id
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        await db.delete(existing)
        await db.commit()


async def my_saved_benefits(db: AsyncSession, user: User) -> list[BenefitCard]:
    benefits = (
        (
            await db.execute(
                select(Benefit)
                .join(UserBenefit, UserBenefit.benefit_id == Benefit.id)
                .where(UserBenefit.user_id == user.id)
                .order_by(UserBenefit.saved_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [await _to_card(db, b, is_relevant=_relevance(b, user), is_saved=True) for b in benefits]
