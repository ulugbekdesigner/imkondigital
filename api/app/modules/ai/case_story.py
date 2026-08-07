"""Case-hikoya — Ziyo bilan birga portfolio elementini yozish (Portfolio 2.0, 6.3-bo'lim).

interview_coach.py bilan bir xil sessiya+xabar+yakunlash tuzilishi, lekin
`complete_session()` faqat holat almashtirmaydi — suhbatni Gemini orqali
tahlil qilib, natijani (vazifa/natija/ko'nikmalar) to'g'ridan-to'g'ri
PortfolioItem'ga yozadi (exam_grader.py'dagi "qat'iy JSON so'ra" naqshi).
Mijoz bahosi ATAYLAB bu yerda YO'Q — AI hech qachon mijoz so'zini o'ylab
topmaydi, bu maydon faqat qo'lda to'ldiriladi.
"""

import json
from dataclasses import dataclass
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_client import AiMessage, generate_ai_reply
from app.core.ai_quota import check_and_increment_quota
from app.models.ai import CaseStoryMessage, CaseStorySession
from app.models.enums import AiFeature, InterviewSessionStatus, MessageRole
from app.models.portfolio import PortfolioItem
from app.models.user import User
from app.schemas.ai import CaseStoryMessageOut, CaseStorySessionCard, CaseStorySessionDetail

_HISTORY_LIMIT = 20

_CHAT_SYSTEM_PROMPT = (
    "Siz Ziyo'siz — IMKON Digital platformasining yordamchisi. Foydalanuvchiga "
    "portfolio case-hikoyasini (bitta ish/loyiha haqida) birga yozishda yordam "
    "berasiz. Suhbat orqali ketma-ket bilib oling: (1) qanday VAZIFA bilan "
    "shug'ullangan, (2) qanday YONDASHGAN — jarayon qanday bo'lgan (aniq "
    "qadamlar), (3) NATIJA nima bo'lgan (imkon bo'lsa o'lchanadigan). Bir "
    "vaqtda faqat bitta savol bering, qisqa va aniq. Lotin yozuvidagi o'zbek "
    "tilida, hurmatli va rag'batlantiruvchi ohangda. Foydalanuvchi javoblari "
    "qisqa bo'lsa ham qoniqing — batafsil yozishga majburlamang, 3-4 savoldan "
    "keyin yetarli ma'lumot to'plangan bo'lishi kerak."
)

_SYNTHESIS_SYSTEM_PROMPT = (
    "Quyida foydalanuvchi bilan portfolio case-hikoyasi haqida bo'lgan suhbat "
    "bor. Shu suhbatdan quyidagilarni ajratib oling va FAQAT quyidagi JSON "
    "formatida javob bering, boshqa hech qanday matn (izoh, ```json belgisi "
    "va h.k.) yozmang:\n"
    '{"task": "<vazifa — 1-2 gap, lotin yozuvidagi o\'zbek tilida>", '
    '"result": "<natija — 1-2 gap>", '
    '"skills": ["<ko\'nikma>", ...]}\n'
    "Faqat suhbatda HAQIQATAN aytilgan narsalarni yozing, hech narsani o'ylab "
    "topmang. Ko'nikmalar ro'yxati 2-6 ta, qisqa so'z/ibora shaklida "
    "(masalan \"Excel\", \"mijoz bilan muloqot\")."
)


@dataclass
class SynthesisResult:
    task: str
    result: str
    skills: list[str]


def _parse_synthesis(reply: str) -> SynthesisResult | None:
    cleaned = reply.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`").removeprefix("json").strip()
    try:
        data = json.loads(cleaned)
        skills = [str(s)[:60] for s in data["skills"]][:6]
        return SynthesisResult(
            task=str(data["task"])[:2000],
            result=str(data["result"])[:2000],
            skills=skills,
        )
    except (KeyError, ValueError, TypeError, json.JSONDecodeError):
        return None


async def _get_session_or_404(db: AsyncSession, session_id: int, user_id: int) -> CaseStorySession:
    session = await db.get(CaseStorySession, session_id)
    if session is None or session.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessiya topilmadi")
    return session


async def _to_detail(db: AsyncSession, session: CaseStorySession) -> CaseStorySessionDetail:
    item = await db.get(PortfolioItem, session.portfolio_item_id)
    messages = (
        (
            await db.execute(
                select(CaseStoryMessage)
                .where(CaseStoryMessage.session_id == session.id)
                .order_by(CaseStoryMessage.created_at.asc())
            )
        )
        .scalars()
        .all()
    )
    return CaseStorySessionDetail(
        id=session.id,
        portfolio_item_id=session.portfolio_item_id,
        portfolio_item_title=item.title if item else "",
        status=session.status,
        created_at=session.created_at,
        completed_at=session.completed_at,
        messages=[CaseStoryMessageOut.model_validate(m) for m in messages],
    )


async def start_session(
    db: AsyncSession, user: User, portfolio_item_id: int
) -> CaseStorySessionDetail:
    item = await db.get(PortfolioItem, portfolio_item_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topilmadi")

    await check_and_increment_quota(db, user.id, AiFeature.CASE_STORY)

    session = CaseStorySession(user_id=user.id, portfolio_item_id=item.id)
    db.add(session)
    await db.flush()

    opening = await generate_ai_reply(
        system=_CHAT_SYSTEM_PROMPT,
        messages=[
            {
                "role": "user",
                "content": (
                    f"Portfolio elementi: '{item.title}'. Suhbatni boshlang — qisqa "
                    "tanishtiring va birinchi savolni bering (vazifa haqida)."
                ),
            }
        ],
        max_tokens=2048,
    )
    db.add(CaseStoryMessage(session_id=session.id, role=MessageRole.ASSISTANT, content=opening))
    await db.commit()
    await db.refresh(session)
    return await _to_detail(db, session)


async def send_message(
    db: AsyncSession, user: User, session_id: int, content: str
) -> CaseStorySessionDetail:
    session = await _get_session_or_404(db, session_id, user.id)
    if session.status != InterviewSessionStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Sessiya yakunlangan")

    history = (
        (
            await db.execute(
                select(CaseStoryMessage)
                .where(CaseStoryMessage.session_id == session.id)
                .order_by(CaseStoryMessage.created_at.asc())
                .limit(_HISTORY_LIMIT)
            )
        )
        .scalars()
        .all()
    )

    db.add(CaseStoryMessage(session_id=session.id, role=MessageRole.USER, content=content))
    await db.flush()

    messages: list[AiMessage] = [
        {"role": "user" if m.role == MessageRole.USER else "assistant", "content": m.content}
        for m in history
    ]
    messages.append({"role": "user", "content": content})

    reply = await generate_ai_reply(system=_CHAT_SYSTEM_PROMPT, messages=messages, max_tokens=2048)
    db.add(CaseStoryMessage(session_id=session.id, role=MessageRole.ASSISTANT, content=reply))
    await db.commit()
    await db.refresh(session)
    return await _to_detail(db, session)


async def complete_session(
    db: AsyncSession, user: User, session_id: int
) -> CaseStorySessionDetail:
    session = await _get_session_or_404(db, session_id, user.id)
    if session.status == InterviewSessionStatus.ACTIVE:
        history = (
            (
                await db.execute(
                    select(CaseStoryMessage)
                    .where(CaseStoryMessage.session_id == session.id)
                    .order_by(CaseStoryMessage.created_at.asc())
                )
            )
            .scalars()
            .all()
        )
        transcript = "\n".join(
            f"{'Foydalanuvchi' if m.role == MessageRole.USER else 'Ziyo'}: {m.content}"
            for m in history
        )

        synthesis: SynthesisResult | None = None
        try:
            reply = await generate_ai_reply(
                system=_SYNTHESIS_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": transcript}],
                max_tokens=1024,
            )
            synthesis = _parse_synthesis(reply)
        except HTTPException:
            synthesis = None

        if synthesis is not None:
            item = await db.get(PortfolioItem, session.portfolio_item_id)
            if item is not None:
                item.task = synthesis.task
                item.result = synthesis.result
                # Mavjud ko'nikmalarga QO'SHILADI, ustidan yozilmaydi — foydalanuvchi
                # qo'lda kiritgan teglar yo'qolib qolmasin.
                item.skills = list(dict.fromkeys([*item.skills, *synthesis.skills]))

        session.status = InterviewSessionStatus.COMPLETED
        session.completed_at = datetime.now(UTC)
        await db.commit()
        await db.refresh(session)
    return await _to_detail(db, session)


async def get_session(db: AsyncSession, user: User, session_id: int) -> CaseStorySessionDetail:
    session = await _get_session_or_404(db, session_id, user.id)
    return await _to_detail(db, session)


async def list_sessions(db: AsyncSession, user: User) -> list[CaseStorySessionCard]:
    sessions = (
        (
            await db.execute(
                select(CaseStorySession)
                .where(CaseStorySession.user_id == user.id)
                .order_by(CaseStorySession.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    cards = []
    for s in sessions:
        item = await db.get(PortfolioItem, s.portfolio_item_id)
        cards.append(
            CaseStorySessionCard(
                id=s.id,
                portfolio_item_id=s.portfolio_item_id,
                portfolio_item_title=item.title if item else "",
                status=s.status,
                created_at=s.created_at,
                completed_at=s.completed_at,
            )
        )
    return cards
