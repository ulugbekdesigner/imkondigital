"""Admin panel biznes logikasi — foydalanuvchi boshqaruvi, audit jurnali, kurs moderatsiyasi."""

import csv
import io

from fastapi import HTTPException, status
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.audit import write_audit_log
from app.models.audit import AuditLog
from app.models.course import Course
from app.models.employer import Company, CompanyMember, Vacancy
from app.models.enums import (
    CompanyMemberRole,
    CourseStatus,
    DisputeStatus,
    NotificationCategory,
    NotificationType,
    RoleCode,
    UserStatus,
)
from app.models.marketplace import Dispute, Order
from app.models.subscription import Subscription
from app.models.user import Role, User, UserRole
from app.modules.instructor_studio import service as instructor_studio_service
from app.modules.notifications.service import create_notification
from app.schemas.admin import (
    AdminCompanyOut,
    AdminCompanyPage,
    AdminCourseOut,
    AdminCoursePage,
    AdminDisputeOut,
    AdminDisputePage,
    AdminInstructorCourseOut,
    AdminInstructorDetail,
    AdminInstructorOut,
    AdminInstructorPage,
    AdminUserOut,
    AdminUserPage,
    AdminUserStats,
    AuditLogOut,
    AuditLogPage,
)

# CSV eksportda bitta so'rovda qaytariladigan maksimal qator soni — xotira
# himoyasi (haqiqiy jadval bundan oshsa, filtrni toraytirish tavsiya etiladi).
_EXPORT_MAX_ROWS = 20_000

# Audit jurnali — xom `action`/`role`/`status` qiymatlarini odam o'qiydigan
# o'zbekcha matnga aylantiradi (apps/web ROLE_META/STATUS_LABEL bilan mos).
_ROLE_LABELS: dict[str, str] = {
    "user": "Foydalanuvchi",
    "instructor": "Ustoz",
    "employer": "Ish beruvchi",
    "mentor": "Mentor",
    "donor": "Donor",
    "gov": "Davlat vakili",
    "moderator": "Moderator",
    "admin": "Administrator",
}
_STATUS_LABELS: dict[str, str] = {
    "pending_verification": "Tasdiqlanmagan",
    "active": "Faol",
    "blocked": "Bloklangan",
}


def _humanize_action(action: str, meta: dict[str, object]) -> str:
    if action == "user.set_status":
        value = str(meta.get("status", ""))
        return f"Foydalanuvchi holati: {_STATUS_LABELS.get(value, value)}"
    if action == "user.assign_role":
        value = str(meta.get("role", ""))
        return f"Rol berildi: {_ROLE_LABELS.get(value, value)}"
    if action == "user.revoke_role":
        value = str(meta.get("role", ""))
        return f"Rol olib tashlandi: {_ROLE_LABELS.get(value, value)}"
    if action == "course.archive":
        return "Kurs arxivlandi"
    if action == "course.publish":
        return "Kurs moderatsiyadan o'tib nashr qilindi"
    if action == "course.reject":
        return "Kurs moderatsiyada rad etildi"
    if action == "dispute.resolve":
        winner = str(meta.get("winner", ""))
        return f"Nizo hal qilindi ({'ijrochi' if winner == 'freelancer' else 'buyurtmachi'} haq topildi)"
    if action == "company.verify":
        return "Kompaniya tasdiqlandi"
    if action == "company.unverify":
        return "Kompaniya tasdig'i bekor qilindi"
    if action == "disability_profile.verify":
        return "Nogironlik profili tasdiqlandi"
    if action == "disability_profile.reject":
        return "Nogironlik profili rad etildi"
    return action


def _filtered_users_stmt(
    *, search: str | None, role: RoleCode | None, user_status: str | None
) -> Select[tuple[User]]:
    stmt = select(User).options(selectinload(User.roles))
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            User.full_name.ilike(pattern) | User.username.ilike(pattern) | User.phone.ilike(pattern)
        )
    if user_status:
        stmt = stmt.where(User.status == user_status)
    if role is not None:
        stmt = (
            stmt.join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .where(Role.code == role)
        )
    return stmt


async def list_users(
    db: AsyncSession,
    *,
    cursor: int | None,
    limit: int,
    search: str | None,
    role: RoleCode | None,
    user_status: str | None,
) -> AdminUserPage:
    stmt = _filtered_users_stmt(search=search, role=role, user_status=user_status)
    if cursor is not None:
        stmt = stmt.where(User.id < cursor)
    stmt = stmt.order_by(User.id.desc()).limit(limit + 1)

    rows = (await db.execute(stmt)).scalars().unique().all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = rows[-1].id if has_more and rows else None

    plan_by_user_id: dict[int, str] = {}
    if rows:
        sub_rows = (
            await db.execute(
                select(Subscription.user_id, Subscription.plan).where(
                    Subscription.user_id.in_([u.id for u in rows])
                )
            )
        ).all()
        plan_by_user_id = {row[0]: row[1] for row in sub_rows}

    return AdminUserPage(
        items=[
            AdminUserOut(**_user_dict(u), subscription_plan=plan_by_user_id.get(u.id, "free"))
            for u in rows
        ],
        next_cursor=next_cursor,
    )


async def get_user_stats(db: AsyncSession) -> AdminUserStats:
    total = (await db.execute(select(func.count(User.id)))).scalar_one()
    blocked = (
        await db.execute(select(func.count(User.id)).where(User.status == UserStatus.BLOCKED))
    ).scalar_one()
    return AdminUserStats(total=total, blocked=blocked)


async def export_users_csv(
    db: AsyncSession, *, search: str | None, role: RoleCode | None, user_status: str | None
) -> str:
    stmt = (
        _filtered_users_stmt(search=search, role=role, user_status=user_status)
        .order_by(User.id.desc())
        .limit(_EXPORT_MAX_ROWS)
    )
    rows = (await db.execute(stmt)).scalars().unique().all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        ["id", "F.I.Sh.", "username", "telefon", "email", "holat", "rollar", "ro'yxatdan o'tgan"]
    )
    for u in rows:
        writer.writerow(
            [
                u.id,
                u.full_name,
                u.username,
                u.phone,
                u.email or "",
                u.status,
                ", ".join(r.code for r in u.roles),
                u.created_at.isoformat(),
            ]
        )
    return buffer.getvalue()


def _user_dict(u: User) -> dict[str, object]:
    return {
        "id": u.id,
        "phone": u.phone,
        "email": u.email,
        "full_name": u.full_name,
        "username": u.username,
        "status": u.status,
        "created_at": u.created_at,
        "roles": [r.code for r in u.roles],
    }


async def set_user_status(
    db: AsyncSession, admin: User, user_id: int, new_status: str
) -> AdminUserOut:
    user = await db.get(User, user_id, options=[selectinload(User.roles)])
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
    if user.id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O'zingizning holatingizni o'zgartira olmaysiz",
        )
    user.status = new_status
    await write_audit_log(
        db,
        actor_id=admin.id,
        action="user.set_status",
        target_type="user",
        target_id=user_id,
        meta={"status": new_status},
    )
    await db.commit()
    await db.refresh(user)
    return AdminUserOut(**_user_dict(user))


async def assign_role(db: AsyncSession, admin: User, user_id: int, role: RoleCode) -> AdminUserOut:
    user = await db.get(User, user_id, options=[selectinload(User.roles)])
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
    role_row = (await db.execute(select(Role).where(Role.code == role))).scalar_one_or_none()
    if role_row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rol topilmadi")
    if role_row.id not in [r.id for r in user.roles]:
        db.add(UserRole(user_id=user.id, role_id=role_row.id))
        await write_audit_log(
            db,
            actor_id=admin.id,
            action="user.assign_role",
            target_type="user",
            target_id=user_id,
            meta={"role": role.value},
        )
        await db.commit()
    await db.refresh(user, attribute_names=["roles"])
    return AdminUserOut(**_user_dict(user))


async def revoke_role(db: AsyncSession, admin: User, user_id: int, role: RoleCode) -> AdminUserOut:
    user = await db.get(User, user_id, options=[selectinload(User.roles)])
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")
    role_row = (await db.execute(select(Role).where(Role.code == role))).scalar_one_or_none()
    if role_row is not None:
        existing = (
            await db.execute(
                select(UserRole).where(UserRole.user_id == user.id, UserRole.role_id == role_row.id)
            )
        ).scalar_one_or_none()
        if existing is not None:
            await db.delete(existing)
            await write_audit_log(
                db,
                actor_id=admin.id,
                action="user.revoke_role",
                target_type="user",
                target_id=user_id,
                meta={"role": role.value},
            )
            await db.commit()
    await db.refresh(user, attribute_names=["roles"])
    return AdminUserOut(**_user_dict(user))


async def _audit_target_names(db: AsyncSession, rows: list[AuditLog]) -> dict[tuple[str, str], str]:
    """`target_type`+`target_id` juftligidan haqiqiy nom (F.I.Sh./kurs/kompaniya) topadi."""
    user_ids: set[int] = set()
    course_ids: set[int] = set()
    company_ids: set[int] = set()
    order_ids: set[int] = set()
    for r in rows:
        if not r.target_id.isdigit():
            continue
        tid = int(r.target_id)
        if r.target_type in ("user", "disability_profile"):
            user_ids.add(tid)
        elif r.target_type == "course":
            course_ids.add(tid)
        elif r.target_type == "company":
            company_ids.add(tid)
        elif r.target_type == "order":
            order_ids.add(tid)

    names: dict[tuple[str, str], str] = {}
    if user_ids:
        user_rows = (
            await db.execute(select(User.id, User.full_name).where(User.id.in_(user_ids)))
        ).all()
        for row in user_rows:
            names[("user", str(row.id))] = row.full_name
            names[("disability_profile", str(row.id))] = row.full_name
    if course_ids:
        course_rows = (
            await db.execute(select(Course.id, Course.title).where(Course.id.in_(course_ids)))
        ).all()
        for row in course_rows:
            names[("course", str(row.id))] = row.title
    if company_ids:
        company_rows = (
            await db.execute(select(Company.id, Company.name).where(Company.id.in_(company_ids)))
        ).all()
        for row in company_rows:
            names[("company", str(row.id))] = row.name
    if order_ids:
        order_rows = (
            await db.execute(select(Order.id, Order.title).where(Order.id.in_(order_ids)))
        ).all()
        for row in order_rows:
            names[("order", str(row.id))] = row.title
    return names


async def list_audit_log(db: AsyncSession, *, cursor: int | None, limit: int) -> AuditLogPage:
    stmt = select(AuditLog)
    if cursor is not None:
        stmt = stmt.where(AuditLog.id < cursor)
    stmt = stmt.order_by(AuditLog.id.desc()).limit(limit + 1)
    rows = list((await db.execute(stmt)).scalars().all())
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = rows[-1].id if has_more and rows else None

    actor_ids = {r.actor_id for r in rows}
    actors: dict[int, str] = {}
    if actor_ids:
        actor_rows = (
            await db.execute(select(User.id, User.full_name).where(User.id.in_(actor_ids)))
        ).all()
        actors = {row.id: row.full_name for row in actor_rows}
    target_names = await _audit_target_names(db, rows)

    items = [
        AuditLogOut(
            id=r.id,
            actor_id=r.actor_id,
            actor_name=actors.get(r.actor_id, "?"),
            action=r.action,
            action_label=_humanize_action(r.action, r.meta),
            target_type=r.target_type,
            target_id=r.target_id,
            target_name=target_names.get((r.target_type, r.target_id)),
            meta=r.meta,
            created_at=r.created_at,
        )
        for r in rows
    ]
    return AuditLogPage(items=items, next_cursor=next_cursor)


async def export_audit_log_csv(db: AsyncSession) -> str:
    stmt = select(AuditLog).order_by(AuditLog.id.desc()).limit(_EXPORT_MAX_ROWS)
    rows = list((await db.execute(stmt)).scalars().all())

    actor_ids = {r.actor_id for r in rows}
    actors: dict[int, str] = {}
    if actor_ids:
        actor_rows = (
            await db.execute(select(User.id, User.full_name).where(User.id.in_(actor_ids)))
        ).all()
        actors = {row.id: row.full_name for row in actor_rows}
    target_names = await _audit_target_names(db, rows)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["vaqt", "amal bajaruvchi", "amal", "nishon", "meta"])
    for r in rows:
        target_name = target_names.get((r.target_type, r.target_id))
        nishon = target_name or f"{r.target_type}#{r.target_id}"
        writer.writerow(
            [
                r.created_at.isoformat(),
                actors.get(r.actor_id, "?"),
                _humanize_action(r.action, r.meta),
                nishon,
                str(r.meta) if r.meta else "",
            ]
        )
    return buffer.getvalue()


async def list_courses_for_moderation(
    db: AsyncSession, *, cursor: int | None, limit: int
) -> AdminCoursePage:
    stmt = select(Course).where(Course.status == CourseStatus.PUBLISHED)
    if cursor is not None:
        stmt = stmt.where(Course.id < cursor)
    stmt = stmt.order_by(Course.id.desc()).limit(limit + 1)
    rows = (await db.execute(stmt)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = rows[-1].id if has_more and rows else None

    instructor_ids = {c.instructor_id for c in rows}
    names: dict[int, str] = {}
    if instructor_ids:
        instructor_rows = (
            await db.execute(select(User.id, User.full_name).where(User.id.in_(instructor_ids)))
        ).all()
        names = {row.id: row.full_name for row in instructor_rows}

    items = [
        AdminCourseOut(
            id=c.id,
            title=c.title,
            slug=c.slug,
            status=c.status,
            instructor_name=names.get(c.instructor_id, "?"),
            students_count=c.students_count,
        )
        for c in rows
    ]
    return AdminCoursePage(items=items, next_cursor=next_cursor)


async def archive_course(db: AsyncSession, admin: User, course_id: int) -> AdminCourseOut:
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    course.status = CourseStatus.ARCHIVED
    await write_audit_log(
        db,
        actor_id=admin.id,
        action="course.archive",
        target_type="course",
        target_id=course_id,
    )
    await db.commit()
    await db.refresh(course)
    instructor = await db.get(User, course.instructor_id)
    return AdminCourseOut(
        id=course.id,
        title=course.title,
        slug=course.slug,
        status=course.status,
        instructor_name=instructor.full_name if instructor else "?",
        students_count=course.students_count,
    )


async def list_pending_courses(
    db: AsyncSession, *, cursor: int | None, limit: int
) -> AdminCoursePage:
    """Ustoz "Nashrga yuborish" bosgan, moderatsiya kutayotgan kurslar navbati."""
    stmt = select(Course).where(Course.status == CourseStatus.PENDING)
    if cursor is not None:
        stmt = stmt.where(Course.id < cursor)
    stmt = stmt.order_by(Course.id.desc()).limit(limit + 1)
    rows = (await db.execute(stmt)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = rows[-1].id if has_more and rows else None

    instructor_ids = {c.instructor_id for c in rows}
    names: dict[int, str] = {}
    if instructor_ids:
        instructor_rows = (
            await db.execute(select(User.id, User.full_name).where(User.id.in_(instructor_ids)))
        ).all()
        names = {row.id: row.full_name for row in instructor_rows}

    items = [
        AdminCourseOut(
            id=c.id,
            title=c.title,
            slug=c.slug,
            status=c.status,
            instructor_name=names.get(c.instructor_id, "?"),
            students_count=c.students_count,
        )
        for c in rows
    ]
    return AdminCoursePage(items=items, next_cursor=next_cursor)


async def decide_course(
    db: AsyncSession, moderator: User, course_id: int, approve: bool, reason: str | None
) -> AdminCourseOut:
    """Moderatsiyadagi kursni nashr qiladi yoki qoralamaga qaytarib rad etadi."""
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    if course.status != CourseStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Kurs moderatsiya navbatida emas"
        )
    if not approve and not (reason and reason.strip()):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rad etish sababi majburiy")

    course.status = CourseStatus.PUBLISHED if approve else CourseStatus.DRAFT
    await write_audit_log(
        db,
        actor_id=moderator.id,
        action="course.publish" if approve else "course.reject",
        target_type="course",
        target_id=course_id,
        meta={"reason": reason} if reason else {},
    )
    await create_notification(
        db,
        user_id=course.instructor_id,
        notif_type=NotificationType.SYSTEM,
        category=NotificationCategory.LEARNING,
        title="Kursingiz nashr qilindi" if approve else "Kursingiz rad etildi",
        body=(
            f"{course.title} endi o'quvchilarga ochiq."
            if approve
            else f"{course.title}: {reason}"
        ),
        link_url=f"/ustoz/kurslar/{course.id}",
    )
    await db.commit()
    await db.refresh(course)
    instructor = await db.get(User, course.instructor_id)
    return AdminCourseOut(
        id=course.id,
        title=course.title,
        slug=course.slug,
        status=course.status,
        instructor_name=instructor.full_name if instructor else "?",
        students_count=course.students_count,
    )


# --- Nizolar (marketplace buyurtma nizolari) ---
async def list_open_disputes(
    db: AsyncSession, *, cursor: int | None, limit: int
) -> AdminDisputePage:
    stmt = select(Dispute).where(Dispute.status == DisputeStatus.OPEN)
    if cursor is not None:
        stmt = stmt.where(Dispute.id < cursor)
    stmt = stmt.order_by(Dispute.id.desc()).limit(limit + 1)
    rows = (await db.execute(stmt)).scalars().all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = rows[-1].id if has_more and rows else None

    order_ids = {d.order_id for d in rows}
    orders: dict[int, Order] = {}
    if order_ids:
        order_rows = (await db.execute(select(Order).where(Order.id.in_(order_ids)))).scalars().all()
        orders = {o.id: o for o in order_rows}

    user_ids: set[int] = set()
    for d in rows:
        user_ids.add(d.opened_by)
        order = orders.get(d.order_id)
        if order is not None:
            user_ids.add(order.client_id)
            user_ids.add(order.freelancer_id)
    names: dict[int, str] = {}
    if user_ids:
        user_rows = (
            await db.execute(select(User.id, User.full_name).where(User.id.in_(user_ids)))
        ).all()
        names = {row.id: row.full_name for row in user_rows}

    items = []
    for d in rows:
        order = orders.get(d.order_id)
        items.append(
            AdminDisputeOut(
                id=d.id,
                order_id=d.order_id,
                order_title=order.title if order else "?",
                amount=order.amount if order else 0,
                opened_by_name=names.get(d.opened_by, "?"),
                client_name=names.get(order.client_id, "?") if order else "?",
                freelancer_name=names.get(order.freelancer_id, "?") if order else "?",
                reason=d.reason,
                status=d.status,
                created_at=d.created_at,
            )
        )
    return AdminDisputePage(items=items, next_cursor=next_cursor)


# --- Ustozlar bo'limi ---
async def list_instructors(
    db: AsyncSession, *, cursor: int | None, limit: int, search: str | None
) -> AdminInstructorPage:
    stmt = (
        select(
            User.id,
            User.full_name,
            User.phone,
            User.username,
            User.status,
            func.count(Course.id).label("courses_count"),
            func.count(Course.id)
            .filter(Course.status == CourseStatus.PUBLISHED)
            .label("published_courses_count"),
            func.coalesce(func.sum(Course.students_count), 0).label("total_students"),
            func.coalesce(func.avg(Course.rating), 0.0).label("average_rating"),
        )
        .select_from(User)
        .join(UserRole, UserRole.user_id == User.id)
        .join(Role, Role.id == UserRole.role_id)
        .outerjoin(Course, Course.instructor_id == User.id)
        .where(Role.code == RoleCode.INSTRUCTOR)
    )
    if search:
        pattern = f"%{search}%"
        stmt = stmt.where(
            User.full_name.ilike(pattern) | User.username.ilike(pattern) | User.phone.ilike(pattern)
        )
    if cursor is not None:
        stmt = stmt.where(User.id < cursor)
    stmt = stmt.group_by(User.id).order_by(User.id.desc()).limit(limit + 1)

    rows = (await db.execute(stmt)).all()
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = rows[-1].id if has_more and rows else None

    items = []
    for row in rows:
        tier = await instructor_studio_service.get_generosity_tier(db, row.id)
        items.append(
            AdminInstructorOut(
                id=row.id,
                full_name=row.full_name,
                phone=row.phone,
                username=row.username,
                status=row.status,
                courses_count=row.courses_count,
                published_courses_count=row.published_courses_count,
                total_students=row.total_students,
                average_rating=round(float(row.average_rating), 2),
                generosity_tier=tier,
            )
        )
    return AdminInstructorPage(items=items, next_cursor=next_cursor)


async def get_instructor_detail(
    db: AsyncSession, admin: User, instructor_id: int
) -> AdminInstructorDetail:
    user = await db.get(User, instructor_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Foydalanuvchi topilmadi")

    courses = (
        (
            await db.execute(
                select(Course)
                .where(Course.instructor_id == instructor_id)
                .order_by(Course.created_at.desc())
            )
        )
        .scalars()
        .all()
    )

    course_items = []
    for c in courses:
        stats = await instructor_studio_service.get_course_stats(db, c.id, admin)
        course_items.append(
            AdminInstructorCourseOut(
                id=c.id,
                title=c.title,
                slug=c.slug,
                status=c.status,
                is_free=c.is_free,
                students_count=stats.students_count,
                views_count=stats.views_count,
                rating=stats.average_rating,
                completion_rate_pct=stats.completion_rate_pct,
                review_count=stats.review_count,
            )
        )

    tier = await instructor_studio_service.get_generosity_tier(db, instructor_id)
    return AdminInstructorDetail(
        id=user.id,
        full_name=user.full_name,
        phone=user.phone,
        email=user.email,
        username=user.username,
        status=user.status,
        created_at=user.created_at,
        generosity_tier=tier,
        courses=course_items,
    )


# --- Kompaniya tasdiqlash ("Tasdiqlangan ish beruvchi" belgisi) ---
async def list_companies(
    db: AsyncSession, *, cursor: int | None, limit: int, verified: bool | None
) -> AdminCompanyPage:
    stmt = select(Company)
    if verified is not None:
        stmt = stmt.where(Company.verified == verified)
    if cursor is not None:
        stmt = stmt.where(Company.id < cursor)
    stmt = stmt.order_by(Company.id.desc()).limit(limit + 1)
    rows = list((await db.execute(stmt)).scalars().all())
    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = rows[-1].id if has_more and rows else None

    company_ids = [c.id for c in rows]
    counts: dict[int, int] = {}
    if company_ids:
        count_rows = (
            await db.execute(
                select(Vacancy.company_id, func.count(Vacancy.id))
                .where(Vacancy.company_id.in_(company_ids))
                .group_by(Vacancy.company_id)
            )
        ).all()
        counts = {r[0]: r[1] for r in count_rows}

    items = [
        AdminCompanyOut(
            id=c.id,
            name=c.name,
            inn=c.inn,
            employee_count=c.employee_count,
            verified=c.verified,
            vacancies_count=counts.get(c.id, 0),
            created_at=c.created_at,
        )
        for c in rows
    ]
    return AdminCompanyPage(items=items, next_cursor=next_cursor)


async def set_company_verified(
    db: AsyncSession, admin: User, company_id: int, verified: bool
) -> AdminCompanyOut:
    company = await db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kompaniya topilmadi")
    newly_verified = verified and not company.verified
    company.verified = verified
    await write_audit_log(
        db,
        actor_id=admin.id,
        action="company.verify" if verified else "company.unverify",
        target_type="company",
        target_id=company_id,
    )
    if newly_verified:
        owner_ids = (
            (
                await db.execute(
                    select(CompanyMember.user_id).where(
                        CompanyMember.company_id == company_id,
                        CompanyMember.role == CompanyMemberRole.OWNER,
                    )
                )
            )
            .scalars()
            .all()
        )
        for owner_id in owner_ids:
            await create_notification(
                db,
                user_id=owner_id,
                notif_type=NotificationType.SYSTEM,
                category=NotificationCategory.OPPORTUNITY,
                title="Kompaniyangiz tasdiqlandi",
                body=f"{company.name} endi 'Tasdiqlangan ish beruvchi' belgisiga ega.",
                link_url="/ish-beruvchi",
            )
    await db.commit()
    await db.refresh(company)

    vacancies_count = (
        await db.execute(select(func.count(Vacancy.id)).where(Vacancy.company_id == company_id))
    ).scalar_one()
    return AdminCompanyOut(
        id=company.id,
        name=company.name,
        inn=company.inn,
        employee_count=company.employee_count,
        verified=company.verified,
        vacancies_count=vacancies_count,
        created_at=company.created_at,
    )
