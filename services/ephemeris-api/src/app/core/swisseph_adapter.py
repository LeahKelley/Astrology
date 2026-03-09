"""
Swiss Ephemeris adapter layer.

This module will wrap the pyswisseph library so that the rest of the
application does not depend directly on the Swiss Ephemeris API.
"""

from typing import Dict, List


class SwissEphemerisAdapter:
    """
    Adapter responsible for interacting with Swiss Ephemeris.
    """

    def compute_bodies(self, jd: float) -> List[Dict]:
        """
        Compute planetary body positions.

        Placeholder implementation for M2.
        """
        raise NotImplementedError("Swiss Ephemeris integration will be implemented in M3")


    def compute_houses(self, jd: float, latitude: float, longitude: float) -> Dict:
        """
        Compute house cusps and angles.

        Placeholder implementation for M2.
        """
        raise NotImplementedError("Swiss Ephemeris integration will be implemented in M3")