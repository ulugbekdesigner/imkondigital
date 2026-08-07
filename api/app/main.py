"""IMKON Digital API — kirish nuqtasi."""

from collections.abc import Awaitable, Callable

from fastapi import APIRouter, FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.core.config import get_settings
from app.modules.admin.router import router as admin_router
from app.modules.ai.router import router as ai_router
from app.modules.analytics.router import router as analytics_router
from app.modules.assessment.router import router as assessment_router
from app.modules.auth.router import router as auth_router
from app.modules.benefits.router import router as benefits_router
from app.modules.course_reviews.router import router as course_reviews_router
from app.modules.courses.router import router as courses_router
from app.modules.donations.router import router as donations_router
from app.modules.donor.router import programs_router
from app.modules.donor.router import router as donor_router
from app.modules.employer.router import router as employer_router
from app.modules.external_jobs.router import router as external_jobs_router
from app.modules.instructor_studio.router import router as instructor_studio_router
from app.modules.learning_home.router import router as learning_home_router
from app.modules.live_lessons.router import router as live_lessons_router
from app.modules.marketplace.router import router as marketplace_router
from app.modules.mentorship.router import router as mentorship_router
from app.modules.moderation.router import router as moderation_router
from app.modules.notifications.router import router as notifications_router
from app.modules.passport.router import router as passport_router
from app.modules.payments.router import router as payments_router
from app.modules.peer_support.router import router as peer_support_router
from app.modules.regions.router import router as regions_router
from app.modules.search.router import router as search_router
from app.modules.streak.router import router as streak_router
from app.modules.subscriptions.router import router as subscriptions_router
from app.modules.success_stories.router import public_router as success_stories_public_router
from app.modules.success_stories.router import router as success_stories_router
from app.modules.support.router import public_router as support_public_router
from app.modules.support.router import router as support_router
from app.modules.telegram.router import router as telegram_router
from app.modules.users.router import router as users_router
from app.modules.verify.router import router as verify_router

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="1.4.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def _security_headers(
    request: Request, call_next: Callable[[Request], Awaitable[Response]]
) -> Response:
    """Ishlab chiqarishga tayyorlov — brauzer darajasidagi asosiy himoya sarlavhalari.

    HTTPS majburlash (HSTS) va TLS terminatsiya Nginx qatlamida (docs/deploy.md);
    bu yerda qoladigan sarlavhalar HTTP ustida ham foydali/zararsiz.
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response


v1 = APIRouter(prefix="/v1")
v1.include_router(auth_router)
v1.include_router(users_router)
v1.include_router(moderation_router)
v1.include_router(verify_router)
v1.include_router(courses_router)
v1.include_router(assessment_router)
v1.include_router(course_reviews_router)
v1.include_router(instructor_studio_router)
v1.include_router(passport_router)
v1.include_router(employer_router)
v1.include_router(marketplace_router)
v1.include_router(payments_router)
v1.include_router(benefits_router)
v1.include_router(notifications_router)
v1.include_router(telegram_router)
v1.include_router(ai_router)
v1.include_router(mentorship_router)
v1.include_router(admin_router)
v1.include_router(donor_router)
v1.include_router(programs_router)
v1.include_router(analytics_router)
v1.include_router(success_stories_router)
v1.include_router(success_stories_public_router)
v1.include_router(donations_router)
v1.include_router(learning_home_router)
v1.include_router(streak_router)
v1.include_router(regions_router)
v1.include_router(search_router)
v1.include_router(external_jobs_router)
v1.include_router(support_router)
v1.include_router(support_public_router)
v1.include_router(live_lessons_router)
v1.include_router(peer_support_router)
v1.include_router(subscriptions_router)
app.include_router(v1)


class HealthResponse(BaseModel):
    status: str
    service: str
    environment: str


@app.get("/health", response_model=HealthResponse, tags=["system"])
async def health() -> HealthResponse:
    """Liveness probe — Docker/CI healthcheck shu endpoint'ni chaqiradi."""
    return HealthResponse(
        status="ok",
        service=settings.app_name,
        environment=settings.environment,
    )
