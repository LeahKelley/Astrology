import os
import swisseph as swe
from datetime import datetime
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
from zoneinfo import ZoneInfo
from timezonefinder import TimezoneFinder


app = FastAPI(
    title="Geolocation",
    description="Geolocation services for retrieving location data",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

geolocator = Nominatim(user_agent="Location Data") 
tf = TimezoneFinder()
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)

@app.get("/location/geolocation")
def location(address: str):
    locationData = []
    getLocation = geolocator.geocode(address)
    if getLocation is None:
        raise HTTPException(
            status_code=404, 
            detail=f"Address '{address}' could not be found. "
        )
    locationData.append({"latitude": getLocation.latitude, "longitude": getLocation.longitude})
    return {'Latitude and Longitude': locationData}

@app.get("/location/geolocation/timezone")
def timezone(lat: float, lng: float):
    timezoneName = tf.timezone_at(lng=lng, lat=lat)

    timeNow = datetime.now(ZoneInfo(timezoneName))
    convertedTime = timeNow.utcoffset().total_seconds() / 3600 #Convert time to seconds then hour to find UTC Time
    return {
        "timezone": timezoneName, #Timezone Name
        "utc_offset": convertedTime #UTC Time
    }
