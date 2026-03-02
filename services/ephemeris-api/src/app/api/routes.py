"""Top-level API router.
ASSIGNED TO SHENG

"""

from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.chart import router as chart_router

# PSEUDOCODE:
# - Mount routers with prefixes and tags

