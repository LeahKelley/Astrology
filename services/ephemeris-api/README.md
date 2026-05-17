# Ephemeris API

Python/FastAPI service that computes natal charts using Swiss Ephemeris (pyswisseph). Returns planetary positions, house cusps, and aspects as JSON.

Runs on **port 8000**.

## Setup

```bash
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate.bat     # Windows
pip install -r requirements.txt
uvicorn src.app.main:app --reload --port 8000
```

Interactive docs available at **http://127.0.0.1:8000/docs**.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/chart/natal` | Compute a natal chart |

## Natal Chart Request

```json
{
  "date": "1990-06-15",
  "time": "14:30",
  "timezone": "America/New_York",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "house_system": "placidus"
}
```

`house_system` is optional and defaults to `placidus`. It is the only supported value in v1.

## Natal Chart Response

```json
{
  "meta": {
    "house_system": "placidus",
    "timezone": "America/New_York"
  },
  "angles": {
    "asc": 152.3,
    "mc": 72.1
  },
  "houses": [152.3, 182.1, 212.0, 242.3, 272.1, 302.0, 332.3, 2.1, 32.0, 62.3, 92.1, 122.0],
  "bodies": [
    {
      "name": "Sun",
      "longitude": 84.5,
      "sign": "Gemini",
      "degree_in_sign": 24.5,
      "retrograde": false,
      "house": 10,
      "speed": 0.95
    }
  ],
  "aspects": [
    { "a": "Sun", "type": "trine", "b": "Moon", "orb": 2.4 }
  ]
}
```

`bodies` includes Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto. `house` is 1–12, or `null` if house calculation was not run.

## Structure

```
src/app/
├── main.py                  # FastAPI app factory, CORS, router mount
├── api/
│   ├── routes.py            # Top-level router that includes sub-routers
│   ├── health.py            # GET /api/v1/health
│   └── chart.py             # POST /api/v1/chart/natal
└── core/
    ├── config.py            # Pydantic BaseSettings (env vars)
    ├── models.py            # Request/response Pydantic models
    ├── errors.py            # Custom exception hierarchy
    ├── logging.py           # App-wide logging setup
    ├── swisseph_adapter.py  # All pyswisseph calls isolated here
    └── natal_chart_service.py  # Orchestrates chart computation
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `pyswisseph` | Swiss Ephemeris bindings for planetary computation |
| `pydantic` | Request/response validation |
| `python-dateutil` | Date parsing utilities |
