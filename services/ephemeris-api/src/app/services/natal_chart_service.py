"""
Service layer for natal chart generation.
"""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo
from uuid import uuid4

import swisseph as swe

from src.app.core.models import ( 
    NatalChartRequest, 
    NatalChartResponse, 
    Meta, 
    BodyPosition, 
    Aspect, 
    Angles,
)    


class NatalChartService:
    def generate_mock(self, req: NatalChartRequest) -> NatalChartResponse:
        return NatalChartResponse(
            meta=Meta(
                house_system=req.house_system,
                timezone=req.timezone,
                request_id=str(uuid4()),
            ),
            angles=Angles(
                asc=123.45,
                mc=210.12,
            ),
            houses=[0.0, 30.0, 60.0, 90.0, 120.0, 150.0, 180.0, 210.0, 240.0, 270.0, 300.0, 330.0],
            bodies=[
                BodyPosition(
                    name="Sun",
                    longitude=301.23,
                    sign="Aquarius",
                    degree_in_sign=1.23,
                    speed=0.98,
                    retrograde=False,
                ),
                BodyPosition(
                    name="Moon",
                    longitude=12.34,
                    sign="Aries",
                    degree_in_sign=12.34,
                    speed=13.20,
                    retrograde=False,
                ),
            ],
            aspects=[
                Aspect(
                    a="Sun",
                    b="Moon",
                    type="trine",
                    orb=1.2,
                )
            ],
        )
    
    def _to_julian_day_ut(self, req: NatalChartRequest) -> float:
        local_dt = datetime.fromisoformat(f"{req.date}T{req.time}").replace(
            tzinfo=ZoneInfo(req.timezone)
        )

        utc_dt = local_dt.astimezone(ZoneInfo("UTC"))

        hour_decimal = (
            utc_dt.hour
            + utc_dt.minute / 60.0
            + utc_dt.second / 3600.0
            + utc_dt.microsecond / 3_600_000_000.0
        )

        jd_ut = swe.julday(
            utc_dt.year,
            utc_dt.month,
            utc_dt.day,
            hour_decimal,
            swe.GREG_CAL,
        )

        return jd_ut