"""CV Builder — Skills Passport ma'lumotlari asosida AI CV matni va PDF yaratadi."""

import io

from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.core.ai_client import AiMessage, generate_ai_reply
from app.core.ai_quota import check_and_increment_quota
from app.core.cv_pdf import render_cv_pdf
from app.models.ai import GeneratedCv
from app.models.employer import Vacancy
from app.models.enums import AiFeature
from app.models.user import User
from app.modules.passport import service as passport_service
from app.schemas.ai import GeneratedCvOut

_SYSTEM_PROMPT = (
    "Siz professional CV muharririsiz. Berilgan ma'lumotlar asosida ixcham, "
    "ishonchli va professional CV matni tuzasiz — lotin yozuvidagi o'zbek "
    "tilida, Markdown uslubida (## bo'lim sarlavhalari, - band belgilari). "
    "Hech qanday to'qima ma'lumot qo'shmang — faqat berilgan faktlarga tayaning."
)


def _build_prompt(
    user: User,
    certificates: list[str],
    portfolio: list[str],
    skills: list[str],
    vacancy: Vacancy | None,
) -> str:
    lines = [
        f"Ism: {user.full_name}",
        f"Foydalanuvchi nomi: @{user.username}",
    ]
    if certificates:
        lines.append("Sertifikatlar: " + "; ".join(certificates))
    else:
        lines.append("Sertifikatlar: hali yo'q")
    if portfolio:
        lines.append("Portfolio ishlari: " + "; ".join(portfolio))
    else:
        lines.append("Portfolio: hali yo'q")
    if skills:
        lines.append("Ko'nikmalar: " + ", ".join(skills))
    if vacancy is not None:
        req_skills = ", ".join(vacancy.skills_required) or "umumiy"
        lines.append(
            f"CV '{vacancy.title}' lavozimiga moslashtirilsin — kerakli ko'nikmalar: {req_skills}. "
            "Mos keladigan haqiqiy tajriba/ko'nikmalarni birinchi o'ringa chiqaring."
        )
    lines.append(
        "Quyidagi bo'limlar bilan CV tuzing: Qisqacha tavsif, Ko'nikmalar, "
        "Sertifikatlar, Portfolio/Loyihalar. Ma'lumot yetarli bo'lmasa, "
        "o'sha bo'limni umumiy imkoniyat sifatida qisqa yozing, to'qib chiqarmang."
    )
    return "\n".join(lines)


async def generate_cv(
    db: AsyncSession, user: User, vacancy_id: int | None = None
) -> GeneratedCvOut:
    await check_and_increment_quota(db, user.id, AiFeature.CV_BUILDER)

    certificates = await passport_service.list_my_certificates(db, user)
    portfolio = await passport_service.list_my_portfolio(db, user)
    skills = sorted({s for p in portfolio for s in p.skills})
    vacancy = await db.get(Vacancy, vacancy_id) if vacancy_id else None

    prompt = _build_prompt(
        user,
        [c.course_title for c in certificates if c.course_title],
        [p.title for p in portfolio],
        skills,
        vacancy,
    )
    messages: list[AiMessage] = [{"role": "user", "content": prompt}]
    content = await generate_ai_reply(system=_SYSTEM_PROMPT, messages=messages, max_tokens=2000)

    pdf_bytes = render_cv_pdf(full_name=user.full_name, content=content)
    storage.ensure_bucket()
    pdf_url = storage.upload_fileobj(io.BytesIO(pdf_bytes), f"cv/{user.id}.pdf", "application/pdf")

    existing = await db.get(GeneratedCv, user.id)
    if existing is not None:
        existing.content = content
        existing.pdf_url = pdf_url
        cv = existing
    else:
        cv = GeneratedCv(user_id=user.id, content=content, pdf_url=pdf_url)
        db.add(cv)
    await db.commit()
    await db.refresh(cv)
    return GeneratedCvOut.model_validate(cv)


async def get_my_cv(db: AsyncSession, user_id: int) -> GeneratedCvOut | None:
    cv = await db.get(GeneratedCv, user_id)
    return GeneratedCvOut.model_validate(cv) if cv else None
