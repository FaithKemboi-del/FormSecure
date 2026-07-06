from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class InitiatePurchaseBody(BaseModel):
    listing_id: UUID


class VerifyTransferBody(BaseModel):
    code: str = Field(..., min_length=4, max_length=4, pattern=r"^\d{4}$")


class EscrowTransactionResponse(BaseModel):
    id: UUID
    listing_id: UUID
    amount: Decimal
    buyer_fee: Decimal
    total_due: Decimal
    status: str
    transfer_code: str | None = None
    mpesa_checkout_request_id: str | None = None
    mpesa_receipt_number: str | None = None
    expires_at: datetime | None = None
    created_at: datetime
    message: str | None = None


class EscrowListResponse(BaseModel):
    items: list[EscrowTransactionResponse]
