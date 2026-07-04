from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_admin_user, get_current_user
from app.models import User, VerificationStatus
from app.schemas.auth import (
    LoginBody,
    MessageResponse,
    RefreshTokenBody,
    RequestOTPBody,
    SignupBody,
    TokenResponse,
    UpdateProfileBody,
    UserProfileResponse,
    VerifyOTPBody,
)
from app.services.admin_users import AdminUserError, apply_admin_user_action, list_users_for_admin
from app.services.auth import TokenError, create_access_token, issue_refresh_token, validate_refresh_token
from app.services.email import EmailError, normalize_email
from app.services.otp import OTPError, request_otp, verify_otp_and_get_or_create_user
from app.services.ratings import get_seller_rating
from app.services.signup import SignupError, signup_or_login_with_phone
from app.schemas.admin_users import AdminUserActionBody, AdminUserListResponse, AdminUserResponse
from app.utils.phone import mask_phone

router = APIRouter(prefix="/api/auth", tags=["auth"])
me_router = APIRouter(prefix="/api", tags=["users"])
admin_users_router = APIRouter(prefix="/api/admin", tags=["admin"])


def _token_response(user: User, refresh_token: str, expires_in: int, is_new_user: bool) -> TokenResponse:
    access_token, _ = create_access_token(user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        is_new_user=is_new_user,
        verification_status=user.verification_status.value,
    )


@router.post("/signup", response_model=TokenResponse)
async def signup_endpoint(
    body: SignupBody,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    try:
        user, is_new_user = await signup_or_login_with_phone(
            session,
            phone_number=body.phone_number,
            full_name=body.full_name,
            accept_terms=body.accept_terms,
            is_signup=True,
        )
    except SignupError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    access_token, expires_in = create_access_token(user.id)
    refresh_token = await issue_refresh_token(session, user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        is_new_user=is_new_user,
        verification_status=user.verification_status.value,
    )


@router.post("/login", response_model=TokenResponse)
async def login_endpoint(
    body: LoginBody,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> TokenResponse:
    try:
        user, _ = await signup_or_login_with_phone(
            session,
            phone_number=body.phone_number,
            full_name=None,
            accept_terms=body.accept_terms,
            is_signup=False,
        )
    except SignupError as exc:
        status_code = status.HTTP_404_NOT_FOUND if "not found" in str(exc).lower() else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=str(exc)) from exc

    access_token, expires_in = create_access_token(user.id)
    refresh_token = await issue_refresh_token(session, user.id)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
        is_new_user=False,
        verification_status=user.verification_status.value,
    )


@router.post("/request-otp", response_model=MessageResponse)
async def request_otp_endpoint(
    body: RequestOTPBody,
    session: Annotated[AsyncSession, Depends(get_db)],
) -> MessageResponse:
    if not settings.otp_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Phone OTP is disabled. Use /api/auth/signup or /api/auth/login instead.",
        )
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
    if not settings.otp_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Phone OTP is disabled. Use /api/auth/signup or /api/auth/login instead.",
        )
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
        verification_status=user.verification_status.value,
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
        verification_status=user.verification_status.value,
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
        verification_status=current_user.verification_status.value,
        is_verified=current_user.is_verified,
        is_blocked=current_user.is_blocked,
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
            current_user.email = normalize_email(str(body.email)) if str(body.email).strip() else None
        except EmailError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    await session.flush()
    rating = await get_seller_rating(session, current_user.id)
    return UserProfileResponse(
        id=current_user.id,
        full_name=current_user.full_name or "",
        phone_number=current_user.phone_number,
        email=current_user.email,
        verification_status=current_user.verification_status.value,
        is_verified=current_user.is_verified,
        is_blocked=current_user.is_blocked,
        rating=float(rating) if rating is not None else None,
    )


@admin_users_router.get("/users", response_model=AdminUserListResponse)
async def admin_list_users(
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(get_admin_user)],
    status_filter: VerificationStatus | None = Query(default=None, alias="status"),
) -> AdminUserListResponse:
    users = await list_users_for_admin(session, verification_status=status_filter)
    return AdminUserListResponse(items=[AdminUserResponse.model_validate(user) for user in users])


@admin_users_router.patch("/users/{user_id}", response_model=AdminUserResponse)
async def admin_update_user(
    user_id: UUID,
    body: AdminUserActionBody,
    session: Annotated[AsyncSession, Depends(get_db)],
    _admin: Annotated[User, Depends(get_admin_user)],
) -> AdminUserResponse:
    try:
        user = await apply_admin_user_action(
            session,
            user_id,
            action=body.action,
            notes=body.notes,
            blocked_reason=body.blocked_reason,
        )
    except AdminUserError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return AdminUserResponse.model_validate(user)
