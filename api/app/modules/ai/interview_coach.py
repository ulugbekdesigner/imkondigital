"""Interview Coach — AI bilan sinov suhbati (savol-javob-fikr-mulohaza)."""

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_client import AiMessage, generate_ai_reply
from app.core.ai_quota import check_and_increment_quota
from app.models.ai import InterviewMessage, InterviewSession
from app.models.employer import Vacancy
from app.models.enums import AiFeature, InterviewSessionStatus, MessageRole
from app.models.user import User
from app.schemas.ai import InterviewMessageOut, InterviewSessionCard, InterviewSessionDetail

_HISTORY_LIMIT = 20


def _system_prompt(vacancy: Vacancy | None) -> str:
    base = (
        "Siz Interview Coach'siz — nogironligi bor insonlarga ish suhbatiga "
        "tayyorlanishda yordam berasiz. Har javobdan keyin qisqa fikr-mulohaza "
        "bering (nima yaxshi, nimani yaxshilash mumkin), so'ng keyingi savolni "
        "bering. Bir vaqtda faqat bitta savol. Lotin yozuvidagi o'zbek tilida, "
        "hurmatli va rag'batlantiruvchi ohangda gapiring."
    )
    if vacancy is not None:
        skills = ", ".join(vacancy.skills_required) or "umumiy"
        base += (
            f" Suhbat '{vacancy.title}' lavozimiga mo'ljallangan, kerakli ko'nikmalar: {skills}."
        )
    return base


async def _get_session_or_404(db: AsyncSession, session_id: int, user_id: int) -> InterviewSession:
    session = await db.get(InterviewSession, session_id)
    if session is None or session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessiya topilmadi")
    return session


async def _to_detail(db: AsyncSession, session: InterviewSession) -> InterviewSessionDetail:
    vacancy = await db.get(Vacancy, session.vacancy_id) if session.vacancy_id else None
    messages = (
        (
            await db.execute(
                select(InterviewMessage)
                .where(InterviewMessage.session_id == session.id)
                .order_by(InterviewMessage.created_at.asc())
            )
        )
        .scalars()
        .all()
    )
    return InterviewSessionDetail(
        id=session.id,
        vacancy_id=session.vacancy_id,
        vacancy_title=vacancy.title if vacancy else None,
        status=session.status,
        created_at=session.created_at,
        completed_at=session.completed_at,
        messages=[InterviewMessageOut.model_validate(m) for m in messages],
    )


async def start_session(
    db: AsyncSession, user: User, vacancy_id: int | None
) -> InterviewSessionDetail:
    await check_and_increment_quota(db, user.id, AiFeature.INTERVIEW_COACH)

    vacancy = await db.get(Vacancy, vacancy_id) if vacancy_id else None
    session = InterviewSession(user_id=user.id, vacancy_id=vacancy_id if vacancy else None)
    db.add(session)
    await db.flush()

    opening = await generate_ai_reply(
        system=_system_prompt(vacancy),
        messages=[
            {
                "role": "user",
                "content": "Suhbatni boshlang — qisqa tanishtiring va birinchi savolni bering.",
            }
        ],
        max_tokens=2048,
    )
    db.add(InterviewMessage(session_id=session.id, role=MessageRole.ASSISTANT, content=opening))
    await db.commit()
    await db.refresh(session)
    return await _to_detail(db, session)


async def send_message(
    db: AsyncSession, user: User, session_id: int, content: str
) -> InterviewSessionDetail:
    session = await _get_session_or_404(db, session_id, user.id)
    if session.status != InterviewSessionStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Sessiya yakunlangan")

    vacancy = await db.get(Vacancy, session.vacancy_id) if session.vacancy_id else None
    history = (
        (
            await db.execute(
                select(InterviewMessage)
                .where(InterviewMessage.session_id == session.id)
                .order_by(InterviewMessage.created_at.asc())
                .limit(_HISTORY_LIMIT)
            )
        )
        .scalars()
        .all()
    )

    db.add(InterviewMessage(session_id=session.id, role=MessageRole.USER, content=content))
    await db.flush()

    messages: list[AiMessage] = [
        {"role": "user" if m.role == MessageRole.USER else "assistant", "content": m.content}
        for m in history
    ]
    messages.append({"role": "user", "content": content})

    reply = await generate_ai_reply(
        system=_system_prompt(vacancy), messages=messages, max_tokens=2048
    )
    db.add(InterviewMessage(session_id=session.id, role=MessageRole.ASSISTANT, content=reply))
    await db.commit()
    await db.refresh(session)
    return await _to_detail(db, session)


async def complete_session(db: AsyncSession, user: User, session_id: int) -> InterviewSessionDetail:
    session = await _get_session_or_404(db, session_id, user.id)
    session.status = InterviewSessionStatus.COMPLETED
    session.completed_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(session)
    return await _to_detail(db, session)


async def get_session(db: AsyncSession, user: User, session_id: int) -> InterviewSessionDetail:
    session = await _get_session_or_404(db, session_id, user.id)
    return await _to_detail(db, session)


async def list_sessions(db: AsyncSession, user: User) -> list[InterviewSessionCard]:
    sessions = (
        (
            await db.execute(
                select(InterviewSession)
                .where(InterviewSession.user_id == user.id)
                .order_by(InterviewSession.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    cards = []
    for s in sessions:
        vacancy = await db.get(Vacancy, s.vacancy_id) if s.vacancy_id else None
        cards.append(
            InterviewSessionCard(
                id=s.id,
                vacancy_id=s.vacancy_id,
                vacancy_title=vacancy.title if vacancy else None,
                status=s.status,
                created_at=s.created_at,
                completed_at=s.completed_at,
            )
        )
    return cards
