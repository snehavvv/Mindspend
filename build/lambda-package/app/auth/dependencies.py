"""
FastAPI dependency: get_current_user.

Extracts and validates the Bearer access token from the Authorization
header.  Returns the full UserInDB document so routes can inspect any
field without an extra DB round-trip.
"""
from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from bson import ObjectId

from app.auth.jwt import decode_token
from app.database import get_db
from app.models.user import UserInDB

_bearer = HTTPBearer(auto_error=True)

_CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Invalid or expired credentials.",
    headers={"WWW-Authenticate": "Bearer"},
)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    db=Depends(get_db),
) -> UserInDB:
    """
    Dependency that resolves a Bearer token to a UserInDB instance.

    Use as:
        @router.get("/me")
        async def me(user: UserInDB = Depends(get_current_user)): ...
    """
    token = credentials.credentials

    try:
        payload = decode_token(token)
    except JWTError:
        raise _CREDENTIALS_EXCEPTION

    if payload.get("type") != "access":
        raise _CREDENTIALS_EXCEPTION

    user_id: str | None = payload.get("sub")
    if not user_id or not ObjectId.is_valid(user_id):
        raise _CREDENTIALS_EXCEPTION

    user_doc = await db.users.find_one({"_id": ObjectId(user_id)})
    if user_doc is None:
        raise _CREDENTIALS_EXCEPTION

    if not user_doc.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated.",
        )

    return UserInDB(**user_doc)
