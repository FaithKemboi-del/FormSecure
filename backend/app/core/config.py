from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://formsecure:formsecure@localhost:5432/formsecure"
    debug: bool = False
    app_name: str = "FormSecure API"

    jwt_secret_key: str = "change-me-in-production-use-a-long-random-string"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30
    otp_expire_minutes: int = 5
    otp_hmac_secret: str = "change-me-otp-secret"

    otp_enabled: bool = False
    mpesa_mode: str = "stub"  # stub | daraja
    mpesa_environment: str = "sandbox"  # sandbox | production
    mpesa_consumer_key: str = ""
    mpesa_consumer_secret: str = ""
    mpesa_shortcode: str = "174379"
    mpesa_passkey: str = ""
    mpesa_callback_url: str = ""
    mpesa_initiator_name: str = ""
    mpesa_security_credential: str = ""
    escrow_expire_minutes: int = 30
    buyer_service_fee: str = "100.00"
    seller_commission_rate: str = "0.05"


settings = Settings()
