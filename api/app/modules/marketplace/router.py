"""Freelancer Marketplace endpoint'lari — /v1/gigs, /v1/orders."""

from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.user import User
from app.modules.auth.deps import get_current_user
from app.modules.marketplace import service
from app.schemas.marketplace import (
    CheckoutOut,
    DeliverRequest,
    DisputeCreate,
    DisputeOut,
    DisputeResolve,
    GigCreate,
    GigDetail,
    GigPage,
    MessageCreate,
    MessageOut,
    OrderCard,
    OrderCreate,
    OrderDetail,
    ReviewCreate,
    ReviewOut,
)

router = APIRouter(tags=["marketplace"])


# ---------- Gig ----------
@router.post("/gigs", status_code=status.HTTP_201_CREATED)
async def create_gig(
    data: GigCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    gig = await service.create_gig(db, user, data)
    return {"id": gig.id, "title": gig.title, "status": gig.status}


@router.post("/gigs/{gig_id}/publish")
async def publish_gig(
    gig_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, object]:
    gig = await service.publish_gig(db, gig_id, user)
    return {"id": gig.id, "status": gig.status}


@router.get("/gigs", response_model=GigPage)
async def catalog(
    category: str | None = None,
    q: str | None = None,
    cursor: int | None = None,
    limit: int = 12,
    db: AsyncSession = Depends(get_db),
) -> GigPage:
    return await service.catalog(db, category=category, q=q, cursor=cursor, limit=min(limit, 48))


@router.get("/gigs/{gig_id}", response_model=GigDetail)
async def gig_detail(gig_id: int, db: AsyncSession = Depends(get_db)) -> GigDetail:
    return await service.gig_detail(db, gig_id)


# ---------- Buyurtma ----------
@router.post("/orders", response_model=OrderCard, status_code=status.HTTP_201_CREATED)
async def create_order(
    data: OrderCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderCard:
    order = await service.create_order(db, user, data)
    return await service.order_card(db, order)


@router.get("/orders/{order_id}/checkout", response_model=CheckoutOut)
async def checkout(
    order_id: int,
    provider: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CheckoutOut:
    return await service.get_checkout(db, order_id, user, provider)


@router.get("/me/orders", response_model=list[OrderCard])
async def my_orders(
    role: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[OrderCard]:
    return await service.list_my_orders(db, user, role=role)


@router.get("/orders/{order_id}", response_model=OrderDetail)
async def order_detail(
    order_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderDetail:
    return await service.order_detail(db, order_id, user)


@router.post("/orders/{order_id}/start", response_model=OrderCard)
async def start_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderCard:
    order = await service.start_order(db, order_id, user)
    return await service.order_card(db, order)


@router.post("/orders/{order_id}/deliver", response_model=OrderCard)
async def deliver_order(
    order_id: int,
    data: DeliverRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderCard:
    order = await service.deliver_order(db, order_id, user, data)
    return await service.order_card(db, order)


@router.post("/orders/{order_id}/accept", response_model=OrderCard)
async def accept_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderCard:
    order = await service.accept_order(db, order_id, user)
    return await service.order_card(db, order)


@router.post("/orders/{order_id}/cancel", response_model=OrderCard)
async def cancel_order(
    order_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrderCard:
    order = await service.cancel_order(db, order_id, user)
    return await service.order_card(db, order)


# ---------- Chat ----------
@router.post(
    "/orders/{order_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED
)
async def add_message(
    order_id: int,
    data: MessageCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageOut:
    return await service.add_message(db, order_id, user, data)


@router.post(
    "/orders/{order_id}/messages/upload",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
async def add_message_with_file(
    order_id: int,
    body: str = Form(""),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MessageOut:
    return await service.add_message_with_file(db, order_id, user, body, file)


@router.get("/orders/{order_id}/messages", response_model=list[MessageOut])
async def list_messages(
    order_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[MessageOut]:
    return await service.list_messages(db, order_id, user)


# ---------- Sharh ----------
@router.post(
    "/orders/{order_id}/review", response_model=ReviewOut, status_code=status.HTTP_201_CREATED
)
async def create_review(
    order_id: int,
    data: ReviewCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReviewOut:
    return await service.create_review(db, order_id, user, data)


# ---------- Nizo ----------
@router.post(
    "/orders/{order_id}/dispute", response_model=DisputeOut, status_code=status.HTTP_201_CREATED
)
async def open_dispute(
    order_id: int,
    data: DisputeCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DisputeOut:
    return await service.open_dispute(db, order_id, user, data)


@router.post("/orders/{order_id}/dispute/resolve", response_model=DisputeOut)
async def resolve_dispute(
    order_id: int,
    data: DisputeResolve,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DisputeOut:
    return await service.resolve_dispute(db, order_id, user, data.winner, data.resolution)
