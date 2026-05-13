# User Profile Service

Python/FastAPI service that computes a daily astrological forecast by comparing current planetary positions against a user's natal chart. Returns a Work, Social, Focus, and Rest status (green / yellow / red) with a message for each.

Runs on **port 8003**.

## Setup

This service uses `pyswisseph` with the Swiss Ephemeris data files located in `services/ephemeris-api/ephe/`. The ephemeris-api service must be present (the data files don't need to be running, just on disk).

If you have the ephemeris-api virtual environment already set up, activate it and run from there. Otherwise:

```bash
pip install fastapi uvicorn pyswisseph
uvicorn daily_activity:app --reload --port 8003
```

## Endpoints

| Method | Path | Query Params | Description |
|--------|------|--------------|-------------|
| GET | `/user-profile/daily-activity` | `birth_jd` (float) | Daily forecast for a birth chart |

`birth_jd` is the Julian Day number of the user's birth. The frontend computes this from the stored `date_of_birth` and `time_of_birth` profile fields.

### Response

```json
{
  "current_date": "2026-05-13",
  "daily_status": {
    "Work":   { "planet": "Mars",    "status": "green",  "message": "High energy today. Tackle your hardest tasks first." },
    "Social": { "planet": "Venus",   "status": "yellow", "message": "A quiet social day. Good for 1-on-1s rather than big groups." },
    "Focus":  { "planet": "Mercury", "status": "red",    "message": "Brain fog is heavy today. Triple-check your work." },
    "Rest":   { "planet": "Moon",    "status": "green",  "message": "Deep recovery is possible tonight. Prioritize sleep." }
  }
}
```

### Status Logic

| Status | Aspects | Planets |
|--------|---------|---------|
| `green` | Trine, Sextile | — |
| `yellow` | Conjunction, or no aspect (default) | — |
| `red` | Square, Opposition | — |

Priority: **red > green > yellow**. Once a category is set to red it cannot be overwritten.

- **Work** is driven by **Mars**
- **Social** is driven by **Venus**
- **Focus** is driven by **Mercury**
- **Rest** is driven by **Moon**

Messages are seeded by `birth_jd + date` so the same user sees the same message throughout the day.

## Files

| File | Purpose |
|------|---------|
| `daily_activity.py` | FastAPI app, aspect calculation logic |
| `text_database.py` | Message copy for all categories and statuses |
