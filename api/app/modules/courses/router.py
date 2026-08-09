"""Ta'lim Akademiyasi endpoint'lari — /v1/courses, /v1/lessons, /v1/enrollments ..."""

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.core.db import get_db
from app.models.course import CourseCategory
from app.models.enums import LessonStatus, RoleCode
from app.models.user import User
from app.modules.auth.deps import get_current_user, get_current_user_optional, require_roles
from app.modules.courses import service
from app.schemas.course import (
    AssignmentCreate,
    CatalogPage,
    CategoryOut,
    CourseCard,
    CourseCreate,
    CourseDetail,
    CourseGalleryItem,
    EnrollmentOut,
    LessonCompleteOut,
    LessonCreate,
    LessonMaterialOut,
    LessonUpdate,
    ModuleCreate,
    ModuleUpdate,
    MyEnrollment,
    MySubmissionOut,
    SubmissionOut,
    SubmissionReview,
)

router = APIRouter(tags=["academy"])
_instructor = require_roles(RoleCode.INSTRUCTOR, RoleCode.ADMIN)


# ---------- Public ----------
@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: AsyncSession = Depends(get_db)) -> list[CategoryOut]:
    rows = (await db.execute(select(CourseCategory).order_by(CourseCategory.sort))).scalars().all()
    return [CategoryOut.model_validate(r) for r in rows]


@router.get("/courses", response_model=CatalogPage)
async def catalog(
    step: int | None = None,
    category_id: int | None = None,
    q: str | None = None,
    is_free: bool | None = None,
    region_id: int | None = None,
    cursor: int | None = None,
    limit: int = 12,
    db: AsyncSession = Depends(get_db),
) -> CatalogPage:
    return await service.catalog(
        db,
        step=step,
        category_id=category_id,
        q=q,
        is_free=is_free,
        region_id=region_id,
        cursor=cursor,
        limit=min(limit, 48),
    )


@router.get("/courses/{slug}", response_model=CourseDetail)
async def course_detail(
    slug: str,
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> CourseDetail:
    return await service.course_detail(db, slug, viewer)


@router.get("/courses/{course_id}/gallery", response_model=list[CourseGalleryItem])
async def course_gallery(
    course_id: int, db: AsyncSession = Depends(get_db)
) -> list[CourseGalleryItem]:
    return await service.get_course_gallery(db, course_id)


# ---------- Instructor ----------
@router.get("/me/courses", response_model=list[CourseCard])
async def my_courses(
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> list[CourseCard]:
    return await service.list_my_courses(db, user)


@router.get("/courses/by-id/{course_id}", response_model=CourseDetail)
async def course_detail_owned(
    course_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> CourseDetail:
    """Kurs konstruktori uchun — egasi qoralamani ham ko'ra oladi."""
    return await service.owned_course_detail(db, course_id, user)


@router.post("/courses", response_model=CourseDetail, status_code=status.HTTP_201_CREATED)
async def create_course(
    data: CourseCreate,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> CourseDetail:
    course = await service.create_course(db, user, data)
    return await service.course_detail_by_id(db, course.id)


@router.post("/courses/{course_id}/publish", response_model=CourseDetail)
async def publish_course(
    course_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> CourseDetail:
    course = await service.publish_course(db, course_id, user)
    return await service.course_detail_by_id(db, course.id)


@router.delete("/courses/{course_id}")
async def remove_course(
    course_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    action = await service.remove_course(db, course_id, user)
    return {"action": action}


@router.post("/courses/{course_id}/modules", status_code=status.HTTP_201_CREATED)
async def create_module(
    course_id: int,
    data: ModuleCreate,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    module = await service.create_module(db, course_id, user, data)
    return {"id": module.id, "title": module.title, "sort": module.sort}


@router.patch("/modules/{module_id}")
async def update_module(
    module_id: int,
    data: ModuleUpdate,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    module = await service.update_module(db, module_id, user, data)
    return {"id": module.id, "title": module.title, "sort": module.sort}


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_module(
    module_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.delete_module(db, module_id, user)


@router.post("/modules/{module_id}/lessons", status_code=status.HTTP_201_CREATED)
async def create_lesson(
    module_id: int,
    data: LessonCreate,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    lesson = await service.create_lesson(db, module_id, user, data)
    return {"id": lesson.id, "title": lesson.title, "status": lesson.status}


@router.patch("/lessons/{lesson_id}")
async def update_lesson(
    lesson_id: int,
    data: LessonUpdate,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    lesson = await service.update_lesson(db, lesson_id, user, data)
    return {"id": lesson.id, "title": lesson.title, "sort": lesson.sort}


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.delete_lesson(db, lesson_id, user)


@router.post("/modules/{module_id}/assignments", status_code=status.HTTP_201_CREATED)
async def create_assignment(
    module_id: int,
    data: AssignmentCreate,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    assignment = await service.create_assignment(db, module_id, user, data)
    return {"id": assignment.id, "title": assignment.title}


@router.post("/lessons/{lesson_id}/video")
async def upload_lesson_video(
    lesson_id: int,
    file: UploadFile = File(...),
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    lesson = await service.owned_lesson(db, lesson_id, user)
    safe_name = storage.validate_upload(file, "video")
    storage.ensure_bucket()
    key = f"raw/{lesson_id}/{safe_name}"
    storage.upload_fileobj(file.file, key)

    lesson.raw_video_key = key
    lesson.status = LessonStatus.PROCESSING
    await db.commit()

    # Transcode navbatga (Celery)
    from app.worker.tasks import transcode_lesson

    task = transcode_lesson.delay(lesson_id)
    return {"lesson_id": lesson_id, "status": lesson.status, "task_id": task.id}


@router.post("/lessons/{lesson_id}/subtitle")
async def upload_lesson_subtitle(
    lesson_id: int,
    file: UploadFile = File(...),
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    lesson = await service.owned_lesson(db, lesson_id, user)
    safe_name = storage.validate_upload(file, "subtitle")
    storage.ensure_bucket()
    key = f"subtitles/{lesson_id}/{safe_name}"
    url = storage.upload_fileobj(file.file, key, "text/vtt")
    lesson.subtitle_url = url
    await db.commit()
    return {"lesson_id": lesson_id, "subtitle_url": url}


@router.post(
    "/lessons/{lesson_id}/materials",
    response_model=LessonMaterialOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_lesson_material(
    lesson_id: int,
    title: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> LessonMaterialOut:
    await service.owned_lesson(db, lesson_id, user)
    safe_name = storage.validate_upload(file, "attachment")
    storage.ensure_bucket()
    key = f"materials/{lesson_id}/{safe_name}"
    file_url = storage.upload_fileobj(file.file, key)
    return await service.add_material(db, lesson_id, user, title, file_url)


@router.delete("/lesson-materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson_material(
    material_id: int,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.delete_material(db, material_id, user)


# ---------- Learner ----------
@router.post("/enrollments", response_model=EnrollmentOut, status_code=status.HTTP_201_CREATED)
async def enroll(
    course_id: int = Form(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> EnrollmentOut:
    enrollment = await service.enroll(db, user, course_id)
    return EnrollmentOut.model_validate(enrollment)


@router.get("/me/enrollments", response_model=list[MyEnrollment])
async def my_enrollments(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MyEnrollment]:
    return await service.list_my_enrollments(db, user)


@router.get("/me/submissions", response_model=list[MySubmissionOut])
async def my_submissions_all(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MySubmissionOut]:
    return await service.list_my_submissions_all(db, user)


@router.get("/courses/{course_id}/progress")
async def course_progress(
    course_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    return await service.get_progress(db, user, course_id)


@router.post("/lessons/{lesson_id}/complete", response_model=LessonCompleteOut)
async def complete_lesson(
    lesson_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LessonCompleteOut:
    pct, completed, cert_uid = await service.complete_lesson(db, user, lesson_id)
    return LessonCompleteOut(
        lesson_id=lesson_id, progress_pct=pct, course_completed=completed, certificate_uid=cert_uid
    )


@router.get("/courses/{course_id}/my-submissions", response_model=list[SubmissionOut])
async def my_submissions(
    course_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SubmissionOut]:
    rows = await service.list_my_submissions(db, user, course_id)
    return [SubmissionOut.model_validate(s) for s in rows]


@router.post("/submissions", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
async def create_submission(
    assignment_id: int = Form(...),
    text: str = Form(""),
    file: UploadFile | None = File(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SubmissionOut:
    file_url: str | None = None
    if file is not None:
        safe_name = storage.validate_upload(file, "attachment")
        storage.ensure_bucket()
        key = f"submissions/{user.id}/{assignment_id}/{safe_name}"
        file_url = storage.upload_fileobj(file.file, key)
    submission = await service.create_submission(db, user, assignment_id, text, file_url)
    return SubmissionOut.model_validate(submission)


@router.post("/submissions/{submission_id}/review", response_model=SubmissionOut)
async def review_submission(
    submission_id: int,
    data: SubmissionReview,
    user: User = Depends(_instructor),
    db: AsyncSession = Depends(get_db),
) -> SubmissionOut:
    submission = await service.review_submission(
        db, user, submission_id, approve=data.approve, feedback=data.feedback
    )
    return SubmissionOut.model_validate(submission)


# ---------- Video himoya (V2-5) ----------
@router.get("/lessons/{lesson_id}/hls-key")
async def hls_key(
    lesson_id: int,
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> Response:
    key_bytes = await service.get_hls_key(db, lesson_id, viewer)
    return Response(content=key_bytes, media_type="application/octet-stream")
