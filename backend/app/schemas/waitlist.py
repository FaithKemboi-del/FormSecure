from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class JoinWaitlistBody(BaseModel):
    event_id: UUID
    phase_id: UUID
    max_budget: Decimal = Field(..., gt=0)
    email: EmailStr | None = None
    notify_via_email: bool = True


class WaitlistEntryResponse(BaseModel):
    id: UUID
    event_id: UUID
    event_title: str
    phase_id: UUID
    phase_name: str
    max_budget: Decimal
    email: str | None
    notify_via_email: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WaitlistListResponse(BaseModel):
    items: list[WaitlistEntryResponse]
