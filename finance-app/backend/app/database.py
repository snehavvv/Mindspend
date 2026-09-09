"""
MongoDB connection lifecycle via Motor (async driver).
`get_db` is the FastAPI dependency injected into routes.
"""
from __future__ import annotations

import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import pymongo

from app.config import get_settings

logger = logging.getLogger("finlytics.database")
settings = get_settings()

_client: AsyncIOMotorClient | None = None
_database: AsyncIOMotorDatabase | None = None


async def connect_db() -> None:
    """Open the Motor connection pool and create required indexes."""
    global _client, _database

    try:
        real_client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        await real_client.admin.command("ping")
        _client = real_client
        _database = _client[settings.MONGODB_DB_NAME]
        logger.info(f"Connected to MongoDB at {settings.MONGODB_URI}")
    except Exception as exc:
        logger.warning(
            f"Could not connect to MongoDB at {settings.MONGODB_URI} ({exc}). "
            "Falling back to in-memory mongomock for development/testing."
        )
        import mongomock_motor
        _client = mongomock_motor.AsyncMongoMockClient()
        _database = _client[settings.MONGODB_DB_NAME]

    # Create indexes for Users
    try:
        await _database.users.create_index("email", unique=True)
    except Exception:
        pass

    # Create indexes for Transactions
    try:
        await _database.transactions.create_index([("user_id", pymongo.ASCENDING), ("date", pymongo.DESCENDING)])
        await _database.transactions.create_index([("user_id", pymongo.ASCENDING), ("category", pymongo.ASCENDING)])
        await _database.transactions.create_index([("user_id", pymongo.ASCENDING), ("type", pymongo.ASCENDING)])
        await _database.transactions.create_index([("note", pymongo.TEXT)])
    except Exception:
        pass

    # Create indexes for Categories
    try:
        await _database.categories.create_index(
            [("user_id", pymongo.ASCENDING), ("name", pymongo.ASCENDING)],
            unique=True
        )
    except Exception:
        pass

    # Create indexes for Budgets
    try:
        await _database.budgets.create_index(
            [("user_id", pymongo.ASCENDING), ("month", pymongo.ASCENDING), ("category", pymongo.ASCENDING)],
            unique=True
        )
    except Exception:
        pass



async def close_db() -> None:
    """Close the Motor connection pool gracefully on shutdown."""
    global _client, _database
    if _client is not None:
        _client.close()
        _client = None
        _database = None


def get_db() -> AsyncIOMotorDatabase:
    """
    FastAPI dependency — returns the active database handle.
    Raises RuntimeError if called before connect_db() has run.
    """
    if _database is None:
        raise RuntimeError("Database not initialised. Did connect_db() run?")
    return _database

