"""Auth biznes logikasi — ro'yxatdan o'tish, tasdiqlash, kirish, refresh rotatsiyasi."""

import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import tezkor_auth_client
from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_phone_code,
    hash_code,
    hash_password,
    verify_code,
    verify_password,
)
from app.core.usernames import random_suffix, slugify_username
from app.models.enums import RoleCode, UserStatus
from app.models.user import PasswordResetToken, PhoneVerification, RefreshToken, Role, User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterResponse,
    TelegramLoginStartResponse,
    TokenResponse,
    VerifyPhoneRequest,
    normalize_phone,
)

_RESET_TOKEN_TTL = timedelta(hours=1)

settings = get_settings()


async def _get_role(db: AsyncSession, code: RoleCode) -> Role:
    role = (await db.execute(select(Role).where(Role.code == code.value))).scalar_one_or_none()
    if role is None:
        # Rollar migratsiyada seed qilinadi; yo'q bo'lsa — konfiguratsiya xatosi
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rol topilmadi: {code.value}",
        )
    return role


async def _issue_tokens(db: AsyncSession, user_id: int) -> TokenResponse:
    access = create_access_token(user_id)
    refresh, jti, expires_at = create_refresh_token(user_id)
    db.add(RefreshToken(user_id=user_id, jti=jti, expires_at=expires_at))
    await db.flush()
    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        expires_in=settings.access_token_expire_minutes * 60,
    )


async def _generate_unique_username(db: AsyncSession, full_name: str) -> str:
    base = slugify_username(full_name)
    for _ in range(5):
        candidate = f"{base}_{random_suffix()}"
        exists = (
            await db.execute(select(User.id).where(User.username == candidate))
        ).scalar_one_or_none()
        if exists is None:
            return candidate
    # Amalda deyarli imkonsiz, lekin nazariy cheksiz sikldan himoya
    return f"{base}_{secrets.token_hex(6)}"


async def register(db: AsyncSession, data: RegisterRequest) -> RegisterResponse:
    existing = (await db.execute(select(User).where(User.phone == data.phone))).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Bu telefon raqami allaqachon ro'yxatdan o'tgan",
        )

    user = User(
        phone=data.phone,
        full_name=data.full_name,
        username=await _generate_unique_username(db, data.full_name),
        password_hash=hash_password(data.password),
        status=UserStatus.PENDING_VERIFICATION,
    )
    user.roles.append(await _get_role(db, RoleCode.USER))
    db.add(user)
    await db.flush()

    code = generate_phone_code()
    db.add(
        PhoneVerification(
            user_id=user.id,
            code_hash=hash_code(code),
            expires_at=datetime.now(UTC) + timedelta(minutes=settings.phone_code_expire_minutes),
        )
    )
    await db.commit()

    return RegisterResponse(
        user_id=user.id,
        phone=user.phone,
        status=user.status,
        dev_code=code if settings.environment == "development" else None,
    )


async def verify_phone(db: AsyncSession, data: VerifyPhoneRequest) -> TokenResponse:
    user = (await db.execute(select(User).where(User.phone == data.phone))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")

    verification = (
        (
            await db.execute(
                select(PhoneVerification)
                .where(
                    PhoneVerification.user_id == user.id,
                    PhoneVerification.consumed.is_(False),
                    PhoneVerification.expires_at > datetime.now(UTC),
                )
                .order_by(PhoneVerification.created_at.desc())
            )
        )
        .scalars()
        .first()
    )

    if verification is None or not verify_code(data.code, verification.code_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tasdiqlash kodi noto'g'ri yoki muddati o'tgan. Yangi kod so'rang.",
        )

    verification.consumed = True
    user.status = UserStatus.ACTIVE
    tokens = await _issue_tokens(db, user.id)
    await db.commit()
    return tokens


async def login(db: AsyncSession, data: LoginRequest) -> TokenResponse:
    user = (await db.execute(select(User).where(User.phone == data.phone))).scalar_one_or_none()
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Telefon raqami yoki parol noto'g'ri",
        )
    if user.status == UserStatus.BLOCKED:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Hisob bloklangan")
    if user.status == UserStatus.PENDING_VERIFICATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Telefon raqami tasdiqlanmagan. Avval kodni kiriting.",
        )

    tokens = await _issue_tokens(db, user.id)
    await db.commit()
    return tokens


async def refresh(db: AsyncSession, refresh_token: str) -> TokenResponse:
    try:
        payload = decode_token(refresh_token)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Yaroqsiz refresh token"
        ) from exc

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token turi noto'g'ri")

    jti = payload.get("jti")
    stored = (
        await db.execute(select(RefreshToken).where(RefreshToken.jti == jti))
    ).scalar_one_or_none()
    if stored is None or stored.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token bekor qilingan yoki topilmadi",
        )

    # Rotatsiya: eski token'ni bekor qilamiz, yangisini beramiz
    stored.revoked = True
    tokens = await _issue_tokens(db, int(payload["sub"]))
    await db.commit()
    return tokens


async def logout(db: AsyncSession, refresh_token: str) -> None:
    try:
        payload = decode_token(refresh_token)
    except jwt.PyJWTError:
        # Yaroqsiz token bo'lsa ham logout muvaffaqiyatli hisoblanadi (idempotent)
        return
    stored = (
        await db.execute(select(RefreshToken).where(RefreshToken.jti == payload.get("jti")))
    ).scalar_one_or_none()
    if stored is not None:
        stored.revoked = True
        await db.commit()


async def create_password_reset_link(db: AsyncSession, admin: User, user_id: int) -> tuple[str, datetime]:
    """QA_AUDIT D7: admin foydalanuvchi parolini KO'RMAYDI/O'RNATMAYDI - faqat
    bir martalik havola yaratadi, uni o'zi tanlagan kanal orqali (Telegram,
    telefon va h.k.) foydalanuvchiga yetkazadi."""
    target = await db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")

    raw_token = secrets.token_urlsafe(32)
    expires_at = datetime.now(UTC) + _RESET_TOKEN_TTL
    db.add(
        PasswordResetToken(
            user_id=user_id,
            token_hash=hash_code(raw_token),
            created_by=admin.id,
            expires_at=expires_at,
        )
    )
    await db.commit()
    link = f"{settings.site_url}/parolni-tiklash?token={raw_token}"
    return link, expires_at


async def reset_password(db: AsyncSession, token: str, new_password: str) -> None:
    now = datetime.now(UTC)
    candidates = (
        (
            await db.execute(
                select(PasswordResetToken).where(
                    PasswordResetToken.consumed.is_(False),
                    PasswordResetToken.expires_at > now,
                )
            )
        )
        .scalars()
        .all()
    )
    matched = next((c for c in candidates if verify_code(token, c.token_hash)), None)
    if matched is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Havola yaroqsiz yoki muddati tugagan",
        )

    user = await db.get(User, matched.user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")

    user.password_hash = hash_password(new_password)
    matched.consumed = True
    # Yangi parol qo'yilgach barcha eski sessiyalar bekor qilinadi (xavfsizlik).
    active_tokens = (
        (
            await db.execute(
                select(RefreshToken).where(
                    RefreshToken.user_id == user.id, RefreshToken.revoked.is_(False)
                )
            )
        )
        .scalars()
        .all()
    )
    for rt in active_tokens:
        rt.revoked = True
    await db.commit()


async def start_telegram_login(return_url: str) -> TelegramLoginStartResponse:
    """Tezkor Auth (markazlashgan Telegram-orqali kirish)da yangi sessiya boshlaydi."""
    try:
        result = await tezkor_auth_client.start_session(return_url)
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Tezkor Auth xizmati javob bermadi"
        ) from exc
    return TelegramLoginStartResponse(**result)


async def telegram_login_status(session_id: str) -> dict[str, Any]:
    try:
        return await tezkor_auth_client.get_status(session_id)
    except httpx.HTTPStatusError as exc:
        # Tezkor Auth'ning o'z 4xx javobi (masalan sessiya topilmadi/muddati
        # tugagan) aynan o'sha holat bilan uzatiladi; 5xx esa umumiy 502'ga.
        upstream = exc.response.status_code
        if 400 <= upstream < 500:
            raise HTTPException(status_code=upstream, detail="Sessiya topilmadi") from exc
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Tezkor Auth xizmati javob bermadi"
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Tezkor Auth xizmati javob bermadi"
        ) from exc


async def finish_telegram_login(db: AsyncSession, session_id: str) -> TokenResponse:
    """Tasdiqlangan sessiyani "claim" qilib IMKON foydalanuvchisiga bog'laydi.

    Mavjud bo'lsa telegram_user_id yoki telefon bo'yicha topiladi, aks holda
    yangi hisob yaratiladi (parol o'rniga tasodifiy, ishlatib bo'lmaydigan
    xesh — foydalanuvchi faqat Telegram orqali kiradi, xohlasa keyin admin
    orqali parol tiklab, parol bilan ham kira oladi).
    """
    try:
        result = await tezkor_auth_client.claim_session(session_id)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Sessiya hali tasdiqlanmagan"
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY, detail="Tezkor Auth xizmati javob bermadi"
        ) from exc

    identity = result.get("identity") or {}
    telegram_user_id = identity.get("telegram_user_id")
    phone_raw = identity.get("phone")
    if not telegram_user_id:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Tezkor Auth foydalanuvchi identifikatorini qaytarmadi",
        )
    if not phone_raw:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram orqali telefon raqami ulashilmadi — botda ulashib qayta urinib ko'ring.",
        )
    try:
        phone = normalize_phone(phone_raw)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Telegram orqali ulashilgan telefon raqami noto'g'ri formatda",
        ) from exc

    user = (
        await db.execute(select(User).where(User.telegram_user_id == telegram_user_id))
    ).scalar_one_or_none()
    if user is None:
        user = (await db.execute(select(User).where(User.phone == phone))).scalar_one_or_none()

    if user is None:
        full_name = identity.get("first_name") or identity.get("username") or "Foydalanuvchi"
        user = User(
            phone=phone,
            full_name=full_name,
            username=await _generate_unique_username(db, full_name),
            password_hash=hash_password(secrets.token_urlsafe(32)),
            status=UserStatus.ACTIVE,
            telegram_user_id=telegram_user_id,
        )
        user.roles.append(await _get_role(db, RoleCode.USER))
        db.add(user)
        await db.flush()
    elif user.telegram_user_id is None:
        user.telegram_user_id = telegram_user_id

    tokens = await _issue_tokens(db, user.id)
    await db.commit()
    return tokens
