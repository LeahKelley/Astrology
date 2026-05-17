# allows forward references in type hints, useful for annotating methods that return the class they're in
from __future__ import annotations
from datetime import datetime # datetime for parsing and converting the birth date/time
from zoneinfo import ZoneInfo # ZoneInfo lets us work with real IANA timezone names like "America/New_York"
from uuid import uuid4 # uuid4 generates a unique ID for each chart request, useful for debugging
import swisseph as swe # swisseph for the Julian Day conversion at the end of the time conversion step

from src.app.core.swisseph_adapter import SwissEphemerisAdapter # our thin wrapper around the raw swisseph API

# import all the pydantic models we'll need to build the response
from src.app.core.models import (
    NatalChartRequest,
    NatalChartResponse,
    Meta,
    BodyPosition,
    Aspect,
    Angles,
)

# the 12 zodiac signs in order, starting at 0 degrees Aries
# each sign occupies exactly 30 degrees of the 360-degree ecliptic
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

# the five major aspects, each with its exact angle and the maximum orb (tolerance) allowed
# e.g. a "trine" is exactly 120 degrees, but we allow up to 6 degrees off from exact
ASPECT_TARGETS = {
    "conjunction": (0.0, 8.0),
    "opposition": (180.0, 8.0),
    "square": (90.0, 6.0),
    "trine": (120.0, 6.0),
    "sextile": (60.0, 4.0),
}


# this service is the main orchestrator that ties together all the calculation steps
# to turn a birth date/time/location into a complete natal chart
class NatalChartService:

    def __init__(self) -> None:
        # create the swisseph adapter once per service instance
        self.adapter = SwissEphemerisAdapter()

    # the main entry point, takes a request and returns a fully built chart response
    def generate(self, req: NatalChartRequest) -> NatalChartResponse:
        # first convert the local birth time to a Julian Day Number in Universal Time
        jd_ut = self._to_julian_day_ut(req)

        # ask swisseph for all 10 planetary positions at that moment
        raw_bodies = self.adapter.compute_bodies(jd_ut)
        # ask swisseph for the 12 house cusps and chart angles, which also requires the birth location
        raw_houses = self.adapter.compute_houses(
            jd=jd_ut,
            latitude=req.latitude,
            longitude=req.longitude,
            house_system=req.house_system,
        )

        # enrich each raw planet dict into a typed BodyPosition with sign, degree, and house info
        bodies = [self._to_body_position(item, raw_houses["houses"]) for item in raw_bodies]
        # find all angular relationships between every pair of planets
        aspects = self._compute_aspects(bodies)

        # assemble the final response object
        return NatalChartResponse(
            meta=Meta(
                house_system=req.house_system,
                timezone=req.timezone,
                # generate a fresh unique ID for this specific chart calculation
                request_id=str(uuid4()),
            ),
            angles=Angles(
                # ascendant = the degree rising on the eastern horizon at the birth moment
                asc=raw_houses["asc"],
                # midheaven = the degree at the very top of the chart
                mc=raw_houses["mc"],
            ),
            houses=raw_houses["houses"],
            bodies=bodies,
            aspects=aspects,
        )

    # a hardcoded fake chart used for testing the UI without needing the real swisseph calculation
    def generate_mock(self, req: NatalChartRequest) -> NatalChartResponse:
        return NatalChartResponse(
            meta=Meta(
                house_system=req.house_system,
                timezone=req.timezone,
                request_id=str(uuid4()),
            ),
            angles=Angles(
                # made-up ascendant and midheaven values just for testing
                asc=123.45,
                mc=210.12,
            ),
            # evenly spaced house cusps every 30 degrees, unrealistic but valid for UI testing
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

    # converts the user's local birth time (with timezone) into a Julian Day Number in UTC
    # swisseph needs time as a continuous decimal number, not a calendar date
    def _to_julian_day_ut(self, req: NatalChartRequest) -> float:
        #combine the date and time strings into a naive datetime, then attach the user's timezone
        local_dt = datetime.fromisoformat(f"{req.date}T{req.time}").replace(
            tzinfo=ZoneInfo(req.timezone)
        )

        # convert to UTC so swisseph gets the right moment regardless of where the person was born
        utc_dt = local_dt.astimezone(ZoneInfo("UTC"))

        # swisseph wants time as a single decimal hour (e.g. 14:30:00 = 14.5)
        # include microseconds so we don't lose precision
        hour_decimal = (
            utc_dt.hour
            + utc_dt.minute / 60.0
            + utc_dt.second / 3600.0
            + utc_dt.microsecond / 3_600_000_000.0
        )

        # convert the UTC date + decimal hour into a Julian Day Number using the Gregorian calendar
        jd_ut = swe.julday(
            utc_dt.year,
            utc_dt.month,
            utc_dt.day,
            hour_decimal,
            swe.GREG_CAL,
        )

        return jd_ut

    # determines which house (1-12) a planet falls in based on its ecliptic longitude and the list of house cusp longitudes
    def _assign_house(self, longitude: float, cusps: list[float]) -> int:
        for i in range(12):
            start = cusps[i]
            # the next cusp wraps back to cusp[0] after the last house
            end = cusps[(i + 1) % 12]
            if start <= end:
                # normal case: the house doesn't cross the 0/360 boundary
                if start <= longitude < end:
                    return i + 1
            else:
                # this house wraps around the 0/360 degree seam (e.g. from 350 to 10)
                if longitude >= start or longitude < end:
                    return i + 1
        # shouldn't happen with valid input, but return house 1 as a safe default
        return 1

    # converts a raw planet dict from swisseph into a fully typed BodyPosition model
    def _to_body_position(self, item: dict, cusps: list[float]) -> BodyPosition:
        longitude = item["longitude"]
        # each sign is 30 degrees wide, so integer-dividing by 30 gives us the sign index (0-11)
        sign_index = int(longitude // 30)
        sign = SIGNS[sign_index]
        # the remainder tells us how many degrees into that sign the planet is (0-30)
        degree_in_sign = longitude % 30

        return BodyPosition(
            name=item["name"],
            longitude=longitude,
            sign=sign,
            degree_in_sign=degree_in_sign,
            speed=item["speed"],
            retrograde=item["retrograde"],
            # figure out which house this longitude falls in
            house=self._assign_house(longitude, cusps),
        )

    # checks every unique pair of planets and records any aspect they form
    def _compute_aspects(self, bodies: list[BodyPosition]) -> list[Aspect]:
        aspects: list[Aspect] = []

        # use nested loops to get every unique pair without repeating (a,b) and (b,a)
        for i in range(len(bodies)):
            for j in range(i + 1, len(bodies)):
                a = bodies[i]
                b = bodies[j]

                # get the angular distance between the two planets
                diff = abs(a.longitude - b.longitude)
                # if the raw diff is over 180, the short arc is actually on the other side
                if diff > 180:
                    diff = 360 - diff

                # check if this angle matches any of our known aspects within its orb
                for aspect_name, (target_angle, max_orb) in ASPECT_TARGETS.items():
                    # how far off from the exact aspect angle are we?
                    orb = abs(diff - target_angle)

                    if orb <= max_orb:
                        aspects.append(
                            Aspect(
                                a=a.name,
                                b=b.name,
                                type=aspect_name,
                                # round to 4 decimal places to keep the response tidy
                                orb=round(orb, 4),
                            )
                        )
                        # once we've matched one aspect for this pair, stop checking more
                        # a planet pair can only form one aspect at a time
                        break

        return aspects