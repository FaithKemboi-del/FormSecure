import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models import RefreshToken, User


class TokenError(Exception):
    pass


def _utcnow() -> datetime:
    return datetime.now(UTC)


def create_access_token(user_id: UUID) -> tuple[str, int]:
    expires_delta = timedelta(minutes=settings.access_token_expire_minutes)
    expire = _utcnow() + expires_delta
    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
        "iat": _utcnow(),
    }
    token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return token, int(expires_delta.total_seconds())


def create_refresh_token_value() -> str:
    return secrets.token_urlsafe(48)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def decode_access_token(token: str) -> UUID:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.PyJWTError as exc:
        raise TokenError("Invalid or expired access token") from exc

    if payload.get("type") != "access":
        raise TokenError("Invalid token type")

    sub = payload.get("sub")
    if not sub:
        raise TokenError("Invalid token subject")

    return UUID(sub)


async def issue_refresh_token(session: AsyncSession, user_id: UUID) -> str:
    raw_token = create_refresh_token_value()
    token_hash = hash_refresh_token(raw_token)
    expires_at = _utcnow() + timedelta(days=settings.refresh_token_expire_days)

    session.add(
        RefreshToken(
            id=uuid4(),
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
    )
    await session.flush()
    return raw_token


async def validate_refresh_token(session: AsyncSession, raw_token: str) -> User:
    token_hash = hash_refresh_token(raw_token)
    result = await session.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked_at.is_(None),
        )
    )
    stored = result.scalar_one_or_none()

    if stored is None:
        raise TokenError("Invalid refresh token")

    if stored.expires_at < _utcnow():
        raise TokenError("Refresh token has expired")

    user_result = await session.execute(select(User).where(User.id == stored.user_id))
    user = user_result.scalar_one_or_none()
    if user is None:
        raise TokenError("User not found")

    stored.revoked_at = _utcnow()
    await session.flush()

    return user
