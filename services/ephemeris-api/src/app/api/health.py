# grab the routing tools we need from FastAPI
from fastapi import APIRouter

# create a router instance, this is what we'll attach our endpoints to
router = APIRouter()

# a simple GET endpoint at /health, useful for load balancers and monitoring tools
# to know if the service is alive and accepting requests
@router.get("/health")
def health_check():
    # just let's user know the service is running, no DB calls or logic needed
    return {"status": "ok"}