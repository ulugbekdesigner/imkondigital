"""Kunlik faollik ketma-ketligi (streak) — Duolingo uslubidagi odat mexanizmi.

`record_activity()` — dars yakunlash yoki test topshirish kabi haqiqiy
o'quv harakati sodir bo'lganda chaqiriladi (`courses.service.complete_lesson`,
`assessment.service.submit_attempt`). Bir kunda bir necha marta chaqirilsa
ham ketma-ketlik faqat bir marta oshadi (idempotent — kun ichida).
"""

from datetime import UTC, datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.streak import UserStreak
from app.models.user import User
from app.schemas.streak import StreakOut


async def record_activity(db: AsyncSession, user: User) -> UserStreak:
    today = datetime.now(UTC).date()
    streak = await db.get(UserStreak, user.id)

    if streak is None:
        streak = UserStreak(
            user_id=user.id, current_streak=1, longest_streak=1, last_activity_date=today
        )
        db.add(streak)
    elif streak.last_activity_date == today:
        pass  # shu kun uchun allaqachon hisoblangan
    elif streak.last_activity_date == today - timedelta(days=1):
        streak.current_streak += 1
        streak.last_activity_date = today
        streak.longest_streak = max(streak.longest_streak, streak.current_streak)
    else:
        # 1 kundan ortiq uzilish (yoki hech qachon faol bo'lmagan) — qayta boshlanadi
        streak.current_streak = 1
        streak.last_activity_date = today

    await db.commit()
    await db.refresh(streak)
    return streak


async def get_streak(db: AsyncSession, user: User) -> StreakOut:
    streak = await db.get(UserStreak, user.id)
    if streak is None:
        return StreakOut(
            current_streak=0, longest_streak=0, last_activity_date=None, active_today=False
        )
    today = datetime.now(UTC).date()
    return StreakOut(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_activity_date=streak.last_activity_date,
        active_today=streak.last_activity_date == today,
    )
