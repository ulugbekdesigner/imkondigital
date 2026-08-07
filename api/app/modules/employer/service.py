"""Bandlik biznes logikasi — kompaniya, vakansiya, ariza, placement."""

from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ladder import ladder_steps_map, user_max_ladder_step
from app.core.match_score import compute_match_score
from app.models.certificate import Certificate
from app.models.course import Course, Enrollment
from app.models.employer import Application, Company, CompanyMember, Placement, Vacancy
from app.models.enums import (
    ApplicationStatus,
    EnrollmentStatus,
    NotificationCategory,
    NotificationType,
    RoleCode,
    VacancyStatus,
)
from app.models.portfolio import PortfolioItem
from app.models.user import Region, Role, User, UserRole
from app.modules.notifications.service import create_notification
from app.schemas.employer import (
    ApplicantOut,
    ApplicationOut,
    CompanyCreate,
    CompanyOut,
    CompanyStats,
    DisabilitySummary,
    EmployerPublicStatsOut,
    PlacementOut,
    VacancyCard,
    VacancyCreate,
    VacancyDetail,
    VacancyPage,
)

# 3 oylik saqlanish foizini hisoblash uchun "3 oy" aniqligi (kunlarda).
_RETENTION_WINDOW_DAYS = 90


def _is_admin(user: User) -> bool:
    return any(r.code == RoleCode.ADMIN for r in user.roles)


_APPLICATION_STATUS_LABEL: dict[str, str] = {
    ApplicationStatus.VIEWED: "Ko'rildi",
    ApplicationStatus.INTERVIEW: "Suhbatga taklif qilindi",
    ApplicationStatus.ACCEPTED: "Qabul qilindi",
    ApplicationStatus.REJECTED: "Rad etildi",
}


async def _owned_company(db: AsyncSession, company_id: int, user: User) -> Company:
    company = await db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kompaniya topilmadi")
    if _is_admin(user):
        return company
    member = (
        await db.execute(
            select(CompanyMember).where(
                CompanyMember.company_id == company_id, CompanyMember.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if member is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Bu kompaniya sizniki emas"
        )
    return company


async def _owned_vacancy(db: AsyncSession, vacancy_id: int, user: User) -> Vacancy:
    vacancy = await db.get(Vacancy, vacancy_id)
    if vacancy is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vakansiya topilmadi")
    await _owned_company(db, vacancy.company_id, user)
    return vacancy


def _quota_recommended(employee_count: int | None) -> int | None:
    """3% tavsiya etilgan inklyuziv kvota — informatsion, majburiy emas (v1)."""
    if not employee_count:
        return None
    return max(1, round(employee_count * 0.03)) if employee_count >= 20 else 0


def _company_out(company: Company) -> CompanyOut:
    return CompanyOut(
        id=company.id,
        name=company.name,
        inn=company.inn,
        logo_url=company.logo_url,
        description=company.description,
        employee_count=company.employee_count,
        inclusive_rating=company.inclusive_rating,
        verified=company.verified,
        quota_recommended=_quota_recommended(company.employee_count),
    )


# --- Kompaniya ---
async def _grant_employer_role(db: AsyncSession, user: User) -> None:
    if any(r.code == RoleCode.EMPLOYER for r in user.roles):
        return
    role_row = (
        await db.execute(select(Role).where(Role.code == RoleCode.EMPLOYER))
    ).scalar_one_or_none()
    if role_row is not None:
        db.add(UserRole(user_id=user.id, role_id=role_row.id))


async def create_company(db: AsyncSession, user: User, data: CompanyCreate) -> CompanyOut:
    company = Company(
        name=data.name,
        inn=data.inn,
        description=data.description,
        employee_count=data.employee_count,
    )
    db.add(company)
    await db.flush()
    db.add(CompanyMember(company_id=company.id, user_id=user.id, role="owner"))
    await _grant_employer_role(db, user)
    await db.commit()
    await db.refresh(company)
    return _company_out(company)


async def list_my_companies(db: AsyncSession, user: User) -> list[CompanyOut]:
    rows = (
        await db.execute(
            select(Company)
            .join(CompanyMember, CompanyMember.company_id == Company.id)
            .where(CompanyMember.user_id == user.id)
        )
    ).scalars()
    return [_company_out(c) for c in rows]


async def list_verified_companies(db: AsyncSession) -> list[CompanyOut]:
    """Ochiq — "IMKON sertifikatini tan oluvchi ish beruvchilar" dasturi uchun (loginsiz)."""
    rows = (
        await db.execute(select(Company).where(Company.verified.is_(True)).order_by(Company.name))
    ).scalars()
    return [_company_out(c) for c in rows]


# --- Vakansiya (ish beruvchi) ---
async def create_vacancy(
    db: AsyncSession, company_id: int, user: User, data: VacancyCreate
) -> Vacancy:
    await _owned_company(db, company_id, user)
    vacancy = Vacancy(
        company_id=company_id,
        title=data.title,
        description=data.description,
        ladder_step=data.ladder_step,
        work_format=data.work_format,
        employment_type=data.employment_type,
        salary_from=data.salary_from,
        salary_to=data.salary_to,
        region_id=data.region_id,
        accommodations=data.accommodations,
        skills_required=data.skills_required,
        status=VacancyStatus.DRAFT,
    )
    db.add(vacancy)
    await db.commit()
    await db.refresh(vacancy)
    return vacancy


async def publish_vacancy(db: AsyncSession, vacancy_id: int, user: User) -> Vacancy:
    vacancy = await _owned_vacancy(db, vacancy_id, user)
    vacancy.status = VacancyStatus.PUBLISHED
    await db.commit()
    await db.refresh(vacancy)
    return vacancy


async def get_owned_vacancy(db: AsyncSession, vacancy_id: int, user: User) -> Vacancy:
    """Egasi ko'rinishi — jamoat /vacancies/{id} farqli, statusdan qat'i nazar
    (qoralama/yopilgan vakansiya arizachilar sahifasida ham kerak bo'ladi)."""
    return await _owned_vacancy(db, vacancy_id, user)


async def list_my_vacancies(db: AsyncSession, company_id: int, user: User) -> list[Vacancy]:
    await _owned_company(db, company_id, user)
    return list(
        (
            await db.execute(
                select(Vacancy)
                .where(Vacancy.company_id == company_id)
                .order_by(Vacancy.created_at.desc())
            )
        ).scalars()
    )


async def _portfolio_counts_map(db: AsyncSession, user_ids: list[int]) -> dict[int, int]:
    if not user_ids:
        return {}
    rows = (
        await db.execute(
            select(PortfolioItem.user_id, func.count(PortfolioItem.id))
            .where(PortfolioItem.user_id.in_(user_ids))
            .group_by(PortfolioItem.user_id)
        )
    ).all()
    return {row[0]: row[1] for row in rows}


async def _certificate_counts_map(db: AsyncSession, user_ids: list[int]) -> dict[int, int]:
    if not user_ids:
        return {}
    rows = (
        await db.execute(
            select(Certificate.user_id, func.count(Certificate.id))
            .where(Certificate.user_id.in_(user_ids))
            .group_by(Certificate.user_id)
        )
    ).all()
    return {row[0]: row[1] for row in rows}


def _user_remote_only(user: User) -> bool:
    profile = user.disability_profile
    if profile is None:
        return False
    return bool(profile.work_conditions.get("remote_only", False))


async def _score_for(db: AsyncSession, vacancy: Vacancy, user: User) -> int:
    user_max_step = await user_max_ladder_step(db, user.id)
    return compute_match_score(
        vacancy_ladder_step=vacancy.ladder_step,
        user_max_ladder_step=user_max_step,
        work_format=vacancy.work_format,
        user_remote_only=_user_remote_only(user),
        vacancy_region_id=vacancy.region_id,
        user_region_id=user.region_id,
        has_accommodations=bool(vacancy.accommodations),
    )


# --- Katalog / detal (public) ---
async def _company_info_map(
    db: AsyncSession, company_ids: list[int]
) -> dict[int, tuple[str, bool]]:
    if not company_ids:
        return {}
    rows = (
        await db.execute(
            select(Company.id, Company.name, Company.verified).where(Company.id.in_(company_ids))
        )
    ).all()
    return {r[0]: (r[1], r[2]) for r in rows}


async def _region_name_map(db: AsyncSession, region_ids: list[int]) -> dict[int, str]:
    ids = [r for r in region_ids if r is not None]
    if not ids:
        return {}
    rows = (await db.execute(select(Region.id, Region.name).where(Region.id.in_(ids)))).all()
    return {r[0]: r[1] for r in rows}


def _to_card(
    vacancy: Vacancy,
    company_name: str,
    company_verified: bool,
    region_name: str | None,
    match_score: int | None,
) -> VacancyCard:
    return VacancyCard(
        id=vacancy.id,
        title=vacancy.title,
        company_name=company_name,
        company_verified=company_verified,
        ladder_step=vacancy.ladder_step,
        work_format=vacancy.work_format,
        employment_type=vacancy.employment_type,
        salary_from=vacancy.salary_from,
        salary_to=vacancy.salary_to,
        region_name=region_name,
        status=vacancy.status,
        created_at=vacancy.created_at,
        match_score=match_score,
        is_inclusive=bool(vacancy.accommodations),
    )


async def catalog(
    db: AsyncSession,
    *,
    step: int | None,
    work_format: str | None,
    region_id: int | None,
    min_salary: int | None,
    q: str | None,
    cursor: int | None,
    limit: int,
    viewer: User | None,
) -> VacancyPage:
    stmt = select(Vacancy).where(Vacancy.status == VacancyStatus.PUBLISHED)
    if step is not None:
        stmt = stmt.where(Vacancy.ladder_step == step)
    if work_format is not None:
        stmt = stmt.where(Vacancy.work_format == work_format)
    if region_id is not None:
        stmt = stmt.where(Vacancy.region_id == region_id)
    if min_salary is not None:
        # Maosh oshkor qilinmagan vakansiyalar filtr faol bo'lganda chiqarilmaydi —
        # tekshirilmagan maoshni "mos keladi" deb ko'rsatish yolg'on bo'lardi.
        stmt = stmt.where(func.coalesce(Vacancy.salary_to, Vacancy.salary_from) >= min_salary)
    if q:
        stmt = stmt.where(Vacancy.title.ilike(f"%{q}%"))
    if cursor is not None:
        stmt = stmt.where(Vacancy.id < cursor)
    stmt = stmt.order_by(Vacancy.id.desc()).limit(limit + 1)

    vacancies = list((await db.execute(stmt)).scalars().all())
    has_more = len(vacancies) > limit
    vacancies = vacancies[:limit]

    companies = await _company_info_map(db, [v.company_id for v in vacancies])
    regions = await _region_name_map(db, [v.region_id for v in vacancies if v.region_id])

    items = []
    for v in vacancies:
        score = await _score_for(db, v, viewer) if viewer is not None else None
        region_name = regions.get(v.region_id) if v.region_id is not None else None
        name, verified = companies.get(v.company_id, ("", False))
        items.append(_to_card(v, name, verified, region_name, score))

    next_cursor = vacancies[-1].id if has_more and vacancies else None
    return VacancyPage(items=items, next_cursor=next_cursor)


async def vacancy_detail(db: AsyncSession, vacancy_id: int, viewer: User | None) -> VacancyDetail:
    vacancy = await db.get(Vacancy, vacancy_id)
    if vacancy is None or vacancy.status != VacancyStatus.PUBLISHED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vakansiya topilmadi")

    company = await db.get(Company, vacancy.company_id)
    region_name = None
    if vacancy.region_id is not None:
        region = await db.get(Region, vacancy.region_id)
        region_name = region.name if region else None

    score = await _score_for(db, vacancy, viewer) if viewer is not None else None
    card = _to_card(
        vacancy,
        company.name if company else "",
        company.verified if company else False,
        region_name,
        score,
    )
    return VacancyDetail(
        **card.model_dump(),
        description=vacancy.description,
        accommodations=vacancy.accommodations,
        skills_required=vacancy.skills_required,
        company_id=vacancy.company_id,
    )


# --- Ariza ---
async def apply(
    db: AsyncSession, user: User, vacancy_id: int, share_disability_profile: bool
) -> ApplicationOut:
    vacancy = await db.get(Vacancy, vacancy_id)
    if vacancy is None or vacancy.status != VacancyStatus.PUBLISHED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vakansiya topilmadi")

    existing = (
        await db.execute(
            select(Application).where(
                Application.vacancy_id == vacancy_id, Application.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Siz bu vakansiyaga allaqachon ariza berdingiz",
        )

    score = await _score_for(db, vacancy, user)
    application = Application(
        vacancy_id=vacancy_id,
        user_id=user.id,
        match_score=score,
        share_disability_profile=share_disability_profile,
        cv_snapshot={"full_name": user.full_name, "phone": user.phone},
    )
    db.add(application)
    await db.commit()
    await db.refresh(application)

    company = await db.get(Company, vacancy.company_id)
    return ApplicationOut(
        id=application.id,
        vacancy_id=vacancy_id,
        vacancy_title=vacancy.title,
        company_name=company.name if company else "",
        match_score=score,
        status=application.status,
        created_at=application.created_at,
    )


async def list_my_applications(db: AsyncSession, user: User) -> list[ApplicationOut]:
    rows = (
        await db.execute(
            select(Application, Vacancy.title, Company.name)
            .join(Vacancy, Vacancy.id == Application.vacancy_id)
            .join(Company, Company.id == Vacancy.company_id)
            .where(Application.user_id == user.id)
            .order_by(Application.created_at.desc())
        )
    ).all()
    return [
        ApplicationOut(
            id=a.id,
            vacancy_id=a.vacancy_id,
            vacancy_title=title,
            company_name=company_name,
            match_score=a.match_score,
            status=a.status,
            created_at=a.created_at,
        )
        for a, title, company_name in rows
    ]


async def list_applicants(db: AsyncSession, vacancy_id: int, user: User) -> list[ApplicantOut]:
    await _owned_vacancy(db, vacancy_id, user)
    rows = (
        await db.execute(
            select(Application, User)
            .join(User, User.id == Application.user_id)
            .where(Application.vacancy_id == vacancy_id)
            .order_by(Application.match_score.desc())
        )
    ).all()

    applicant_ids = [applicant.id for _, applicant in rows]
    ladder_steps = await ladder_steps_map(db, applicant_ids)
    portfolio_counts = await _portfolio_counts_map(db, applicant_ids)
    certificate_counts = await _certificate_counts_map(db, applicant_ids)

    result: list[ApplicantOut] = []
    for a, applicant in rows:
        disability = None
        if a.share_disability_profile and applicant.disability_profile is not None:
            disability = DisabilitySummary(
                group_type=applicant.disability_profile.group_type,
                categories=applicant.disability_profile.categories,
            )
        result.append(
            ApplicantOut(
                id=a.id,
                user_id=applicant.id,
                full_name=applicant.full_name,
                username=applicant.username,
                match_score=a.match_score,
                status=a.status,
                created_at=a.created_at,
                ladder_step=ladder_steps.get(applicant.id, 0),
                portfolio_count=portfolio_counts.get(applicant.id, 0),
                certificates_count=certificate_counts.get(applicant.id, 0),
                disability=disability,
                placement=PlacementOut.model_validate(a.placement) if a.placement else None,
            )
        )
    return result


async def get_company_stats(db: AsyncSession, company_id: int, user: User) -> CompanyStats:
    await _owned_company(db, company_id, user)
    active_vacancies = (
        await db.execute(
            select(func.count(Vacancy.id)).where(
                Vacancy.company_id == company_id, Vacancy.status == VacancyStatus.PUBLISHED
            )
        )
    ).scalar_one()
    new_applications = (
        await db.execute(
            select(func.count(Application.id))
            .select_from(Application)
            .join(Vacancy, Vacancy.id == Application.vacancy_id)
            .where(
                Vacancy.company_id == company_id,
                Application.status == ApplicationStatus.SUBMITTED,
            )
        )
    ).scalar_one()
    hired = (
        await db.execute(
            select(func.count(Application.id))
            .select_from(Application)
            .join(Vacancy, Vacancy.id == Application.vacancy_id)
            .where(
                Vacancy.company_id == company_id, Application.status == ApplicationStatus.ACCEPTED
            )
        )
    ).scalar_one()
    return CompanyStats(
        active_vacancies=active_vacancies, new_applications=new_applications, hired=hired
    )


async def get_public_employer_stats(db: AsyncSession) -> EmployerPublicStatsOut:
    """ "/ish-beruvchilarga" ochiq sahifasi uchun — barcha kompaniyalar bo'yicha jamlanma."""
    avg_days = (
        await db.execute(
            select(
                func.avg(func.extract("epoch", Placement.started_at - Vacancy.created_at) / 86400.0)
            )
            .select_from(Placement)
            .join(Application, Application.id == Placement.application_id)
            .join(Vacancy, Vacancy.id == Application.vacancy_id)
        )
    ).scalar_one_or_none()

    cutoff = datetime.now(UTC) - timedelta(days=_RETENTION_WINDOW_DAYS)
    eligible = (
        await db.execute(select(func.count(Placement.id)).where(Placement.started_at <= cutoff))
    ).scalar_one()
    retained = (
        await db.execute(
            select(func.count(Placement.id)).where(
                Placement.started_at <= cutoff, Placement.checkin_3m.is_(True)
            )
        )
    ).scalar_one()

    return EmployerPublicStatsOut(
        avg_days_to_hire=round(avg_days) if avg_days is not None else None,
        retention_3m_pct=round(retained / eligible * 100) if eligible > 0 else None,
    )


async def update_application_status(
    db: AsyncSession, application_id: int, user: User, new_status: str
) -> Application:
    application = await db.get(Application, application_id)
    if application is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ariza topilmadi")
    vacancy = await db.get(Vacancy, application.vacancy_id)
    assert vacancy is not None
    await _owned_company(db, vacancy.company_id, user)

    application.status = new_status
    newly_placed = False
    if new_status == ApplicationStatus.ACCEPTED:
        existing_placement = await db.execute(
            select(Placement).where(Placement.application_id == application.id)
        )
        if existing_placement.scalar_one_or_none() is None:
            db.add(Placement(application_id=application.id))
            newly_placed = True

    await create_notification(
        db,
        user_id=application.user_id,
        notif_type=NotificationType.APPLICATION_STATUS,
        category=NotificationCategory.OPPORTUNITY,
        title=f"Arizangiz holati o'zgardi: {_APPLICATION_STATUS_LABEL.get(new_status, new_status)}",
        body=vacancy.title,
        link_url=f"/vakansiyalar/{vacancy.id}",
    )

    if newly_placed:
        await _notify_instructors_of_placement(db, application.user_id, vacancy.title)

    await db.commit()
    await db.refresh(application)
    return application


async def _notify_instructors_of_placement(
    db: AsyncSession, student_user_id: int, vacancy_title: str
) -> None:
    """O'quvchi ishga joylashganda — uni o'qitgan (kursini tugatgan) ustozlarga
    tabrik bildirishnomasi yuboriladi (docs/design/README.md 4-jadval: "Ustoz — O'quvchi
    ishga joylashdi" — ustoz kabineti dashboardida imk-celebrate/CelebrationScreen
    orqali ko'rsatiladi). Faqat TUGATILGAN kurslar hisobga olinadi — ro'yxatdan
    o'tib tashlab ketilgan kurs ustozi bezovta qilinmaydi."""
    student = await db.get(User, student_user_id)
    if student is None:
        return
    instructor_rows = (
        await db.execute(
            select(Course.instructor_id, Course.title)
            .join(Enrollment, Enrollment.course_id == Course.id)
            .where(
                Enrollment.user_id == student_user_id,
                Enrollment.status == EnrollmentStatus.COMPLETED,
            )
            .distinct()
        )
    ).all()
    notified: set[int] = set()
    for instructor_id, course_title in instructor_rows:
        if instructor_id in notified:
            continue
        notified.add(instructor_id)
        await create_notification(
            db,
            user_id=instructor_id,
            notif_type=NotificationType.STUDENT_PLACED,
            category=NotificationCategory.LEARNING,
            title="O'quvchingiz ishga joylashdi!",
            body=f"{student.full_name} — \"{course_title}\" kursi bitiruvchisi {vacancy_title} lavozimiga qabul qilindi.",
            link_url="/ustoz/kurslar/dashboard",
        )


# --- Placement check-in ---
async def checkin(db: AsyncSession, placement_id: int, user: User, period: str) -> Placement:
    placement = await db.get(Placement, placement_id)
    if placement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement topilmadi")
    application = await db.get(Application, placement.application_id)
    assert application is not None
    vacancy = await db.get(Vacancy, application.vacancy_id)
    assert vacancy is not None

    is_employer = False
    try:
        await _owned_company(db, vacancy.company_id, user)
        is_employer = True
    except HTTPException:
        pass
    if not is_employer and application.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Faqat nomzod yoki ish beruvchi check-in qila oladi",
        )

    if period == "1w":
        placement.checkin_1w = True
    elif period == "1m":
        placement.checkin_1m = True
    else:
        placement.checkin_3m = True
        placement.stable_confirmed_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(placement)
    return placement
