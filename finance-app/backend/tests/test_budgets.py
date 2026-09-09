"""
Unit & integration tests for the Budgets engine: CRUD, live spend calculation, alerts, and month/user isolation.
"""
from __future__ import annotations

import pytest
from httpx import AsyncClient


async def _auth_headers(client: AsyncClient, email: str = "budget_user@finlytics.dev") -> dict[str, str]:
    password = "Password123!"
    reg = await client.post(
        "/api/auth/register",
        json={"email": email, "password": password, "username": email.split("@")[0]},
    )
    assert reg.status_code == 201
    login = await client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_budget_crud_and_upsert(client: AsyncClient):
    headers = await _auth_headers(client, "crud_b@finlytics.dev")

    # 1. Create budget for Housing: $1,500 in 2026-09
    payload = {"category": "Housing", "month": "2026-09", "limit_amount": 1500.0}
    r_create = await client.post("/api/budgets", headers=headers, json=payload)
    assert r_create.status_code == 201, r_create.text
    b = r_create.json()
    assert b["category"] == "Housing"
    assert b["limit_amount"] == 1500.0
    assert b["current_spend"] == 0.0
    assert b["remaining"] == 1500.0
    assert b["percentage"] == 0.0
    b_id = b["id"]

    # 2. Upsert same category and month with new limit: $1,600
    r_upsert = await client.post("/api/budgets", headers=headers, json={"category": "Housing", "month": "2026-09", "limit_amount": 1600.0})
    assert r_upsert.status_code in (200, 201)
    assert r_upsert.json()["limit_amount"] == 1600.0

    # 3. Update via PUT
    r_update = await client.put(f"/api/budgets/{b_id}", headers=headers, json={"limit_amount": 1750.0})
    assert r_update.status_code == 200
    assert r_update.json()["limit_amount"] == 1750.0

    # 4. Delete
    r_del = await client.delete(f"/api/budgets/{b_id}", headers=headers)
    assert r_del.status_code == 200

    # 5. Verify deleted
    r_list = await client.get("/api/budgets?month=2026-09", headers=headers)
    assert len(r_list.json()) == 0


@pytest.mark.asyncio
async def test_budget_live_spend_and_alert_calculation(client: AsyncClient):
    """Verifies that expense transactions for the target month accurately calculate spend, remaining, and alert flags."""
    headers = await _auth_headers(client, "alerts_b@finlytics.dev")

    # Set Budget: Groceries = $500 in 2026-09
    await client.post("/api/budgets", headers=headers, json={"category": "Groceries", "month": "2026-09", "limit_amount": 500.0})

    # Set Budget: Dining = $200 in 2026-09
    await client.post("/api/budgets", headers=headers, json={"category": "Food & Dining", "month": "2026-09", "limit_amount": 200.0})

    # Insert Groceries expense: $460 (92% of $500 -> is_near_limit = True)
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "expense", "amount": 460.0, "category": "Groceries", "date": "2026-09-10T12:00:00Z"},
    )

    # Insert Dining expense: $250 (125% of $200 -> is_over_budget = True)
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "expense", "amount": 250.0, "category": "Food & Dining", "date": "2026-09-12T12:00:00Z"},
    )

    # List budgets for 2026-09
    r_list = await client.get("/api/budgets?month=2026-09", headers=headers)
    assert r_list.status_code == 200
    budgets = r_list.json()
    assert len(budgets) == 2

    groceries = next(b for b in budgets if b["category"] == "Groceries")
    assert groceries["current_spend"] == 460.0
    assert groceries["remaining"] == 40.0
    assert groceries["percentage"] == 92.0
    assert groceries["is_near_limit"] is True
    assert groceries["is_over_budget"] is False

    dining = next(b for b in budgets if b["category"] == "Food & Dining")
    assert dining["current_spend"] == 250.0
    assert dining["remaining"] == -50.0
    assert dining["percentage"] == 125.0
    assert dining["is_over_budget"] is True
    assert dining["is_near_limit"] is False

    # Check Summary endpoint
    r_sum = await client.get("/api/budgets/summary?month=2026-09", headers=headers)
    assert r_sum.status_code == 200
    sum_data = r_sum.json()
    assert sum_data["total_budgeted"] == 700.0  # 500 + 200
    assert sum_data["total_spent"] == 710.0     # 460 + 250
    assert sum_data["categories_over_budget"] == 1
    assert sum_data["categories_near_limit"] == 1


@pytest.mark.asyncio
async def test_budget_month_and_user_isolation(client: AsyncClient):
    """Transactions in August or October, or belonging to another user, must not affect September budget spend."""
    headers_a = await _auth_headers(client, "user_iso_a@finlytics.dev")
    headers_b = await _auth_headers(client, "user_iso_b@finlytics.dev")

    # User A creates Entertainment budget for 2026-09: $100
    await client.post("/api/budgets", headers=headers_a, json={"category": "Entertainment", "month": "2026-09", "limit_amount": 100.0})

    # Transaction in August (prior month)
    await client.post(
        "/api/transactions",
        headers=headers_a,
        json={"type": "expense", "amount": 80.0, "category": "Entertainment", "date": "2026-08-31T20:00:00Z"},
    )

    # Transaction by User B in September
    await client.post(
        "/api/transactions",
        headers=headers_b,
        json={"type": "expense", "amount": 95.0, "category": "Entertainment", "date": "2026-09-15T20:00:00Z"},
    )

    # User A's budget for September should still have $0 spend
    r_a = await client.get("/api/budgets?month=2026-09", headers=headers_a)
    assert r_a.status_code == 200
    assert r_a.json()[0]["current_spend"] == 0.0
    assert r_a.json()[0]["remaining"] == 100.0
