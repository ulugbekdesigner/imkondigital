"""Ta'lim Akademiyasi biznes logikasi."""

import re
import secrets
from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.assessment import Quiz, QuizAttempt
from app.models.certificate import Certificate
from app.models.course import (
    Assignment,
    Course,
    CourseModule,
    Enrollment,
    Lesson,
    LessonCompletion,
    Submission,
)
from app.models.enums import (
    CourseStatus,
    EnrollmentStatus,
    LessonStatus,
    NotificationCategory,
    NotificationType,
    PassportVisibility,
    QuizKind,
    RoleCode,
    SubmissionStatus,
)
from app.models.lesson_material import LessonMaterial
from app.models.portfolio import PortfolioItem
from app.models.user import Region, User
from app.modules.notifications.service import create_notification
from app.modules.passport import service as passport_service
from app.modules.streak import service as streak_service
from app.schemas.assessment import QuizPublic
from app.schemas.course import (
    AssignmentCreate,
    AssignmentOut,
    CatalogPage,
    CourseCard,
    CourseCreate,
    CourseDetail,
    CourseGalleryItem,
    EnrollmentOut,
    LessonCreate,
    LessonMaterialOut,
    LessonOut,
    LessonUpdate,
    ModuleCreate,
    ModuleOut,
    ModuleUpdate,
    MyEnrollment,
    MySubmissionOut,
)


def slugify(title: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:180] or "kurs"
    return f"{base}-{secrets.token_hex(3)}"


def _is_admin(user: User) -> bool:
    return any(r.code == RoleCode.ADMIN for r in user.roles)


async def _owned_course(db: AsyncSession, course_id: int, user: User) -> Course:
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    if course.instructor_id != user.id and not _is_admin(user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu kurs sizniki emas")
    return course


async def _owned_module(db: AsyncSession, module_id: int, user: User) -> CourseModule:
    module = await db.get(CourseModule, module_id)
    if module is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modul topilmadi")
    await _owned_course(db, module.course_id, user)
    return module


async def _owned_lesson(db: AsyncSession, lesson_id: int, user: User) -> Lesson:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dars topilmadi")
    await _owned_module(db, lesson.module_id, user)
    return lesson


# --- Yaratish (ustoz) ---
async def create_course(db: AsyncSession, user: User, data: CourseCreate) -> Course:
    course = Course(
        instructor_id=user.id,
        title=data.title,
        slug=slugify(data.title),
        description=data.description,
        category_id=data.category_id,
        ladder_step=data.ladder_step,
        price=0 if data.is_free else data.price,
        is_free=data.is_free,
        region_id=data.region_id,
        duration_weeks=data.duration_weeks,
        status=CourseStatus.DRAFT,
    )
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def create_module(
    db: AsyncSession, course_id: int, user: User, data: ModuleCreate
) -> CourseModule:
    await _owned_course(db, course_id, user)
    module = CourseModule(course_id=course_id, title=data.title, sort=data.sort)
    db.add(module)
    await db.commit()
    await db.refresh(module)
    return module


async def update_module(
    db: AsyncSession, module_id: int, user: User, data: ModuleUpdate
) -> CourseModule:
    module = await _owned_module(db, module_id, user)
    if data.title is not None:
        module.title = data.title
    if data.sort is not None:
        module.sort = data.sort
    await db.commit()
    await db.refresh(module)
    return module


async def delete_module(db: AsyncSession, module_id: int, user: User) -> None:
    await _owned_module(db, module_id, user)
    # Core-darajasidagi DELETE — ORM eager-loaded (selectin) collection'ni nollashga
    # urinmasdan, DB'dagi ON DELETE CASCADE'ga to'g'ridan-to'g'ri ishonadi.
    await db.execute(delete(CourseModule).where(CourseModule.id == module_id))
    await db.commit()


async def create_lesson(db: AsyncSession, module_id: int, user: User, data: LessonCreate) -> Lesson:
    await _owned_module(db, module_id, user)
    lesson = Lesson(
        module_id=module_id,
        title=data.title,
        description=data.description,
        sort=data.sort,
        status=LessonStatus.DRAFT,
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


async def update_lesson(db: AsyncSession, lesson_id: int, user: User, data: LessonUpdate) -> Lesson:
    lesson = await _owned_lesson(db, lesson_id, user)
    if data.title is not None:
        lesson.title = data.title
    if data.description is not None:
        lesson.description = data.description
    if data.sort is not None:
        lesson.sort = data.sort
    await db.commit()
    await db.refresh(lesson)
    return lesson


async def delete_lesson(db: AsyncSession, lesson_id: int, user: User) -> None:
    await _owned_lesson(db, lesson_id, user)
    await db.execute(delete(Lesson).where(Lesson.id == lesson_id))
    await db.commit()


async def create_assignment(
    db: AsyncSession, module_id: int, user: User, data: AssignmentCreate
) -> Assignment:
    await _owned_module(db, module_id, user)
    assignment = Assignment(
        module_id=module_id, title=data.title, description=data.description, sort=data.sort
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)
    return assignment


async def owned_lesson(db: AsyncSession, lesson_id: int, user: User) -> Lesson:
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dars topilmadi")
    await _owned_module(db, lesson.module_id, user)
    return lesson


async def add_material(
    db: AsyncSession, lesson_id: int, user: User, title: str, file_url: str
) -> LessonMaterialOut:
    await owned_lesson(db, lesson_id, user)
    material = LessonMaterial(lesson_id=lesson_id, title=title, file_url=file_url)
    db.add(material)
    await db.commit()
    await db.refresh(material)
    return LessonMaterialOut(id=material.id, title=material.title, file_url=material.file_url)


async def delete_material(db: AsyncSession, material_id: int, user: User) -> None:
    material = await db.get(LessonMaterial, material_id)
    if material is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Material topilmadi")
    await owned_lesson(db, material.lesson_id, user)
    await db.delete(material)
    await db.commit()


async def publish_course(db: AsyncSession, course_id: int, user: User) -> Course:
    course = await _owned_course(db, course_id, user)
    module_stmt = select(CourseModule.id).where(CourseModule.course_id == course_id).limit(1)
    has_module = (await db.execute(module_stmt)).first() is not None
    if not has_module:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nashr qilishdan oldin kamida bitta modul qo'shing",
        )
    course.status = CourseStatus.PUBLISHED
    await db.commit()
    await db.refresh(course)
    return course


# --- Katalog / detal (public) ---
async def _lessons_count_map(db: AsyncSession, course_ids: list[int]) -> dict[int, int]:
    if not course_ids:
        return {}
    rows = (
        await db.execute(
            select(Course.id, func.count(Lesson.id))
            .select_from(Course)
            .join(CourseModule, CourseModule.course_id == Course.id)
            .join(Lesson, Lesson.module_id == CourseModule.id)
            .where(Course.id.in_(course_ids))
            .group_by(Course.id)
        )
    ).all()
    return {cid: cnt for cid, cnt in rows}


async def _region_name_map(db: AsyncSession, region_ids: list[int]) -> dict[int, str]:
    ids = [r for r in region_ids if r is not None]
    if not ids:
        return {}
    rows = (await db.execute(select(Region.id, Region.name).where(Region.id.in_(ids)))).all()
    return {rid: name for rid, name in rows}


def _to_card(course: Course, lessons_count: int, region_name: str | None = None) -> CourseCard:
    return CourseCard(
        id=course.id,
        title=course.title,
        slug=course.slug,
        description=course.description,
        ladder_step=course.ladder_step,
        is_free=course.is_free,
        price=course.price,
        cover_url=course.cover_url,
        status=course.status,
        rating=course.rating,
        students_count=course.students_count,
        income_success_rate=course.income_success_rate,
        lessons_count=lessons_count,
        region_id=course.region_id,
        region_name=region_name,
        duration_weeks=course.duration_weeks,
    )


async def catalog(
    db: AsyncSession,
    *,
    step: int | None,
    category_id: int | None,
    q: str | None,
    is_free: bool | None,
    region_id: int | None,
    cursor: int | None,
    limit: int,
) -> CatalogPage:
    stmt = select(Course).where(Course.status == CourseStatus.PUBLISHED)
    if step is not None:
        stmt = stmt.where(Course.ladder_step == step)
    if category_id is not None:
        stmt = stmt.where(Course.category_id == category_id)
    if is_free is not None:
        stmt = stmt.where(Course.is_free.is_(is_free))
    if region_id is not None:
        stmt = stmt.where(Course.region_id == region_id)
    if q:
        stmt = stmt.where(Course.title.ilike(f"%{q}%"))
    if cursor is not None:
        stmt = stmt.where(Course.id < cursor)
    stmt = stmt.order_by(Course.id.desc()).limit(limit + 1)

    courses = list((await db.execute(stmt)).scalars().all())
    has_more = len(courses) > limit
    courses = courses[:limit]
    counts = await _lessons_count_map(db, [c.id for c in courses])
    regions = await _region_name_map(db, [c.region_id for c in courses if c.region_id])
    items = [
        _to_card(c, counts.get(c.id, 0), regions.get(c.region_id) if c.region_id else None)
        for c in courses
    ]
    next_cursor = courses[-1].id if has_more and courses else None
    return CatalogPage(items=items, next_cursor=next_cursor)


def _lesson_out(lesson: Lesson, *, reveal_hls: bool) -> LessonOut:
    return LessonOut(
        id=lesson.id,
        title=lesson.title,
        description=lesson.description,
        hls_url=lesson.hls_url if reveal_hls else None,
        subtitle_url=lesson.subtitle_url if reveal_hls else None,
        transcript=lesson.transcript if reveal_hls else None,
        duration=lesson.duration,
        status=lesson.status,
        sort=lesson.sort,
        materials=(
            [
                LessonMaterialOut(id=m.id, title=m.title, file_url=m.file_url)
                for m in lesson.materials
            ]
            if reveal_hls
            else []
        ),
    )


def _quiz_public(quiz: Quiz) -> QuizPublic:
    return QuizPublic(
        id=quiz.id,
        kind=quiz.kind,
        title=quiz.title,
        pass_score_pct=quiz.pass_score_pct,
        time_limit_seconds=quiz.time_limit_seconds,
        question_count=len(quiz.questions),
    )


async def _quiz_map_by_module(db: AsyncSession, module_ids: list[int]) -> dict[int, QuizPublic]:
    if not module_ids:
        return {}
    rows = (await db.execute(select(Quiz).where(Quiz.module_id.in_(module_ids)))).scalars().all()
    return {q.module_id: _quiz_public(q) for q in rows if q.module_id is not None}


async def _final_quiz(db: AsyncSession, course_id: int) -> QuizPublic | None:
    quiz = (await db.execute(select(Quiz).where(Quiz.course_id == course_id))).scalar_one_or_none()
    return _quiz_public(quiz) if quiz is not None else None


async def _is_enrolled(db: AsyncSession, course_id: int, user_id: int) -> bool:
    return (
        await db.execute(
            select(Enrollment.id).where(
                Enrollment.user_id == user_id, Enrollment.course_id == course_id
            )
        )
    ).scalar_one_or_none() is not None


async def course_detail(db: AsyncSession, slug: str, viewer: User | None) -> CourseDetail:
    course = (await db.execute(select(Course).where(Course.slug == slug))).scalar_one_or_none()
    is_owner = viewer is not None and course is not None and (
        viewer.id == course.instructor_id or _is_admin(viewer)
    )
    if course is None or (course.status != CourseStatus.PUBLISHED and not is_owner):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    if not is_owner:
        # Egasi o'z qoralamasini "Ko'rib chiqish" orqali ko'rganda ko'rishlar
        # sonini soxta oshirmasligi kerak.
        course.views_count += 1
        await db.commit()
    # Bepul kurslarda video hammaga ochiq; pullik kurslarda faqat ro'yxatga olgan
    # foydalanuvchiga (haqiqiy xarid oqimi hali yo'q — V2-4'da hujjatlashtirilgan,
    # amalda hozircha faqat bepul kurslarga tegishli, lekin mantiq to'g'ri qurilgan).
    reveal = (
        course.is_free
        or is_owner
        or (viewer is not None and await _is_enrolled(db, course.id, viewer.id))
    )
    return await _build_detail(db, course, reveal=reveal)


async def course_detail_by_id(db: AsyncSession, course_id: int) -> CourseDetail:
    """Ustoz javoblari uchun — holatdan qat'i nazar (draft/published)."""
    course = await db.get(Course, course_id)
    if course is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")
    return await _build_detail(db, course, reveal=True)


async def list_my_courses(db: AsyncSession, user: User) -> list[CourseCard]:
    """Ustozning o'z kurslari — holatdan qat'i nazar (kurs konstruktori uchun)."""
    courses = (
        (
            await db.execute(
                select(Course)
                .where(Course.instructor_id == user.id)
                .order_by(Course.created_at.desc())
            )
        )
        .scalars()
        .all()
    )
    counts = await _lessons_count_map(db, [c.id for c in courses])
    regions = await _region_name_map(db, [c.region_id for c in courses if c.region_id])
    return [
        _to_card(c, counts.get(c.id, 0), regions.get(c.region_id) if c.region_id else None)
        for c in courses
    ]


async def list_my_enrollments(db: AsyncSession, user: User) -> list[MyEnrollment]:
    rows = (
        await db.execute(
            select(Enrollment, Course.title, Course.slug)
            .join(Course, Course.id == Enrollment.course_id)
            .where(Enrollment.user_id == user.id)
            .order_by(Enrollment.started_at.desc())
        )
    ).all()
    return [
        MyEnrollment(
            enrollment=EnrollmentOut.model_validate(e),
            course_title=title,
            course_slug=slug,
        )
        for e, title, slug in rows
    ]


async def owned_course_detail(db: AsyncSession, course_id: int, user: User) -> CourseDetail:
    """Kurs konstruktori uchun — faqat egasi (yoki admin), holatdan qat'i nazar."""
    course = await _owned_course(db, course_id, user)
    return await _build_detail(db, course, reveal=True)


async def _build_detail(db: AsyncSession, course: Course, *, reveal: bool) -> CourseDetail:
    instructor = await db.get(User, course.instructor_id)
    counts = await _lessons_count_map(db, [course.id])
    region_name = None
    if course.region_id is not None:
        region = await db.get(Region, course.region_id)
        region_name = region.name if region else None
    card = _to_card(course, counts.get(course.id, 0), region_name)
    quiz_map = await _quiz_map_by_module(db, [m.id for m in course.modules])
    modules = [
        ModuleOut(
            id=m.id,
            title=m.title,
            sort=m.sort,
            lessons=[_lesson_out(lesson, reveal_hls=reveal) for lesson in m.lessons],
            assignments=[
                AssignmentOut(id=a.id, title=a.title, description=a.description, sort=a.sort)
                for a in m.assignments
            ],
            quiz=quiz_map.get(m.id),
        )
        for m in course.modules
    ]
    return CourseDetail(
        **card.model_dump(),
        trailer_url=course.trailer_url,
        instructor_name=instructor.full_name if instructor else "IMKON Digital",
        final_exam_brief=course.final_exam_brief,
        final_quiz=await _final_quiz(db, course.id),
        modules=modules,
    )


# --- Ro'yxatga olish / progress ---
async def enroll(db: AsyncSession, user: User, course_id: int) -> Enrollment:
    course = await db.get(Course, course_id)
    if course is None or course.status != CourseStatus.PUBLISHED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kurs topilmadi")

    existing = (
        await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user.id, Enrollment.course_id == course_id
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        return existing

    enrollment = Enrollment(user_id=user.id, course_id=course_id)
    db.add(enrollment)
    course.students_count += 1
    await db.commit()
    await db.refresh(enrollment)
    return enrollment


async def _total_lessons(db: AsyncSession, course_id: int) -> int:
    return (
        await db.execute(
            select(func.count(Lesson.id))
            .select_from(Lesson)
            .join(CourseModule, CourseModule.id == Lesson.module_id)
            .where(CourseModule.course_id == course_id)
        )
    ).scalar_one()


async def _module_lock_reason(
    db: AsyncSession, enrollment: Enrollment, module: CourseModule, course: Course
) -> str | None:
    """Modul qulflanganmi — qulflangan bo'lsa sababni, aks holda None qaytaradi.

    Mastery-model (Khan Academy uslubi): modul faqat oldingi BARCHA modullar
    tugallangan VA ularning MODULE_CHECK testi (agar bo'lsa) o'tilgan bo'lsagina
    ochiladi — LAYOUT_XARITA.md 4.2-bo'lim: "test topshirilmaguncha keyingi
    dars ochilmaydi". Ma'lumot modelida test faqat MODUL darajasida bo'lgani
    uchun ("dars darajasida" emas), qoida modul-darajasida amalga oshiriladi:
    oldingi modul to'liq tugallanmaguncha va uning testi o'tilmaguncha,
    keyingi moduldagi darslar bajarilgan deb belgilanmaydi.
    """
    prior_modules = (
        await db.execute(
            select(CourseModule)
            .where(CourseModule.course_id == course.id, CourseModule.sort < module.sort)
            .order_by(CourseModule.sort)
        )
    ).scalars().all()
    if not prior_modules:
        return None

    for prior in prior_modules:
        lesson_ids = [lesson.id for lesson in prior.lessons]
        if lesson_ids:
            done_count = (
                await db.execute(
                    select(func.count(LessonCompletion.id)).where(
                        LessonCompletion.enrollment_id == enrollment.id,
                        LessonCompletion.lesson_id.in_(lesson_ids),
                    )
                )
            ).scalar_one()
            if done_count < len(lesson_ids):
                return f'Avval "{prior.title}" modulini yakunlang'
        quiz = (
            await db.execute(
                select(Quiz).where(
                    Quiz.module_id == prior.id, Quiz.kind == QuizKind.MODULE_CHECK
                )
            )
        ).scalar_one_or_none()
        if quiz is not None:
            passed = (
                await db.execute(
                    select(QuizAttempt.id).where(
                        QuizAttempt.quiz_id == quiz.id,
                        QuizAttempt.user_id == enrollment.user_id,
                        QuizAttempt.passed.is_(True),
                    )
                )
            ).first()
            if passed is None:
                return f'Avval "{prior.title}" modulining testini o\'ting'
    return None


async def _check_module_unlocked(
    db: AsyncSession, enrollment: Enrollment, module: CourseModule, course: Course
) -> None:
    reason = await _module_lock_reason(db, enrollment, module, course)
    if reason is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)


async def _locked_module_ids(
    db: AsyncSession, enrollment: Enrollment, course: Course
) -> list[int]:
    """Foydalanuvchi uchun HOZIR qulflangan modullar ro'yxati (proaktiv, UI uchun)."""
    locked: list[int] = []
    for module in course.modules:
        reason = await _module_lock_reason(db, enrollment, module, course)
        if reason is not None:
            locked.append(module.id)
    return locked


async def complete_lesson(
    db: AsyncSession, user: User, lesson_id: int
) -> tuple[int, bool, str | None]:
    """Darsni bajarilgan deb belgilaydi va progressni qayta hisoblaydi.

    Qaytaradi: (progress_pct, course_completed, certificate_uid).
    Kurs 100% tugallansa — sertifikat avtomatik beriladi (PDF + QR).
    """
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dars topilmadi")
    module = await db.get(CourseModule, lesson.module_id)
    assert module is not None
    course_id = module.course_id

    enrollment = (
        await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user.id, Enrollment.course_id == course_id
            )
        )
    ).scalar_one_or_none()
    if enrollment is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Avval kursga yoziling")

    course = await db.get(Course, course_id)
    assert course is not None
    await _check_module_unlocked(db, enrollment, module, course)

    already = (
        await db.execute(
            select(LessonCompletion).where(
                LessonCompletion.enrollment_id == enrollment.id,
                LessonCompletion.lesson_id == lesson_id,
            )
        )
    ).scalar_one_or_none()
    if already is None:
        db.add(LessonCompletion(enrollment_id=enrollment.id, lesson_id=lesson_id))
        await db.flush()
    await streak_service.record_activity(db, user)

    done = (
        await db.execute(
            select(func.count(LessonCompletion.id)).where(
                LessonCompletion.enrollment_id == enrollment.id
            )
        )
    ).scalar_one()
    total = await _total_lessons(db, course_id)
    pct = round(done / total * 100) if total else 0
    enrollment.progress_pct = pct
    completed = pct >= 100
    if completed:
        enrollment.status = EnrollmentStatus.COMPLETED
        enrollment.completed_at = datetime.now(UTC)
    await db.commit()

    certificate_uid: str | None = None
    if completed:
        cert = await passport_service.issue_certificate_for_completion(db, user, course)
        if cert is not None:
            await create_notification(
                db,
                user_id=user.id,
                notif_type=NotificationType.CERTIFICATE_ISSUED,
                category=NotificationCategory.LEARNING,
                title="Tabriklaymiz! Sertifikat berildi",
                body=course.title,
                link_url="/profil",
            )
        await db.commit()
        certificate_uid = cert.uid if cert else None

    return pct, completed, certificate_uid


async def get_progress(db: AsyncSession, user: User, course_id: int) -> dict[str, object]:
    """Foydalanuvchining kursdagi holati: yozilganmi, progress, tugatilgan darslar, qulflangan modullar."""
    enrollment = (
        await db.execute(
            select(Enrollment).where(
                Enrollment.user_id == user.id, Enrollment.course_id == course_id
            )
        )
    ).scalar_one_or_none()
    if enrollment is None:
        return {
            "enrolled": False,
            "progress_pct": 0,
            "status": None,
            "completed_lesson_ids": [],
            "locked_module_ids": [],
            "certificate": None,
        }
    done_ids = list(
        (
            await db.execute(
                select(LessonCompletion.lesson_id).where(
                    LessonCompletion.enrollment_id == enrollment.id
                )
            )
        ).scalars()
    )
    course = await db.get(Course, course_id)
    assert course is not None
    locked_ids = await _locked_module_ids(db, enrollment, course)
    cert = (
        await db.execute(
            select(Certificate).where(
                Certificate.user_id == user.id, Certificate.course_id == course_id
            )
        )
    ).scalar_one_or_none()
    certificate = (
        {
            "uid": cert.uid,
            "pdf_url": cert.pdf_url,
            "issued_at": cert.issued_at.isoformat(),
            "confirmed_at": cert.confirmed_at.isoformat() if cert.confirmed_at else None,
        }
        if cert
        else None
    )
    return {
        "enrolled": True,
        "progress_pct": enrollment.progress_pct,
        "status": enrollment.status,
        "completed_lesson_ids": done_ids,
        "locked_module_ids": locked_ids,
        "certificate": certificate,
    }


async def list_my_submissions(db: AsyncSession, user: User, course_id: int) -> list[Submission]:
    """Foydalanuvchining shu kursdagi (barcha modullar bo'yicha) topshiriqlari."""
    rows = (
        (
            await db.execute(
                select(Submission)
                .join(Assignment, Assignment.id == Submission.assignment_id)
                .join(CourseModule, CourseModule.id == Assignment.module_id)
                .where(CourseModule.course_id == course_id, Submission.user_id == user.id)
            )
        )
        .scalars()
        .all()
    )
    return list(rows)


async def list_my_submissions_all(db: AsyncSession, user: User) -> list[MySubmissionOut]:
    """Foydalanuvchining BARCHA kurslardagi topshiriqlari — /profil 'Faoliyatim'."""
    rows = (
        await db.execute(
            select(Submission, Assignment.title, Course.id, Course.title, Course.slug)
            .join(Assignment, Assignment.id == Submission.assignment_id)
            .join(CourseModule, CourseModule.id == Assignment.module_id)
            .join(Course, Course.id == CourseModule.course_id)
            .where(Submission.user_id == user.id)
            .order_by(Submission.created_at.desc())
        )
    ).all()
    return [
        MySubmissionOut(
            id=submission.id,
            assignment_id=submission.assignment_id,
            assignment_title=assignment_title,
            course_id=course_id,
            course_title=course_title,
            course_slug=course_slug,
            text=submission.text,
            file_url=submission.file_url,
            status=submission.status,
            feedback=submission.feedback,
            created_at=submission.created_at,
        )
        for submission, assignment_title, course_id, course_title, course_slug in rows
    ]


async def create_submission(
    db: AsyncSession, user: User, assignment_id: int, text: str, file_url: str | None
) -> Submission:
    assignment = await db.get(Assignment, assignment_id)
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topshiriq topilmadi")
    submission = Submission(
        assignment_id=assignment_id, user_id=user.id, text=text, file_url=file_url
    )
    db.add(submission)
    await db.commit()
    await db.refresh(submission)
    return submission


async def review_submission(
    db: AsyncSession, user: User, submission_id: int, *, approve: bool, feedback: str
) -> Submission:
    """Ustoz topshiriqni tasdiqlaydi/rad etadi. Tasdiqlansa — portfolio'ga avtomatik qo'shiladi."""
    submission = await db.get(Submission, submission_id)
    if submission is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topshiriq topilmadi")
    assignment = await db.get(Assignment, submission.assignment_id)
    assert assignment is not None
    await _owned_module(db, assignment.module_id, user)  # faqat shu kurs ustozi tasdiqlay oladi

    submission.status = SubmissionStatus.APPROVED if approve else SubmissionStatus.REJECTED
    submission.feedback = feedback
    submission.reviewed_by = user.id

    if approve:
        await passport_service.add_portfolio_from_submission(db, submission)

    module = await db.get(CourseModule, assignment.module_id)
    course = await db.get(Course, module.course_id) if module else None
    await create_notification(
        db,
        user_id=submission.user_id,
        notif_type=NotificationType.ASSIGNMENT_REVIEWED,
        category=NotificationCategory.LEARNING,
        title=(
            "Topshirig'ingiz tekshirildi" if approve else "Topshiriq qayta ishlashni talab qiladi"
        ),
        body=f"{assignment.title} · {course.title}" if course else assignment.title,
        link_url=f"/kurslar/{course.slug}" if course else None,
    )

    await db.commit()
    await db.refresh(submission)
    return submission


# --- Video himoya (V2-5/C1) ---
async def has_lesson_access(db: AsyncSession, lesson: Lesson, user: User | None) -> bool:
    """Bepul kursda hammaga ochiq (video/transkriptning o'zi kabi); pullikda faqat

    ro'yxatdan o'tgan foydalanuvchiga (`_authorize_lesson_access` — study_buddy.py
    bilan bir xil mantiq, AES kalit yetkazishda ham qayta ishlatiladi)."""
    module = await db.get(CourseModule, lesson.module_id)
    assert module is not None
    course = await db.get(Course, module.course_id)
    assert course is not None
    if course.is_free:
        return True
    if user is None:
        return False
    return await _is_enrolled(db, course.id, user.id)


async def get_hls_key(db: AsyncSession, lesson_id: int, user: User | None) -> bytes:
    """HLS AES-128 xom kalitini qaytaradi — faqat haqiqiy kirish huquqi tekshirilgandan keyin."""
    lesson = await db.get(Lesson, lesson_id)
    if lesson is None or lesson.hls_key_hex is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kalit topilmadi")
    if not await has_lesson_access(db, lesson, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Bu darsga kirish huquqingiz yo'q"
        )
    return bytes.fromhex(lesson.hls_key_hex)


async def get_course_gallery(db: AsyncSession, course_id: int) -> list[CourseGalleryItem]:
    """Kurs bilan bog'liq topshiriqlardan kelib chiqqan portfolio ishlari — faqat
    passportini ochiq/havola-bilan qilgan foydalanuvchilarniki (maxfiylik hurmati)."""
    rows = (
        await db.execute(
            select(PortfolioItem, User)
            .join(Submission, PortfolioItem.submission_id == Submission.id)
            .join(Assignment, Submission.assignment_id == Assignment.id)
            .join(CourseModule, Assignment.module_id == CourseModule.id)
            .join(User, PortfolioItem.user_id == User.id)
            .where(
                CourseModule.course_id == course_id,
                User.passport_visibility != PassportVisibility.PRIVATE,
            )
            .order_by(PortfolioItem.created_at.desc())
            .limit(12)
        )
    ).all()
    return [
        CourseGalleryItem(
            id=item.id,
            title=item.title,
            description=item.description,
            media_urls=item.media_urls,
            student_name=user.full_name,
            student_username=user.username,
            created_at=item.created_at,
        )
        for item, user in rows
    ]
