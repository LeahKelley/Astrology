
from fastapi import FastAPI # FastAPI is the web framework powering this service
from fastapi.middleware.cors import CORSMiddleware # CORSMiddleware lets our frontend (running on a different port) talk to this API
from src.app.api.routes import api_router # the combined router that has all our endpoints wired up
from src.app.core.logging import configure_logging # our custom logging setup function

# using a factory function here so the app creation logic is self-contained and testable
def create_app() -> FastAPI:
    # set up logging first so any startup errors get captured
    configure_logging()
    # create the FastAPI instance with a User-friendly name and version
    app = FastAPI(title="Ephemeris API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        # allow requests from both the Next.js dev server and Vite dev server ports
        allow_origins=["http://localhost:3000", "http://localhost:5173"],
        # allow all HTTP methods (GET, POST, etc.)
        allow_methods=["*"],
        # allow all headers 
        allow_headers=["*"],
    )

    # mount all our API routes under the /api/v1 prefix
    app.include_router(api_router, prefix="/api/v1")
    return app

# create the app instance, uvicorn picks this up when it starts the server
app = create_app()
