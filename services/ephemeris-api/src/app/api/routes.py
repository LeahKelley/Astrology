"""Top-level API router.
ASSIGNED TO SHENG

"""

from fastapi import APIRouter
from src.app.api.health import router as health_router
from src.app.api.chart import router as chart_router

# PSEUDOCODE:
# - Mount routers with prefixes and tags

