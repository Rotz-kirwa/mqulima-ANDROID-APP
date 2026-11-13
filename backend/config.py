"""Validated environment settings for the Mqulima FastAPI backend."""
from functools import lru_cache
from pathlib import Path
from typing import List

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

ROOT_DIR = Path(__file__).parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_ENV: str = Field(default="development")
    MONGO_URL: str = Field(...)
    DB_NAME: str = Field(default="mqulima")
    JWT_SECRET: str = Field(...)
    JWT_EXPIRE_DAYS: int = Field(default=30, ge=1, le=90)

    ALLOWED_ORIGINS: str = Field(
        default="https://mqulima.com,https://www.mqulima.com,http://localhost:8080,http://localhost:8081"
    )
    MONGO_MAX_POOL_SIZE: int = Field(default=50, ge=5, le=500)
    MONGO_MIN_POOL_SIZE: int = Field(default=5, ge=0, le=100)
    MONGO_SERVER_SELECTION_TIMEOUT_MS: int = Field(default=5000, ge=500)
    MONGO_CONNECT_TIMEOUT_MS: int = Field(default=5000, ge=500)
    MONGO_SOCKET_TIMEOUT_MS: int = Field(default=15000, ge=1000)

    MAX_REQUEST_BYTES: int = Field(default=5 * 1024 * 1024, ge=65536)
    RATE_LIMIT_AUTH_PER_MIN: int = Field(default=12, ge=1)
    RATE_LIMIT_AI_PER_HOUR: int = Field(default=30, ge=1)
    RATE_LIMIT_WRITE_PER_MIN: int = Field(default=60, ge=1)
    RATE_LIMIT_DEFAULT_PER_MIN: int = Field(default=180, ge=1)

    EMERGENT_LLM_KEY: str = Field(default="")
    AI_TIMEOUT_SECONDS: float = Field(default=20.0, ge=2.0, le=60.0)

    @model_validator(mode="after")
    def _validate_production_secrets(self) -> "Settings":
        env = self.APP_ENV.strip().lower()
        if env == "production":
            if len(self.JWT_SECRET.strip()) < 32:
                raise ValueError("JWT_SECRET must be at least 32 characters in production.")
            if "*" in self.ALLOWED_ORIGINS:
                raise ValueError("Wildcard '*' in ALLOWED_ORIGINS is disallowed in production.")
        return self

    @property
    def allowed_origins_list(self) -> List[str]:
        origins = [o.strip().rstrip("/") for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]
        if self.APP_ENV.strip().lower() == "production":
            return [o for o in origins if o.startswith("https://")]
        return origins or ["http://localhost:8081"]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


def validate_startup_settings() -> Settings:
    """Eagerly validates environment settings during server startup."""
    return get_settings()

