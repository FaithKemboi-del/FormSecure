from datetime import UTC, datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User, VerificationStatus
from app.utils.phone import PhoneNumberError, normalize_kenyan_phone


class SignupError(Exception):
    pass


async def signup_or_login_with_phone(
    session: AsyncSession,
    *,
    phone_number: str,
    full_name: str | None,
    accept_terms: bool,
    is_signup: bool,
) -> tuple[User, bool]:
    if not accept_terms:
        raise SignupError("You must accept the Terms of Service to continue.")

    try:
        normalized_phone = normalize_kenyan_phone(phone_number)
    except PhoneNumberError as exc:
        raise SignupError(str(exc)) from exc

    result = await session.execute(select(User).where(User.phone_number == normalized_phone))
    user = result.scalar_one_or_none()

    if user is not None:
        if user.is_blocked:
            raise SignupError("This account has been suspended.")
        if is_signup:
            raise SignupError("Account already exists. Use log in instead.")
        return user, False

    if not is_signup:
        raise SignupError("Account not found. Please sign up first.")

    if not full_name or not full_name.strip():
        raise SignupError("Full name is required to sign up.")

    user = User(
        id=uuid4(),
        phone_number=normalized_phone,
        full_name=full_name.strip(),
        verification_status=VerificationStatus.PENDING,
        is_verified=False,
        terms_accepted_at=datetime.now(UTC),
    )
    session.add(user)
    await session.flush()
    return user, True
