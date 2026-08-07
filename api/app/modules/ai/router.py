"""AI qatlami endpoint'lari — Career Coach, CV Builder, Interview Coach (/v1/ai/*)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.ai_client import AiMessage
from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.models.user import User
from app.modules.ai import (
    career_coach,
    case_story,
    cv_builder,
    interview_coach,
    placement_test,
    study_buddy,
    ziyo,
)
from app.modules.auth.deps import get_current_user, get_current_user_optional
from app.schemas.ai import (
    CareerCoachMessageIn,
    CareerCoachMessageOut,
    CaseStoryMessageIn,
    CaseStorySessionCard,
    CaseStorySessionDetail,
    CaseStoryStartRequest,
    CvGenerateRequest,
    GeneratedCvOut,
    InterviewMessageIn,
    InterviewSessionCard,
    InterviewSessionDetail,
    InterviewStartRequest,
    PlacementTestMessageIn,
    PlacementTestSessionCard,
    PlacementTestSessionDetail,
    PlacementTestStartRequest,
    StudyBuddyMessageIn,
    StudyBuddyMessageOut,
    ZiyoMessageIn,
    ZiyoMessageOut,
)

router = APIRouter(prefix="/ai", tags=["ai"])
_limit_ziyo = rate_limit("ziyo", limit=30, window_seconds=3600)


# --- Career Coach ---
@router.get("/career-coach/messages", response_model=list[CareerCoachMessageOut])
async def career_coach_history(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CareerCoachMessageOut]:
    return await career_coach.list_messages(db, user.id)


@router.post("/career-coach/messages", response_model=CareerCoachMessageOut)
async def career_coach_send(
    data: CareerCoachMessageIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CareerCoachMessageOut:
    return await career_coach.send_message(db, user, data.content)


@router.delete("/career-coach/messages", status_code=status.HTTP_204_NO_CONTENT)
async def career_coach_clear(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await career_coach.clear_history(db, user.id)


# --- CV Builder ---
@router.post("/cv/generate", response_model=GeneratedCvOut)
async def cv_generate(
    data: CvGenerateRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GeneratedCvOut:
    return await cv_builder.generate_cv(db, user, data.vacancy_id)


@router.get("/cv", response_model=GeneratedCvOut)
async def cv_get(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> GeneratedCvOut:
    cv = await cv_builder.get_my_cv(db, user.id)
    if cv is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hali CV yaratilmagan")
    return cv


# --- Interview Coach ---
@router.post("/interview/sessions", response_model=InterviewSessionDetail)
async def interview_start(
    data: InterviewStartRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSessionDetail:
    return await interview_coach.start_session(db, user, data.vacancy_id)


@router.get("/interview/sessions", response_model=list[InterviewSessionCard])
async def interview_list(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[InterviewSessionCard]:
    return await interview_coach.list_sessions(db, user)


@router.get("/interview/sessions/{session_id}", response_model=InterviewSessionDetail)
async def interview_detail(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSessionDetail:
    return await interview_coach.get_session(db, user, session_id)


@router.post("/interview/sessions/{session_id}/messages", response_model=InterviewSessionDetail)
async def interview_send(
    session_id: int,
    data: InterviewMessageIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSessionDetail:
    return await interview_coach.send_message(db, user, session_id, data.content)


@router.post("/interview/sessions/{session_id}/complete", response_model=InterviewSessionDetail)
async def interview_complete(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> InterviewSessionDetail:
    return await interview_coach.complete_session(db, user, session_id)


# --- Case Story (Portfolio 2.0 — Ziyo bilan case-hikoya yozish) ---
@router.post("/case-story/sessions", response_model=CaseStorySessionDetail)
async def case_story_start(
    data: CaseStoryStartRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CaseStorySessionDetail:
    return await case_story.start_session(db, user, data.portfolio_item_id)


@router.get("/case-story/sessions", response_model=list[CaseStorySessionCard])
async def case_story_list(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[CaseStorySessionCard]:
    return await case_story.list_sessions(db, user)


@router.get("/case-story/sessions/{session_id}", response_model=CaseStorySessionDetail)
async def case_story_detail(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CaseStorySessionDetail:
    return await case_story.get_session(db, user, session_id)


@router.post("/case-story/sessions/{session_id}/messages", response_model=CaseStorySessionDetail)
async def case_story_send(
    session_id: int,
    data: CaseStoryMessageIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CaseStorySessionDetail:
    return await case_story.send_message(db, user, session_id, data.content)


@router.post("/case-story/sessions/{session_id}/complete", response_model=CaseStorySessionDetail)
async def case_story_complete(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CaseStorySessionDetail:
    return await case_story.complete_session(db, user, session_id)


# --- Study Buddy ---
@router.get("/study-buddy/{lesson_id}/messages", response_model=list[StudyBuddyMessageOut])
async def study_buddy_history(
    lesson_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[StudyBuddyMessageOut]:
    return await study_buddy.list_messages(db, user.id, lesson_id)


@router.post("/study-buddy/{lesson_id}/messages", response_model=StudyBuddyMessageOut)
async def study_buddy_send(
    lesson_id: int,
    data: StudyBuddyMessageIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StudyBuddyMessageOut:
    return await study_buddy.send_message(db, user, lesson_id, data.content)


# --- Til daraja aniqlash testi (Placement Test) ---
@router.post("/placement-test/sessions", response_model=PlacementTestSessionDetail)
async def placement_test_start(
    data: PlacementTestStartRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlacementTestSessionDetail:
    return await placement_test.start_session(db, user, data.language)


@router.get("/placement-test/sessions", response_model=list[PlacementTestSessionCard])
async def placement_test_list(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PlacementTestSessionCard]:
    return await placement_test.list_sessions(db, user)


@router.get("/placement-test/sessions/{session_id}", response_model=PlacementTestSessionDetail)
async def placement_test_detail(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlacementTestSessionDetail:
    return await placement_test.get_session(db, user, session_id)


@router.post(
    "/placement-test/sessions/{session_id}/messages", response_model=PlacementTestSessionDetail
)
async def placement_test_send(
    session_id: int,
    data: PlacementTestMessageIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlacementTestSessionDetail:
    return await placement_test.send_message(db, user, session_id, data.content)


@router.post(
    "/placement-test/sessions/{session_id}/complete", response_model=PlacementTestSessionDetail
)
async def placement_test_complete(
    session_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PlacementTestSessionDetail:
    return await placement_test.complete_session(db, user, session_id)


# --- Ziyo (sayt bo'ylab yo'lboshchi, mehmon uchun ham ochiq) ---
@router.post(
    "/ziyo/messages", response_model=ZiyoMessageOut, dependencies=[Depends(_limit_ziyo)]
)
async def ziyo_send(
    data: ZiyoMessageIn,
    user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
) -> ZiyoMessageOut:
    messages: list[AiMessage] = [
        {"role": m.role, "content": m.content} for m in data.messages
    ]
    reply = await ziyo.send_message(
        db, user, messages, data.page_path, mode=data.mode, language=data.language
    )
    return ZiyoMessageOut(content=reply)
