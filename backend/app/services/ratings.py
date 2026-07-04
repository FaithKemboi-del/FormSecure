from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import EscrowTransaction, EscrowTransactionStatus


async def get_seller_rating(session: AsyncSession, user_id: UUID) -> float | None:
    result = await session.execute(
        select(func.count(EscrowTransaction.id)).where(
            EscrowTransaction.seller_id == user_id,
            EscrowTransaction.status == EscrowTransactionStatus.RELEASED,
        )
    )
    completed = result.scalar_one()
    if completed == 0:
        return None
    return None


def seller_display_name(full_name: str | None) -> str:
    if not full_name or not full_name.strip():
        return "Seller"
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]} {parts[-1][0]}."
