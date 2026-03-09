from fastapi import APIRouter
from app.core.models import NatalChartRequest, NatalChartResponse
from app.services.natal_chart_service import NatalChartService

router = APIRouter()

@router.post("/chart", response_model=NatalChartResponse)
def generate_chart(request: NatalChartRequest):
    """
    Generate natal chart data.
    """
    service = NatalChartService()
    result = service.generate_chart(request)

    return result