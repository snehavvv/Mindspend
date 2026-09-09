"""
Transactions API routes: CRUD, filtering, pagination, CSV export, and CSV import with validation.
"""
from __future__ import annotations

import csv
import io
import math
import re
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.base import utcnow
from app.models.csv_import import CsvImportReport, RowError
from app.models.transaction import (
    PaginatedTransactionsResponse,
    RecurringFrequency,
    TransactionCreate,
    TransactionResponse,
    TransactionType,
    TransactionUpdate,
)
from app.models.user import UserInDB

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _doc_to_response(doc: dict) -> TransactionResponse:
    """Helper to convert MongoDB raw doc to TransactionResponse."""
    dt = doc["date"]
    if isinstance(dt, str):
        try:
            dt = datetime.fromisoformat(dt.replace("Z", "+00:00"))
        except Exception:
            dt = utcnow()

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

    return TransactionResponse(
        id=str(doc["_id"]),
        user_id=str(doc["user_id"]),
        type=TransactionType(doc["type"]),
        amount=float(doc["amount"]),
        currency=doc.get("currency", "USD"),
        category=doc["category"],
        note=doc.get("note"),
        date=dt,
        tags=doc.get("tags", []),
        recurring=bool(doc.get("recurring", False)),
        recurring_frequency=RecurringFrequency(doc["recurring_frequency"]) if doc.get("recurring_frequency") else None,
        created_at=created_at,
        updated_at=updated_at,
    )


# ── CSV Export (placed before /{id} to avoid path collision) ───────────────────
@router.get("/export", summary="Export transactions as CSV")
async def export_transactions(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None,
    type: Optional[TransactionType] = None,
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Streams all matching transactions for the current user as an RFC 4180 CSV file.
    """
    query: dict = {"user_id": str(user.id)}
    if type:
        query["type"] = type.value
    if category:
        query["category"] = category
    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = start_date
        if end_date:
            query["date"]["$lte"] = end_date

    cursor = db.transactions.find(query).sort("date", -1)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "date",
        "type",
        "amount",
        "currency",
        "category",
        "note",
        "tags",
        "recurring",
        "recurring_frequency",
    ])

    async for doc in cursor:
        dt = doc["date"]
        dt_str = dt.isoformat() if isinstance(dt, datetime) else str(dt)
        tags_str = ";".join(doc.get("tags", []))
        writer.writerow([
            dt_str,
            doc["type"],
            doc["amount"],
            doc.get("currency", "USD"),
            doc["category"],
            doc.get("note") or "",
            tags_str,
            str(bool(doc.get("recurring", False))).lower(),
            doc.get("recurring_frequency") or "",
        ])

    csv_data = output.getvalue()
    output.close()

    filename = f"finlytics-transactions-{utcnow().strftime('%Y%m%d-%H%M')}.csv"
    return StreamingResponse(
        io.StringIO(csv_data),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── CSV Import (placed before /{id} to avoid path collision) ───────────────────
@router.post("/import", response_model=CsvImportReport, summary="Import transactions from CSV")
async def import_transactions(
    file: UploadFile = File(...),
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Imports transactions from an uploaded CSV with row-level validation.
    Returns counts and detailed diagnostic errors for skipped/failed rows.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file must be a CSV (.csv).",
        )

    content = await file.read()
    try:
        # Handle utf-8 and utf-8-sig (BOM from Excel)
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="File could not be decoded as UTF-8.",
        )

    reader = csv.DictReader(io.StringIO(text))
    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="CSV file appears to be empty or missing headers.",
        )

    # Normalize headers
    normalized_headers = {h.strip().lower(): h for h in reader.fieldnames}
    required_cols = ["date", "type", "amount", "category"]
    missing = [col for col in required_cols if col not in normalized_headers]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"CSV missing required columns: {', '.join(missing)}. Required: date, type, amount, category.",
        )

    date_col = normalized_headers["date"]
    type_col = normalized_headers["type"]
    amount_col = normalized_headers["amount"]
    category_col = normalized_headers["category"]
    note_col = normalized_headers.get("note")
    currency_col = normalized_headers.get("currency")
    tags_col = normalized_headers.get("tags")
    recurring_col = normalized_headers.get("recurring")
    freq_col = normalized_headers.get("recurring_frequency")

    valid_docs: list[dict] = []
    errors: list[RowError] = []
    now = utcnow()

    for idx, row in enumerate(reader, start=1):
        raw_repr = ", ".join(f"{k}:{v}" for k, v in list(row.items())[:4])

        # 1. Type validation
        raw_type = (row.get(type_col) or "").strip().lower()
        if raw_type not in ("income", "expense"):
            errors.append(RowError(
                row=idx,
                raw_data=raw_repr,
                error=f"Invalid type '{raw_type}'. Must be 'income' or 'expense'."
            ))
            continue

        # 2. Amount validation
        raw_amount = (row.get(amount_col) or "").strip().replace("$", "").replace(",", "")
        try:
            amount = float(raw_amount)
            if amount <= 0:
                raise ValueError("Amount must be positive.")
        except Exception:
            errors.append(RowError(
                row=idx,
                raw_data=raw_repr,
                error=f"Invalid amount '{raw_amount}'. Must be a positive number."
            ))
            continue

        # 3. Category validation
        category = (row.get(category_col) or "").strip()
        if not category:
            errors.append(RowError(
                row=idx,
                raw_data=raw_repr,
                error="Category cannot be empty."
            ))
            continue

        # 4. Date validation
        raw_date = (row.get(date_col) or "").strip()
        parsed_date: datetime | None = None
        date_formats = [
            "%Y-%m-%d",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%SZ",
            "%Y-%m-%d %H:%M:%S",
            "%m/%d/%Y",
            "%d/%m/%Y",
            "%Y/%m/%d",
        ]
        for fmt in date_formats:
            try:
                parsed_date = datetime.strptime(raw_date, fmt)
                break
            except ValueError:
                continue

        if parsed_date is None:
            try:
                parsed_date = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
            except Exception:
                pass

        if parsed_date is None:
            errors.append(RowError(
                row=idx,
                raw_data=raw_repr,
                error=f"Invalid date '{raw_date}'. Supported: YYYY-MM-DD or ISO-8601."
            ))
            continue

        # Ensure timezone-aware UTC
        if parsed_date.tzinfo is None:
            parsed_date = parsed_date.replace(tzinfo=timezone.utc)

        # 5. Optional fields
        note = (row.get(note_col) or "").strip() if note_col else None
        currency = (row.get(currency_col) or "USD").strip().upper()[:3]
        if not currency:
            currency = "USD"

        raw_tags = row.get(tags_col) if tags_col else ""
        if raw_tags:
            tags = [t.strip() for t in re.split(r"[;,]", raw_tags) if t.strip()]
        else:
            tags = []

        raw_rec = (row.get(recurring_col) or "").strip().lower()
        recurring = raw_rec in ("true", "1", "yes", "y")

        raw_freq = (row.get(freq_col) or "").strip().lower() if freq_col else None
        freq = raw_freq if raw_freq in ("daily", "weekly", "monthly", "yearly") else None

        valid_docs.append({
            "user_id": str(user.id),
            "type": raw_type,
            "amount": amount,
            "currency": currency,
            "category": category,
            "note": note or None,
            "date": parsed_date,
            "tags": tags,
            "recurring": recurring,
            "recurring_frequency": freq,
            "created_at": now,
            "updated_at": now,
        })

    if valid_docs:
        await db.transactions.insert_many(valid_docs)

    return CsvImportReport(
        total_rows=len(valid_docs) + len(errors),
        imported_count=len(valid_docs),
        failed_count=len(errors),
        errors=errors,
    )


# ── CRUD Endpoints ────────────────────────────────────────────────────────────
@router.post("", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED, summary="Create a transaction")
async def create_transaction(
    body: TransactionCreate,
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Creates a new transaction for the authenticated user.
    """
    now = utcnow()
    doc = {
        "user_id": str(user.id),
        "type": body.type.value,
        "amount": round(body.amount, 2),
        "currency": body.currency,
        "category": body.category.strip(),
        "note": body.note.strip() if body.note else None,
        "date": body.date,
        "tags": body.tags,
        "recurring": body.recurring,
        "recurring_frequency": body.recurring_frequency.value if body.recurring_frequency else None,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.transactions.insert_one(doc)
    doc["_id"] = result.inserted_id

    return _doc_to_response(doc)


@router.get("", response_model=PaginatedTransactionsResponse, summary="List transactions with filters and pagination")
async def list_transactions(
    page: int = Query(default=1, ge=1, description="Page number (1-based)"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    start_date: Optional[datetime] = Query(default=None, description="Filter date >= start_date"),
    end_date: Optional[datetime] = Query(default=None, description="Filter date <= end_date"),
    category: Optional[str] = Query(default=None, description="Filter by category name"),
    type: Optional[TransactionType] = Query(default=None, description="Filter by type (income/expense)"),
    search: Optional[str] = Query(default=None, description="Text search on note or category"),
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Returns paginated transactions with optional date-range, category, type, and note text search filters.
    """
    query: dict = {"user_id": str(user.id)}

    if type:
        query["type"] = type.value

    if category:
        query["category"] = category

    if start_date or end_date:
        query["date"] = {}
        if start_date:
            query["date"]["$gte"] = start_date
        if end_date:
            query["date"]["$lte"] = end_date

    if search and search.strip():
        term = search.strip()
        query["$or"] = [
            {"note": {"$regex": re.escape(term), "$options": "i"}},
            {"category": {"$regex": re.escape(term), "$options": "i"}},
        ]

    total = await db.transactions.count_documents(query)
    pages = max(1, math.ceil(total / limit))
    skip = (page - 1) * limit

    cursor = db.transactions.find(query).sort("date", -1).skip(skip).limit(limit)
    items = [_doc_to_response(doc) async for doc in cursor]

    return PaginatedTransactionsResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        pages=pages,
    )


@router.get("/{id}", response_model=TransactionResponse, summary="Get single transaction by ID")
async def get_transaction(
    id: str,
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Retrieves a single transaction owned by the authenticated user.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format.",
        )

    doc = await db.transactions.find_one({"_id": ObjectId(id), "user_id": str(user.id)})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    return _doc_to_response(doc)


@router.put("/{id}", response_model=TransactionResponse, summary="Update an existing transaction")
async def update_transaction(
    id: str,
    body: TransactionUpdate,
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Updates a transaction owned by the authenticated user.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format.",
        )

    existing = await db.transactions.find_one({"_id": ObjectId(id), "user_id": str(user.id)})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    update_fields: dict = {"updated_at": utcnow()}
    if body.type is not None:
        update_fields["type"] = body.type.value
    if body.amount is not None:
        update_fields["amount"] = round(body.amount, 2)
    if body.currency is not None:
        update_fields["currency"] = body.currency
    if body.category is not None:
        update_fields["category"] = body.category.strip()
    if body.note is not None:
        update_fields["note"] = body.note.strip() if body.note else None
    if body.date is not None:
        update_fields["date"] = body.date
    if body.tags is not None:
        update_fields["tags"] = body.tags
    if body.recurring is not None:
        update_fields["recurring"] = body.recurring
    if body.recurring_frequency is not None:
        update_fields["recurring_frequency"] = (
            body.recurring_frequency.value if body.recurring_frequency else None
        )

    await db.transactions.update_one(
        {"_id": ObjectId(id), "user_id": str(user.id)},
        {"$set": update_fields}
    )

    updated_doc = await db.transactions.find_one({"_id": ObjectId(id)})
    return _doc_to_response(updated_doc)


@router.delete("/{id}", summary="Delete a transaction")
async def delete_transaction(
    id: str,
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Deletes a transaction owned by the authenticated user.
    """
    if not ObjectId.is_valid(id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID format.",
        )

    result = await db.transactions.delete_one({"_id": ObjectId(id), "user_id": str(user.id)})
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found.",
        )

    return {"message": "Transaction deleted successfully.", "id": id}
