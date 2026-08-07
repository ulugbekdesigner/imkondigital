"""Pullik daraja endpoint'lari — /v1/me/subscription, /v1/admin/users/{id}/subscription."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.db import get_db
from app.models.enums import RoleCode
from app.models.user import User
from app.modules.auth.deps import get_current_user, require_roles
from app.modules.subscriptions import service
from app.schemas.subscription import SubscriptionGrantIn, SubscriptionOut

router = APIRouter(tags=["subscriptions"])
_admin = require_roles(RoleCode.ADMIN)
settings = get_settings()


@router.get("/subscriptions/pricing")
async def pricing() -> dict[str, int]:
    return {
        "plus_price_som": settings.subscription_plus_price_som,
        "pro_price_som": settings.subscription_pro_price_som,
    }


@router.get("/me/subscription", response_model=SubscriptionOut)
async def my_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionOut:
    return await service.get_my_subscription(db, user.id)


@router.patch("/admin/users/{user_id}/subscription", response_model=SubscriptionOut)
async def admin_set_subscription(
    user_id: int,
    data: SubscriptionGrantIn,
    admin: User = Depends(_admin),
    db: AsyncSession = Depends(get_db),
) -> SubscriptionOut:
    return await service.admin_set_plan(db, user_id, data.plan, admin.id)
