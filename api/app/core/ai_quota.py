"""AI xususiyatlari uchun kunlik kvota nazorati — narxlar portlashidan himoya (12-bo'lim)."""

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.subscription import get_plan
from app.models.ai import AiUsage
from app.models.enums import AiFeature, SubscriptionPlan

settings = get_settings()

_DAILY_LIMITS: dict[str, int] = {
    AiFeature.CAREER_COACH: settings.ai_daily_quota_career_coach,
    AiFeature.CV_BUILDER: settings.ai_daily_quota_cv_builder,
    AiFeature.INTERVIEW_COACH: settings.ai_daily_quota_interview_coach,
    AiFeature.STUDY_BUDDY: settings.ai_daily_quota_study_buddy,
    AiFeature.EXAM_GRADER: settings.ai_daily_quota_exam_grader,
    AiFeature.ZIYO: settings.ai_daily_quota_ziyo,
    AiFeature.CASE_STORY: settings.ai_daily_quota_case_story,
    AiFeature.PLACEMENT_TEST: settings.ai_daily_quota_placement_test,
}

# Ziyo — 4.1-bo'lim ("3 daraja" modeli) bo'yicha yagona reja-farqlangan
# xususiyat; qolgan AI vositalari hozircha tekis limitda qoladi.
_ZIYO_LIMIT_BY_PLAN: dict[str, int] = {
    SubscriptionPlan.FREE: settings.ai_daily_quota_ziyo,
    SubscriptionPlan.PLUS: settings.ai_daily_quota_ziyo_plus,
    SubscriptionPlan.PRO: settings.ai_daily_quota_ziyo_pro,
}


async def check_and_increment_quota(db: AsyncSession, user_id: int, feature: str) -> None:
    """Kunlik limitni tekshiradi, oshgan bo'lsa 429 ko'taradi; aks holda sonini +1 qiladi.

    Chaqiruvchi o'z tranzaksiyasini keyinroq commit qiladi (bu funksiya faqat flush qiladi).
    """
    today = datetime.now(UTC).date()
    usage = (
        await db.execute(
            select(AiUsage).where(
                AiUsage.user_id == user_id,
                AiUsage.feature == feature,
                AiUsage.usage_date == today,
            )
        )
    ).scalar_one_or_none()

    limit = _DAILY_LIMITS.get(feature, 0)
    if feature == AiFeature.ZIYO:
        plan = await get_plan(db, user_id)
        limit = _ZIYO_LIMIT_BY_PLAN.get(plan, limit)
    current = usage.count if usage else 0
    if current >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Kunlik AI so'rovlar limiti tugadi. Ertaga qayta urinib ko'ring.",
        )

    if usage is None:
        db.add(AiUsage(user_id=user_id, feature=feature, usage_date=today, count=1))
    else:
        usage.count += 1
    await db.flush()
