from fastapi import APIRouter
from src.app.core.models import NatalChartRequest, NatalChartResponse
from src.app.services.natal_chart_service import NatalChartService

router = APIRouter()

@router.post("/chart", response_model=NatalChartResponse)
def generate_chart(request: NatalChartRequest):
    """
    Generate natal chart data.
    """
    service = NatalChartService()
    result = service.generate_mock(request)

    return result