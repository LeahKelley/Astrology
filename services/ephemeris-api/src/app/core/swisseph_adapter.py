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
        Compute planetary body positions.
        Real Swiss Ephemeris calculations will be added in the next step.
        """
        raise NotImplementedError("Body calculations will be implemented next")

    def compute_houses(
        self,
        jd: float,
        latitude: float,
        longitude: float,
        house_system: str = "placidus",
    ) -> Dict:
        """
        Compute house cusps and angles.
        Real Swiss Ephemeris calculations will be added in the next step.
        """
        raise NotImplementedError("House calculations will be implemented next")