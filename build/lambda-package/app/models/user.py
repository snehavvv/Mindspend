"""
User-related Pydantic models.

Separation:
  UserCreate      — inbound registration payload (validated, never stored raw)
  UserInDB        — internal model that maps a MongoDB document (has hashed_password)
  UserResponse    — outbound shape — NEVER includes hashed_password
  LoginRequest    — inbound login payload
  TokenResponse   — login success response (access token + user)
  RefreshResponse — /refresh success response
"""
from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.base import BaseDocument


# ── Inbound ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(min_length=2, max_length=50)
    password: str = Field(min_length=8)

    @field_validator("username")
    @classmethod
    def username_chars(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^[\w\-. ]+$", v):
            raise ValueError(
                "Username may only contain letters, numbers, spaces, "
                "underscores, hyphens, and dots."
            )
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ── Internal (DB) ──────────────────────────────────────────────────────────────

class UserInDB(BaseDocument):
    """Full user document as stored in MongoDB — includes hashed_password."""
    email: str
    username: str
    hashed_password: str
    is_active: bool = True


# ── Outbound ───────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    """Safe public representation of a user — no sensitive fields."""
    id: str
    email: str
    username: str
    created_at: datetime
    is_active: bool


class TokenResponse(BaseModel):
    """Returned by POST /login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshResponse(BaseModel):
    """Returned by POST /refresh."""
    access_token: str
    token_type: str = "bearer"
