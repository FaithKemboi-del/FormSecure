from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class SellerSummary(BaseModel):
    id: UUID
    display_name: str
    rating: float | None


class ListingPublicResponse(BaseModel):
    id: UUID
    asking_price: Decimal
    savings_vs_gate: Decimal
    estimated_gate_value: Decimal
    seller: SellerSummary
    status: str


class PhaseSummaryResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    face_value: Decimal
    estimated_gate_value: Decimal
    status: str
    active_listing_count: int


class EventSummaryResponse(BaseModel):
    id: UUID
    title: str
    venue: str
    location: str
    event_date: datetime
    image_url: str | None
    lowest_active_price: Decimal | None
    active_listing_count: int
    phases: list[PhaseSummaryResponse]


class PhaseWithListingsResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    face_value: Decimal
    estimated_gate_value: Decimal
    status: str
    listings: list[ListingPublicResponse]


class EventDetailResponse(BaseModel):
    id: UUID
    title: str
    venue: str
    location: str
    event_date: datetime
    image_url: str | None
    phases: list[PhaseWithListingsResponse]


class EventListResponse(BaseModel):
    items: list[EventSummaryResponse]
    total: int
