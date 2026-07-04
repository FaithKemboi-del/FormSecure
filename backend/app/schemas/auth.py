from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.utils.phone import PhoneNumberError, normalize_kenyan_phone


class RequestOTPBody(BaseModel):
    phone_number: str = Field(..., examples=["+254712345678", "0712345678"])

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        try:
            return normalize_kenyan_phone(value)
        except PhoneNumberError as exc:
            raise ValueError(str(exc)) from exc


class VerifyOTPBody(BaseModel):
    phone_number: str
    otp: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    full_name: str | None = Field(default=None, max_length=120)

    @field_validator("phone_number")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        try:
            return normalize_kenyan_phone(value)
        except PhoneNumberError as exc:
            raise ValueError(str(exc)) from exc


class RefreshTokenBody(BaseModel):
    refresh_token: str = Field(..., min_length=10)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    is_new_user: bool = False


class MessageResponse(BaseModel):
    message: str
    phone_number: str


class UserProfileResponse(BaseModel):
    id: UUID
    full_name: str
    phone_number: str
    is_verified: bool
    rating: float | None

    model_config = {"from_attributes": True}
