from datetime import datetime
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.events import EventDetailResponse, EventListResponse
from app.services.events import get_event_detail, list_events

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("", response_model=EventListResponse)
async def get_events(
    session: Annotated[AsyncSession, Depends(get_db)],
    location: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    phase_slug: str | None = Query(default=None, description="Filter by ticket phase slug"),
    phase_available: bool | None = Query(
        default=None,
        description="If true, only events with active listings (optionally for phase_slug)",
    ),
    min_price: Decimal | None = Query(default=None, ge=0),
    max_price: Decimal | None = Query(default=None, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> EventListResponse:
    return await list_events(
        session,
        location=location,
        date_from=date_from,
        date_to=date_to,
        phase_slug=phase_slug,
        phase_available=phase_available,
        min_price=min_price,
        max_price=max_price,
        limit=limit,
        offset=offset,
    )


@router.get("/{event_id}", response_model=EventDetailResponse)
async def get_event(
    event_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> EventDetailResponse:
    event = await get_event_detail(session, event_id)
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return event
