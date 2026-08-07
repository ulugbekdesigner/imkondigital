"""Donor dasturi biznes logikasi — yaratish, ariza berish, qabul/rad."""

from datetime import UTC, datetime

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ladder import ladder_steps_map
from app.models.donor import DonorProgram, ProgramEnrollment
from app.models.enums import (
    DonorProgramStatus,
    NotificationCategory,
    NotificationType,
    ProgramEnrollmentStatus,
    VerifiedStatus,
)
from app.models.user import Region, User
from app.modules.notifications.service import create_notification
from app.schemas.donor import DonorProgramOut, ProgramEnrollmentOut

# Qoralama→faol→yakunlangan — chiziqli oqim; orqaga yoki ustidan sakrash yo'q
# (Xayriya loyihasidagi _ALLOWED_TRANSITIONS bilan bir xil naqsh).
_ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    DonorProgramStatus.DRAFT: {DonorProgramStatus.ACTIVE},
    DonorProgramStatus.ACTIVE: {DonorProgramStatus.COMPLETED},
}


async def _to_program_out(db: AsyncSession, program: DonorProgram) -> DonorProgramOut:
    donor = await db.get(User, program.donor_id)
    assert donor is not None
    enrolled_count = (
        await db.execute(
            select(func.count())
            .select_from(ProgramEnrollment)
            .where(
                ProgramEnrollment.program_id == program.id,
                ProgramEnrollment.status == ProgramEnrollmentStatus.APPROVED,
            )
        )
    ).scalar_one()
    return DonorProgramOut(
        id=program.id,
        donor_id=program.donor_id,
        donor_name=donor.full_name,
        title=program.title,
        description=program.description,
        status=program.status,
        enrolled_count=enrolled_count,
        created_at=program.created_at,
    )


async def create_program(
    db: AsyncSession, donor: User, title: str, description: str
) -> DonorProgramOut:
    program = DonorProgram(donor_id=donor.id, title=title, description=description)
    db.add(program)
    await db.commit()
    await db.refresh(program)
    return await _to_program_out(db, program)


async def list_my_programs(db: AsyncSession, donor: User) -> list[DonorProgramOut]:
    rows = (
        (
            await db.execute(
                select(DonorProgram)
                .where(DonorProgram.donor_id == donor.id)
                .order_by(DonorProgram.id.desc())
            )
        )
        .scalars()
        .all()
    )
    return [await _to_program_out(db, p) for p in rows]


async def list_active_programs(db: AsyncSession) -> list[DonorProgramOut]:
    rows = (
        (
            await db.execute(
                select(DonorProgram)
                .where(DonorProgram.status == DonorProgramStatus.ACTIVE)
                .order_by(DonorProgram.id.desc())
            )
        )
        .scalars()
        .all()
    )
    return [await _to_program_out(db, p) for p in rows]


async def _owned_program(db: AsyncSession, donor: User, program_id: int) -> DonorProgram:
    program = await db.get(DonorProgram, program_id)
    if program is None or program.donor_id != donor.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dastur topilmadi")
    return program


async def update_program_status(
    db: AsyncSession, donor: User, program_id: int, new_status: DonorProgramStatus
) -> DonorProgramOut:
    program = await _owned_program(db, donor, program_id)
    allowed = _ALLOWED_TRANSITIONS.get(program.status, set())
    if new_status.value not in allowed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"'{program.status}' holatidan '{new_status.value}' holatiga o'tib bo'lmaydi",
        )
    program.status = new_status.value
    await db.commit()
    await db.refresh(program)
    return await _to_program_out(db, program)


async def _region_names_map(db: AsyncSession, user_ids: list[int]) -> dict[int, str]:
    if not user_ids:
        return {}
    rows = (
        await db.execute(
            select(User.id, Region.name)
            .join(Region, Region.id == User.region_id)
            .where(User.id.in_(user_ids))
        )
    ).all()
    return {row[0]: row[1] for row in rows}


async def apply_to_program(db: AsyncSession, user: User, program_id: int) -> ProgramEnrollmentOut:
    program = await db.get(DonorProgram, program_id)
    if program is None or program.status != DonorProgramStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dastur topilmadi")
    verified = (
        user.disability_profile is not None
        and user.disability_profile.verified_status == VerifiedStatus.VERIFIED
    )
    if not verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ariza berish uchun tasdiqlangan nogironlik profili kerak",
        )
    existing = (
        await db.execute(
            select(ProgramEnrollment).where(
                ProgramEnrollment.program_id == program_id, ProgramEnrollment.user_id == user.id
            )
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu dasturga allaqachon ariza bergansiz"
        )

    enrollment = ProgramEnrollment(program_id=program_id, user_id=user.id)
    db.add(enrollment)
    await db.flush()
    await create_notification(
        db,
        user_id=program.donor_id,
        notif_type=NotificationType.SYSTEM,
        category=NotificationCategory.OPPORTUNITY,
        title=f"{user.full_name} '{program.title}' dasturiga ariza berdi",
        link_url="/donor",
    )
    await db.commit()
    await db.refresh(enrollment)
    regions = await _region_names_map(db, [user.id])
    ladder_steps = await ladder_steps_map(db, [user.id])
    return ProgramEnrollmentOut(
        id=enrollment.id,
        program_id=enrollment.program_id,
        user_id=enrollment.user_id,
        applicant_name=user.full_name,
        region_name=regions.get(user.id),
        ladder_step=ladder_steps.get(user.id, 0),
        status=enrollment.status,
        applied_at=enrollment.applied_at,
        decided_at=enrollment.decided_at,
    )


async def list_applications(
    db: AsyncSession, donor: User, program_id: int
) -> list[ProgramEnrollmentOut]:
    await _owned_program(db, donor, program_id)
    rows = (
        (
            await db.execute(
                select(ProgramEnrollment)
                .where(ProgramEnrollment.program_id == program_id)
                .order_by(ProgramEnrollment.id.desc())
            )
        )
        .scalars()
        .all()
    )
    applicant_ids = {r.user_id for r in rows}
    names: dict[int, str] = {}
    if applicant_ids:
        name_rows = (
            await db.execute(select(User.id, User.full_name).where(User.id.in_(applicant_ids)))
        ).all()
        names = {row.id: row.full_name for row in name_rows}
    regions = await _region_names_map(db, list(applicant_ids))
    ladder_steps = await ladder_steps_map(db, list(applicant_ids))
    return [
        ProgramEnrollmentOut(
            id=r.id,
            program_id=r.program_id,
            user_id=r.user_id,
            applicant_name=names.get(r.user_id, "?"),
            region_name=regions.get(r.user_id),
            ladder_step=ladder_steps.get(r.user_id, 0),
            status=r.status,
            applied_at=r.applied_at,
            decided_at=r.decided_at,
        )
        for r in rows
    ]


async def decide_application(
    db: AsyncSession, donor: User, program_id: int, enrollment_id: int, approve: bool
) -> ProgramEnrollmentOut:
    program = await _owned_program(db, donor, program_id)
    enrollment = await db.get(ProgramEnrollment, enrollment_id)
    if enrollment is None or enrollment.program_id != program_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ariza topilmadi")
    if enrollment.status != ProgramEnrollmentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Bu arizaga allaqachon javob berilgan"
        )

    enrollment.status = (
        ProgramEnrollmentStatus.APPROVED if approve else ProgramEnrollmentStatus.REJECTED
    )
    enrollment.decided_at = datetime.now(UTC)
    applicant = await db.get(User, enrollment.user_id)
    assert applicant is not None
    await create_notification(
        db,
        user_id=enrollment.user_id,
        notif_type=NotificationType.SYSTEM,
        category=NotificationCategory.OPPORTUNITY,
        title=(
            f"'{program.title}' dasturiga arizangiz qabul qilindi"
            if approve
            else f"'{program.title}' dasturiga arizangiz rad etildi"
        ),
        link_url="/dasturlar",
    )
    await db.commit()
    await db.refresh(enrollment)
    regions = await _region_names_map(db, [applicant.id])
    ladder_steps = await ladder_steps_map(db, [applicant.id])
    return ProgramEnrollmentOut(
        id=enrollment.id,
        program_id=enrollment.program_id,
        user_id=enrollment.user_id,
        applicant_name=applicant.full_name,
        region_name=regions.get(applicant.id),
        ladder_step=ladder_steps.get(applicant.id, 0),
        status=enrollment.status,
        applied_at=enrollment.applied_at,
        decided_at=enrollment.decided_at,
    )
