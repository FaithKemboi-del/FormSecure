from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, VerificationStatus


class AdminUserError(Exception):
    pass


async def list_users_for_admin(
    session: AsyncSession,
    *,
    verification_status: VerificationStatus | None = None,
) -> list[User]:
    query = select(User).order_by(User.created_at.desc())
    if verification_status is not None:
        query = query.where(User.verification_status == verification_status)
    result = await session.execute(query)
    return list(result.scalars().all())


async def apply_admin_user_action(
    session: AsyncSession,
    user_id: UUID,
    *,
    action: str,
    notes: str | None,
    blocked_reason: str | None,
) -> User:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise AdminUserError("User not found.")

    if action == "approve":
        user.verification_status = VerificationStatus.VERIFIED
        user.is_verified = True
        user.verification_notes = notes
    elif action == "reject":
        user.verification_status = VerificationStatus.REJECTED
        user.is_verified = False
        user.verification_notes = notes
    elif action == "needs_more_info":
        user.verification_status = VerificationStatus.NEEDS_MORE_INFO
        user.is_verified = False
        user.verification_notes = notes
    elif action == "block":
        user.is_blocked = True
        user.blocked_reason = blocked_reason or notes or "Suspended for policy violation."
        user.is_verified = False
    elif action == "unblock":
        user.is_blocked = False
        user.blocked_reason = None
    else:
        raise AdminUserError("Unknown action.")

    await session.flush()
    return user
