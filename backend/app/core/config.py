from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql+asyncpg://formsecure:formsecure@localhost:5432/formsecure"
    debug: bool = False
    app_name: str = "FormSecure API"


settings = Settings()
