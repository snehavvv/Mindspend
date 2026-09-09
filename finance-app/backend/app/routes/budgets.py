"""
Budgets API routes: CRUD operations and spend-vs-limit monthly aggregation.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.base import utcnow
from app.models.budget import (
    BudgetCreate,
    BudgetResponse,
    BudgetSummaryResponse,
    BudgetUpdate,
)
from app.models.user import UserInDB

router = APIRouter(prefix="/budgets", tags=["budgets"])


def _parse_budget_month(month_str: Optional[str]) -> tuple[datetime, datetime, str]:
    """Parses YYYY-MM and returns (start_of_month, start_of_next_month, canonical_month_str)."""
    now = datetime.now(timezone.utc)
    if not month_str:
        year, month = now.year, now.month
    else:
        match = re.match(r"^(\d{4})-(0[1-9]|1[0-2])$", month_str.strip())
        if not match:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid month format. Expected YYYY-MM (e.g. 2026-09)."
            )
        year, month = int(match.group(1)), int(match.group(2))

    canonical = f"{year:04d}-{month:02d}"
    start_curr = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)
    if month == 12:
        start_next = datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    else:
        start_next = datetime(year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    return start_curr, start_next, canonical


async def _get_category_spends_for_month(
    db: AsyncIOMotorDatabase,
    user_id: str,
    start_curr: datetime,
    start_next: datetime,
) -> dict[str, float]:
    """Aggregates expense totals by category from transactions."""
    pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "type": "expense",
                "date": {"$gte": start_curr, "$lt": start_next},
            }
        },
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"}
            }
        }
    ]
    cursor = db.transactions.aggregate(pipeline)
    docs = await cursor.to_list(length=None)
    return {doc["_id"].lower(): round(float(doc["total"]), 2) for doc in docs}


def _build_budget_response(doc: dict, spend_map: dict[str, float]) -> BudgetResponse:
    cat = doc["category"]
    limit = round(float(doc["limit_amount"]), 2)
    spent = spend_map.get(cat.lower(), 0.0)
    remaining = round(limit - spent, 2)
    percentage = round((spent / limit * 100), 1) if limit > 0 else 0.0
    is_over = spent > limit
    is_near = percentage >= 90.0 and not is_over

    created_at = doc.get("created_at") or utcnow()
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        except Exception:
            created_at = utcnow()

    updated_at = doc.get("updated_at") or utcnow()
    if isinstance(updated_at, str):
        try:
            updated_at = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
        except Exception:
            updated_at = utcnow()

    return BudgetResponse(
        id=str(doc["_id"]),
        user_id=str(doc["user_id"]),
        category=cat,
        month=doc["month"],
        limit_amount=limit,
        current_spend=spent,
        remaining=remaining,
        percentage=percentage,
        is_over_budget=is_over,
        is_near_limit=is_near,
        created_at=created_at,
        updated_at=updated_at,
    )


@router.get("/summary", response_model=BudgetSummaryResponse, summary="Get overall monthly budget summary and alerts")
async def get_budget_summary(
    month: Optional[str] = Query(default=None, description="Month in YYYY-MM format"),
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Returns total budgeted, total spent, remaining balance, and list of budgets with warning alerts.
    """
    start_curr, start_next, canonical_month = _parse_budget_month(month)
    user_id_str = str(user.id)

    spend_map = await _get_category_spends_for_month(db, user_id_str, start_curr, start_next)

    cursor = db.budgets.find({"user_id": user_id_str, "month": canonical_month}).sort("category", 1)
    budget_docs = await cursor.to_list(length=None)

    budgets: list[BudgetResponse] = []
    total_budgeted = 0.0
    total_spent = 0.0
    over_count = 0
    near_count = 0

    for doc in budget_docs:
        resp = _build_budget_response(doc, spend_map)
        budgets.append(resp)
        total_budgeted += resp.limit_amount
        total_spent += resp.current_spend
        if resp.is_over_budget:
            over_count += 1
        elif resp.is_near_limit:
            near_count += 1

    total_budgeted = round(total_budgeted, 2)
    total_spent = round(total_spent, 2)
    total_remaining = round(total_budgeted - total_spent, 2)
    overall_percentage = round((total_spent / total_budgeted * 100), 1) if total_budgeted > 0 else 0.0

    return BudgetSummaryResponse(
        month=canonical_month,
        total_budgeted=total_budgeted,
        total_spent=total_spent,
        total_remaining=total_remaining,
        overall_percentage=overall_percentage,
        categories_over_budget=over_count,
        categories_near_limit=near_count,
        budgets=budgets,
    )


@router.get("", response_model=list[BudgetResponse], summary="List budgets for a given month")
async def list_budgets(
    month: Optional[str] = Query(default=None, description="Month in YYYY-MM format"),
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Returns all category budgets configured for the target month with live spend calculations.
    """
    start_curr, start_next, canonical_month = _parse_budget_month(month)
    user_id_str = str(user.id)

    spend_map = await _get_category_spends_for_month(db, user_id_str, start_curr, start_next)

    cursor = db.budgets.find({"user_id": user_id_str, "month": canonical_month}).sort("category", 1)
    docs = await cursor.to_list(length=None)

    return [_build_budget_response(doc, spend_map) for doc in docs]


@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED, summary="Create or upsert a category budget")
async def create_or_upsert_budget(
    body: BudgetCreate,
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Creates or updates a monthly category budget for the authenticated user.
    """
    start_curr, start_next, canonical_month = _parse_budget_month(body.month)
    user_id_str = str(user.id)
    now = utcnow()

    existing = await db.budgets.find_one({
        "user_id": user_id_str,
        "month": canonical_month,
        "category": {"$regex": f"^{re.escape(body.category)}$", "$options": "i"}
    })

    if existing:
        await db.budgets.update_one(
            {"_id": existing["_id"]},
            {"$set": {"limit_amount": round(body.limit_amount, 2), "updated_at": now}}
        )
        updated_doc = await db.budgets.find_one({"_id": existing["_id"]})
    else:
        new_doc = {
            "user_id": user_id_str,
            "category": body.category.strip(),
            "month": canonical_month,
            "limit_amount": round(body.limit_amount, 2),
            "created_at": now,
            "updated_at": now,
        }
        res = await db.budgets.insert_one(new_doc)
        new_doc["_id"] = res.inserted_id
        updated_doc = new_doc

    spend_map = await _get_category_spends_for_month(db, user_id_str, start_curr, start_next)
    return _build_budget_response(updated_doc, spend_map)


@router.put("/{id}", response_model=BudgetResponse, summary="Update budget limit")
async def update_budget(
    id: str,
    body: BudgetUpdate,
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Updates the limit amount of a specific budget owned by the authenticated user.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid budget ID.")

    user_id_str = str(user.id)
    existing = await db.budgets.find_one({"_id": ObjectId(id), "user_id": user_id_str})
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")

    now = utcnow()
    await db.budgets.update_one(
        {"_id": ObjectId(id)},
        {"$set": {"limit_amount": round(body.limit_amount, 2), "updated_at": now}}
    )

    updated_doc = await db.budgets.find_one({"_id": ObjectId(id)})
    start_curr, start_next, _ = _parse_budget_month(updated_doc["month"])
    spend_map = await _get_category_spends_for_month(db, user_id_str, start_curr, start_next)
    return _build_budget_response(updated_doc, spend_map)


@router.delete("/{id}", summary="Delete a budget")
async def delete_budget(
    id: str,
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Deletes a specific category budget owned by the authenticated user.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid budget ID.")

    res = await db.budgets.delete_one({"_id": ObjectId(id), "user_id": str(user.id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")

    return {"message": "Budget deleted successfully.", "id": id}
