"""
FastAPI application factory.

- CORS configured for SPA origin(s) with credentials (cookies).
- DB connection opened/closed via lifespan context manager.
- All API routes mounted under /api prefix.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import connect_db, close_db
from app.routes.auth import router as auth_router
from app.routes.transactions import router as transactions_router
from app.routes.categories import router as categories_router
from app.routes.analytics import router as analytics_router
from app.routes.budgets import router as budgets_router


settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup → yield → shutdown lifecycle hook."""
    await connect_db()
    yield
    await close_db()


app = FastAPI(
    title="Finlytics API",
    description="Personal finance and expense management REST API.",
    version="0.3.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ── CORS — must be registered before any router ──────────────────────────────
# allow_credentials=True is required for the browser to send httpOnly cookies.
# Must use explicit origins (not "*") when credentials are enabled.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router, prefix="/api")
app.include_router(transactions_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(budgets_router, prefix="/api")




# ── Utility routes ────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"], summary="Liveness probe")
async def health_check():
    return {"status": "ok", "version": "0.2.0"}
