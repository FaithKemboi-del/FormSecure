from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    EscrowTransaction,
    EscrowTransactionStatus,
    Event,
    Listing,
    ListingStatus,
    TicketPhase,
    User,
)
from app.schemas.listings import ListingCreateResponse, ListingMineListResponse, ListingMineResponse
from app.services.pricing import max_allowed_listing_price, min_allowed_listing_price

IN_PROGRESS_ESCROW_STATUSES = {
    EscrowTransactionStatus.PENDING,
    EscrowTransactionStatus.ESCROWED,
    EscrowTransactionStatus.VERIFIED,
}


class ListingError(Exception):
    pass


async def create_listing(
    session: AsyncSession,
    seller: User,
    *,
    event_id: UUID,
    phase_id: UUID,
    asking_price,
    external_ticket_identifier: str,
) -> ListingCreateResponse:
    phase_result = await session.execute(
        select(TicketPhase)
        .where(TicketPhase.id == phase_id)
        .options(selectinload(TicketPhase.event))
    )
    phase = phase_result.scalar_one_or_none()
    if phase is None or phase.event_id != event_id:
        raise ListingError("Phase not found for this event.")

    min_price = min_allowed_listing_price(phase.face_value)
    max_price = max_allowed_listing_price(phase.face_value)
    if asking_price < min_price:
        raise ListingError(f"Asking price must be at least face value ({min_price}).")
    if asking_price > max_price:
        raise ListingError(f"Asking price cannot exceed face value + 20% ({max_price}).")

    listing = Listing(
        id=uuid4(),
        seller_id=seller.id,
        ticket_phase_id=phase.id,
        asking_price=asking_price,
        external_ticket_identifier=external_ticket_identifier.strip(),
        status=ListingStatus.ACTIVE,
    )
    session.add(listing)
    await session.flush()

    return ListingCreateResponse(
        id=listing.id,
        status=listing.status.value,
        asking_price=listing.asking_price,
        message="Listing created successfully.",
    )


async def get_my_listings(session: AsyncSession, seller: User) -> ListingMineListResponse:
    result = await session.execute(
        select(Listing)
        .where(Listing.seller_id == seller.id)
        .options(selectinload(Listing.ticket_phase).selectinload(TicketPhase.event))
        .order_by(Listing.created_at.desc())
    )
    listings = result.scalars().all()

    items = [
        ListingMineResponse(
            id=listing.id,
            event_id=listing.ticket_phase.event_id,
            event_title=listing.ticket_phase.event.title,
            phase_id=listing.ticket_phase_id,
            phase_name=listing.ticket_phase.name,
            asking_price=listing.asking_price,
            face_value=listing.ticket_phase.face_value,
            external_ticket_identifier=listing.external_ticket_identifier,
            status=listing.status.value,
            created_at=listing.created_at,
            updated_at=listing.updated_at,
        )
        for listing in listings
    ]
    return ListingMineListResponse(items=items)


async def cancel_listing(session: AsyncSession, seller: User, listing_id: UUID) -> None:
    result = await session.execute(
        select(Listing)
        .where(Listing.id == listing_id, Listing.seller_id == seller.id)
        .options(selectinload(Listing.transactions))
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        raise ListingError("Listing not found.")

    for txn in listing.transactions:
        if txn.status in IN_PROGRESS_ESCROW_STATUSES:
            raise ListingError("Cannot cancel a listing with an in-progress transaction.")

    listing.status = ListingStatus.CANCELLED
    await session.flush()
