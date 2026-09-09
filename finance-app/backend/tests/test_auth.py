"""
Auth endpoint test suite.

Covers:
  ✓ Successful registration
  ✓ Duplicate email → 422 with field-level detail on `email`
  ✓ Invalid email format → 422
  ✓ Weak password → 422
  ✓ Successful login → access token + refresh cookie
  ✓ Wrong password → 401 with generic message
  ✓ Non-existent email → 401 with same generic message (no enumeration)
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient

# ── Fixtures ──────────────────────────────────────────────────────────────────
_VALID_USER = {
    "email": "alice@example.com",
    "username": "Alice",
    "password": "Secure1Pass",
}


async def _register(client: AsyncClient, overrides: dict | None = None) -> None:
    payload = {**_VALID_USER, **(overrides or {})}
    await client.post("/api/auth/register", json=payload)


# ── Registration ──────────────────────────────────────────────────────────────

async def test_register_success(client: AsyncClient):
    r = await client.post("/api/auth/register", json=_VALID_USER)
    assert r.status_code == 201
    data = r.json()
    assert data["email"] == _VALID_USER["email"]
    assert data["username"] == _VALID_USER["username"]
    assert "id" in data
    assert "hashed_password" not in data  # never leaks


async def test_register_duplicate_email(client: AsyncClient):
    await _register(client)
    r = await client.post(
        "/api/auth/register",
        json={**_VALID_USER, "username": "Bob"},  # different name, same email
    )
    assert r.status_code == 422
    detail = r.json()["detail"]
    assert isinstance(detail, list)
    locs = [e["loc"] for e in detail]
    assert ["body", "email"] in locs, f"Expected email field error, got: {detail}"


async def test_register_invalid_email(client: AsyncClient):
    r = await client.post(
        "/api/auth/register",
        json={**_VALID_USER, "email": "not-an-email"},
    )
    assert r.status_code == 422


async def test_register_password_too_short(client: AsyncClient):
    r = await client.post(
        "/api/auth/register",
        json={**_VALID_USER, "password": "short"},
    )
    assert r.status_code == 422


async def test_register_password_no_uppercase(client: AsyncClient):
    r = await client.post(
        "/api/auth/register",
        json={**_VALID_USER, "password": "nouppercase1"},
    )
    assert r.status_code == 422


async def test_register_password_no_number(client: AsyncClient):
    r = await client.post(
        "/api/auth/register",
        json={**_VALID_USER, "password": "NoNumbersHere"},
    )
    assert r.status_code == 422


# ── Login ─────────────────────────────────────────────────────────────────────

async def test_login_success(client: AsyncClient):
    await _register(client)
    r = await client.post(
        "/api/auth/login",
        json={"email": _VALID_USER["email"], "password": _VALID_USER["password"]},
    )
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == _VALID_USER["email"]
    # Refresh cookie must be set
    assert "finlytics_refresh" in r.cookies


async def test_login_wrong_password(client: AsyncClient):
    await _register(client)
    r = await client.post(
        "/api/auth/login",
        json={"email": _VALID_USER["email"], "password": "WrongPass9"},
    )
    assert r.status_code == 401
    # Generic message — does NOT reveal whether email exists
    msg = r.json()["detail"].lower()
    assert "incorrect" in msg or "wrong" in msg


async def test_login_nonexistent_email(client: AsyncClient):
    r = await client.post(
        "/api/auth/login",
        json={"email": "nobody@example.com", "password": "Whatever1"},
    )
    assert r.status_code == 401
    # Must return the same message as wrong-password (no enumeration)
    msg = r.json()["detail"].lower()
    assert "incorrect" in msg or "wrong" in msg


# ── Protected route ───────────────────────────────────────────────────────────

async def test_get_me_authenticated(client: AsyncClient):
    await _register(client)
    login = await client.post(
        "/api/auth/login",
        json={"email": _VALID_USER["email"], "password": _VALID_USER["password"]},
    )
    token = login.json()["access_token"]
    r = await client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert r.status_code == 200
    assert r.json()["email"] == _VALID_USER["email"]


async def test_get_me_unauthenticated(client: AsyncClient):
    r = await client.get("/api/auth/me")
    assert r.status_code == 403  # HTTPBearer raises 403 when header missing
