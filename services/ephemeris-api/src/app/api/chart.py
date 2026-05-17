# pull in the router class from FastAPI
from fastapi import APIRouter
# import the request/response models so FastAPI knows what shape data to expect and return
from src.app.core.models import NatalChartRequest, NatalChartResponse
# import the service that does all the actual chart calculation heavy lifting
from src.app.services.natal_chart_service import NatalChartService

# create this module's router, gets registered in routes.py
router = APIRouter()

# POST endpoint for generating a natal chart, FastAPI uses response_model to validate and serialize the output
@router.post("/chart/natal", response_model=NatalChartResponse)
def generate_chart(request: NatalChartRequest):
    # spin up a fresh service instance for this request
    service = NatalChartService()
    # hand the request off to the service and get back the computed chart data
    result = service.generate(request)
    # send the result back to the caller
    return result