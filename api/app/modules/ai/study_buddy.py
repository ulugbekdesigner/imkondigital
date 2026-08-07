"""AI Study Buddy — har video dars yonidagi AI suhbatdosh (V2-3/B2).

Dars konteksti (transkript) tizim promptiga to'g'ridan-to'g'ri kiritiladi (RAG
emas) — darslar qisqa/lokal bo'lgani uchun vektor qidiruv ortiqcha murakkablik
bo'lardi. Tarix (user_id, lesson_id) juftligi bo'yicha alohida saqlanadi —
foydalanuvchi darsni almashtirsa, suhbat shu darsga tegishli kontekst bilan
boshlanadi.
"""

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_client import AiMessage, generate_ai_reply
from app.core.ai_quota import check_and_increment_quota
from app.models.ai import StudyBuddyMessage
from app.models.course import Course, CourseModule, Enrollment, Lesson
from app.models.enums import AiFeature, MessageRole
from app.models.user import User
from app.schemas.ai import StudyBuddyMessageOut

_HISTORY_LIMIT = 20
_TRANSCRIPT_MAX_CHARS = 6000


def _system_prompt(lesson: Lesson) -> str:
    base = (
        "Siz IMKON Digital platformasidagi Study Buddy'siz — nogironligi bor "
        "o'quvchilarga video darsni tushunishda yordam berasiz. Ohang: sabrli, "
        "hurmatli, hech qachon kamsituvchi yoki rahm-shafqat ohangida emas. "
        "Javoblaringiz qisqa (3-6 gap), aniq va lotin yozuvidagi o'zbek tilida "
        f"bo'lsin. Dars nomi: '{lesson.title}'."
    )
    if lesson.description:
        base += f" Dars tavsifi: {lesson.description}"
    if lesson.transcript:
        transcript = lesson.transcript[:_TRANSCRIPT_MAX_CHARS]
        base += (
            f"\n\nDars transkripti (savolga javob berishda shunga tayaning):\n{transcript}"
        )
    else:
        base += " Bu darsning transkripti hali mavjud emas — umumiy mavzu bo'yicha yordam bering."
    return base


async def _get_lesson_or_404(db: AsyncSession, lesson_id: int) -> Lesson:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dars topilmadi")
    return lesson


async def _authorize_lesson_access(db: AsyncSession, user_id: int, lesson: Lesson) -> None:
    """Pullik kurslarda faqat ro'yxatdan o'tgan foydalanuvchi darsning transkriptiga

    asoslangan AI suhbatdan foydalana oladi (bepul kurslarda hamma uchun ochiq —
    xuddi video/transkriptning o'zi kabi, courses/service.py'dagi `reveal` mantig'iga mos).
    """
    module = await db.get(CourseModule, lesson.module_id)
    assert module is not None
    course = await db.get(Course, module.course_id)
    assert course is not None
    if course.is_free:
        return
    enrollment = (
        await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user_id, Enrollment.course_id == course.id
            )
        )
    ).scalar_one_or_none()
    if enrollment is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Bu darsga kirish huquqingiz yo'q"
        )


async def list_messages(
    db: AsyncSession, user_id: int, lesson_id: int
) -> list[StudyBuddyMessageOut]:
    rows = (
        (
            await db.execute(
                select(StudyBuddyMessage)
                .where(
                    StudyBuddyMessage.user_id == user_id,
                    StudyBuddyMessage.lesson_id == lesson_id,
                )
                .order_by(StudyBuddyMessage.created_at.asc())
            )
        )
        .scalars()
        .all()
    )
    return [StudyBuddyMessageOut.model_validate(m) for m in rows]


async def send_message(
    db: AsyncSession, user: User, lesson_id: int, content: str
) -> StudyBuddyMessageOut:
    lesson = await _get_lesson_or_404(db, lesson_id)
    await _authorize_lesson_access(db, user.id, lesson)
    await check_and_increment_quota(db, user.id, AiFeature.STUDY_BUDDY)

    history = list(
        (
            await db.execute(
                select(StudyBuddyMessage)
                .where(
                    StudyBuddyMessage.user_id == user.id,
                    StudyBuddyMessage.lesson_id == lesson_id,
                )
                .order_by(StudyBuddyMessage.created_at.desc())
                .limit(_HISTORY_LIMIT)
            )
        ).scalars()
    )
    history.reverse()

    db.add(
        StudyBuddyMessage(
            user_id=user.id, lesson_id=lesson_id, role=MessageRole.USER, content=content
        )
    )
    await db.flush()

    messages: list[AiMessage] = [
        {"role": "user" if m.role == MessageRole.USER else "assistant", "content": m.content}
        for m in history
    ]
    messages.append({"role": "user", "content": content})

    reply_text = await generate_ai_reply(
        system=_system_prompt(lesson), messages=messages, max_tokens=2048
    )

    assistant_msg = StudyBuddyMessage(
        user_id=user.id, lesson_id=lesson_id, role=MessageRole.ASSISTANT, content=reply_text
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)
    return StudyBuddyMessageOut.model_validate(assistant_msg)
