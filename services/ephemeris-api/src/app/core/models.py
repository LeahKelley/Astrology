from pydantic import BaseModel, Field
from typing import Literal, List
from uuid import uuid4

HouseSystem = Literal["placidus"]

class NatalChartRequest(BaseModel):
    date: str = Field(..., description="YYYY-MM-DD")
    time: str = Field(..., description="HH:MM (24-hour)")
    timezone: str = Field(..., description="IANA timezone, e.g. America/New_York")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    house_system: HouseSystem = "placidus"

AspectType = Literal["conjunction", "opposition", "square", "trine", "sextile"]

BodyName = Literal[
    "Sun", "Moon", "Mercury", "Venus", "Mars",
    "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"
]

SignName = Literal[
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
]

class Meta(BaseModel):
    house_system: HouseSystem
    timezone: str
    request_id: str

class Angles(BaseModel):
    asc: float = Field(..., ge=0, lt=360)
    mc: float = Field(..., ge=0, lt=360)

class BodyPosition(BaseModel):
    name: BodyName
    longitude: float = Field(..., ge=0, lt=360)
    sign: SignName
    degree_in_sign: float = Field(..., ge=0, lt=30)
    speed: float
    retrograde: bool

class Aspect(BaseModel):
    a: BodyName
    b: BodyName
    type: AspectType
    orb: float = Field(..., ge=0)

class NatalChartResponse(BaseModel):
    meta: Meta
    angles: Angles
    houses: List[float] = Field(..., min_length=12, max_length=12)
    bodies: List[BodyPosition]
    aspects: List[Aspect]

