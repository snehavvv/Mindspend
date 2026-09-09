"""
Unit & integration tests for Transactions CRUD, filtering, pagination, CSV import/export, and Categories.
"""
from __future__ import annotations

import io
import pytest
from httpx import AsyncClient


async def _auth_headers(client: AsyncClient, email: str = "tx_user@finlytics.dev") -> dict[str, str]:
    password = "Password123!"
    reg = await client.post(
        "/api/auth/register",
        json={
            "email": email,
            "password": password,
            "username": email.split("@")[0],
        },
    )
    assert reg.status_code == 201, reg.text
    login = await client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}



@pytest.mark.asyncio
async def test_transaction_crud(client: AsyncClient):
    headers = await _auth_headers(client, "crud@finlytics.dev")

    # 1. Create
    create_payload = {
        "type": "expense",
        "amount": 89.99,
        "currency": "USD",
        "category": "Food & Dining",
        "note": "Dinner with friends",
        "date": "2026-09-08T19:30:00Z",
        "tags": ["social", "dinner"],
        "recurring": False,
    }
    create_resp = await client.post("/api/transactions", headers=headers, json=create_payload)
    assert create_resp.status_code == 201, create_resp.text
    tx = create_resp.json()
    assert tx["amount"] == 89.99
    assert tx["category"] == "Food & Dining"
    assert tx["tags"] == ["social", "dinner"]
    tx_id = tx["id"]

    # 2. Read single
    get_resp = await client.get(f"/api/transactions/{tx_id}", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == tx_id

    # 3. Update
    update_payload = {"amount": 95.00, "note": "Dinner with friends + tip"}
    put_resp = await client.put(f"/api/transactions/{tx_id}", headers=headers, json=update_payload)
    assert put_resp.status_code == 200
    assert put_resp.json()["amount"] == 95.00
    assert put_resp.json()["note"] == "Dinner with friends + tip"

    # 4. Delete
    del_resp = await client.delete(f"/api/transactions/{tx_id}", headers=headers)
    assert del_resp.status_code == 200

    # 5. Verify deleted
    get_again = await client.get(f"/api/transactions/{tx_id}", headers=headers)
    assert get_again.status_code == 404


@pytest.mark.asyncio
async def test_transaction_filters_and_search(client: AsyncClient):
    headers = await _auth_headers(client, "filter@finlytics.dev")

    # Seed transactions
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "income", "amount": 3000, "category": "Salary", "note": "Monthly paycheck", "date": "2026-09-01T00:00:00Z"},
    )
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "expense", "amount": 120, "category": "Groceries", "note": "Weekly market trip", "date": "2026-09-03T00:00:00Z"},
    )
    await client.post(
        "/api/transactions",
        headers=headers,
        json={"type": "expense", "amount": 45, "category": "Transportation", "note": "Uber ride downtown", "date": "2026-09-05T00:00:00Z"},
    )

    # Filter by type: income
    r_type = await client.get("/api/transactions?type=income", headers=headers)
    assert r_type.status_code == 200
    assert r_type.json()["total"] == 1
    assert r_type.json()["items"][0]["category"] == "Salary"

    # Filter by category: Groceries
    r_cat = await client.get("/api/transactions?category=Groceries", headers=headers)
    assert r_cat.status_code == 200
    assert r_cat.json()["total"] == 1
    assert r_cat.json()["items"][0]["amount"] == 120

    # Text search on note: "uber"
    r_search = await client.get("/api/transactions?search=uber", headers=headers)
    assert r_search.status_code == 200
    assert r_search.json()["total"] == 1
    assert r_search.json()["items"][0]["note"] == "Uber ride downtown"


@pytest.mark.asyncio
async def test_categories_api(client: AsyncClient):
    headers = await _auth_headers(client, "cats@finlytics.dev")

    # 1. Get default categories
    get_resp = await client.get("/api/categories", headers=headers)
    assert get_resp.status_code == 200
    cats = get_resp.json()
    assert len(cats) >= 15
    assert any(c["name"] == "Housing" and c["is_default"] is True for c in cats)

    # 2. Add custom category
    post_resp = await client.post(
        "/api/categories",
        headers=headers,
        json={"name": "SaaS Subscriptions", "type": "expense", "icon": "cloud", "color": "#8B5CF6"},
    )
    assert post_resp.status_code == 201
    custom_cat = post_resp.json()
    assert custom_cat["name"] == "SaaS Subscriptions"
    assert custom_cat["is_default"] is False

    # 3. Verify custom category is returned in list
    get_after = await client.get("/api/categories", headers=headers)
    assert any(c["name"] == "SaaS Subscriptions" and c["is_default"] is False for c in get_after.json())


@pytest.mark.asyncio
async def test_csv_export_and_import(client: AsyncClient):
    headers = await _auth_headers(client, "csv@finlytics.dev")

    # 1. Seed 1 transaction
    await client.post(
        "/api/transactions",
        headers=headers,
        json={
            "type": "expense",
            "amount": 75.25,
            "category": "Entertainment",
            "note": "Movie night",
            "date": "2026-09-04T20:00:00Z",
            "tags": ["cinema", "fun"],
        },
    )

    # 2. Test export
    export_resp = await client.get("/api/transactions/export", headers=headers)
    assert export_resp.status_code == 200
    assert "text/csv" in export_resp.headers["content-type"]
    csv_text = export_resp.text
    assert "date,type,amount,currency,category,note,tags,recurring,recurring_frequency" in csv_text
    assert "Movie night" in csv_text
    assert "75.25" in csv_text

    # 3. Test import with valid rows and 1 invalid row
    import_csv = (
        "date,type,amount,currency,category,note,tags,recurring,recurring_frequency\n"
        "2026-09-05,expense,32.50,USD,Groceries,Coffee beans,beans;coffee,false,\n"
        "2026-09-06,income,150.00,USD,Freelance,Quick fix,work,false,\n"
        "2026-09-07,invalid_type,-20.00,USD,Shopping,Bad row,,false,\n"  # Invalid
    )
    files = {"file": ("test_import.csv", io.BytesIO(import_csv.encode("utf-8")), "text/csv")}
    import_resp = await client.post("/api/transactions/import", headers=headers, files=files)
    assert import_resp.status_code == 200
    report = import_resp.json()
    assert report["total_rows"] == 3
    assert report["imported_count"] == 2
    assert report["failed_count"] == 1
    assert len(report["errors"]) == 1
    assert report["errors"][0]["row"] == 3
