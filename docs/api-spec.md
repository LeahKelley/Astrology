# API Specification

All services run on localhost during development. Base URLs match the ports listed below.

---

## Ephemeris API — port 8000

### Health Check

```
GET /api/v1/health
```

Response 200:
```json
{ "status": "ok" }
```

---

### Natal Chart

```
POST /api/v1/chart/natal
```

#### Request (JSON)

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

#### Request Field Rules

| Field | Required | Description |
|-------|----------|-------------|
| `date` | Yes | YYYY-MM-DD |
| `time` | Yes | HH:MM (24-hour) |
| `timezone` | Yes | IANA timezone string (e.g. `America/New_York`) |
| `latitude` | Yes | -90 to 90 |
| `longitude` | Yes | -180 to 180 |
| `house_system` | No | Defaults to `placidus` (only supported value in v1) |

#### Response 200 (JSON)

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

#### Response Field Notes

- All angles and longitudes are ecliptic degrees in the range 0–360.
- `houses` is a 12-element array of cusp longitudes, index 0 = House 1.
- `bodies` includes Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto.
- `sign` is one of the 12 sign names (e.g. `Aries`, `Scorpio`).
- `degree_in_sign` is 0.00–29.99.
- `house` is 1–12, or `null` if house calculation was not run.
- `retrograde` is `true` when `speed` is negative.

#### Aspect Types

`conjunction`, `opposition`, `square`, `trine`, `sextile`

Default orbs: conjunction 8°, opposition 8°, square 6°, trine 6°, sextile 4°.

#### Error Response

```json
{ "detail": "Invalid timezone" }
```

---

## Geolocation Service — port 8001

### Geocode a City

```
GET /location/geolocation?address=New York
```

Response 200:
```json
{
  "Latitude and Longitude": [
    { "latitude": 40.7128, "longitude": -74.0060 }
  ]
}
```

Returns 404 if the city cannot be found.

---

### Timezone for Coordinates

```
GET /location/geolocation/timezone?lat=40.7128&lng=-74.0060
```

Response 200:
```json
{
  "timezone": "America/New_York",
  "utc_offset": -4.0
}
```

`utc_offset` is the current UTC offset in hours (accounting for DST).

---

## Interpretations Service — port 8002

### Health Check

```
GET /health
```

### Reference Data

```
GET /interpret/planets        — all planet interpretations
GET /interpret/signs          — all sign interpretations
GET /interpret/houses         — all house interpretations
GET /interpret/aspects        — all aspect interpretations
GET /interpret/planet/:name   — single planet (e.g. Sun, Moon, Mars, ASC, MC)
GET /interpret/sign/:name     — single sign (e.g. Aries, Scorpio)
GET /interpret/house/:num     — single house (e.g. 1, 7, 12)
GET /interpret/aspect/:name   — single aspect (e.g. trine, square)
```

### Combo Interpretations

```
GET /interpret/combo/planet-in-sign?planet=Sun&sign=Aries&retrograde=false
GET /interpret/combo/planet-in-house?planet=Sun&house=1
GET /interpret/combo/house-cusp?house=1&sign=Aries
GET /interpret/combo/aspect?planet1=Sun&aspect=trine&planet2=Moon
```

The `retrograde` query param on `planet-in-sign` is optional; omitting it returns the direct (non-retrograde) interpretation.

### Response Format

All endpoints return:
```json
{
  "title": "Mars in Scorpio",
  "text": "...",
  "keywords": ["intensity", "drive", "transformation"]
}
```

Batch endpoints (`/interpret/planets`, etc.) return a map keyed by name or number.

---

## User Profile Service — port 8003

### Daily Activity Forecast

```
GET /user-profile/daily-activity?birth_jd=2447958.125
```

`birth_jd` is the Julian Day Number of the user's birth. The frontend computes this from `date_of_birth` and `time_of_birth`.

Response 200:
```json
{
  "current_date": "2026-05-13",
  "daily_status": {
    "Work":   { "planet": "Mars",    "status": "green",  "message": "High energy today..." },
    "Social": { "planet": "Venus",   "status": "yellow", "message": "A quiet social day..." },
    "Focus":  { "planet": "Mercury", "status": "red",    "message": "Brain fog is heavy..." },
    "Rest":   { "planet": "Moon",    "status": "green",  "message": "Deep recovery possible..." }
  }
}
```

Status values: `green` (trine/sextile), `red` (square/opposition), `yellow` (conjunction or no aspect). Priority: red > green > yellow.
