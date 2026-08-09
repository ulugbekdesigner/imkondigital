"""Analitika biznes logikasi — barcha natijalar anonim AGREGAT (CONTRIBUTING.md 6-qoida).

Kichik hujayra bostirilishi (k-anonimlik): guruh soni < `_SUPPRESS_BELOW` bo'lsa
son o'rniga `None` qaytariladi — kam sonli guruhni (masalan bitta hudud/toifa)
alohida shaxsga bog'lab bo'lmasin.
"""

import csv
import io
from datetime import UTC, datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai import AiUsage
from app.models.benefits import UserBenefit
from app.models.course import Course, Enrollment
from app.models.donor import DonorProgram, ProgramEnrollment
from app.models.employer import Application, Company, Placement, Vacancy
from app.models.enums import (
    ApplicationStatus,
    CourseStatus,
    EnrollmentStatus,
    GigStatus,
    MentorshipStatus,
    OrderStatus,
    ProgramEnrollmentStatus,
    UserStatus,
    VacancyStatus,
    VerifiedStatus,
)
from app.models.marketplace import Gig, Order
from app.models.mentorship import Mentorship
from app.models.user import DisabilityProfile, Region, User
from app.schemas.analytics import (
    AdminAiUsageOverview,
    AdminOverview,
    AiFeatureUsage,
    BucketStat,
    DailyBucket,
    DonorOverview,
    GovOverview,
    RegistrationsDaily,
)

_SUPPRESS_BELOW = 3
_TASHKENT = ZoneInfo("Asia/Tashkent")


async def _scalar(db: AsyncSession, stmt: Select[tuple[int]]) -> int:
    return (await db.execute(stmt)).scalar_one() or 0


async def admin_overview(db: AsyncSession) -> AdminOverview:
    total_users = await _scalar(db, select(func.count()).select_from(User))
    active_users = await _scalar(
        db, select(func.count()).select_from(User).where(User.status == UserStatus.ACTIVE)
    )
    verified_profiles = await _scalar(
        db,
        select(func.count())
        .select_from(DisabilityProfile)
        .where(DisabilityProfile.verified_status == VerifiedStatus.VERIFIED),
    )
    published_courses = await _scalar(
        db, select(func.count()).select_from(Course).where(Course.status == CourseStatus.PUBLISHED)
    )
    total_enrollments = await _scalar(db, select(func.count()).select_from(Enrollment))
    completed_enrollments = await _scalar(
        db,
        select(func.count())
        .select_from(Enrollment)
        .where(Enrollment.status == EnrollmentStatus.COMPLETED),
    )
    published_vacancies = await _scalar(
        db,
        select(func.count()).select_from(Vacancy).where(Vacancy.status == VacancyStatus.PUBLISHED),
    )
    placements = await _scalar(db, select(func.count()).select_from(Placement))
    active_gigs = await _scalar(
        db, select(func.count()).select_from(Gig).where(Gig.status == GigStatus.PUBLISHED)
    )
    paid_orders_volume = await _scalar(
        db,
        select(func.coalesce(func.sum(Order.amount), 0)).where(Order.status == OrderStatus.PAID),
    )
    benefit_claims = await _scalar(db, select(func.count()).select_from(UserBenefit))
    active_mentorships = await _scalar(
        db,
        select(func.count())
        .select_from(Mentorship)
        .where(Mentorship.status == MentorshipStatus.ACTIVE),
    )

    return AdminOverview(
        total_users=total_users,
        active_users=active_users,
        verified_disability_profiles=verified_profiles,
        published_courses=published_courses,
        total_enrollments=total_enrollments,
        completed_enrollments=completed_enrollments,
        published_vacancies=published_vacancies,
        placements=placements,
        active_gigs=active_gigs,
        paid_orders_volume=paid_orders_volume,
        benefit_claims=benefit_claims,
        active_mentorships=active_mentorships,
    )


async def registrations_daily(db: AsyncSession) -> RegistrationsDaily:
    """Oxirgi 7 kun (Toshkent kuni bo'yicha) — kunlik ro'yxatdan o'tganlar soni.

    Shaxsiy ma'lumot ochilmaydi (faqat kunlik jami son), shuning uchun
    _SUPPRESS_BELOW kabi kichik-hujayra bostirish bu yerda kerak emas —
    boshqa xom son ko'rsatkichlar (total_users va h.k.) bilan bir xil.
    """
    today = datetime.now(UTC).astimezone(_TASHKENT).date()
    start_date = today - timedelta(days=6)
    start_at = datetime(start_date.year, start_date.month, start_date.day, tzinfo=_TASHKENT)

    local_day = func.date(func.timezone("Asia/Tashkent", User.created_at))
    stmt = (
        select(local_day.label("day"), func.count().label("count"))
        .where(User.created_at >= start_at)
        .group_by(local_day)
    )
    rows = (await db.execute(stmt)).all()
    counts = {row.day: row.count for row in rows}

    days = []
    for i in range(7):
        d = start_date + timedelta(days=i)
        days.append(DailyBucket(date=d.isoformat(), count=counts.get(d, 0)))
    return RegistrationsDaily(days=days)


async def admin_ai_usage(db: AsyncSession) -> AdminAiUsageOverview:
    """AI xususiyatlari ishlatilishi — xususiyat bo'yicha jami + oxirgi 7 kun.

    `AiUsage.usage_date` allaqachon sana (Toshkent kunidan olinadi, `check_and_
    increment_quota`da yaratiladi) — `registrations_daily`dagi kabi
    `func.timezone()` konvertatsiyasi shart emas.
    """
    feature_rows = (
        await db.execute(
            select(
                AiUsage.feature,
                func.sum(AiUsage.count),
                func.count(func.distinct(AiUsage.user_id)),
            ).group_by(AiUsage.feature)
        )
    ).all()
    by_feature = [
        AiFeatureUsage(feature=row[0], total_count=row[1] or 0, active_users=row[2] or 0)
        for row in feature_rows
    ]

    today = datetime.now(UTC).astimezone(_TASHKENT).date()
    start_date = today - timedelta(days=6)
    daily_rows = (
        await db.execute(
            select(AiUsage.usage_date, func.sum(AiUsage.count))
            .where(AiUsage.usage_date >= start_date)
            .group_by(AiUsage.usage_date)
        )
    ).all()
    daily_counts = {row[0]: row[1] or 0 for row in daily_rows}
    daily_total = [
        DailyBucket(date=d.isoformat(), count=daily_counts.get(d, 0))
        for d in (start_date + timedelta(days=i) for i in range(7))
    ]

    return AdminAiUsageOverview(by_feature=by_feature, daily_total=daily_total)


def _suppress(rows: list[tuple[str | None, int]]) -> list[BucketStat]:
    return [
        BucketStat(
            label=label or "Noma'lum",
            count=count if count >= _SUPPRESS_BELOW else None,
        )
        for label, count in rows
    ]


async def donor_overview(db: AsyncSession, donor: User) -> DonorOverview:
    program_ids = (
        (await db.execute(select(DonorProgram.id).where(DonorProgram.donor_id == donor.id)))
        .scalars()
        .all()
    )
    if not program_ids:
        return DonorOverview(
            programs_count=0,
            total_applicants=0,
            approved_enrollees=0,
            completed_courses_among_enrollees=0,
            placements_among_enrollees=0,
            region_breakdown=[],
            disability_group_breakdown=[],
        )

    total_applicants = await _scalar(
        db,
        select(func.count())
        .select_from(ProgramEnrollment)
        .where(ProgramEnrollment.program_id.in_(program_ids)),
    )
    enrollee_ids_stmt = select(ProgramEnrollment.user_id).where(
        ProgramEnrollment.program_id.in_(program_ids),
        ProgramEnrollment.status == ProgramEnrollmentStatus.APPROVED,
    )
    enrollee_ids = (await db.execute(enrollee_ids_stmt)).scalars().all()
    approved_enrollees = len(enrollee_ids)

    if not enrollee_ids:
        return DonorOverview(
            programs_count=len(program_ids),
            total_applicants=total_applicants,
            approved_enrollees=0,
            completed_courses_among_enrollees=0,
            placements_among_enrollees=0,
            region_breakdown=[],
            disability_group_breakdown=[],
        )

    completed_courses = await _scalar(
        db,
        select(func.count())
        .select_from(Enrollment)
        .where(
            Enrollment.user_id.in_(enrollee_ids),
            Enrollment.status == EnrollmentStatus.COMPLETED,
        ),
    )
    placements_count = await _scalar(
        db,
        select(func.count())
        .select_from(Placement)
        .join(Application, Application.id == Placement.application_id)
        .where(Application.user_id.in_(enrollee_ids)),
    )

    region_rows = (
        await db.execute(
            select(Region.name, func.count(User.id))
            .join(User, User.region_id == Region.id)
            .where(User.id.in_(enrollee_ids))
            .group_by(Region.name)
            .order_by(func.count(User.id).desc())
        )
    ).all()
    group_rows = (
        await db.execute(
            select(DisabilityProfile.group_type, func.count(DisabilityProfile.user_id))
            .where(DisabilityProfile.user_id.in_(enrollee_ids))
            .group_by(DisabilityProfile.group_type)
            .order_by(func.count(DisabilityProfile.user_id).desc())
        )
    ).all()

    return DonorOverview(
        programs_count=len(program_ids),
        total_applicants=total_applicants,
        approved_enrollees=approved_enrollees,
        completed_courses_among_enrollees=completed_courses,
        placements_among_enrollees=placements_count,
        region_breakdown=_suppress([(r[0], r[1]) for r in region_rows]),
        disability_group_breakdown=_suppress(
            [(f"{r[0]}-guruh" if r[0] else None, r[1]) for r in group_rows]
        ),
    )


async def gov_overview(db: AsyncSession) -> GovOverview:
    total_students = await _scalar(db, select(func.count()).select_from(User))
    total_employed = await _scalar(
        db,
        select(func.count(func.distinct(Application.user_id)))
        .select_from(Placement)
        .join(Application, Application.id == Placement.application_id),
    )
    total_companies = await _scalar(db, select(func.count()).select_from(Company))
    region_coverage = await _scalar(
        db, select(func.count(func.distinct(User.region_id))).where(User.region_id.is_not(None))
    )

    total_verified = await _scalar(
        db,
        select(func.count())
        .select_from(DisabilityProfile)
        .where(DisabilityProfile.verified_status == VerifiedStatus.VERIFIED),
    )
    verified_ids = (
        (
            await db.execute(
                select(DisabilityProfile.user_id).where(
                    DisabilityProfile.verified_status == VerifiedStatus.VERIFIED
                )
            )
        )
        .scalars()
        .all()
    )

    employment_rate = 0.0
    course_completion_rate = 0.0
    if verified_ids:
        placed = await _scalar(
            db,
            select(func.count(func.distinct(Application.user_id)))
            .select_from(Placement)
            .join(Application, Application.id == Placement.application_id)
            .where(
                Application.user_id.in_(verified_ids),
                Application.status == ApplicationStatus.ACCEPTED,
            ),
        )
        employment_rate = round(placed / len(verified_ids) * 100, 1)

        enrolled_count = await _scalar(
            db,
            select(func.count(func.distinct(Enrollment.user_id)))
            .select_from(Enrollment)
            .where(Enrollment.user_id.in_(verified_ids)),
        )
        if enrolled_count:
            completed_count = await _scalar(
                db,
                select(func.count(func.distinct(Enrollment.user_id)))
                .select_from(Enrollment)
                .where(
                    Enrollment.user_id.in_(verified_ids),
                    Enrollment.status == EnrollmentStatus.COMPLETED,
                ),
            )
            course_completion_rate = round(completed_count / enrolled_count * 100, 1)

    marketplace_volume = await _scalar(
        db, select(func.coalesce(func.sum(Order.amount), 0)).where(Order.status == OrderStatus.PAID)
    )
    benefit_claims = await _scalar(db, select(func.count()).select_from(UserBenefit))

    region_rows = (
        (
            await db.execute(
                select(Region.name, func.count(User.id))
                .join(User, User.region_id == Region.id)
                .where(User.id.in_(verified_ids))
                .group_by(Region.name)
                .order_by(func.count(User.id).desc())
            )
        ).all()
        if verified_ids
        else []
    )
    group_rows = (
        await db.execute(
            select(DisabilityProfile.group_type, func.count(DisabilityProfile.user_id))
            .where(DisabilityProfile.verified_status == VerifiedStatus.VERIFIED)
            .group_by(DisabilityProfile.group_type)
            .order_by(func.count(DisabilityProfile.user_id).desc())
        )
    ).all()
    # Hududlar bo'yicha ishga joylashuv — yuqoridagi region_breakdown'dan farqli
    # (u tasdiqlangan profil sonini ko'rsatadi), bu esa haqiqiy placement sonini.
    region_employment_rows = (
        await db.execute(
            select(Region.name, func.count(func.distinct(Application.user_id)))
            .select_from(Placement)
            .join(Application, Application.id == Placement.application_id)
            .join(User, User.id == Application.user_id)
            .join(Region, Region.id == User.region_id)
            .group_by(Region.name)
            .order_by(func.count(func.distinct(Application.user_id)).desc())
        )
    ).all()

    return GovOverview(
        total_students=total_students,
        total_employed=total_employed,
        total_companies=total_companies,
        region_coverage=region_coverage,
        total_verified_disability_profiles=total_verified,
        employment_rate_pct=employment_rate,
        course_completion_rate_pct=course_completion_rate,
        marketplace_volume_som=marketplace_volume,
        benefit_claims=benefit_claims,
        region_employment_breakdown=_suppress([(r[0], r[1]) for r in region_employment_rows]),
        region_breakdown=_suppress([(r[0], r[1]) for r in region_rows]),
        disability_group_breakdown=_suppress(
            [(f"{r[0]}-guruh" if r[0] else None, r[1]) for r in group_rows]
        ),
    )


def _bucket_cell(stat: BucketStat) -> str:
    return "ko'rsatilmaydi (<3)" if stat.count is None else str(stat.count)


async def export_gov_overview_csv(db: AsyncSession) -> str:
    overview = await gov_overview(db)
    today = datetime.now(_TASHKENT).strftime("%Y-%m-%d")

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["Milliy statistika hisoboti", f"holat: {today}"])
    writer.writerow([])
    writer.writerow(["ko'rsatkich", "qiymat"])
    writer.writerow(["O'quvchi", overview.total_students])
    writer.writerow(["Ishga joylashgan", overview.total_employed])
    writer.writerow(["Kompaniya", overview.total_companies])
    writer.writerow(["Viloyat qamrovi", overview.region_coverage])
    writer.writerow(
        ["Tasdiqlangan nogironlik profili", overview.total_verified_disability_profiles]
    )
    writer.writerow(["Bandlik darajasi (%)", overview.employment_rate_pct])
    writer.writerow(["Kursni tugatish darajasi (%)", overview.course_completion_rate_pct])
    writer.writerow(["Marketplace aylanmasi (so'm)", overview.marketplace_volume_som])
    writer.writerow(["Olingan imtiyoz", overview.benefit_claims])
    writer.writerow([])
    writer.writerow(["Hududlar bo'yicha ishga joylashuv", ""])
    for stat in overview.region_employment_breakdown:
        writer.writerow([stat.label, _bucket_cell(stat)])
    writer.writerow([])
    writer.writerow(["Hududlar bo'yicha tasdiqlangan profil", ""])
    for stat in overview.region_breakdown:
        writer.writerow([stat.label, _bucket_cell(stat)])
    return buffer.getvalue()
