"""
AWS Lambda entrypoint with Mangum ASGI adapter for Finlytics FastAPI backend.
"""
from mangum import Mangum
from app.main import app

handler = Mangum(app, lifespan="off")
