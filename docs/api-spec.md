# API Spec (Draft)

Base URL (local): http://localhost:8000

## Health
GET /health
Response 200:
{ "status": "ok" }

## Natal Chart
POST /chart/natal

Request (JSON):
{
  "date": "YYYY-MM-DD",
  "time": "HH:MM",
  "timezone": "America/New_York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "house_system": "placidus"
}

Response 200 (JSON):
{
  "meta": {
    "house_system": "placidus",
    "timezone": "America/New_York"
  },
  "angles": {
    "asc": 123.45,
    "mc": 210.12
  },
  "houses": [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
  "bodies": [
    { "name": "Sun", "lon": 301.23, "speed": 0.98 },
    { "name": "Moon", "lon": 12.34, "speed": 13.2 }
  ],
  "aspects": [
    { "a": "Sun", "b": "Moon", "type": "trine", "orb": 1.2 }
  ]
}

Errors (example):
Response 400:
{ "error": "Invalid timezone" }
