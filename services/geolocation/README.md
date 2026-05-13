# Geolocation Service

Python/FastAPI service that geocodes city names to coordinates and resolves IANA timezones. Used by the frontend to prepare inputs for the Ephemeris API.

Runs on **port 8001**.

## Setup

```bash
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate.bat     # Windows
pip install -r requirements.txt
uvicorn geolocation:app --reload --port 8001
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/location/geolocation?address=...` | Geocode a city name to lat/lng |
| GET | `/location/geolocation/timezone?lat=...&lng=...` | Get IANA timezone for coordinates |

### Geocode Example

```
GET /location/geolocation?address=New York
```

```json
[{ "latitude": 40.7128, "longitude": -74.0060, "display_name": "New York, USA" }]
```

### Timezone Example

```
GET /location/geolocation/timezone?lat=40.7128&lng=-74.0060
```

```json
{ "timezone": "America/New_York" }
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `geopy` | City name geocoding |
| `timezonefinder` | Coordinate-to-timezone resolution |
| `tzdata` | Timezone database |
