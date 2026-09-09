"""
Transaction models, enums, validation and response schemas.
"""
from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, field_validator

from app.models.base import BaseDocument, PyObjectId


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


class RecurringFrequency(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class TransactionBase(BaseModel):
    type: TransactionType = Field(..., description="Income or expense")
    amount: float = Field(..., gt=0, description="Transaction monetary amount (positive number)")
    currency: str = Field(default="USD", max_length=3, description="ISO 4217 3-letter currency code")
    category: str = Field(..., min_length=1, max_length=50, description="Category name")
    note: Optional[str] = Field(default=None, max_length=500, description="Optional description or note")
    date: datetime = Field(..., description="Date/time transaction occurred (ISO-8601)")
    tags: list[str] = Field(default_factory=list, description="Array of searchable string tags")
    recurring: bool = Field(default=False, description="Whether transaction repeats automatically")
    recurring_frequency: Optional[RecurringFrequency] = Field(
        default=None,
        description="Recurrence cadence if recurring is True"
    )

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("tags", mode="before")
    @classmethod
    def clean_tags(cls, v):
        if isinstance(v, str):
            # Split comma-separated string if provided
            return [t.strip() for t in v.split(",") if t.strip()]
        if isinstance(v, list):
            return [str(t).strip() for t in v if str(t).strip()]
        return []


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(BaseModel):
    type: Optional[TransactionType] = None
    amount: Optional[float] = Field(default=None, gt=0)
    currency: Optional[str] = Field(default=None, max_length=3)
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    note: Optional[str] = Field(default=None, max_length=500)
    date: Optional[datetime] = None
    tags: Optional[list[str]] = None
    recurring: Optional[bool] = None
    recurring_frequency: Optional[RecurringFrequency] = None

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, v: Optional[str]) -> Optional[str]:
        return v.upper().strip() if v else None

    @field_validator("tags", mode="before")
    @classmethod
    def clean_tags(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            return [t.strip() for t in v.split(",") if t.strip()]
        if isinstance(v, list):
            return [str(t).strip() for t in v if str(t).strip()]
        return []


class TransactionInDB(BaseDocument, TransactionBase):
    user_id: PyObjectId = Field(..., description="Owner user ID")


class TransactionResponse(BaseModel):
    id: str
    user_id: str
    type: TransactionType
    amount: float
    currency: str
    category: str
    note: Optional[str] = None
    date: datetime
    tags: list[str]
    recurring: bool
    recurring_frequency: Optional[RecurringFrequency] = None
    created_at: datetime
    updated_at: datetime


class PaginatedTransactionsResponse(BaseModel):
    items: list[TransactionResponse]
    total: int
    page: int
    limit: int
    pages: int
