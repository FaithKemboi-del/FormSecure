from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Event, Listing, ListingStatus, TicketPhase, TicketPhaseStatus
from app.schemas.events import (
    EventDetailResponse,
    EventListResponse,
    EventSummaryResponse,
    ListingPublicResponse,
    PhaseSummaryResponse,
    PhaseWithListingsResponse,
    SellerSummary,
)
from app.services.pricing import compute_savings_vs_gate, resolve_gate_value
from app.services.ratings import get_seller_rating, seller_display_name


async def list_events(
    session: AsyncSession,
    *,
    location: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    phase_slug: str | None = None,
    phase_available: bool | None = None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    limit: int = 50,
    offset: int = 0,
) -> EventListResponse:
    query = (
        select(Event)
        .options(selectinload(Event.phases).selectinload(TicketPhase.listings).selectinload(Listing.seller))
        .order_by(Event.event_date.asc())
    )

    if location:
        query = query.where(
            or_(
                Event.location.ilike(f"%{location}%"),
                Event.venue.ilike(f"%{location}%"),
            )
        )
    if date_from:
        query = query.where(Event.event_date >= date_from)
    if date_to:
        query = query.where(Event.event_date <= date_to)

    result = await session.execute(query)
    events = result.scalars().unique().all()

    summaries: list[EventSummaryResponse] = []
    for event in events:
        summary = await _build_event_summary(event)
        if not _event_passes_filters(
            summary,
            event,
            phase_slug=phase_slug,
            phase_available=phase_available,
            min_price=min_price,
            max_price=max_price,
        ):
            continue
        summaries.append(summary)

    total = len(summaries)
    page = summaries[offset : offset + limit]
    return EventListResponse(items=page, total=total)


def _event_passes_filters(
    summary: EventSummaryResponse,
    event: Event,
    *,
    phase_slug: str | None,
    phase_available: bool | None,
    min_price: Decimal | None,
    max_price: Decimal | None,
) -> bool:
    if phase_slug:
        phase = next((p for p in event.phases if p.slug == phase_slug), None)
        if phase is None:
            return False
        if phase_available and not any(l.status == ListingStatus.ACTIVE for l in phase.listings):
            return False

    if phase_available and not any(p.active_listing_count > 0 for p in summary.phases):
        return False

    if min_price is not None:
        if summary.lowest_active_price is None or summary.lowest_active_price < min_price:
            return False
    if max_price is not None:
        if summary.lowest_active_price is None or summary.lowest_active_price > max_price:
            return False

    return True


async def _build_event_summary(event: Event) -> EventSummaryResponse:
    phase_summaries: list[PhaseSummaryResponse] = []
    lowest: Decimal | None = None
    total_active = 0

    for phase in sorted(event.phases, key=lambda p: p.sort_order):
        active_listings = [listing for listing in phase.listings if listing.status == ListingStatus.ACTIVE]
        active_count = len(active_listings)
        total_active += active_count
        gate = resolve_gate_value(phase.face_value, phase.estimated_gate_value)

        for listing in active_listings:
            if lowest is None or listing.asking_price < lowest:
                lowest = listing.asking_price

        phase_summaries.append(
            PhaseSummaryResponse(
                id=phase.id,
                name=phase.name,
                slug=phase.slug,
                face_value=phase.face_value,
                estimated_gate_value=gate,
                status=phase.status.value,
                active_listing_count=active_count,
            )
        )

    return EventSummaryResponse(
        id=event.id,
        title=event.title,
        venue=event.venue,
        location=event.location,
        event_date=event.event_date,
        image_url=event.image_url,
        lowest_active_price=lowest,
        active_listing_count=total_active,
        phases=phase_summaries,
    )


async def get_event_detail(session: AsyncSession, event_id: UUID) -> EventDetailResponse | None:
    result = await session.execute(
        select(Event)
        .where(Event.id == event_id)
        .options(
            selectinload(Event.phases)
            .selectinload(TicketPhase.listings)
            .selectinload(Listing.seller)
        )
    )
    event = result.scalar_one_or_none()
    if event is None:
        return None

    phases: list[PhaseWithListingsResponse] = []
    for phase in sorted(event.phases, key=lambda p: p.sort_order):
        gate = resolve_gate_value(phase.face_value, phase.estimated_gate_value)
        listings: list[ListingPublicResponse] = []

        for listing in phase.listings:
            if listing.status != ListingStatus.ACTIVE:
                continue
            rating = await get_seller_rating(session, listing.seller_id)
            listings.append(
                ListingPublicResponse(
                    id=listing.id,
                    asking_price=listing.asking_price,
                    savings_vs_gate=compute_savings_vs_gate(listing.asking_price, gate),
                    estimated_gate_value=gate,
                    seller=SellerSummary(
                        id=listing.seller_id,
                        display_name=seller_display_name(listing.seller.full_name),
                        rating=rating,
                    ),
                    status=listing.status.value,
                )
            )

        phases.append(
            PhaseWithListingsResponse(
                id=phase.id,
                name=phase.name,
                slug=phase.slug,
                face_value=phase.face_value,
                estimated_gate_value=gate,
                status=phase.status.value,
                listings=listings,
            )
        )

    return EventDetailResponse(
        id=event.id,
        title=event.title,
        venue=event.venue,
        location=event.location,
        event_date=event.event_date,
        image_url=event.image_url,
        phases=phases,
    )
