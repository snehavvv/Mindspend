"""
Analytics API routes: Monthly summary aggregation powered by MongoDB aggregation pipeline.
"""
from __future__ import annotations

import calendar
import re
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.analytics import (
    AnalyticsSummaryResponse,
    CategorySpend,
    DailyTrendPoint,
)
from app.models.category import DEFAULT_CATEGORIES
from app.models.user import UserInDB

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _parse_month(month_str: Optional[str]) -> tuple[datetime, datetime, datetime, str]:
    """
    Parses a YYYY-MM string and returns:
    (start_of_month, start_of_next_month, start_of_prev_month, canonical_month_str)
    """
    now = datetime.now(timezone.utc)
    if not month_str:
        year = now.year
        month = now.month
    else:
        match = re.match(r"^(\d{4})-(\d{2})$", month_str.strip())
        if not match:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid month format. Expected YYYY-MM (e.g. 2026-09)."
            )
        year, month = int(match.group(1)), int(match.group(2))
        if month < 1 or month > 12:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Month must be between 01 and 12."
            )

    canonical = f"{year:04d}-{month:02d}"
    start_of_month = datetime(year, month, 1, 0, 0, 0, tzinfo=timezone.utc)

    # Next month
    if month == 12:
        start_of_next_month = datetime(year + 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    else:
        start_of_next_month = datetime(year, month + 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    # Previous month
    if month == 1:
        start_of_prev_month = datetime(year - 1, 12, 1, 0, 0, 0, tzinfo=timezone.utc)
    else:
        start_of_prev_month = datetime(year, month - 1, 1, 0, 0, 0, tzinfo=timezone.utc)

    return start_of_month, start_of_next_month, start_of_prev_month, canonical


@router.get(
    "/summary",
    response_model=AnalyticsSummaryResponse,
    summary="Get monthly income, expenses, net, category breakdown, and daily trend"
)
async def get_monthly_summary(
    month: Optional[str] = Query(
        default=None,
        description="Target month in YYYY-MM format (defaults to current month)"
    ),
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Calculates monthly financial performance using MongoDB aggregation pipelines:
    - Total Income
    - Total Expense
    - Net Savings (Income - Expense)
    - Spend-by-category breakdown with exact totals and percentage share
    - Previous month net for trend comparison
    - Daily income/expense and cumulative running balance
    """
    start_curr, start_next, start_prev, canonical_month = _parse_month(month)
    user_id_str = str(user.id)

    # ── Pipeline 1: Current Month Totals by Type (Income vs Expense) ────────────
    totals_pipeline = [
        {
            "$match": {
                "user_id": user_id_str,
                "date": {"$gte": start_curr, "$lt": start_next},
            }
        },
        {
            "$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        }
    ]
    totals_cursor = db.transactions.aggregate(totals_pipeline)
    totals_docs = await totals_cursor.to_list(length=None)

    total_income = 0.0
    total_expense = 0.0
    for doc in totals_docs:
        if doc["_id"] == "income":
            total_income = round(float(doc["total"]), 2)
        elif doc["_id"] == "expense":
            total_expense = round(float(doc["total"]), 2)

    net = round(total_income - total_expense, 2)

    # ── Pipeline 2: Spend By Category (MongoDB Aggregation Pipeline) ────────────
    category_pipeline = [
        {
            "$match": {
                "user_id": user_id_str,
                "type": "expense",
                "date": {"$gte": start_curr, "$lt": start_next},
            }
        },
        {
            "$group": {
                "_id": "$category",
                "total": {"$sum": "$amount"},
                "count": {"$sum": 1},
            }
        },
        {
            "$sort": {"total": -1}
        }
    ]
    category_cursor = db.transactions.aggregate(category_pipeline)
    category_docs = await category_cursor.to_list(length=None)

    # Fetch user categories and default categories to attach icon and color
    custom_cats = await db.categories.find({"user_id": user_id_str}).to_list(length=None)
    cat_meta_map: dict[str, dict] = {}
    for d in DEFAULT_CATEGORIES:
        cat_meta_map[d["name"].lower()] = {"icon": d["icon"], "color": d["color"]}
    for c in custom_cats:
        cat_meta_map[c["name"].lower()] = {
            "icon": c.get("icon", "tag"),
            "color": c.get("color", "#D97706"),
        }

    spend_by_category: list[CategorySpend] = []
    for doc in category_docs:
        cat_name = doc["_id"]
        cat_total = round(float(doc["total"]), 2)
        pct = round((cat_total / total_expense * 100), 1) if total_expense > 0 else 0.0
        meta = cat_meta_map.get(cat_name.lower(), {"icon": "tag", "color": "#D97706"})

        spend_by_category.append(
            CategorySpend(
                category=cat_name,
                total=cat_total,
                percentage=pct,
                count=int(doc.get("count", 0)),
                icon=meta["icon"],
                color=meta["color"],
            )
        )

    # ── Pipeline 3: Previous Month Net (MongoDB Aggregation) ───────────────────
    prev_pipeline = [
        {
            "$match": {
                "user_id": user_id_str,
                "date": {"$gte": start_prev, "$lt": start_curr},
            }
        },
        {
            "$group": {
                "_id": "$type",
                "total": {"$sum": "$amount"},
            }
        }
    ]
    prev_cursor = db.transactions.aggregate(prev_pipeline)
    prev_docs = await prev_cursor.to_list(length=None)

    prev_income = 0.0
    prev_expense = 0.0
    for doc in prev_docs:
        if doc["_id"] == "income":
            prev_income = round(float(doc["total"]), 2)
        elif doc["_id"] == "expense":
            prev_expense = round(float(doc["total"]), 2)

    previous_month_net = round(prev_income - prev_expense, 2)

    # Trend calculation
    trend_pct: Optional[float] = None
    if previous_month_net != 0:
        trend_pct = round(((net - previous_month_net) / abs(previous_month_net)) * 100, 1)
    elif net != 0:
        trend_pct = 100.0 if net > 0 else -100.0
    else:
        trend_pct = 0.0

    # ── Pipeline 4: Daily Breakdown for Area / Trend Chart ─────────────────────
    daily_pipeline = [
        {
            "$match": {
                "user_id": user_id_str,
                "date": {"$gte": start_curr, "$lt": start_next},
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$date"}
                },
                "income": {
                    "$sum": {
                        "$cond": [{"$eq": ["$type", "income"]}, "$amount", 0]
                    }
                },
                "expense": {
                    "$sum": {
                        "$cond": [{"$eq": ["$type", "expense"]}, "$amount", 0]
                    }
                },
            }
        },
        {
            "$sort": {"_id": 1}
        }
    ]
    daily_cursor = db.transactions.aggregate(daily_pipeline)
    daily_docs = await daily_cursor.to_list(length=None)

    daily_map = {
        d["_id"]: {
            "income": round(float(d.get("income", 0)), 2),
            "expense": round(float(d.get("expense", 0)), 2),
        }
        for d in daily_docs
    }

    # Generate complete day-by-day sequence for the month
    year_int = int(canonical_month[:4])
    month_int = int(canonical_month[5:7])
    _, days_in_month = calendar.monthrange(year_int, month_int)

    daily_trend: list[DailyTrendPoint] = []
    cumulative = 0.0

    for day in range(1, days_in_month + 1):
        day_str = f"{canonical_month}-{day:02d}"
        d_inc = daily_map.get(day_str, {}).get("income", 0.0)
        d_exp = daily_map.get(day_str, {}).get("expense", 0.0)
        d_net = round(d_inc - d_exp, 2)
        cumulative = round(cumulative + d_net, 2)

        daily_trend.append(
            DailyTrendPoint(
                date=day_str,
                income=d_inc,
                expense=d_exp,
                net=d_net,
                cumulative_net=cumulative,
            )
        )

    return AnalyticsSummaryResponse(
        month=canonical_month,
        total_income=total_income,
        total_expense=total_expense,
        net=net,
        previous_month_net=previous_month_net,
        trend_pct=trend_pct,
        spend_by_category=spend_by_category,
        daily_trend=daily_trend,
    )
