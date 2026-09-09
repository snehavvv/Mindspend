"""
CSV import validation schemas and report models.
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class RowError(BaseModel):
    row: int = Field(..., description="1-based line index in the uploaded CSV (excluding header)")
    raw_data: Optional[str] = Field(default=None, description="Truncated raw row string")
    error: str = Field(..., description="Explanation of validation failure")


class CsvImportReport(BaseModel):
    total_rows: int = Field(..., description="Total data rows parsed from CSV")
    imported_count: int = Field(..., description="Successfully validated and inserted rows")
    failed_count: int = Field(..., description="Rows rejected due to validation errors")
    errors: list[RowError] = Field(default_factory=list, description="List of per-row error diagnostics")
