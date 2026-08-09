"""B2B "Xizmatlar" (tez kunda) qiziqish endpoint'i - /v1/service-interest.

Ochiq (loginsiz) - shu sabab IP-limit bilan himoyalangan (donations bo'limidagi
ochiq POST endpoint'lar bilan bir xil naqsh).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.rate_limit import rate_limit
from app.modules.service_interest import service
from app.schemas.service_interest import ServiceInterestCreate

router = APIRouter(prefix="/service-interest", tags=["service-interest"])
_limit_service_interest = rate_limit("service-interest", limit=5, window_seconds=3600)


@router.post(
    "", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(_limit_service_interest)]
)
async def register_service_interest(
    data: ServiceInterestCreate,
    db: AsyncSession = Depends(get_db),
) -> None:
    await service.register_interest(db, data.email)
