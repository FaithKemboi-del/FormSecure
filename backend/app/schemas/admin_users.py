from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class SignupBody(BaseModel):
    phone_number: str
    full_name: str = Field(..., min_length=2, max_length=120)
    accept_terms: bool = Field(..., description="Must be true to sign up")


class LoginBody(BaseModel):
    phone_number: str
    accept_terms: bool = True


class AdminUserResponse(BaseModel):
    id: UUID
    phone_number: str
    full_name: str | None
    email: str | None
    verification_status: str
    is_blocked: bool
    blocked_reason: str | None
    verification_notes: str | None
    terms_accepted_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AdminUserListResponse(BaseModel):
    items: list[AdminUserResponse]


class AdminUserActionBody(BaseModel):
    action: str = Field(..., pattern="^(approve|reject|needs_more_info|block|unblock)$")
    notes: str | None = Field(default=None, max_length=1000)
    blocked_reason: str | None = Field(default=None, max_length=500)
