"""
Budget models, request and response schemas.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from app.models.base import BaseDocument, PyObjectId


class BudgetBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=50, description="Category name for this budget")
    month: str = Field(..., description="Target month in YYYY-MM format")
    limit_amount: float = Field(..., gt=0, description="Allocated spending limit (positive number)")

    @field_validator("category")
    @classmethod
    def clean_category(cls, v: str) -> str:
        return v.strip()

    @field_validator("month")
    @classmethod
    def validate_month(cls, v: str) -> str:
        v = v.strip()
        if not re.match(r"^\d{4}-(0[1-9]|1[0-2])$", v):
            raise ValueError("Month must be formatted as YYYY-MM (e.g. 2026-09)")
        return v


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BaseModel):
    limit_amount: float = Field(..., gt=0, description="Updated limit amount")


class BudgetInDB(BaseDocument, BudgetBase):
    user_id: PyObjectId = Field(..., description="Owner user ID")


class BudgetResponse(BaseModel):
    id: str
    user_id: str
    category: str
    month: str
    limit_amount: float
    current_spend: float = 0.0
    remaining: float = 0.0
    percentage: float = 0.0
    is_over_budget: bool = False
    is_near_limit: bool = False
    created_at: datetime
    updated_at: datetime


class BudgetSummaryResponse(BaseModel):
    month: str
    total_budgeted: float = 0.0
    total_spent: float = 0.0
    total_remaining: float = 0.0
    overall_percentage: float = 0.0
    categories_over_budget: int = 0
    categories_near_limit: int = 0
    budgets: list[BudgetResponse] = Field(default_factory=list)
