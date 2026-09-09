"""
JWT utilities — create and verify access / refresh tokens.

Access token  : short-lived (default 15 min),  type claim = "access"
Refresh token : long-lived  (default 7 days),   type claim = "refresh"

The `type` claim prevents a refresh token from being used as an access
token and vice versa.
"""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt

from app.config import get_settings

settings = get_settings()


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


def create_access_token(subject: str, extra: dict[str, Any] | None = None) -> str:
    """
    Create a signed JWT intended for API authorisation.

    Args:
        subject: The user's string ID (ObjectId as str).
        extra:   Optional additional claims merged into the payload.
    """
    expire = _now_utc() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    payload: dict[str, Any] = {
        "sub":  subject,
        "exp":  expire,
        "iat":  _now_utc(),
        "type": "access",
        **(extra or {}),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    """Create a signed JWT intended for session renewal only."""
    expire = _now_utc() + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub":  subject,
        "exp":  expire,
        "iat":  _now_utc(),
        "type": "refresh",
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and verify a JWT.

    Raises:
        jose.JWTError: on any signature/expiry/format error.
    """
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
