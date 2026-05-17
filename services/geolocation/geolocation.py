import os # os is available if we need env vars later, currently unused but kept as a placeholder
from datetime import datetime # datetime lets us get the current time in a specific timezone
# FastAPI is the web framework, Query is for query param validation, HTTPException lets us return clean error responses
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware # CORS so our frontend can call this service from a different port
from geopy.geocoders import Nominatim # Nominatim is a free geocoding service backed by OpenStreetMap
from geopy.extra.rate_limiter import RateLimiter # RateLimiter wraps geocode calls to avoid hammering the Nominatim API too fast
from zoneinfo import ZoneInfo # ZoneInfo resolves timezone names like "America/New_York" into real timezone objects
from timezonefinder import TimezoneFinder # TimezoneFinder maps lat/lng coordinates to a timezone name

# create the FastAPI app instance for this service
app = FastAPI(
    title="Geolocation",
    description="Geolocation services for retrieving location data",
)

# allow the frontend dev servers to call this API without getting blocked by the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# set up the geocoder with a descriptive user agent (Nominatim requires one)
geolocator = Nominatim(user_agent="Location Data")
# create a TimezoneFinder instance for converting coordinates to timezone names
tf = TimezoneFinder()
# wrap the geocode function in a rate limiter so we wait at least 1 second between calls
geocode = RateLimiter(geolocator.geocode, min_delay_seconds=1)

# endpoint that takes a readable address and returns its lat/lng coordinates
@app.get("/location/geolocation")
def location(address: str):
    # start with an empty list to hold the result
    locationData = []
    # ask Nominatim to look up the address
    getLocation = geolocator.geocode(address)
    # if nothing comes back, the address wasn't found, return a 404 with message
    if getLocation is None:
        raise HTTPException(
            status_code=404,
            detail=f"Address '{address}' could not be found. "
        )
    # pull the lat/lng off the result and add it to our list
    locationData.append({"latitude": getLocation.latitude, "longitude": getLocation.longitude})
    return {'Latitude and Longitude': locationData}

# endpoint that takes lat/lng and returns the timezone name and UTC offset
@app.get("/location/geolocation/timezone")
def timezone(lat: float, lng: float):
    # find the IANA timezone name (e.g. "America/Chicago") for these coordinates
    timezoneName = tf.timezone_at(lng=lng, lat=lat)

    # get the current time in that timezone so we can calculate the UTC offset
    timeNow = datetime.now(ZoneInfo(timezoneName))
    # utcoffset() gives a timedelta, total_seconds() converts it, divide by 3600 to get hours
    convertedTime = timeNow.utcoffset().total_seconds() / 3600
    return {
        # the full timezone name like "America/Los_Angeles"
        "timezone": timezoneName,
        # the UTC offset as a float, e.g. -7.0 for PDT
        "utc_offset": convertedTime
    }
