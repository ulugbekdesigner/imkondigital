"""Foydalanuvchi profili biznes logikasi."""

from datetime import UTC, datetime

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.core.audit import write_audit_log
from app.core.ladder import user_max_ladder_step
from app.models.enums import RoleCode, UserStatus, VerifiedStatus
from app.models.user import DisabilityProfile, RefreshToken, Role, User, UserRole
from app.modules.ai import cv_builder
from app.modules.courses import service as courses_service
from app.modules.employer import service as employer_service
from app.modules.marketplace import service as marketplace_service
from app.modules.passport import service as passport_service
from app.modules.streak import service as streak_service
from app.modules.subscriptions import service as subscriptions_service
from app.schemas.export import DataExportOut
from app.schemas.user import DisabilityProfileIn, DisabilityProfileOut, UserOut, UserUpdate

_ALLOWED_DOC_CONTENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
_MAX_DOC_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB


async def serialize_user(db: AsyncSession, user: User) -> UserOut:
    """User modelini xavfsiz UserOut'ga aylantiradi — nogironlik TAFSILOTLARISIZ."""
    return UserOut(
        id=user.id,
        phone=user.phone,
        email=user.email,
        full_name=user.full_name,
        username=user.username,
        passport_visibility=user.passport_visibility,
        region_id=user.region_id,
        birth_date=user.birth_date,
        gender=user.gender,
        avatar_url=user.avatar_url,
        status=user.status,
        created_at=user.created_at,
        roles=[r.code for r in user.roles],
        disability_verified_status=(
            user.disability_profile.verified_status if user.disability_profile else None
        ),
        # Raqamli Narvon pog'onasi (0-4) — eng yuqori TUGATILGAN kurs asosida.
        # DIQQAT: /users/me/trajectory'dagi 15-bosqichli "Trayektoriya" bilan
        # ARALASHTIRMASLIK — ular butunlay boshqa ikkita real ko'rsatkich.
        ladder_step=await user_max_ladder_step(db, user.id),
    )


async def update_username(db: AsyncSession, user: User, username: str) -> UserOut:
    if username == user.username:
        return await serialize_user(db, user)
    taken = (
        await db.execute(select(User.id).where(User.username == username, User.id != user.id))
    ).scalar_one_or_none()
    if taken is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu username band, boshqasini tanlang"
        )
    user.username = username
    await db.commit()
    await db.refresh(user)
    return await serialize_user(db, user)


async def update_me(db: AsyncSession, user: User, data: UserUpdate) -> UserOut:
    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        setattr(user, field, value.value if hasattr(value, "value") else value)
    await db.commit()
    await db.refresh(user)
    return await serialize_user(db, user)


async def become_instructor(db: AsyncSession, user: User) -> UserOut:
    """O'zi-o'ziga ustoz rolini beradi — admin tasdig'i shart emas (idempotent)."""
    if not any(r.code == RoleCode.INSTRUCTOR for r in user.roles):
        role_row = (
            await db.execute(select(Role).where(Role.code == RoleCode.INSTRUCTOR))
        ).scalar_one_or_none()
        if role_row is not None:
            db.add(UserRole(user_id=user.id, role_id=role_row.id))
            await db.commit()
            await db.refresh(user, attribute_names=["roles"])
    return await serialize_user(db, user)


async def upsert_disability_profile(
    db: AsyncSession, user: User, data: DisabilityProfileIn
) -> DisabilityProfile:
    """Nogironlik profilini yaratadi/yangilaydi va moderatsiyaga yuboradi (pending)."""
    profile = user.disability_profile
    if profile is None:
        profile = DisabilityProfile(user_id=user.id)
        db.add(profile)

    profile.group_type = data.group_type.value if data.group_type else None
    profile.categories = data.categories
    profile.work_conditions = data.work_conditions
    # Har o'zgartirishda qayta tasdiqlash talab qilinadi
    profile.verified_status = VerifiedStatus.PENDING
    profile.verified_at = None
    profile.submitted_at = datetime.now(UTC)
    profile.rejection_reason = None

    await db.commit()
    await db.refresh(profile)
    return profile


async def upload_disability_document(
    db: AsyncSession, user: User, file: UploadFile
) -> DisabilityProfile:
    """Tasdiqlovchi hujjat (MSEK ma'lumotnomasi va h.k.) yuklaydi va qayta

    moderatsiyaga yuboradi — moderator navbatida haqiqiy hujjatni ko'rish
    imkoni bo'lishi uchun (avval `doc_url` ustuni bor edi, lekin uni
    to'ldiradigan endpoint umuman yo'q edi).
    """
    if file.content_type not in _ALLOWED_DOC_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Faqat PDF, JPG yoki PNG formatidagi fayl qabul qilinadi",
        )
    if file.size is not None and file.size > _MAX_DOC_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fayl hajmi 8 MB dan oshmasligi kerak",
        )

    profile = user.disability_profile
    if profile is None:
        profile = DisabilityProfile(user_id=user.id)
        db.add(profile)

    storage.ensure_bucket()
    key = f"disability-docs/{user.id}/{file.filename}"
    profile.doc_url = storage.upload_fileobj(file.file, key, file.content_type)
    # Yangi hujjat — avvalgi qaror (agar bo'lsa) endi eskirgan dalilga
    # asoslangan, shuning uchun qayta ko'rib chiqish navbatiga qaytadi.
    profile.verified_status = VerifiedStatus.PENDING
    profile.verified_at = None
    profile.submitted_at = datetime.now(UTC)
    profile.rejection_reason = None

    await db.commit()
    await db.refresh(profile)
    return profile


async def moderate_disability_profile(
    db: AsyncSession, moderator: User, user_id: int, approve: bool, reason: str | None = None
) -> DisabilityProfile:
    profile = await db.get(DisabilityProfile, user_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Nogironlik profili topilmadi"
        )
    profile.verified_status = VerifiedStatus.VERIFIED if approve else VerifiedStatus.REJECTED
    profile.verified_at = datetime.now(UTC) if approve else None
    profile.rejection_reason = None if approve else reason
    if approve:
        # 4.1-bo'lim "Muhim himoya qoidasi": tasdiqlangan nogironlik profili
        # PLUS darajasini donor fondi hisobidan avtomatik ochadi.
        await subscriptions_service.grant_stipend(db, user_id)
    await write_audit_log(
        db,
        actor_id=moderator.id,
        action="disability_profile.verify" if approve else "disability_profile.reject",
        target_type="disability_profile",
        target_id=user_id,
    )
    await db.commit()
    await db.refresh(profile)
    return profile


async def deactivate_me(db: AsyncSession, user: User) -> None:
    """Foydalanuvchi o'zi hisobini yopadi.

    Qattiq o'chirish (boshqa modullardagi sertifikat/buyurtma/to'lov yozuvlarini
    kaskad o'chirish) emas — status 'blocked'ga o'tadi (get_current_user shu
    statusdagi foydalanuvchini DARHOL rad etadi, apps/auth/deps.py) va barcha
    faol refresh tokenlar (barcha qurilmalarda) bekor qilinadi. Qayta faollashtirish
    faqat admin orqali — bu qasddan (tasodifiy bosilib ketgan hisobni tiklash imkoni
    qolsin degan qaror).
    """
    await db.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user.id, RefreshToken.revoked.is_(False))
        .values(revoked=True)
    )
    user.status = UserStatus.BLOCKED
    await write_audit_log(
        db,
        actor_id=user.id,
        action="user.self_deactivate",
        target_type="user",
        target_id=user.id,
    )
    await db.commit()


async def export_my_data(db: AsyncSession, user: User) -> DataExportOut:
    """'Mening ma'lumotlarim' arxivi — KENGAYISH_PLAN_3.md 8-bo'lim.

    Bildirishnomalar (vaqtinchalik) va xayriyalar (Donation'da user_id yo'q,
    faqat erkin donor_name/email — hisobga bog'lanmagan) ATAYLAB kiritilmagan.
    """
    disability_profile = (
        DisabilityProfileOut.model_validate(user.disability_profile)
        if user.disability_profile
        else None
    )
    return DataExportOut(
        exported_at=datetime.now(UTC),
        profile=await serialize_user(db, user),
        disability_profile=disability_profile,
        enrollments=await courses_service.list_my_enrollments(db, user),
        certificates=await passport_service.list_my_certificates(db, user),
        portfolio=await passport_service.list_my_portfolio(db, user),
        applications=await employer_service.list_my_applications(db, user),
        orders=await marketplace_service.list_my_orders(db, user, role=None),
        streak=await streak_service.get_streak(db, user),
        generated_cv=await cv_builder.get_my_cv(db, user.id),
    )
