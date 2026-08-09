"""Bandlik endpoint'lari — /v1/companies, /v1/vacancies, /v1/applications, /v1/placements."""

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import get_current_user, get_current_user_optional, require_roles
from app.modules.employer import service
from app.schemas.employer import (
    ApplicantOut,
    ApplicationCreate,
    ApplicationOut,
    ApplicationStatusUpdate,
    BlindTaskSubmissionOut,
    CheckinRequest,
    CompanyCreate,
    CompanyOut,
    CompanyStats,
    EmployerPublicStatsOut,
    PlacementOut,
    TaskSubmissionFeedback,
    TaskSubmissionOut,
    VacancyCreate,
    VacancyDetail,
    VacancyPage,
    VacancyTaskCreate,
    VacancyTaskOut,
)

router = APIRouter(tags=["employment"])
_employer = require_roles(RoleCode.EMPLOYER, RoleCode.ADMIN)


@router.get("/employer/public-stats", response_model=EmployerPublicStatsOut)
async def public_employer_stats(db: AsyncSession = Depends(get_db)) -> EmployerPublicStatsOut:
    return await service.get_public_employer_stats(db)


# ---------- Kompaniya ----------
@router.post("/companies", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def create_company(
    data: CompanyCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CompanyOut:
    return await service.create_company(db, user, data)


@router.get("/me/companies", response_model=list[CompanyOut])
async def my_companies(
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> list[CompanyOut]:
    return await service.list_my_companies(db, user)


@router.get("/companies/verified", response_model=list[CompanyOut])
async def verified_companies(db: AsyncSession = Depends(get_db)) -> list[CompanyOut]:
    return await service.list_verified_companies(db)


# ---------- Vakansiya (ish beruvchi) ----------
@router.post("/companies/{company_id}/vacancies", status_code=status.HTTP_201_CREATED)
async def create_vacancy(
    company_id: int,
    data: VacancyCreate,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    vacancy = await service.create_vacancy(db, company_id, user, data)
    return {"id": vacancy.id, "title": vacancy.title, "status": vacancy.status}


@router.post("/vacancies/{vacancy_id}/publish")
async def publish_vacancy(
    vacancy_id: int,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    vacancy = await service.publish_vacancy(db, vacancy_id, user)
    return {"id": vacancy.id, "status": vacancy.status}


@router.get("/vacancies/{vacancy_id}/owner")
async def vacancy_for_owner(
    vacancy_id: int,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    vacancy = await service.get_owned_vacancy(db, vacancy_id, user)
    task = await service.get_vacancy_task(db, vacancy_id, user)
    return {
        "id": vacancy.id,
        "title": vacancy.title,
        "status": vacancy.status,
        "task": task.model_dump() if task else None,
    }


# ---------- Sinov topshirig'i — "ko'r baholash" (ish beruvchi) ----------
@router.post("/vacancies/{vacancy_id}/task", response_model=VacancyTaskOut)
async def set_vacancy_task(
    vacancy_id: int,
    data: VacancyTaskCreate,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> VacancyTaskOut:
    return await service.set_vacancy_task(db, vacancy_id, user, data)


@router.get("/vacancies/{vacancy_id}/task-submissions", response_model=list[BlindTaskSubmissionOut])
async def task_submissions(
    vacancy_id: int,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> list[BlindTaskSubmissionOut]:
    return await service.list_task_submissions(db, vacancy_id, user)


@router.post("/task-submissions/{submission_id}/feedback", response_model=BlindTaskSubmissionOut)
async def task_submission_feedback(
    submission_id: int,
    data: TaskSubmissionFeedback,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> BlindTaskSubmissionOut:
    return await service.submit_task_feedback(db, submission_id, user, data.feedback)


@router.post("/task-submissions/{submission_id}/reveal", response_model=BlindTaskSubmissionOut)
async def task_submission_reveal(
    submission_id: int,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> BlindTaskSubmissionOut:
    return await service.reveal_task_submission(db, submission_id, user)


@router.get("/companies/{company_id}/vacancies")
async def my_vacancies(
    company_id: int,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> list[dict[str, object]]:
    vacancies = await service.list_my_vacancies(db, company_id, user)
    return [{"id": v.id, "title": v.title, "status": v.status} for v in vacancies]


@router.get("/companies/{company_id}/stats", response_model=CompanyStats)
async def company_stats(
    company_id: int,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> CompanyStats:
    return await service.get_company_stats(db, company_id, user)


# ---------- Public katalog ----------
@router.get("/vacancies", response_model=VacancyPage)
async def catalog(
    step: int | None = None,
    work_format: str | None = None,
    region_id: int | None = None,
    min_salary: int | None = None,
    q: str | None = None,
    cursor: int | None = None,
    limit: int = 12,
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> VacancyPage:
    return await service.catalog(
        db,
        step=step,
        work_format=work_format,
        region_id=region_id,
        min_salary=min_salary,
        q=q,
        cursor=cursor,
        limit=min(limit, 48),
        viewer=viewer,
    )


@router.get("/vacancies/{vacancy_id}", response_model=VacancyDetail)
async def vacancy_detail(
    vacancy_id: int,
    viewer: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> VacancyDetail:
    return await service.vacancy_detail(db, vacancy_id, viewer)


# ---------- Ariza (nomzod) ----------
@router.post(
    "/vacancies/{vacancy_id}/apply",
    response_model=ApplicationOut,
    status_code=status.HTTP_201_CREATED,
)
async def apply(
    vacancy_id: int,
    data: ApplicationCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ApplicationOut:
    return await service.apply(db, user, vacancy_id, data.share_disability_profile)


@router.get("/me/applications", response_model=list[ApplicationOut])
async def my_applications(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ApplicationOut]:
    return await service.list_my_applications(db, user)


@router.post("/applications/{application_id}/task-submission", response_model=TaskSubmissionOut)
async def submit_task_response(
    application_id: int,
    text: str = Form(""),
    file: UploadFile | None = File(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskSubmissionOut:
    file_url: str | None = None
    if file is not None:
        safe_name = storage.validate_upload(file, "attachment")
        storage.ensure_bucket()
        key = f"assessment-submissions/{user.id}/{application_id}/{safe_name}"
        file_url = storage.upload_fileobj(file.file, key)
    return await service.create_task_submission(db, user, application_id, text, file_url)


# ---------- Arizalar (ish beruvchi) ----------
@router.get("/vacancies/{vacancy_id}/applicants", response_model=list[ApplicantOut])
async def applicants(
    vacancy_id: int,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> list[ApplicantOut]:
    return await service.list_applicants(db, vacancy_id, user)


@router.post("/applications/{application_id}/status")
async def update_application_status(
    application_id: int,
    data: ApplicationStatusUpdate,
    user: User = Depends(_employer),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    application = await service.update_application_status(db, application_id, user, data.status)
    return {"id": application.id, "status": application.status}


# ---------- Placement check-in ----------
@router.post("/placements/{placement_id}/checkin", response_model=PlacementOut)
async def checkin(
    placement_id: int,
    data: CheckinRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlacementOut:
    placement = await service.checkin(db, placement_id, user, data.period)
    return PlacementOut.model_validate(placement)
