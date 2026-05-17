# BaseModel is the base class for all our data shapes, Field lets us add validation and descriptions
from pydantic import BaseModel, Field
# Literal locks a field to a specific set of allowed string values, List is for typed lists
from typing import Literal, List
# uuid4 is imported but not currently used, probably will be useful for generating unique request IDs in the future, kept as a placeholder
from uuid import uuid4

# right now we only support placidus, but using Literal makes it easy to add more later
HouseSystem = Literal["placidus"]

# the shape of the incoming request body when asking for a natal chart
class NatalChartRequest(BaseModel):
    # birth date in YYYY-MM-DD format
    date: str = Field(..., description="YYYY-MM-DD")
    # birth time in 24-hour HH:MM format
    time: str = Field(..., description="HH:MM (24-hour)")
    # IANA timezone string so we can convert local birth time to UTC for the calculation
    timezone: str = Field(..., description="IANA timezone, e.g. America/New_York")
    # birth latitude, clamped to valid geographic range
    latitude: float = Field(..., ge=-90, le=90)
    # birth longitude, clamped to valid geographic range
    longitude: float = Field(..., ge=-180, le=180)
    # which house system to use, defaults to placidus
    house_system: HouseSystem = "placidus"

# the five major aspects used in traditional astrology
AspectType = Literal["conjunction", "opposition", "square", "trine", "sextile"]

# the ten classical planets included in a natal chart
BodyName = Literal[
    "Sun", "Moon", "Mercury", "Venus", "Mars",
    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"
]

# all twelve zodiac signs
SignName = Literal[
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

# metadata that gets echoed back in the response so the caller knows what settings were used
class Meta(BaseModel):
    # which house system was used for this chart
    house_system: HouseSystem
    # the timezone the birth time was interpreted in
    timezone: str
    # unique identifier for this request, useful for debugging
    request_id: str

# the two major chart angles: ascendant (rising) and midheaven
class Angles(BaseModel):
    # ascendant, the degree of the zodiac rising on the eastern horizon at birth
    asc: float = Field(..., ge=0, lt=360)
    # midheaven (MC), the degree at the top of the chart, representing career and public life
    mc: float = Field(..., ge=0, lt=360)

# the position of a single planet in the chart
class BodyPosition(BaseModel):
    # which planet this is
    name: BodyName
    # absolute ecliptic longitude, 0-360 degrees around the zodiac
    longitude: float = Field(..., ge=0, lt=360)
    # which zodiac sign the planet falls in
    sign: SignName
    # how many degrees into that sign the planet is, always 0-30
    degree_in_sign: float = Field(..., ge=0, lt=30)
    # how fast the planet is moving in degrees per day
    speed: float
    # true if the planet appears to be moving backward from Earth's perspective
    retrograde: bool
    # which house (1-12) the planet occupies, None if house calculation wasn't run
    house: int | None = Field(default=None, ge=1, le=12)

# a relationship between two planets, defined by the angle between them
class Aspect(BaseModel):
    # the first planet in the pair
    a: BodyName
    # the second planet in the pair
    b: BodyName
    # what kind of aspect it is (conjunction, trine, etc.)
    type: AspectType
    # how many degrees off from the exact angle the aspect is, smaller = tighter
    orb: float = Field(..., ge=0)

# the full response object returned after chart calculation
class NatalChartResponse(BaseModel):
    # echo back the settings used for this chart
    meta: Meta
    # the ascendant and midheaven degrees
    angles: Angles
    # the 12 house cusps as ecliptic degrees, always exactly 12 values
    houses: List[float] = Field(..., min_length=12, max_length=12)
    # one entry per planet with its full position data
    bodies: List[BodyPosition]
    # all significant angular relationships found between planets
    aspects: List[Aspect]

