"""
Category API routes: GET default + custom categories, and POST new custom category.
"""
from __future__ import annotations

import re
from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId

from app.auth.dependencies import get_current_user
from app.database import get_db
from app.models.base import utcnow
from app.models.category import (
    DEFAULT_CATEGORIES,
    CategoryCreate,
    CategoryResponse,
)
from app.models.user import UserInDB

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse], summary="List all accessible categories")
async def list_categories(
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Returns default system categories combined with custom categories
    created by the authenticated user.
    """
    results: list[CategoryResponse] = []

    # 1. Add system defaults
    for i, cat in enumerate(DEFAULT_CATEGORIES):
        slug = re.sub(r"[^a-z0-9]+", "-", cat["name"].lower()).strip("-")
        results.append(
            CategoryResponse(
                id=f"default-{slug}-{i}",
                name=cat["name"],
                type=cat["type"],
                icon=cat["icon"],
                color=cat["color"],
                is_default=True,
            )
        )

    # 2. Fetch user's custom categories
    cursor = db.categories.find({"user_id": str(user.id)}).sort("name", 1)
    async for doc in cursor:
        results.append(
            CategoryResponse(
                id=str(doc["_id"]),
                name=doc["name"],
                type=doc["type"],
                icon=doc.get("icon", "tag"),
                color=doc.get("color", "#D97706"),
                is_default=False,
            )
        )

    return results


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, summary="Create a custom category")
async def create_category(
    body: CategoryCreate,
    user: UserInDB = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    """
    Creates a new custom category for the authenticated user.
    Prevents duplicate category names.
    """
    # Check against system defaults
    if any(c["name"].lower() == body.name.lower() for c in DEFAULT_CATEGORIES):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A default category named '{body.name}' already exists."
        )

    # Check against existing user categories
    existing = await db.categories.find_one({
        "user_id": str(user.id),
        "name": {"$regex": f"^{re.escape(body.name)}$", "$options": "i"}
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category '{body.name}' already exists."
        )

    now = utcnow()
    doc = {
        "user_id": str(user.id),
        "name": body.name.strip(),
        "type": body.type.value,
        "icon": body.icon or "tag",
        "color": body.color or "#D97706",
        "is_default": False,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.categories.insert_one(doc)
    doc["_id"] = result.inserted_id

    return CategoryResponse(
        id=str(doc["_id"]),
        name=doc["name"],
        type=doc["type"],
        icon=doc["icon"],
        color=doc["color"],
        is_default=False,
    )
