import os
import swisseph as swe
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path
from datetime import datetime, timezone
import random
from text_database import DAILY_TEXT

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BODY_MAP = {
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
}

ASPECT_TARGETS = {
    "conjunction": (0.0, 8.0),
    "opposition": (180.0, 8.0),
    "square": (90.0, 6.0),
    "trine": (120.0, 6.0),
    "sextile": (60.0, 4.0),
}

ephe_path = Path(__file__).resolve().parents[1] / "ephemeris-api" / "ephe"
swe.set_ephe_path(str(ephe_path))

def compute_bodies(jd: float) -> list[dict]:
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED #Change swe.FLG_MOSEPH to swe.FLG_SWIEPH later
    bodies = []
    for name, body_id in BODY_MAP.items():
        xx, retflags = swe.calc_ut(jd, body_id, flags)
        bodies.append({
            "name": name,
            "longitude": swe.degnorm(xx[0]),
            "speed": xx[3],
        })
    return bodies

def calculate_daily_status(birth_jd: float, today_jd: float) -> dict:
    birth_planets = compute_bodies(birth_jd)
    today_planets = compute_bodies(today_jd)

    #Default States
    dashboard = {
        "Work": {"planet": "Mars", "status": "yellow"},
        "Social": {"planet": "Venus", "status": "yellow"},
        "Focus": {"planet": "Mercury", "status": "yellow"},
        "Rest": {"planet": "Moon", "status": "yellow"}
    }

    for current in today_planets:
        if current["name"] not in ["Mars", "Venus", "Mercury", "Moon"]:
            continue
            
        for natal in birth_planets:
            diff = abs(current["longitude"] - natal["longitude"])
            if diff > 180:
                diff = 360 - diff
                
            for aspect_name, (target_angle, max_orb) in ASPECT_TARGETS.items():
                if abs(diff - target_angle) <= max_orb:
                    
                    if aspect_name in ["trine", "sextile"]:
                        color = "green"
                    elif aspect_name in ["square", "opposition"]:
                        color = "red"
                    else:
                        color = "yellow"
                        
                    for category, data in dashboard.items():
                        if data["planet"] == current["name"]:
                            # Prioritize more severe warnings
                            if color == "red" or (color == "green" and data["status"] == "yellow"):
                                dashboard[category]["status"] = color
                    break 

    for category, data in dashboard.items():
        current_status = data["status"]
        #Randomize text based on status color
        options = DAILY_TEXT[category][current_status]
        rng = random.Random(f"{birth_jd}:{today_jd:.0f}:{category}")
        data["message"] = rng.choice(options)

    return dashboard

@app.get("/user-profile/daily-activity")
def get_daily_activity(
    birth_jd: float = Query(..., description="The Julian Day of the user's birth")
):
    now = datetime.now(timezone.utc)
    
    #Current Time --> Julian
    hour_decimal = now.hour + (now.minute / 60.0) + (now.second / 3600.0)
    current_jd = swe.julday(now.year, now.month, now.day, hour_decimal, swe.GREG_CAL)
    
    # Run Daily Status
    daily_status = calculate_daily_status(birth_jd, current_jd)
    
    return {
        "current_date": now.strftime("%Y-%m-%d"),
        "daily_status": daily_status
    }