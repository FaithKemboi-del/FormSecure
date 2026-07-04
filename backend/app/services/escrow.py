import secrets
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models import (
    EscrowTransaction,
    EscrowTransactionStatus,
    Listing,
    ListingStatus,
    TicketPhase,
    User,
    VerificationStatus,
)
from app.services.mpesa import initiate_stk_push, simulate_stk_success

BUYER_FEE = Decimal(settings.buyer_service_fee)
SELLER_COMMISSION_RATE = Decimal(settings.seller_commission_rate)


class EscrowError(Exception):
    pass


def _generate_transfer_code() -> str:
    return f"{secrets.randbelow(10000):04d}"


def _utcnow() -> datetime:
    return datetime.now(UTC)


async def initiate_purchase(
    session: AsyncSession,
    buyer: User,
    listing_id: UUID,
) -> EscrowTransaction:
    if buyer.is_blocked:
        raise EscrowError("Your account is suspended.")
    if buyer.verification_status != VerificationStatus.VERIFIED:
        raise EscrowError("Your account is pending manual verification.")

    result = await session.execute(
        select(Listing)
        .where(Listing.id == listing_id)
        .options(
            selectinload(Listing.seller),
            selectinload(Listing.ticket_phase).selectinload(TicketPhase.event),
        )
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        raise EscrowError("Listing not found.")
    if listing.status != ListingStatus.ACTIVE:
        raise EscrowError("This listing is no longer available.")
    if listing.seller_id == buyer.id:
        raise EscrowError("You cannot buy your own listing.")

    for txn in listing.transactions:
        if txn.status in {
            EscrowTransactionStatus.PENDING,
            EscrowTransactionStatus.ESCROWED,
            EscrowTransactionStatus.VERIFIED,
        }:
            raise EscrowError("This listing already has an active transaction.")

    amount = listing.asking_price
    seller_commission = (amount * SELLER_COMMISSION_RATE).quantize(Decimal("0.01"))

    stk = await initiate_stk_push(
        phone_number=buyer.phone_number,
        amount=float(amount + BUYER_FEE),
        account_reference=str(listing.id)[:12],
        transaction_desc=f"FormSecure ticket escrow",
    )

    transaction = EscrowTransaction(
        id=uuid4(),
        buyer_id=buyer.id,
        seller_id=listing.seller_id,
        listing_id=listing.id,
        amount=amount,
        buyer_fee=BUYER_FEE,
        seller_commission=seller_commission,
        status=EscrowTransactionStatus.PENDING,
        mpesa_checkout_request_id=stk["checkout_request_id"],
    )
    listing.status = ListingStatus.RESERVED
    session.add(transaction)
    await session.flush()
    return transaction


async def confirm_payment(
    session: AsyncSession,
    buyer: User,
    transaction_id: UUID,
) -> EscrowTransaction:
    result = await session.execute(
        select(EscrowTransaction)
        .where(EscrowTransaction.id == transaction_id, EscrowTransaction.buyer_id == buyer.id)
        .options(selectinload(EscrowTransaction.listing))
    )
    transaction = result.scalar_one_or_none()
    if transaction is None:
        raise EscrowError("Transaction not found.")
    if transaction.status != EscrowTransactionStatus.PENDING:
        raise EscrowError("Payment already processed or cancelled.")

    mpesa_result = await simulate_stk_success(
        checkout_request_id=transaction.mpesa_checkout_request_id or "",
        phone_number=buyer.phone_number,
    )

    now = _utcnow()
    transaction.status = EscrowTransactionStatus.ESCROWED
    transaction.transfer_code = _generate_transfer_code()
    transaction.paid_at = now
    transaction.expires_at = now + timedelta(minutes=settings.escrow_expire_minutes)
    transaction.mpesa_receipt_number = mpesa_result["mpesa_receipt_number"]
    await session.flush()
    return transaction


async def verify_transfer(
    session: AsyncSession,
    buyer: User,
    transaction_id: UUID,
    code: str,
) -> EscrowTransaction:
    result = await session.execute(
        select(EscrowTransaction)
        .where(EscrowTransaction.id == transaction_id, EscrowTransaction.buyer_id == buyer.id)
        .options(selectinload(EscrowTransaction.listing))
    )
    transaction = result.scalar_one_or_none()
    if transaction is None:
        raise EscrowError("Transaction not found.")
    if transaction.status != EscrowTransactionStatus.ESCROWED:
        raise EscrowError("Transaction is not awaiting ticket verification.")
    if transaction.expires_at and transaction.expires_at < _utcnow():
        raise EscrowError("Verification window expired. Funds will be refunded.")

    if code.strip() != transaction.transfer_code:
        raise EscrowError("Invalid verification code.")

    now = _utcnow()
    transaction.status = EscrowTransactionStatus.VERIFIED
    transaction.verified_at = now
    transaction.status = EscrowTransactionStatus.RELEASED
    transaction.released_at = now
    transaction.listing.status = ListingStatus.SOLD
    await session.flush()
    return transaction


async def expire_stale_transactions(session: AsyncSession) -> int:
    now = _utcnow()
    result = await session.execute(
        select(EscrowTransaction)
        .where(
            EscrowTransaction.status == EscrowTransactionStatus.ESCROWED,
            EscrowTransaction.expires_at.is_not(None),
            EscrowTransaction.expires_at < now,
        )
        .options(selectinload(EscrowTransaction.listing))
    )
    transactions = result.scalars().all()
    for transaction in transactions:
        transaction.status = EscrowTransactionStatus.REFUNDED
        transaction.refunded_at = now
        if transaction.listing.status == ListingStatus.RESERVED:
            transaction.listing.status = ListingStatus.ACTIVE
    return len(transactions)


async def get_buyer_transactions(session: AsyncSession, buyer_id: UUID) -> list[EscrowTransaction]:
    result = await session.execute(
        select(EscrowTransaction)
        .where(EscrowTransaction.buyer_id == buyer_id)
        .order_by(EscrowTransaction.created_at.desc())
    )
    return list(result.scalars().all())
