"""
Service layer for natal chart generation.
"""

from __future__ import annotations
from uuid import uuid4
from src.app.core.models import NatalChartRequest, NatalChartResponse, Meta, BodyPosition, Aspect, Angles


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