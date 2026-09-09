"""
Application settings loaded from environment variables / .env file.
Uses pydantic-settings so every field is validated at startup.
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── MongoDB ────────────────────────────────────────────────────────
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "finlytics"

    # ── JWT ───────────────────────────────────────────────────────────
    JWT_SECRET: str = "dev-secret-please-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── CORS ──────────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]


@lru_cache
def get_settings() -> Settings:
    """Cached settings instance — safe to call many times."""
    return Settings()
