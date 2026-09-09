"""
Finlytics API — FastAPI application root.
Stub for chunk 1 (design system phase). Full implementation in chunk 2.
"""
from fastapi import FastAPI

app = FastAPI(
    title="Finlytics API",
    description="Personal finance and expense management backend.",
    version="0.1.0",
)


@app.get("/health", tags=["meta"])
async def health_check():
    """Liveness probe — returns 200 when service is up."""
    return {"status": "ok", "version": "0.1.0"}
