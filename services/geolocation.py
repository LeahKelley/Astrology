import os
import swisseph as swe
from fastapi import FastAPI, Query, HTTPException
from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter

app = FastAPI(
    title="Geolocation",
    description="Geolocation services for retrieving location data",
)

geolocator = Nominatim(user_agent="Location Data") 
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
    locationData.append({"longitude": getLocation.latitude, "latitude": getLocation.longitude})
    return {"Longitude and Latitude": locationData}