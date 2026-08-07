"""15 bosqichli hayot trayektoriyasi (Vision Book 1.5).

Har bosqich real, mustaqil ma'lumot signalidan hisoblanadi (ro'yxatdan
o'tish, tasdiqlash, Enrollment, Submission, PortfolioItem, Certificate,
Mentorship, Placement, marketplace Order, instructor roli). Bosqichlar
CHIZIQLI TALAB QILINMAYDI — masalan foydalanuvchi mentor bo'lishdan oldin
allaqachon sertifikat olgan bo'lishi mumkin; har biri o'z holicha "done".

"current" — eng kichik raqamli hali bajarilmagan bosqich (keyingi taklif
sifatida ajratiladi). Undan boshqa hali bajarilmagan bosqichlar "locked".
14-bosqich ("Biznes boshlash") uchun platformada hozircha tekshiriladigan
real signal yo'q — shuning uchun doim "locked" bo'lib qoladi (fabrikatsiya
qilinmaydi).
"""

from dataclasses import dataclass

from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai import CareerCoachMessage
from app.models.certificate import Certificate
from app.models.course import Enrollment, Submission
from app.models.employer import Application, Placement
from app.models.enums import (
    MentorshipStatus,
    MessageRole,
    OrderStatus,
    RoleCode,
    UserStatus,
    VerifiedStatus,
)
from app.models.marketplace import Order
from app.models.mentorship import Mentorship
from app.models.portfolio import PortfolioItem
from app.models.user import User
from app.schemas.user import TrajectoryOut, TrajectoryStep


@dataclass(frozen=True)
class StepDef:
    number: int
    phase: str
    title: str


STEP_DEFS: tuple[StepDef, ...] = (
    StepDef(1, "A", "Profil yaratish"),
    StepDef(2, "A", "Shaxsni tasdiqlash"),
    StepDef(3, "A", "Nogironlik maqomini tasdiqlash"),
    StepDef(4, "A", "Qobiliyatlarni aniqlash"),
    StepDef(5, "B", "AI kasb tavsiyasi"),
    StepDef(6, "B", "Kurslarga yozilish"),
    StepDef(7, "B", "Amaliy topshiriqlar"),
    StepDef(8, "B", "Portfolio yaratish"),
    StepDef(9, "B", "Sertifikat (Skills Passport)"),
    StepDef(10, "C", "Mentor bilan ishlash"),
    StepDef(11, "D", "Ish topish"),
    StepDef(12, "D", "Freelancer bo'lish"),
    StepDef(13, "D", "Barqaror daromad"),
    StepDef(14, "E", "Biznes boshlash"),
    StepDef(15, "E", "Mentor darajasiga chiqish"),
)


async def _exists(db: AsyncSession, stmt: Select[tuple[int]]) -> bool:
    row = (await db.execute(stmt.limit(1))).first()
    return row is not None


async def _completed_steps(db: AsyncSession, user: User) -> set[int]:
    """Har bosqichni MUSTAQIL ravishda, haqiqiy ma'lumotdan tekshiradi."""
    done = {1}  # profil yaratilgan (royxatdan otgan)

    if user.status == UserStatus.ACTIVE:
        done.add(2)  # telefon tasdiqlangan

    profile = user.disability_profile
    if profile is not None and profile.verified_status == VerifiedStatus.VERIFIED:
        done.add(3)  # nogironlik maqomi tasdiqlangan
    if profile is not None and bool(profile.work_conditions):
        done.add(4)  # ish sharoiti ehtiyojlari aniqlangan

    if await _exists(
        db,
        select(CareerCoachMessage.id).where(
            CareerCoachMessage.user_id == user.id,
            CareerCoachMessage.role == MessageRole.ASSISTANT,
        ),
    ):
        done.add(5)  # AI karyera-koch javob bergan

    if await _exists(db, select(Enrollment.id).where(Enrollment.user_id == user.id)):
        done.add(6)

    if await _exists(db, select(Submission.id).where(Submission.user_id == user.id)):
        done.add(7)

    if await _exists(db, select(PortfolioItem.id).where(PortfolioItem.user_id == user.id)):
        done.add(8)

    if await _exists(db, select(Certificate.id).where(Certificate.user_id == user.id)):
        done.add(9)

    if await _exists(
        db,
        select(Mentorship.id).where(
            Mentorship.mentee_id == user.id,
            Mentorship.status.in_((MentorshipStatus.ACTIVE, MentorshipStatus.COMPLETED)),
        ),
    ):
        done.add(10)

    placement_stmt = select(Placement.id).join(
        Application, Application.id == Placement.application_id
    ).where(Application.user_id == user.id)
    if await _exists(db, placement_stmt):
        done.add(11)

    if await _exists(
        db,
        select(Order.id).where(
            Order.freelancer_id == user.id, Order.status == OrderStatus.PAID
        ),
    ):
        done.add(12)

    if await _exists(
        db, placement_stmt.where(Placement.stable_confirmed_at.is_not(None))
    ):
        done.add(13)  # barqaror daromad — 3 oylik check-in tasdiqlangan

    # 14 "Biznes boshlash" — platformada kuzatiladigan real signal yo'q,
    # ataylab o'tkazib yuboriladi.

    if any(r.code == RoleCode.INSTRUCTOR for r in user.roles):
        done.add(15)  # o'zi ustoz/mentor darajasiga chiqqan

    return done


async def build_trajectory(db: AsyncSession, user: User) -> TrajectoryOut:
    done = await _completed_steps(db, user)
    not_done = [d.number for d in STEP_DEFS if d.number not in done]
    current = not_done[0] if not_done else STEP_DEFS[-1].number
    steps: list[TrajectoryStep] = []
    for d in STEP_DEFS:
        if d.number in done:
            step_status = "done"
        elif d.number == current:
            step_status = "current"
        else:
            step_status = "locked"
        steps.append(
            TrajectoryStep(number=d.number, phase=d.phase, title=d.title, status=step_status)
        )
    return TrajectoryOut(current_step=current, steps=steps)
