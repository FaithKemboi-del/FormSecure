from datetime import UTC, datetime, timedelta
from uuid import uuid4

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import PhoneOTP, User
from app.services.sms import generate_otp_code, hash_otp, send_otp_sms, verify_otp_hash


class OTPError(Exception):
    pass


def _utcnow() -> datetime:
    return datetime.now(UTC)


async def request_otp(session: AsyncSession, phone_number: str) -> None:
    now = _utcnow()
    expires_at = now + timedelta(minutes=settings.otp_expire_minutes)
    code = generate_otp_code()
    code_hash = hash_otp(phone_number, code)

    await session.execute(
        update(PhoneOTP)
        .where(
            PhoneOTP.phone_number == phone_number,
            PhoneOTP.used_at.is_(None),
        )
        .values(used_at=now)
    )

    session.add(
        PhoneOTP(
            id=uuid4(),
            phone_number=phone_number,
            code_hash=code_hash,
            expires_at=expires_at,
        )
    )
    await session.flush()

    await send_otp_sms(phone_number, code)


async def verify_otp_and_get_or_create_user(
    session: AsyncSession,
    phone_number: str,
    code: str,
    full_name: str | None,
) -> tuple[User, bool]:
    now = _utcnow()

    result = await session.execute(
        select(PhoneOTP)
        .where(
            PhoneOTP.phone_number == phone_number,
            PhoneOTP.used_at.is_(None),
            PhoneOTP.expires_at > now,
        )
        .order_by(PhoneOTP.created_at.desc())
        .limit(1)
    )
    otp_record = result.scalar_one_or_none()

    if otp_record is None:
        raise OTPError("OTP expired or not found. Request a new code.")

    if not verify_otp_hash(phone_number, code, otp_record.code_hash):
        raise OTPError("Invalid OTP code.")

    otp_record.used_at = now

    user_result = await session.execute(select(User).where(User.phone_number == phone_number))
    user = user_result.scalar_one_or_none()
    is_new_user = user is None

    if is_new_user:
        if not full_name or not full_name.strip():
            raise OTPError("full_name is required for new accounts.")
        user = User(
            id=uuid4(),
            phone_number=phone_number,
            full_name=full_name.strip(),
            is_verified=True,
        )
        session.add(user)
    else:
        user.is_verified = True
        if full_name and full_name.strip():
            user.full_name = full_name.strip()

    await session.flush()
    return user, is_new_user
