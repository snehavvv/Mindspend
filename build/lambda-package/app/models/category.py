"""
Category models and default system categories.
"""
from __future__ import annotations

from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

from app.models.base import BaseDocument, PyObjectId


class CategoryType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50, description="Category display name")
    type: CategoryType = Field(..., description="Income or expense category")
    icon: Optional[str] = Field(default="tag", description="Icon identifier for frontend rendering")
    color: Optional[str] = Field(default="#D97706", description="Hex or design token color")


class CategoryCreate(CategoryBase):
    pass


class CategoryInDB(BaseDocument, CategoryBase):
    user_id: Optional[PyObjectId] = Field(default=None, description="Owner user id (null for system defaults)")
    is_default: bool = Field(default=False, description="True if provided by Finlytics system")


class CategoryResponse(BaseModel):
    id: str
    name: str
    type: CategoryType
    icon: str
    color: str
    is_default: bool


# Curated default categories aligned with Onyx & Amber design system
DEFAULT_CATEGORIES: list[dict] = [
    # Expense
    {"name": "Housing", "type": CategoryType.EXPENSE, "icon": "home", "color": "#D97706", "is_default": True},
    {"name": "Food & Dining", "type": CategoryType.EXPENSE, "icon": "utensils", "color": "#F59E0B", "is_default": True},
    {"name": "Groceries", "type": CategoryType.EXPENSE, "icon": "shopping-cart", "color": "#10B981", "is_default": True},
    {"name": "Transportation", "type": CategoryType.EXPENSE, "icon": "car", "color": "#3B82F6", "is_default": True},
    {"name": "Utilities", "type": CategoryType.EXPENSE, "icon": "zap", "color": "#6366F1", "is_default": True},
    {"name": "Entertainment", "type": CategoryType.EXPENSE, "icon": "film", "color": "#EC4899", "is_default": True},
    {"name": "Healthcare", "type": CategoryType.EXPENSE, "icon": "activity", "color": "#EF4444", "is_default": True},
    {"name": "Shopping", "type": CategoryType.EXPENSE, "icon": "bag", "color": "#8B5CF6", "is_default": True},
    {"name": "Personal Care", "type": CategoryType.EXPENSE, "icon": "smile", "color": "#14B8A6", "is_default": True},
    {"name": "Travel", "type": CategoryType.EXPENSE, "icon": "plane", "color": "#06B6D4", "is_default": True},
    {"name": "Education", "type": CategoryType.EXPENSE, "icon": "book-open", "color": "#84CC16", "is_default": True},
    {"name": "Other Expense", "type": CategoryType.EXPENSE, "icon": "more-horizontal", "color": "#78716C", "is_default": True},
    # Income
    {"name": "Salary", "type": CategoryType.INCOME, "icon": "briefcase", "color": "#10B981", "is_default": True},
    {"name": "Freelance", "type": CategoryType.INCOME, "icon": "laptop", "color": "#34D399", "is_default": True},
    {"name": "Investments", "type": CategoryType.INCOME, "icon": "trending-up", "color": "#059669", "is_default": True},
    {"name": "Gifts", "type": CategoryType.INCOME, "icon": "gift", "color": "#F59E0B", "is_default": True},
    {"name": "Other Income", "type": CategoryType.INCOME, "icon": "dollar-sign", "color": "#6EE7B7", "is_default": True},
]
