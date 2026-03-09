"""FastAPI app entrypoint 
ASSIGNED TO Leah
"""

from fastapi import FastAPI
from src.app.api.routes import api_router
from src.app.core.logging import configure_logging


def create_app() -> FastAPI:
    """Factory function to create and configure the FastAPI app."""
    configure_logging()  # Set up logging configuration
    app = FastAPI(title="Ephemeris API", version="0.1.0")
    app.include_router(api_router, prefix="/api/v1")  # Include API routes
    return app

app = create_app()  # Create the FastAPI app instance
