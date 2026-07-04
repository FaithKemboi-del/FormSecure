from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.deps import get_current_user
from app.services.ratings import get_seller_rating
from app.models import User
from app.schemas.auth import (
    MessageResponse,
    RefreshTokenBody,
    RequestOTPBody,
    TokenResponse,
    UpdateProfileBody,
    UserProfileResponse,
    VerifyOTPBody,
)
from app.services.email import EmailError, normalize_email
from app.services.auth import TokenError, create_access_token, issue_refresh_token, validate_refresh_token
from app.services.otp import OTPError, request_otp, verify_otp_and_get_or_create_user
from app.utils.phone import mask_phone

router = APIRouter(prefix="/api/auth", tags=["auth"])
me_router = APIRouter(prefix="/api", tags=["users"])


@router.post("/request-otp", response_model=MessageResponse)
async def request_otp_endpoint(
    body: RequestOTPBody,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    await request_otp(session, body.phone_number)
    return MessageResponse(
        message="OTP sent. Check your phone (or server console in development).",
        phone_number=mask_phone(body.phone_number),
    )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp_endpoint(
    body: VerifyOTPBody,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    try:
        user, is_new_user = await verify_otp_and_get_or_create_user(
            session,
            body.phone_number,
            body.otp,
            body.full_name,
        )
    except OTPError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    access_token, expires_in = create_access_token(user.id)
    refresh_token = await issue_refresh_token(session, user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        is_new_user=is_new_user,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(
    body: RefreshTokenBody,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    try:
        user = await validate_refresh_token(session, body.refresh_token)
    except TokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    access_token, expires_in = create_access_token(user.id)
    new_refresh_token = await issue_refresh_token(session, user.id)

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=expires_in,
        is_new_user=False,
    )


@me_router.get("/me", response_model=UserProfileResponse)
async def get_me(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserProfileResponse:
    rating = await get_seller_rating(session, current_user.id)
    return UserProfileResponse(
        id=current_user.id,
        full_name=current_user.full_name or "",
        phone_number=current_user.phone_number,
        email=current_user.email,
        is_verified=current_user.is_verified,
        rating=float(rating) if rating is not None else None,
    )


@me_router.patch("/me", response_model=UserProfileResponse)
async def update_me(
    body: UpdateProfileBody,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
) -> UserProfileResponse:
    if body.full_name is not None:
        current_user.full_name = body.full_name.strip()
    if body.email is not None:
        try:
            current_user.email = normalize_email(str(body.email))
        except EmailError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    await session.flush()
    rating = await get_seller_rating(session, current_user.id)
    return UserProfileResponse(
        id=current_user.id,
        full_name=current_user.full_name or "",
        phone_number=current_user.phone_number,
        email=current_user.email,
        is_verified=current_user.is_verified,
        rating=float(rating) if rating is not None else None,
    )
