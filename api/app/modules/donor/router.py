"""Donor dasturi endpoint'lari — /v1/donor/* (donor kabineti) va /v1/programs/* (ochiq)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import get_current_user, require_roles
from app.modules.donor import service
from app.schemas.donor import (
    DonorProgramIn,
    DonorProgramOut,
    DonorProgramStatusUpdate,
    ProgramEnrollmentOut,
)

_donor = require_roles(RoleCode.DONOR)

router = APIRouter(prefix="/donor", tags=["donor"])


@router.post("/programs", response_model=DonorProgramOut, status_code=201)
async def create_program(
    data: DonorProgramIn,
    donor: User = Depends(_donor),
    db: AsyncSession = Depends(get_db),
) -> DonorProgramOut:
    return await service.create_program(db, donor, data.title, data.description)


@router.get("/programs", response_model=list[DonorProgramOut])
async def my_programs(
    donor: User = Depends(_donor), db: AsyncSession = Depends(get_db)
) -> list[DonorProgramOut]:
    return await service.list_my_programs(db, donor)


@router.patch("/programs/{program_id}/status", response_model=DonorProgramOut)
async def update_program_status(
    program_id: int,
    data: DonorProgramStatusUpdate,
    donor: User = Depends(_donor),
    db: AsyncSession = Depends(get_db),
) -> DonorProgramOut:
    return await service.update_program_status(db, donor, program_id, data.status)


@router.get("/programs/{program_id}/applications", response_model=list[ProgramEnrollmentOut])
async def list_applications(
    program_id: int,
    donor: User = Depends(_donor),
    db: AsyncSession = Depends(get_db),
) -> list[ProgramEnrollmentOut]:
    return await service.list_applications(db, donor, program_id)


@router.post(
    "/programs/{program_id}/applications/{enrollment_id}/approve",
    response_model=ProgramEnrollmentOut,
)
async def approve_application(
    program_id: int,
    enrollment_id: int,
    donor: User = Depends(_donor),
    db: AsyncSession = Depends(get_db),
) -> ProgramEnrollmentOut:
    return await service.decide_application(db, donor, program_id, enrollment_id, True)


@router.post(
    "/programs/{program_id}/applications/{enrollment_id}/reject",
    response_model=ProgramEnrollmentOut,
)
async def reject_application(
    program_id: int,
    enrollment_id: int,
    donor: User = Depends(_donor),
    db: AsyncSession = Depends(get_db),
) -> ProgramEnrollmentOut:
    return await service.decide_application(db, donor, program_id, enrollment_id, False)


programs_router = APIRouter(prefix="/programs", tags=["donor"])


@programs_router.get("", response_model=list[DonorProgramOut])
async def browse_programs(db: AsyncSession = Depends(get_db)) -> list[DonorProgramOut]:
    return await service.list_active_programs(db)


@programs_router.post("/{program_id}/apply", response_model=ProgramEnrollmentOut, status_code=201)
async def apply_to_program(
    program_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProgramEnrollmentOut:
    return await service.apply_to_program(db, user, program_id)
