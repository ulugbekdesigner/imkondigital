"""Til daraja aniqlash testi (Placement Test) — KENGAYISH_PLAN_3.md 3.2-bo'lim, 1-band.

Interview Coach'ning suhbat-sessiya naqshini (savol-javob) va exam_grader'ning
qattiq-JSON tahlil naqshini birlashtiradi: sessiya davomida Gemini erkin
matnda (tabiiy til muhitida) savol beradi, `complete_session` chaqirilganda
esa BUTUN suhbat tarixi asosida bitta qo'shimcha qattiq-JSON so'rov orqali
CEFR darajasi (A1-C1) aniqlanadi.
"""

import json
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_client import AiMessage, generate_ai_reply
from app.core.ai_quota import check_and_increment_quota
from app.models.ai import PlacementTestMessage, PlacementTestSession
from app.models.enums import AiFeature, InterviewSessionStatus, MessageRole
from app.models.user import User
from app.schemas.ai import (
    PlacementTestMessageOut,
    PlacementTestSessionCard,
    PlacementTestSessionDetail,
)

_HISTORY_LIMIT = 20
_LANGUAGE_NAMES = {"en": "ingliz", "ru": "rus"}
_VALID_LEVELS = {"A1", "A2", "B1", "B2", "C1"}


def _question_system_prompt(language: str) -> str:
    lang_name = _LANGUAGE_NAMES.get(language, "ingliz")
    return (
        f"Siz IMKON Digital platformasidagi {lang_name} tili daraja aniqlash testi "
        "imtihonchisisiz (CEFR: A1-C1). Nogironligi bor insonlar bilan ishlaysiz — "
        "sabrli, hurmatli va rag'batlantiruvchi bo'ling, hech qachon xijolat qildirmang.\n\n"
        f"Savollarni {lang_name} tilida bering (bu haqiqiy til amaliyoti bo'lsin), lekin "
        "juda oddiy savoldan boshlang. Har javobdan keyin javob sifatiga qarab keyingi "
        "savolni birozgina qiyinlashtiring yoki soddalashtiring (adaptiv daraja aniqlash). "
        "Bir vaqtda faqat BITTA savol bering, qisqa va tabiiy. Hozircha aniqlangan darajani "
        "AYTMANG — bu faqat suhbat oxirida alohida hisoblanadi."
    )


def _verdict_system_prompt(language: str) -> str:
    lang_name = _LANGUAGE_NAMES.get(language, "ingliz")
    return (
        f"Quyida bir foydalanuvchining {lang_name} tili darajasini aniqlash uchun "
        "o'tkazilgan suhbat tarixi berilgan. Uning javoblari asosida CEFR darajasini "
        "(A1, A2, B1, B2 yoki C1) aniqlang. FAQAT quyidagi JSON formatida javob bering, "
        "boshqa hech qanday matn (izoh, ```json belgisi va h.k.) yozmang:\n"
        '{"cefr_level": "A1" | "A2" | "B1" | "B2" | "C1", '
        '"feedback": "<3-5 gaplik, lotin yozuvidagi o\'zbekcha izoh: kuchli va '
        'yaxshilash kerak bo\'lgan tomonlar>"}'
    )


def _parse_verdict(reply: str) -> tuple[str | None, str]:
    """Format xato bo'lsa `None` qaytaradi — bu foydalanuvchining texnik AI
    nosozligi tufayli soxta "A1" (eng past daraja) bilan belgilanib
    qolmasligi uchun (avval shunday edi — Ziyo prompt'idagi "hech qachon
    xijolat qildirmang" tamoyiliga zid edi). Frontend `cefr_level=null`ni
    "qayta urining" holati sifatida ko'rsatishi kerak.
    """
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").removeprefix("json").strip()
    try:
        data = json.loads(cleaned)
        level = str(data["cefr_level"]).strip().upper()
        if level not in _VALID_LEVELS:
            raise ValueError(f"noma'lum daraja: {level}")
        return level, str(data["feedback"])[:2000]
    except (KeyError, ValueError, TypeError, json.JSONDecodeError):
        return None, "Natijani aniqlab bo'lmadi — texnik nosozlik yuz berdi. Iltimos, testni qayta boshlang."


async def _get_session_or_404(
    db: AsyncSession, session_id: int, user_id: int
) -> PlacementTestSession:
    session = await db.get(PlacementTestSession, session_id)
    if session is None or session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessiya topilmadi")
    return session


async def _to_detail(db: AsyncSession, session: PlacementTestSession) -> PlacementTestSessionDetail:
    messages = (
        (
            await db.execute(
                select(PlacementTestMessage)
                .where(PlacementTestMessage.session_id == session.id)
                .order_by(PlacementTestMessage.created_at.asc())
            )
        )
        .scalars()
        .all()
    )
    return PlacementTestSessionDetail(
        id=session.id,
        language=session.language,
        status=session.status,
        cefr_level=session.cefr_level,
        level_feedback=session.level_feedback,
        created_at=session.created_at,
        completed_at=session.completed_at,
        messages=[PlacementTestMessageOut.model_validate(m) for m in messages],
    )


async def start_session(db: AsyncSession, user: User, language: str) -> PlacementTestSessionDetail:
    await check_and_increment_quota(db, user.id, AiFeature.PLACEMENT_TEST)

    session = PlacementTestSession(user_id=user.id, language=language)
    db.add(session)
    await db.flush()

    opening = await generate_ai_reply(
        system=_question_system_prompt(language),
        messages=[
            {
                "role": "user",
                "content": "Testni boshlang — qisqa tanishtiring va birinchi (juda oddiy) savolni bering.",
            }
        ],
        max_tokens=1024,
    )
    db.add(
        PlacementTestMessage(session_id=session.id, role=MessageRole.ASSISTANT, content=opening)
    )
    await db.commit()
    await db.refresh(session)
    return await _to_detail(db, session)


async def send_message(
    db: AsyncSession, user: User, session_id: int, content: str
) -> PlacementTestSessionDetail:
    session = await _get_session_or_404(db, session_id, user.id)
    if session.status != InterviewSessionStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Sessiya yakunlangan")

    history = (
        (
            await db.execute(
                select(PlacementTestMessage)
                .where(PlacementTestMessage.session_id == session.id)
                .order_by(PlacementTestMessage.created_at.asc())
                .limit(_HISTORY_LIMIT)
            )
        )
        .scalars()
        .all()
    )

    db.add(PlacementTestMessage(session_id=session.id, role=MessageRole.USER, content=content))
    await db.flush()

    messages: list[AiMessage] = [
        {"role": "user" if m.role == MessageRole.USER else "assistant", "content": m.content}
        for m in history
    ]
    messages.append({"role": "user", "content": content})

    reply = await generate_ai_reply(
        system=_question_system_prompt(session.language), messages=messages, max_tokens=1024
    )
    db.add(PlacementTestMessage(session_id=session.id, role=MessageRole.ASSISTANT, content=reply))
    await db.commit()
    await db.refresh(session)
    return await _to_detail(db, session)


async def complete_session(
    db: AsyncSession, user: User, session_id: int
) -> PlacementTestSessionDetail:
    session = await _get_session_or_404(db, session_id, user.id)
    if session.status != InterviewSessionStatus.ACTIVE:
        return await _to_detail(db, session)

    history = (
        (
            await db.execute(
                select(PlacementTestMessage)
                .where(PlacementTestMessage.session_id == session.id)
                .order_by(PlacementTestMessage.created_at.asc())
            )
        )
        .scalars()
        .all()
    )
    transcript = "\n".join(
        f"{'Imtihonchi' if m.role == MessageRole.ASSISTANT else 'Foydalanuvchi'}: {m.content}"
        for m in history
    )

    reply = await generate_ai_reply(
        system=_verdict_system_prompt(session.language),
        messages=[{"role": "user", "content": transcript or "(suhbat bo'sh)"}],
        max_tokens=1024,
    )
    level, feedback = _parse_verdict(reply)

    session.status = InterviewSessionStatus.COMPLETED
    session.completed_at = datetime.now(UTC)
    session.cefr_level = level
    session.level_feedback = feedback
    await db.commit()
    await db.refresh(session)
    return await _to_detail(db, session)


async def get_session(db: AsyncSession, user: User, session_id: int) -> PlacementTestSessionDetail:
    session = await _get_session_or_404(db, session_id, user.id)
    return await _to_detail(db, session)


async def list_sessions(db: AsyncSession, user: User) -> list[PlacementTestSessionCard]:
    sessions = (
        (
            await db.execute(
                select(PlacementTestSession)
                .where(PlacementTestSession.user_id == user.id)
                .order_by(PlacementTestSession.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    return [
        PlacementTestSessionCard(
            id=s.id,
            language=s.language,
            status=s.status,
            cefr_level=s.cefr_level,
            level_feedback=s.level_feedback,
            created_at=s.created_at,
            completed_at=s.completed_at,
        )
        for s in sessions
    ]
