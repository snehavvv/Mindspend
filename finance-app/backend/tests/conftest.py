"""
Pytest fixtures for auth tests.

Strategy:
  - Spin up a real Motor client against a dedicated *test* database.
  - Override the `get_db` FastAPI dependency so routes talk to that DB.
  - Use httpx AsyncClient with ASGITransport (no real HTTP server needed).
  - Wipe the users collection after every test function for isolation.
  - Drop the entire test database at the end of the session.
"""
import os
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient

from app.database import get_db
from app.main import app

_TEST_MONGO_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
_TEST_DB_NAME = "finlytics_test"


@pytest_asyncio.fixture(scope="session")
async def test_db():
    """Session-scoped Motor database pointing at finlytics_test or mongomock."""
    try:
        client = AsyncIOMotorClient(_TEST_MONGO_URI, serverSelectionTimeoutMS=1500)
        await client.admin.command("ping")
        db = client[_TEST_DB_NAME]
        yield db
        await client.drop_database(_TEST_DB_NAME)
        client.close()
    except Exception:
        import mongomock_motor
        client = mongomock_motor.AsyncMongoMockClient()
        db = client[_TEST_DB_NAME]
        yield db
        client.close()


@pytest_asyncio.fixture
async def client(test_db):
    """
    Function-scoped httpx AsyncClient wired to the FastAPI app.
    Overrides get_db so every request hits the test database.
    Cleans collections after each test.
    """
    app.dependency_overrides[get_db] = lambda: test_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()
    await test_db.users.delete_many({})
    await test_db.transactions.delete_many({})
    await test_db.categories.delete_many({})
    await test_db.budgets.delete_many({})



