from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user, get_verified_user
from app.models import EscrowTransaction, User
from app.schemas.escrow import EscrowListResponse, EscrowTransactionResponse, InitiatePurchaseBody, VerifyTransferBody
from app.services.escrow import EscrowError, confirm_payment, get_buyer_transactions, initiate_purchase, verify_transfer

router = APIRouter(prefix="/api/escrow", tags=["escrow"])


def _to_response(transaction: EscrowTransaction, message: str | None = None) -> EscrowTransactionResponse:
    transfer_code = transaction.transfer_code if transaction.status.value in {"escrowed", "verified", "released"} else None
    return EscrowTransactionResponse(
        id=transaction.id,
        listing_id=transaction.listing_id,
        amount=transaction.amount,
        buyer_fee=transaction.buyer_fee,
        total_due=transaction.amount + transaction.buyer_fee,
        status=transaction.status.value,
        transfer_code=transfer_code,
        mpesa_checkout_request_id=transaction.mpesa_checkout_request_id,
        mpesa_receipt_number=transaction.mpesa_receipt_number,
        expires_at=transaction.expires_at,
        created_at=transaction.created_at,
        message=message,
    )


@router.post("/purchase", response_model=EscrowTransactionResponse, status_code=status.HTTP_201_CREATED)
async def purchase_listing(
    body: InitiatePurchaseBody,
    session: Annotated[AsyncSession, Depends(get_db)],
    buyer: Annotated[User, Depends(get_verified_user)],
) -> EscrowTransactionResponse:
    try:
        transaction = await initiate_purchase(session, buyer, body.listing_id)
    except EscrowError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _to_response(
        transaction,
        message="M-Pesa STK push initiated. Confirm payment on your phone, then tap confirm in the app.",
    )


@router.post("/{transaction_id}/confirm-payment", response_model=EscrowTransactionResponse)
async def confirm_escrow_payment(
    transaction_id: UUID,
    session: Annotated[AsyncSession, Depends(get_db)],
    buyer: Annotated[User, Depends(get_verified_user)],
) -> EscrowTransactionResponse:
    try:
        transaction = await confirm_payment(session, buyer, transaction_id)
    except EscrowError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _to_response(
        transaction,
        message=(
            f"Payment secured in escrow. After the seller transfers your ticket, enter code "
            f"{transaction.transfer_code} to confirm receipt."
        ),
    )


@router.post("/{transaction_id}/verify-transfer", response_model=EscrowTransactionResponse)
async def verify_escrow_transfer(
    transaction_id: UUID,
    body: VerifyTransferBody,
    session: Annotated[AsyncSession, Depends(get_db)],
    buyer: Annotated[User, Depends(get_verified_user)],
) -> EscrowTransactionResponse:
    try:
        transaction = await verify_transfer(session, buyer, transaction_id, body.code)
    except EscrowError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return _to_response(transaction, message="Ticket verified. Funds released to seller.")


@router.get("/mine", response_model=EscrowListResponse)
async def get_my_escrow_transactions(
    session: Annotated[AsyncSession, Depends(get_db)],
    buyer: Annotated[User, Depends(get_current_user)],
) -> EscrowListResponse:
    transactions = await get_buyer_transactions(session, buyer.id)
    return EscrowListResponse(items=[_to_response(txn) for txn in transactions])
