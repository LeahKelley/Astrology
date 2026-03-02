"""Chart endpoints.
ASSIGNED TO SHENG
POST /chart/natal
Do this now:  /chart/natal returns a MOCK response that matches the response schema.
Later: replace the mock with real computations via Swiss Ephemeris adapter.
"""

from fastapi import APIRouter
from app.core.models import NatalChartRequest, NatalChartResponse
from app.services.natal_chart_service import NatalChartService


    """Generate natal chart data.

    PSEUDOCODE:
    1) Validate request (Pydantic already does basic validation)
    2) Delegate to service layer
    3) Return NatalChartResponse

    service returns mock data.
    """

