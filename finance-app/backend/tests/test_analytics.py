"""
Unit & integration tests specifically verifying the MongoDB aggregation pipeline for /analytics/summary.
"""
from __future__ import annotations

from datetime import datetime, timezone
import pytest
from httpx import AsyncClient


async def _register_and_login(client: AsyncClient, email: str = "alex@finlytics.dev") -> dict[str, str]:
    """Helper to register and login a user, returning Authorization header."""
    password = "Password123!"
    reg_resp = await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "username": email.split("@")[0],
        },
    )
    assert reg_resp.status_code == 201, reg_resp.text
    
    login_resp = await client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}



@pytest.mark.asyncio
async def test_empty_month_summary(client: AsyncClient):
    """When a user has no transactions for the requested month, summary returns zeros and empty categories."""
    headers = await _register_and_login(client, "empty@finlytics.dev")

    resp = await client.get("/api/analytics/summary?month=2026-09", headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["month"] == "2026-09"
    assert data["total_income"] == 0.0
    assert data["total_expense"] == 0.0
    assert data["net"] == 0.0
    assert data["spend_by_category"] == []
    assert len(data["daily_trend"]) == 30  # September has 30 days
    assert all(d["income"] == 0.0 and d["expense"] == 0.0 and d["net"] == 0.0 for d in data["daily_trend"])


@pytest.mark.asyncio
async def test_income_and_expense_aggregation(client: AsyncClient):
    """Tests that the aggregation pipeline computes income, expense, and net correctly."""
    headers = await _register_and_login(client, "income_exp@finlytics.dev")

    # Insert 2 incomes
    await client.post(
        "/api/transactions",
        headers=headers,
        json={
            "type": "income",
            "amount": 5000.00,
            "category": "Salary",
            "date": "2026-09-01T09:00:00Z",
        },
    )
    await client.post(
        "/api/transactions",
        headers=headers,
        json={
            "type": "income",
            "amount": 1250.50,
            "category": "Freelance",
            "date": "2026-09-15T14:30:00Z",
        },
    )

    # Insert 2 expenses
    await client.post(
        "/api/transactions",
        headers=headers,
        json={
            "type": "expense",
            "amount": 1500.00,
            "category": "Housing",
            "date": "2026-09-02T10:00:00Z",
        },
    )
    await client.post(
        "/api/transactions",
        headers=headers,
        json={
            "type": "expense",
            "amount": 750.50,
            "category": "Food & Dining",
            "date": "2026-09-10T12:00:00Z",
        },
    )

    resp = await client.get("/api/analytics/summary?month=2026-09", headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["total_income"] == 6250.50
    assert data["total_expense"] == 2250.50
    assert data["net"] == 4000.00  # 6250.50 - 2250.50


@pytest.mark.asyncio
async def test_spend_by_category_breakdown(client: AsyncClient):
    """Validates spend-by-category sorting by total descending and accurate percentage calculation."""
    headers = await _register_and_login(client, "categories@finlytics.dev")

    # Housing: $1000
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "expense", "amount": 1000.0, "category": "Housing", "date": "2026-09-01T00:00:00Z"},
    )
    # Groceries: $400 ($250 + $150)
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "expense", "amount": 250.0, "category": "Groceries", "date": "2026-09-05T00:00:00Z"},
    )
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "expense", "amount": 150.0, "category": "Groceries", "date": "2026-09-12T00:00:00Z"},
    )
    # Entertainment: $100
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "expense", "amount": 100.0, "category": "Entertainment", "date": "2026-09-20T00:00:00Z"},
    )

    resp = await client.get("/api/analytics/summary?month=2026-09", headers=headers)
    assert resp.status_code == 200, resp.text
    data = resp.json()

    assert data["total_expense"] == 1500.0
    cats = data["spend_by_category"]
    assert len(cats) == 3

    # Must be sorted descending by total
    assert cats[0]["category"] == "Housing"
    assert cats[0]["total"] == 1000.0
    assert cats[0]["percentage"] == round(1000.0 / 1500.0 * 100, 1)  # 66.7%
    assert cats[0]["count"] == 1

    assert cats[1]["category"] == "Groceries"
    assert cats[1]["total"] == 400.0
    assert cats[1]["percentage"] == round(400.0 / 1500.0 * 100, 1)  # 26.7%
    assert cats[1]["count"] == 2

    assert cats[2]["category"] == "Entertainment"
    assert cats[2]["total"] == 100.0
    assert cats[2]["percentage"] == round(100.0 / 1500.0 * 100, 1)  # 6.7%
    assert cats[2]["count"] == 1


@pytest.mark.asyncio
async def test_month_date_boundaries(client: AsyncClient):
    """Ensures transactions outside the target month are excluded from current month aggregation."""
    headers = await _register_and_login(client, "boundaries@finlytics.dev")

    # Transaction on 2026-08-31 23:59:59 (previous month)
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "income", "amount": 999.0, "category": "Salary", "date": "2026-08-31T23:59:59Z"},
    )

    # Transaction inside 2026-09
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "income", "amount": 2000.0, "category": "Salary", "date": "2026-09-01T00:00:00Z"},
    )

    # Transaction on 2026-10-01 00:00:00 (next month)
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "income", "amount": 888.0, "category": "Salary", "date": "2026-10-01T00:00:00Z"},
    )

    resp = await client.get("/api/analytics/summary?month=2026-09", headers=headers)
    assert resp.status_code == 200
    data = resp.json()

    # Only the 2000.0 should be counted in 2026-09
    assert data["total_income"] == 2000.0
    # The 999.0 should be detected in previous_month_net!
    assert data["previous_month_net"] == 999.0


@pytest.mark.asyncio
async def test_user_data_isolation(client: AsyncClient):
    """User B's transactions must never appear in User A's analytics summary."""
    headers_a = await _register_and_login(client, "user_a@finlytics.dev")
    headers_b = await _register_and_login(client, "user_b@finlytics.dev")

    # User A has $1000 income
    await client.post(
        "/api/transactions",
        headers=headers_a,
        json={"type": "income", "amount": 1000.0, "category": "Salary", "date": "2026-09-05T00:00:00Z"},
    )

    # User B has $9999 income
    await client.post(
        "/api/transactions",
        headers=headers_b,
        json={"type": "income", "amount": 9999.0, "category": "Salary", "date": "2026-09-05T00:00:00Z"},
    )

    # User A's summary
    resp_a = await client.get("/api/analytics/summary?month=2026-09", headers=headers_a)
    assert resp_a.status_code == 200
    assert resp_a.json()["total_income"] == 1000.0

    # User B's summary
    resp_b = await client.get("/api/analytics/summary?month=2026-09", headers=headers_b)
    assert resp_b.status_code == 200
    assert resp_b.json()["total_income"] == 9999.0


@pytest.mark.asyncio
async def test_daily_cumulative_balance(client: AsyncClient):
    """Verifies that daily cumulative trend points properly accumulate day over day."""
    headers = await _register_and_login(client, "cumulative@finlytics.dev")

    # Day 1: +1000
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "income", "amount": 1000.0, "category": "Salary", "date": "2026-09-01T12:00:00Z"},
    )
    # Day 3: -200
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "expense", "amount": 200.0, "category": "Food & Dining", "date": "2026-09-03T12:00:00Z"},
    )

    resp = await client.get("/api/analytics/summary?month=2026-09", headers=headers)
    assert resp.status_code == 200
    days = resp.json()["daily_trend"]

    # Day 1
    d1 = next(d for d in days if d["date"] == "2026-09-01")
    assert d1["income"] == 1000.0
    assert d1["cumulative_net"] == 1000.0

    # Day 2 (zero activity, cumulative stays 1000.0)
    d2 = next(d for d in days if d["date"] == "2026-09-02")
    assert d2["net"] == 0.0
    assert d2["cumulative_net"] == 1000.0

    # Day 3 (-200, cumulative becomes 800.0)
    d3 = next(d for d in days if d["date"] == "2026-09-03")
    assert d3["expense"] == 200.0
    assert d3["net"] == -200.0
    assert d3["cumulative_net"] == 800.0
