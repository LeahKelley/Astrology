"""FastAPI app entrypoint 
ASSIGNED TO SHENG

App entrypoint + create_app()

Goal: Set up the basic FastAPI app structure with a few simple routes to verify that everything is wired up correctly.
- Server boots cleanly
- /health works
- /chart/natal accepts the request body and returns MOCK JSON (no Swiss Ephemeris yet)

Notes:
- Keep Swiss Ephemeris behind app.core.swisseph_adapter in later milestones (M3).
- Do NOT implement business logic here; route handlers should delegate to services.
"""

from fastapi import FastAPI
from src.app.api.routes import api_router
from src.app.core.logging import configure_logging


def create_app() -> FastAPI:
    """Create and configure the FastAPI app.
    PSEUDOCODE:
    1) configure logging
    2) instantiate FastAPI(title, version)
    3) include API router
    4) add exception handlers (later)
    5) return app
    """

