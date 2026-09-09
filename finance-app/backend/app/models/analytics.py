"""
Analytics summary models and aggregation response schemas.
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class CategorySpend(BaseModel):
    category: str
    total: float
    percentage: float = Field(..., description="Percentage of total expense (0-100)")
    count: int = Field(default=0, description="Number of transactions in this category")
    icon: Optional[str] = None
    color: Optional[str] = None


class DailyTrendPoint(BaseModel):
    date: str = Field(..., description="Date formatted as YYYY-MM-DD")
    income: float = 0.0
    expense: float = 0.0
    net: float = 0.0
    cumulative_net: float = 0.0


class AnalyticsSummaryResponse(BaseModel):
    month: str = Field(..., description="Target month formatted as YYYY-MM")
    total_income: float = 0.0
    total_expense: float = 0.0
    net: float = 0.0
    previous_month_net: float = 0.0
    trend_pct: Optional[float] = Field(
        default=None,
        description="Percentage difference in net compared to previous month"
    )
    spend_by_category: list[CategorySpend] = Field(default_factory=list)
    daily_trend: list[DailyTrendPoint] = Field(default_factory=list)
