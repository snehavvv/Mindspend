"""
Auth routes: /register, /login, /refresh, /logout, /me

Security decisions:
  - /login returns a generic 401 regardless of whether the email
    exists — prevents user enumeration.
  - Refresh token is stored as httpOnly + SameSite=Lax cookie so JS
    cannot read it.
  - Logout simply clears the cookie; token blacklisting is out of scope
    for this chunk (add Redis token store in a later chunk if needed).
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated, Optional

from bson import ObjectId
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from jose import JWTError

from app.auth.dependencies import get_current_user
from app.auth.hashing import hash_password, verify_password
from app.auth.jwt import create_access_token, create_refresh_token, decode_token
from app.config import get_settings
from app.database import get_db
from app.models.user import (
    LoginRequest,
    RefreshResponse,
    TokenResponse,
    UserCreate,
    UserInDB,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

_REFRESH_COOKIE = "finlytics_refresh"
_REFRESH_COOKIE_MAX_AGE = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


def _user_response(doc: dict) -> UserResponse:
    return UserResponse(
        id=str(doc["_id"]),
        email=doc["email"],
        username=doc["username"],
        created_at=doc["created_at"],
        is_active=doc.get("is_active", True),
    )


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=token,
        httponly=True,
        secure=False,       # ← set True behind HTTPS in production
        samesite="lax",
        max_age=_REFRESH_COOKIE_MAX_AGE,
        path="/",
    )


# ── POST /api/auth/register ───────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new account",
)
async def register(body: UserCreate, db=Depends(get_db)):
    # Duplicate email check — return a 422 that the frontend can surface
    # on the email field inline.
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=[
                {
                    "loc": ["body", "email"],
                    "msg": "An account with this email already exists.",
                    "type": "value_error.duplicate",
                }
            ],
        )

    now = datetime.now(timezone.utc)
    doc = {
        "email": body.email.lower(),
        "username": body.username.strip(),
        "hashed_password": hash_password(body.password),
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _user_response(doc)


# ── POST /api/auth/login ──────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Sign in and receive an access token",
)
async def login(body: LoginRequest, response: Response, db=Depends(get_db)):
    # Generic 401 regardless of failure reason — prevents user enumeration.
    _auth_err = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="The email or password you entered is incorrect.",
    )

    user_doc = await db.users.find_one({"email": body.email.lower()})
    if user_doc is None:
        raise _auth_err

    if not verify_password(body.password, user_doc["hashed_password"]):
        raise _auth_err

    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact support.",
        )

    user_id = str(user_doc["_id"])
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    _set_refresh_cookie(response, refresh_token)

    return TokenResponse(
        access_token=access_token,
        user=_user_response(user_doc),
    )


# ── POST /api/auth/refresh ────────────────────────────────────────────────────

@router.post(
    "/refresh",
    response_model=RefreshResponse,
    summary="Exchange a refresh-token cookie for a new access token",
)
async def refresh(
    db=Depends(get_db),
    refresh_cookie: Annotated[Optional[str], Cookie(alias=_REFRESH_COOKIE)] = None,
):
    _session_err = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Session expired. Please sign in again.",
    )

    if not refresh_cookie:
        raise _session_err

    try:
        payload = decode_token(refresh_cookie)
    except JWTError:
        raise _session_err

    if payload.get("type") != "refresh":
        raise _session_err

    user_id: str | None = payload.get("sub")
    if not user_id or not ObjectId.is_valid(user_id):
        raise _session_err

    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if user_doc is None or not user_doc.get("is_active", True):
        raise _session_err

    return RefreshResponse(access_token=create_access_token(user_id))


# ── POST /api/auth/logout ─────────────────────────────────────────────────────

@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="Clear the refresh-token cookie",
)
async def logout(response: Response):
    response.delete_cookie(key=_REFRESH_COOKIE, path="/")
    return {"message": "Logged out successfully."}


# ── GET /api/auth/me ──────────────────────────────────────────────────────────

@router.get(
    "/me",
    response_model=UserResponse,
    summary="Return the currently authenticated user",
)
async def get_me(current_user: UserInDB = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id or "",
        email=current_user.email,
        username=current_user.username,
        created_at=current_user.created_at,
        is_active=current_user.is_active,
    )
