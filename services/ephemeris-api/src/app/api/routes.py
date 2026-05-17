# pull in FastAPI's router class so we can create a top-level router
from fastapi import APIRouter
# import the individual routers from each endpoint module, aliased for no clashing
from src.app.api.health import router as health_router
from src.app.api.chart import router as chart_router

# this is the main API router that collects all sub-routers in one place
api_router = APIRouter()
# register the health check endpoints under api_router
api_router.include_router(health_router)
# register the natal chart endpoints under api_router
api_router.include_router(chart_router)