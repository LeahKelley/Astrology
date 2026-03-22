"""
Service layer for natal chart generation.
"""

from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo
from uuid import uuid4

import swisseph as swe

from src.app.core.swisseph_adapter import SwissEphemerisAdapter

from src.app.core.models import (
    NatalChartRequest,
    NatalChartResponse,
    Meta,
    BodyPosition,
    Aspect,
    Angles,
)

SIGNS = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]

ASPECT_TARGETS = {
    "conjunction": (0.0, 8.0),
    "opposition": (180.0, 8.0),
    "square": (90.0, 6.0),
    "trine": (120.0, 6.0),
    "sextile": (60.0, 4.0),
}


class NatalChartService:

    def __init__(self) -> None:
        self.adapter = SwissEphemerisAdapter()

    def generate(self, req: NatalChartRequest) -> NatalChartResponse:
        jd_ut = self._to_julian_day_ut(req)

        raw_bodies = self.adapter.compute_bodies(jd_ut)
        raw_houses = self.adapter.compute_houses(
            jd=jd_ut,
            latitude=req.latitude,
            longitude=req.longitude,
            house_system=req.house_system,
        )

        bodies = [self._to_body_position(item) for item in raw_bodies]
        aspects = self._compute_aspects(bodies)

        return NatalChartResponse(
            meta=Meta(
                house_system=req.house_system,
                timezone=req.timezone,
                request_id=str(uuid4()),
            ),
            angles=Angles(
                asc=raw_houses["asc"],
                mc=raw_houses["mc"],
            ),
            houses=raw_houses["houses"],
            bodies=bodies,
            aspects=aspects,
        )

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

    def _to_body_position(self, item: dict) -> BodyPosition:
        longitude = item["longitude"]
        sign_index = int(longitude // 30)
        sign = SIGNS[sign_index]
        degree_in_sign = longitude % 30

        return BodyPosition(
            name=item["name"],
            longitude=longitude,
            sign=sign,
            degree_in_sign=degree_in_sign,
            speed=item["speed"],
            retrograde=item["retrograde"],
        )

    def _compute_aspects(self, bodies: list[BodyPosition]) -> list[Aspect]:
        aspects: list[Aspect] = []

        for i in range(len(bodies)):
            for j in range(i + 1, len(bodies)):
                a = bodies[i]
                b = bodies[j]

                diff = abs(a.longitude - b.longitude)
                if diff > 180:
                    diff = 360 - diff

                for aspect_name, (target_angle, max_orb) in ASPECT_TARGETS.items():
                    orb = abs(diff - target_angle)

                    if orb <= max_orb:
                        aspects.append(
                            Aspect(
                                a=a.name,
                                b=b.name,
                                type=aspect_name,
                                orb=round(orb, 4),
                            )
                        )
                        break

        return aspects