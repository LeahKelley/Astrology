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
  "longitude": -74.0060
}
```

## Natal Chart Response

```json
{
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
  "angles": {
    "asc": 152.3,
    "mc": 72.1
  },
  "houses": [152.3, 182.1, 212.0, 242.3, 272.1, 302.0, 332.3, 2.1, 32.0, 62.3, 92.1, 122.0],
  "aspects": [
    { "a": "Sun", "type": "trine", "b": "Moon", "orb": 2.4 }
  ]
}
```

## Dependencies

| Package | Purpose |
|---------|---------|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server |
| `pyswisseph` | Swiss Ephemeris bindings for planetary computation |
| `pydantic` | Request/response validation |
| `python-dateutil` | Date parsing utilities |
