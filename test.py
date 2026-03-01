import os
import swisseph as swe
from fastapi import FastAPI, Query, HTTPException

# 1. Initialize the FastAPI app
app = FastAPI(
    title="Endpoints",
    description="Testing Swiss Endpoints",
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
EPHE_PATH = os.path.join(BASE_DIR, "ephe")
swe.set_ephe_path(EPHE_PATH)


@app.get("/planets/list")
def list_planets():
    planetList = []
    for i in range(16): #15 total apparently
        planetName = swe.get_planet_name(i)
        planetList.append({"id": i, "name": planetName})
    return {"planets": planetList}

@app.get("/planets/{planet_id}")
def get_planet_position(
    planet_id: int, 
    year: int = 2026, 
    month: int = 1, 
    day: int = 1, 
    hour: float = 12.0
):
    try:
        jd = swe.julday(year, month, day, hour)
        
        flags = swe.FLG_SPEED
        res, name = swe.calc_ut(jd, planet_id, flags)
        
        return {
            "planet_name": name,
            "julian_day": jd,
            "longitude": res[0],
            "latitude": res[1],
            "speed": res[3],
            "is_retrograde": res[3] < 0
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
