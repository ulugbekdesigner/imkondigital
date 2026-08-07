"""Career Coach — kasb-hunar bo'yicha AI suhbatdosh, foydalanuvchi tarixi bilan."""

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_client import AiMessage, generate_ai_reply
from app.core.ai_quota import check_and_increment_quota
from app.models.ai import CareerCoachMessage
from app.models.enums import AiFeature, MessageRole
from app.models.user import User
from app.modules.passport import service as passport_service
from app.schemas.ai import CareerCoachMessageOut

_HISTORY_LIMIT = 20


def _system_prompt(user: User, cert_count: int, portfolio_count: int, skills: list[str]) -> str:
    profile = f"{cert_count} ta sertifikat, {portfolio_count} ta portfolio ishi"
    if skills:
        profile += ", ko'nikmalar: " + ", ".join(skills)
    return (
        "Siz IMKON Digital platformasidagi Career Coach'siz — O'zbekistonda "
        "nogironligi bor insonlarga kasb-hunar va martaba bo'yicha maslahat berasiz. "
        "Ohang: hurmatli, imkoniyatga yo'naltirilgan, hech qachon rahm-shafqat "
        "ohangida gapirmaysiz. Javoblaringiz qisqa (3-6 gap), amaliy va lotin "
        f"yozuvidagi o'zbek tilida bo'lsin. Foydalanuvchi ismi: {user.full_name}. "
        f"Foydalanuvchi profili: {profile}. Yo'nalish tavsiya qilganda faqat shu "
        "profilga asoslaning — to'qima tajriba yoki ko'nikma qo'shmang. Bir nechta "
        "variant tavsiya qilsangiz, ularni raqamlangan ro'yxat (1. 2. 3.) sifatida bering."
    )


async def list_messages(db: AsyncSession, user_id: int) -> list[CareerCoachMessageOut]:
    rows = (
        (
            await db.execute(
                select(CareerCoachMessage)
                .where(CareerCoachMessage.user_id == user_id)
                .order_by(CareerCoachMessage.created_at.asc())
            )
        )
        .scalars()
        .all()
    )
    return [CareerCoachMessageOut.model_validate(m) for m in rows]


async def send_message(db: AsyncSession, user: User, content: str) -> CareerCoachMessageOut:
    await check_and_increment_quota(db, user.id, AiFeature.CAREER_COACH)

    history = list(
        (
            await db.execute(
                select(CareerCoachMessage)
                .where(CareerCoachMessage.user_id == user.id)
                .order_by(CareerCoachMessage.created_at.desc())
                .limit(_HISTORY_LIMIT)
            )
        ).scalars()
    )
    history.reverse()

    db.add(CareerCoachMessage(user_id=user.id, role=MessageRole.USER, content=content))
    await db.flush()

    messages: list[AiMessage] = [
        {"role": "user" if m.role == MessageRole.USER else "assistant", "content": m.content}
        for m in history
    ]
    messages.append({"role": "user", "content": content})

    certificates = await passport_service.list_my_certificates(db, user)
    portfolio = await passport_service.list_my_portfolio(db, user)
    skills = sorted({s for p in portfolio for s in p.skills})
    system = _system_prompt(user, len(certificates), len(portfolio), skills)

    reply_text = await generate_ai_reply(system=system, messages=messages, max_tokens=2048)

    assistant_msg = CareerCoachMessage(
        user_id=user.id, role=MessageRole.ASSISTANT, content=reply_text
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)
    return CareerCoachMessageOut.model_validate(assistant_msg)


async def clear_history(db: AsyncSession, user_id: int) -> None:
    await db.execute(delete(CareerCoachMessage).where(CareerCoachMessage.user_id == user_id))
    await db.commit()
