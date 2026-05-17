# Path lets us build filesystem paths in a cross-platform way
from pathlib import Path
# type hints for the data structures we return
from typing import Dict, List

# the pyswisseph library, a Python binding to the Swiss Ephemeris C library used for astronomical calculations
import swisseph as swe

 # map from planet names to the integer constants swisseph expects
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

# swisseph identifies house systems by single-byte codes, "P" = Placidus
HOUSE_SYSTEM_MAP = {
    "placidus": b"P",
}

# this class wraps the raw swisseph library calls so the rest of the app
# doesn't have to know about swisseph's quirky API directly
class SwissEphemerisAdapter:

    def __init__(self) -> None:
        # resolve the path to the ephemeris data files relative to this file's location
        # this file is 4 levels deep: services/ephemeris-api/src/app/core/swisseph_adapter.py
        # so parents[3] gets us to services/ephemeris-api, then we go into the ephe/ folder
        ephe_path = Path(__file__).resolve().parents[3] / "ephe"
        # tell swisseph where to find its data files before we make any calculation calls
        swe.set_ephe_path(str(ephe_path))

    # takes a Julian Day Number (a continuous count of days since noon Jan 1, 4713 BC)
    # and returns the position of every planet we care about
    def compute_bodies(self, jd: float) -> List[Dict]:
        # FLG_SWIEPH = use the Swiss Ephemeris files (more accurate than built-in), FLG_SPEED = also return velocity
        flags = swe.FLG_SWIEPH | swe.FLG_SPEED
        # will hold one dict per planet
        bodies: List[Dict] = []

        # iterate over every planet in our map and ask swisseph to calculate its position
        for name, body_id in BODY_MAP.items():
            # calc_ut returns a tuple: xx has position/velocity data, retflags tells us if anything went wrong
            xx, retflags = swe.calc_ut(jd, body_id, flags)

            # xx[0] is the raw ecliptic longitude, degnorm normalizes it to 0-360
            longitude = swe.degnorm(xx[0])
            # xx[3] is the speed in degrees/day, negative means retrograde motion
            speed = xx[3]

            bodies.append(
                {
                    "name": name,
                    "longitude": longitude,
                    "speed": speed,
                    # retrograde is true whenever the planet's apparent motion is backward
                    "retrograde": speed < 0,
                }
            )

        return bodies

    # calculates where the 12 house cusps fall, plus the ascendant and midheaven
    def compute_houses(
        self,
        jd: float,
        latitude: float,
        longitude: float,
        house_system: str = "placidus",
    ) -> Dict:
        # look up the single-byte code swisseph wants for this house system
        hsys = HOUSE_SYSTEM_MAP[house_system]
        # houses_ex returns: cusps = 13 cusp values (index 0 unused), ascmc = angles array
        cusps, ascmc = swe.houses_ex(jd, latitude, longitude, hsys)

        # take only the 12 real house cusps (cusps[0] is a placeholder), normalize each to 0-360
        houses = [swe.degnorm(cusp) for cusp in cusps[:12]]
        # ascmc[0] is the ascendant, the degree rising on the eastern horizon at birth
        asc = swe.degnorm(ascmc[0])
        # ascmc[1] is the midheaven (MC), the degree at the top of the chart
        mc = swe.degnorm(ascmc[1])

        return {
            "houses": houses,
            "asc": asc,
            "mc": mc,
        }