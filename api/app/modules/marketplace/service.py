"""Freelancer Marketplace biznes logikasi — gig, buyurtma (escrow), chat, sharh, nizo."""

import secrets
from datetime import UTC, datetime

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import storage
from app.core.audit import write_audit_log
from app.core.config import get_settings
from app.core.escrow import can_transition
from app.core.payment_sign import build_click_checkout_url, build_payme_checkout_url
from app.models.enums import (
    DisputeStatus,
    GigStatus,
    NotificationCategory,
    NotificationType,
    OrderStatus,
)
from app.models.marketplace import (
    Dispute,
    Gig,
    Order,
    OrderMessage,
    OrderMilestone,
    Payment,
    Review,
)
from app.models.user import User
from app.modules.notifications.service import create_notification
from app.schemas.marketplace import (
    CheckoutOut,
    DeliverRequest,
    DisputeCreate,
    DisputeOut,
    GigCard,
    GigCreate,
    GigDetail,
    GigPage,
    MessageCreate,
    MessageOut,
    MilestoneOut,
    OrderCard,
    OrderCreate,
    OrderDetail,
    ReviewCreate,
    ReviewOut,
)

settings = get_settings()

NEW_TALENT_THRESHOLD = 3  # shu sondan kam bajarilgan buyurtma — "Yangi iste'dodlar"
DISPUTABLE_STATUSES = {OrderStatus.FUNDED, OrderStatus.IN_PROGRESS, OrderStatus.DELIVERED}


def _is_moderator(user: User) -> bool:
    codes = {r.code for r in user.roles}
    return "moderator" in codes or "admin" in codes


async def _completed_orders_count(db: AsyncSession, freelancer_id: int) -> int:
    return (
        await db.execute(
            select(func.count(Order.id)).where(
                Order.freelancer_id == freelancer_id, Order.status == OrderStatus.PAID
            )
        )
    ).scalar_one()


async def _freelancer_rating(db: AsyncSession, freelancer_id: int) -> tuple[float | None, int]:
    avg_rating, review_count = (
        await db.execute(
            select(func.avg(Review.rating), func.count(Review.id)).where(
                Review.to_user_id == freelancer_id
            )
        )
    ).one()
    return (round(float(avg_rating), 1) if avg_rating is not None else None, review_count)


def _require_party(order: Order, user: User) -> None:
    if user.id not in (order.client_id, order.freelancer_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Bu buyurtma sizniki emas"
        )


async def _get_order_or_404(db: AsyncSession, order_id: int) -> Order:
    order = await db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Buyurtma topilmadi")
    return order


# --- Gig ---
async def create_gig(db: AsyncSession, user: User, data: GigCreate) -> Gig:
    gig = Gig(
        freelancer_id=user.id,
        title=data.title,
        description=data.description,
        category=data.category,
        price_from=data.price_from,
        delivery_days=data.delivery_days,
        status=GigStatus.DRAFT,
    )
    db.add(gig)
    await db.commit()
    await db.refresh(gig)
    return gig


async def publish_gig(db: AsyncSession, gig_id: int, user: User) -> Gig:
    gig = await db.get(Gig, gig_id)
    if gig is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    if gig.freelancer_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Bu xizmat sizniki emas")
    gig.status = GigStatus.PUBLISHED
    await db.commit()
    await db.refresh(gig)
    return gig


async def _gig_card(db: AsyncSession, gig: Gig, freelancer: User) -> GigCard:
    completed = await _completed_orders_count(db, gig.freelancer_id)
    avg_rating, review_count = await _freelancer_rating(db, gig.freelancer_id)
    return GigCard(
        id=gig.id,
        title=gig.title,
        category=gig.category,
        price_from=gig.price_from,
        delivery_days=gig.delivery_days,
        freelancer_id=gig.freelancer_id,
        freelancer_name=freelancer.full_name,
        freelancer_username=freelancer.username,
        freelancer_avatar_url=freelancer.avatar_url,
        is_new_talent=completed < NEW_TALENT_THRESHOLD,
        average_rating=avg_rating,
        review_count=review_count,
    )


async def catalog(
    db: AsyncSession, *, category: str | None, q: str | None, cursor: int | None, limit: int
) -> GigPage:
    stmt = select(Gig).where(Gig.status == GigStatus.PUBLISHED)
    if category:
        stmt = stmt.where(Gig.category == category)
    if q:
        stmt = stmt.where(Gig.title.ilike(f"%{q}%"))
    if cursor is not None:
        stmt = stmt.where(Gig.id < cursor)
    stmt = stmt.order_by(Gig.id.desc()).limit(limit + 1)

    gigs = list((await db.execute(stmt)).scalars().all())
    has_more = len(gigs) > limit
    gigs = gigs[:limit]

    items = []
    for g in gigs:
        freelancer = await db.get(User, g.freelancer_id)
        assert freelancer is not None
        items.append(await _gig_card(db, g, freelancer))

    next_cursor = gigs[-1].id if has_more and gigs else None
    return GigPage(items=items, next_cursor=next_cursor)


async def gig_detail(db: AsyncSession, gig_id: int) -> GigDetail:
    gig = await db.get(Gig, gig_id)
    if gig is None or gig.status != GigStatus.PUBLISHED:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Xizmat topilmadi")
    freelancer = await db.get(User, gig.freelancer_id)
    assert freelancer is not None
    card = await _gig_card(db, gig, freelancer)
    return GigDetail(**card.model_dump(), description=gig.description)


# --- Buyurtma ---
async def create_order(db: AsyncSession, client: User, data: OrderCreate) -> Order:
    if data.freelancer_id == client.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="O'zingizga buyurtma bera olmaysiz"
        )
    freelancer = await db.get(User, data.freelancer_id)
    if freelancer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Freelancer topilmadi")

    if data.milestones:
        milestone_sum = sum(m.amount for m in data.milestones)
        if milestone_sum != data.amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bosqichlar summasi buyurtma summasiga teng bo'lishi kerak",
            )

    order = Order(
        gig_id=data.gig_id,
        client_id=client.id,
        freelancer_id=data.freelancer_id,
        title=data.title,
        description=data.description,
        amount=data.amount,
        status=OrderStatus.CREATED,
    )
    db.add(order)
    await db.flush()

    for i, m in enumerate(data.milestones):
        db.add(OrderMilestone(order_id=order.id, title=m.title, amount=m.amount, sort=i))

    await db.commit()
    await db.refresh(order)
    return order


async def get_checkout(db: AsyncSession, order_id: int, user: User, provider: str) -> CheckoutOut:
    order = await _get_order_or_404(db, order_id)
    _require_party(order, user)
    if order.client_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz to'lovni boshlaydi"
        )
    if order.status != OrderStatus.CREATED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Buyurtma to'lovga tayyor emas"
        )

    if provider == "payme":
        url = build_payme_checkout_url(
            merchant_id=settings.payme_merchant_id,
            account_key="order_id",
            account_value=order.id,
            amount_sum=order.amount,
        )
    elif provider == "click":
        url = build_click_checkout_url(
            service_id=settings.click_service_id,
            merchant_id=settings.click_merchant_id,
            transaction_param=str(order.id),
            amount_sum=order.amount,
            return_url=f"{settings.site_url}/buyurtmalarim/{order.id}",
        )
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Noma'lum provayder")

    return CheckoutOut(provider=provider, checkout_url=url)


async def order_card(db: AsyncSession, order: Order) -> OrderCard:
    client = await db.get(User, order.client_id)
    freelancer = await db.get(User, order.freelancer_id)
    return OrderCard(
        id=order.id,
        title=order.title,
        amount=order.amount,
        status=order.status,
        client_id=order.client_id,
        freelancer_id=order.freelancer_id,
        client_name=client.full_name if client else "",
        freelancer_name=freelancer.full_name if freelancer else "",
        created_at=order.created_at,
    )


async def list_my_orders(db: AsyncSession, user: User, *, role: str | None) -> list[OrderCard]:
    stmt = select(Order)
    if role == "client":
        stmt = stmt.where(Order.client_id == user.id)
    elif role == "freelancer":
        stmt = stmt.where(Order.freelancer_id == user.id)
    else:
        stmt = stmt.where((Order.client_id == user.id) | (Order.freelancer_id == user.id))
    stmt = stmt.order_by(Order.created_at.desc())

    orders = (await db.execute(stmt)).scalars().all()
    return [await order_card(db, o) for o in orders]


async def order_detail(db: AsyncSession, order_id: int, user: User) -> OrderDetail:
    order = await _get_order_or_404(db, order_id)
    _require_party(order, user)
    card = await order_card(db, order)
    payment = (
        await db.execute(select(Payment).where(Payment.order_id == order_id))
    ).scalar_one_or_none()
    return OrderDetail(
        **card.model_dump(),
        description=order.description,
        delivered_note=order.delivered_note,
        delivered_file_url=order.delivered_file_url,
        milestones=[MilestoneOut.model_validate(m) for m in order.milestones],
        payment_status=payment.status if payment else None,
    )


def _transition_or_409(order: Order, target: OrderStatus) -> None:
    if not can_transition(order.status, target):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"'{order.status}' holatidan '{target}' ga o'tib bo'lmaydi",
        )
    order.status = target


async def start_order(db: AsyncSession, order_id: int, user: User) -> Order:
    order = await _get_order_or_404(db, order_id)
    if order.freelancer_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer boshlaydi"
        )
    _transition_or_409(order, OrderStatus.IN_PROGRESS)
    await create_notification(
        db,
        user_id=order.client_id,
        notif_type=NotificationType.ORDER_STATUS,
        category=NotificationCategory.OPPORTUNITY,
        title="Freelancer ishni boshladi",
        body=order.title,
        link_url=f"/buyurtmalarim/{order.id}",
    )
    await db.commit()
    await db.refresh(order)
    return order


async def deliver_order(db: AsyncSession, order_id: int, user: User, data: DeliverRequest) -> Order:
    order = await _get_order_or_404(db, order_id)
    if order.freelancer_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Faqat freelancer topshiradi"
        )
    _transition_or_409(order, OrderStatus.DELIVERED)
    order.delivered_note = data.note
    order.delivered_file_url = data.file_url
    await create_notification(
        db,
        user_id=order.client_id,
        notif_type=NotificationType.ORDER_STATUS,
        category=NotificationCategory.OPPORTUNITY,
        title="Ish topshirildi — tekshirib chiqing",
        body=order.title,
        link_url=f"/buyurtmalarim/{order.id}",
    )
    await db.commit()
    await db.refresh(order)
    return order


async def accept_order(db: AsyncSession, order_id: int, user: User) -> Order:
    order = await _get_order_or_404(db, order_id)
    if order.client_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz qabul qiladi"
        )
    _transition_or_409(order, OrderStatus.ACCEPTED)
    # Qabul qilish + pulni chiqarish bitta amalda (real hayotda alohida payout so'rovi bo'lardi)
    _transition_or_409(order, OrderStatus.PAID)
    await create_notification(
        db,
        user_id=order.freelancer_id,
        notif_type=NotificationType.ORDER_STATUS,
        category=NotificationCategory.OPPORTUNITY,
        title="Ish qabul qilindi — to'lov chiqarildi",
        body=order.title,
        link_url=f"/buyurtmalarim/{order.id}",
    )
    await db.commit()
    await db.refresh(order)
    return order


async def cancel_order(db: AsyncSession, order_id: int, user: User) -> Order:
    order = await _get_order_or_404(db, order_id)
    if order.client_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Faqat mijoz bekor qiladi"
        )
    _transition_or_409(order, OrderStatus.CANCELLED)
    await create_notification(
        db,
        user_id=order.freelancer_id,
        notif_type=NotificationType.ORDER_STATUS,
        category=NotificationCategory.OPPORTUNITY,
        title="Buyurtma bekor qilindi",
        body=order.title,
        link_url=f"/buyurtmalarim/{order.id}",
    )
    await db.commit()
    await db.refresh(order)
    return order


# --- Chat ---
async def add_message(
    db: AsyncSession, order_id: int, user: User, data: MessageCreate
) -> MessageOut:
    order = await _get_order_or_404(db, order_id)
    _require_party(order, user)
    msg = OrderMessage(order_id=order_id, sender_id=user.id, body=data.body, file_url=data.file_url)
    db.add(msg)
    recipient_id = order.freelancer_id if user.id == order.client_id else order.client_id
    await create_notification(
        db,
        user_id=recipient_id,
        notif_type=NotificationType.ORDER_MESSAGE,
        category=NotificationCategory.OPPORTUNITY,
        title=f"{user.full_name} yangi xabar yubordi",
        body=data.body[:200],
        link_url=f"/buyurtmalarim/{order.id}",
    )
    await db.commit()
    await db.refresh(msg)
    return MessageOut(
        id=msg.id,
        sender_id=user.id,
        sender_name=user.full_name,
        body=msg.body,
        file_url=msg.file_url,
        created_at=msg.created_at,
    )


async def add_message_with_file(
    db: AsyncSession, order_id: int, user: User, body: str, file: UploadFile
) -> MessageOut:
    storage.ensure_bucket()
    # Tasodifiy papka segmenti — bir xil nomli fayllar (masalan "screenshot.png")
    # ikkala tomondan yuborilganda bir-birini ustidan yozib qo'ymasligi uchun.
    key = f"orders/{order_id}/{secrets.token_hex(4)}/{file.filename}"
    file_url = storage.upload_fileobj(file.file, key, file.content_type)
    return await add_message(db, order_id, user, MessageCreate(body=body, file_url=file_url))


async def list_messages(db: AsyncSession, order_id: int, user: User) -> list[MessageOut]:
    order = await _get_order_or_404(db, order_id)
    _require_party(order, user)
    rows = (
        await db.execute(
            select(OrderMessage, User)
            .join(User, User.id == OrderMessage.sender_id)
            .where(OrderMessage.order_id == order_id)
            .order_by(OrderMessage.created_at.asc())
        )
    ).all()
    return [
        MessageOut(
            id=m.id,
            sender_id=m.sender_id,
            sender_name=u.full_name,
            body=m.body,
            file_url=m.file_url,
            created_at=m.created_at,
        )
        for m, u in rows
    ]


# --- Sharh ---
async def create_review(
    db: AsyncSession, order_id: int, user: User, data: ReviewCreate
) -> ReviewOut:
    order = await _get_order_or_404(db, order_id)
    _require_party(order, user)
    if order.status != OrderStatus.PAID:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Faqat yakunlangan buyurtmaga sharh qoldiriladi",
        )
    to_user_id = order.freelancer_id if user.id == order.client_id else order.client_id

    existing = (
        await db.execute(
            select(Review).where(Review.order_id == order_id, Review.from_user_id == user.id)
        )
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Siz allaqachon sharh qoldirgansiz"
        )

    review = Review(
        order_id=order_id,
        from_user_id=user.id,
        to_user_id=to_user_id,
        rating=data.rating,
        text=data.text,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return ReviewOut.model_validate(review)


# --- Nizo ---
async def open_dispute(
    db: AsyncSession, order_id: int, user: User, data: DisputeCreate
) -> DisputeOut:
    order = await _get_order_or_404(db, order_id)
    _require_party(order, user)
    try:
        order_status = OrderStatus(order.status)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Nizo ochib bo'lmaydi"
        ) from exc
    if order_status not in DISPUTABLE_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Nizo faqat to'langan va yakunlanmagan buyurtmada ochiladi",
        )

    existing = (
        await db.execute(select(Dispute).where(Dispute.order_id == order_id))
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Nizo allaqachon ochilgan")

    _transition_or_409(order, OrderStatus.DISPUTED)
    dispute = Dispute(
        order_id=order_id, opened_by=user.id, reason=data.reason, status=DisputeStatus.OPEN
    )
    db.add(dispute)
    counterpart_id = order.freelancer_id if user.id == order.client_id else order.client_id
    await create_notification(
        db,
        user_id=counterpart_id,
        notif_type=NotificationType.ORDER_STATUS,
        category=NotificationCategory.OPPORTUNITY,
        title="Buyurtma bo'yicha nizo ochildi",
        body=order.title,
        link_url=f"/buyurtmalarim/{order.id}",
    )
    await db.commit()
    await db.refresh(dispute)
    return DisputeOut(
        id=dispute.id,
        order_id=order_id,
        opened_by=user.id,
        reason=dispute.reason,
        resolution=None,
        status=dispute.status,
        created_at=dispute.created_at,
        resolved_at=None,
    )


async def resolve_dispute(
    db: AsyncSession, order_id: int, moderator: User, winner: str, resolution: str
) -> DisputeOut:
    if not _is_moderator(moderator):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Faqat moderator hal qiladi"
        )

    order = await _get_order_or_404(db, order_id)
    dispute = (
        await db.execute(select(Dispute).where(Dispute.order_id == order_id))
    ).scalar_one_or_none()
    if dispute is None or dispute.status != DisputeStatus.OPEN:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ochiq nizo topilmadi")

    target_status = OrderStatus.PAID if winner == "freelancer" else OrderStatus.REFUNDED
    _transition_or_409(order, target_status)

    dispute.status = (
        DisputeStatus.RESOLVED_FREELANCER
        if winner == "freelancer"
        else DisputeStatus.RESOLVED_CLIENT
    )
    dispute.resolution = resolution
    dispute.moderator_id = moderator.id
    dispute.resolved_at = datetime.now(UTC)

    await write_audit_log(
        db,
        actor_id=moderator.id,
        action="dispute.resolve",
        target_type="order",
        target_id=order_id,
        meta={"winner": winner, "dispute_id": dispute.id},
    )

    for party_id, is_winner in (
        (order.freelancer_id, winner == "freelancer"),
        (order.client_id, winner == "client"),
    ):
        await create_notification(
            db,
            user_id=party_id,
            notif_type=NotificationType.ORDER_STATUS,
            category=NotificationCategory.OPPORTUNITY,
            title="Nizo hal qilindi" + (" — siz haqsiz deb topildingiz" if is_winner else ""),
            body=order.title,
            link_url=f"/buyurtmalarim/{order.id}",
        )

    await db.commit()
    await db.refresh(dispute)
    return DisputeOut(
        id=dispute.id,
        order_id=order_id,
        opened_by=dispute.opened_by,
        reason=dispute.reason,
        resolution=dispute.resolution,
        status=dispute.status,
        created_at=dispute.created_at,
        resolved_at=dispute.resolved_at,
    )
