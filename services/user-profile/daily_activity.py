# os is imported but not currently used, available if env var access is needed later
import os
# the Swiss Ephemeris library for calculating planetary positions
import swisseph as swe
# FastAPI for the web server, Query for typed query params, HTTPException for error responses
from fastapi import FastAPI, Query, HTTPException
# CORS so the frontend can call this service from a different port
from fastapi.middleware.cors import CORSMiddleware
# sys is imported but not used, available if we need to manipulate the Python path for imports later
import sys
# Path for building cross-platform file paths
from pathlib import Path
# datetime for getting the current UTC time, timezone for making it timezone-aware
from datetime import datetime, timezone
# used to seed a deterministic RNG so the same birth/day combo always gets the same message
import random
# import the content library of messages keyed by category and energy color
from text_database import DAILY_TEXT

# create the FastAPI app instance for this service
app = FastAPI()

# allow the frontend dev servers to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# the four planets that drive the daily activity card, each mapped to a life category
# Moon = Rest, Mercury = Focus, Venus = Social, Mars = Work
BODY_MAP = {
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
}

# the five major aspects and their allowed orb (how many degrees off from exact they can be)
# tighter orbs for slower-moving aspects, looser for the most prominent ones
ASPECT_TARGETS = {
    "conjunction": (0.0, 8.0),
    "opposition": (180.0, 8.0),
    "square": (90.0, 6.0),
    "trine": (120.0, 6.0),
    "sextile": (60.0, 4.0),
}

# build the path to the ephemeris data files relative to this file
# this service lives in services/user-profile/, so parents[1] gets us to services/,
# then we navigate into the ephemeris-api's ephe/ folder
ephe_path = Path(__file__).resolve().parents[1] / "ephemeris-api" / "ephe"
# tell swisseph where to look for its data before we make any calculations
swe.set_ephe_path(str(ephe_path))

# calculates the position of our four key planets for a given Julian Day Number
def compute_bodies(jd: float) -> list[dict]:
    # use the Swiss Ephemeris files for accuracy, and include speed data for retrograde detection
    flags = swe.FLG_SWIEPH | swe.FLG_SPEED
    # will hold one dict per planet
    bodies = []
    # ask swisseph for each planet's position at this moment in time
    for name, body_id in BODY_MAP.items():
        # calc_ut returns position data in xx, retflags signals any errors
        xx, retflags = swe.calc_ut(jd, body_id, flags)
        bodies.append({
            "name": name,
            # normalize the raw ecliptic longitude to a clean 0-360 value
            "longitude": swe.degnorm(xx[0]),
            # speed in degrees/day, negative = retrograde
            "speed": xx[3],
        })
    return bodies

# compares today's planetary positions against the user's natal positions
# and assigns a green/yellow/red energy status to each life category
def calculate_daily_status(birth_jd: float, today_jd: float) -> dict:
    # get the planet positions at birth to use as the reference points
    birth_planets = compute_bodies(birth_jd)
    # get where those same planets are right now
    today_planets = compute_bodies(today_jd)

    # start everyone at yellow (neutral) before we check for any aspects
    dashboard = {
        "Work": {"planet": "Mars", "status": "yellow"},
        "Social": {"planet": "Venus", "status": "yellow"},
        "Focus": {"planet": "Mercury", "status": "yellow"},
        "Rest": {"planet": "Moon", "status": "yellow"}
    }

    # loop through each of today's planets and check if it's forming an aspect
    # with any of the user's natal planets
    for current in today_planets:
        # we only care about the four planets we track, skip anything else
        if current["name"] not in ["Mars", "Venus", "Mercury", "Moon"]:
            continue

        # compare against every natal planet to check for aspects
        for natal in birth_planets:
            # get the angular distance between the two planets
            diff = abs(current["longitude"] - natal["longitude"])
            # if the raw diff is over 180, take the short way around the circle
            if diff > 180:
                diff = 360 - diff

            # check if this angular distance matches any of our known aspect patterns
            for aspect_name, (target_angle, max_orb) in ASPECT_TARGETS.items():
                if abs(diff - target_angle) <= max_orb:

                    # trines and sextiles are harmonious, bump the color to green
                    if aspect_name in ["trine", "sextile"]:
                        color = "green"
                    # squares and oppositions are challenging, bump to red
                    elif aspect_name in ["square", "opposition"]:
                        color = "red"
                    # conjunctions can go either way, leave as yellow (neutral)
                    else:
                        color = "yellow"

                    # find which category this planet is responsible for and update its status
                    for category, data in dashboard.items():
                        if data["planet"] == current["name"]:
                            # red always wins, and green only upgrades from yellow (never overwrites red)
                            if color == "red" or (color == "green" and data["status"] == "yellow"):
                                dashboard[category]["status"] = color
                    # once we've found a matching aspect, stop checking other aspects for this planet pair
                    break

    # now that we have statuses, attach a matching message to each category
    for category, data in dashboard.items():
        current_status = data["status"]
        # grab the message options for this category/status combo
        options = DAILY_TEXT[category][current_status]
        # seed the RNG with birth date + today + category so the same inputs always produce the same message
        # this prevents the message from changing every time the endpoint is hit within the same day
        rng = random.Random(f"{birth_jd}:{today_jd:.0f}:{category}")
        data["message"] = rng.choice(options)

    return dashboard

# the endpoint the frontend calls to get the day's activity card data
@app.get("/user-profile/daily-activity")
def get_daily_activity(
    # birth_jd is a Julian Day Number that was calculated when the user set up their profile
    birth_jd: float = Query(..., description="The Julian Day of the user's birth")
):
    # get the current moment in UTC so we know "today"
    now = datetime.now(timezone.utc)

    # convert the current time to a fractional hour so swisseph can accept it
    # e.g. 14:30:00 becomes 14.5
    hour_decimal = now.hour + (now.minute / 60.0) + (now.second / 3600.0)
    # convert the current date+time to a Julian Day Number using the Gregorian calendar
    current_jd = swe.julday(now.year, now.month, now.day, hour_decimal, swe.GREG_CAL)

    # run the aspect comparison to figure out today's energy levels
    daily_status = calculate_daily_status(birth_jd, current_jd)

    return {
        # include today's date so the frontend can display it
        "current_date": now.strftime("%Y-%m-%d"),
        # the four category statuses and their messages
        "daily_status": daily_status
    }