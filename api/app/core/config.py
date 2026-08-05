from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application configuration, loaded from environment / .env file."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # --- App ---
    PROJECT_NAME: str = "Festival Hub API"
    API_V1_PREFIX: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development | production

    # --- Database ---
    # SQLAlchemy URL using psycopg3, e.g.
    # postgresql+psycopg://festival:festival@localhost:5432/festival360
    DATABASE_URL: str = (
        "postgresql+psycopg://festival:festival@localhost:5432/festival360"
    )

    # --- CORS ---
    # Comma-separated list of allowed origins for the frontend.
    CORS_ORIGINS: str = "http://localhost:3000"

    # --- Auth (used from the auth phase) ---
    SECRET_KEY: str = "change-me-in-production-please-set-a-long-random-value"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 12  # 12h

    # --- Custom domains ---
    PLATFORM_DOMAIN: str = "festival360.ro"
    DOMAIN_VERIFY_PREFIX: str = "_festivalhub-verify"

    # --- Media library (uploaded files) ---
    # Directory where uploads are stored (mount a volume here in production).
    MEDIA_DIR: str = "media_uploads"
    # Public path prefix under which media is served (proxied by the frontend).
    MEDIA_URL_PREFIX: str = "/media"
    MAX_UPLOAD_MB: int = 8

    # --- Seed / demo ---
    SEED_ON_STARTUP: bool = False

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
