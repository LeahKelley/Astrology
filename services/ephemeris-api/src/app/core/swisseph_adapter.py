"""
Swiss Ephemeris adapter layer.
This module will wrap the pyswisseph library so that the rest of the
application does not depend directly on the Swiss Ephemeris API.
"""

from pathlib import Path
from typing import Dict, List

import swisseph as swe

BODY_MAP = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN,
    "Uranus": swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO,
}

HOUSE_SYSTEM_MAP = {
    "placidus": b"P",
}

class SwissEphemerisAdapter:
    """
    Adapter responsible for interacting with Swiss Ephemeris.
    """

    def __init__(self) -> None:
        # services/ephemeris-api/src/app/core/swisseph_adapter.py
        # -> go up to services/ephemeris-api, then into ephe/
        ephe_path = Path(__file__).resolve().parents[3] / "ephe"
        swe.set_ephe_path(str(ephe_path))

    def compute_bodies(self, jd: float) -> List[Dict]:
        """
        Compute planetary body positions from a Julian day in UT.
        """
        flags = swe.FLG_SWIEPH | swe.FLG_SPEED
        bodies: List[Dict] = []

        for name, body_id in BODY_MAP.items():
            xx, retflags = swe.calc_ut(jd, body_id, flags)

            longitude = swe.degnorm(xx[0])
            speed = xx[3]

            bodies.append(
                {
                    "name": name,
                    "longitude": longitude,
                    "speed": speed,
                    "retrograde": speed < 0,
                }
            )

        return bodies

    def compute_houses(
        self,
        jd: float,
        latitude: float,
        longitude: float,
        house_system: str = "placidus",
    ) -> Dict:
        """
        Compute house cusps and key angles from a Julian day in UT.
        """
        hsys = HOUSE_SYSTEM_MAP[house_system]
        cusps, ascmc = swe.houses_ex(jd, latitude, longitude, hsys)

        houses = [swe.degnorm(cusp) for cusp in cusps[:12]]
        asc = swe.degnorm(ascmc[0])
        mc = swe.degnorm(ascmc[1])

        return {
            "houses": houses,
            "asc": asc,
            "mc": mc,
        }