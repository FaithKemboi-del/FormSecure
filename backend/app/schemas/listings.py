from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class CreateListingBody(BaseModel):
    event_id: UUID
    phase_id: UUID = Field(..., description="Ticket phase ID")
    asking_price: Decimal = Field(..., gt=0)
    external_ticket_identifier: str = Field(..., min_length=3, max_length=200)


class ListingMineResponse(BaseModel):
    id: UUID
    event_id: UUID
    event_title: str
    phase_id: UUID
    phase_name: str
    asking_price: Decimal
    face_value: Decimal
    external_ticket_identifier: str
    status: str
    created_at: datetime
    updated_at: datetime


class ListingMineListResponse(BaseModel):
    items: list[ListingMineResponse]


class ListingCreateResponse(BaseModel):
    id: UUID
    status: str
    asking_price: Decimal
    message: str
