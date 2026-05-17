# Architecture

## Overview

MyAstrology is a full-stack natal chart application made up of four independent services and a Next.js frontend. All services run on localhost during development.

```
Astrology/
├── apps/
│   └── client-ui/               # Next.js 16 frontend (port 3000)
└── services/
    ├── ephemeris-api/            # Natal chart computation (port 8000)
    ├── geolocation/              # City geocoding and timezone lookup (port 8001)
    ├── interpretations/          # Astrological interpretation text (port 8002)
    └── user-profile/             # Daily activity forecast (port 8003)
```

## Services

### Client UI (Next.js 16)

- App Router with server and client components
- Supabase for authentication and two database tables (`profiles`, `stored_profiles`)
- Calls the four backend services over localhost for chart data, geocoding, interpretations, and daily forecasts
- Renders an interactive SVG chart wheel using `@astrodraw/astrochart`
- Middleware enforces authentication on protected routes and refreshes session cookies

### Ephemeris API (Python / FastAPI, port 8000)

- Validates birth data inputs (date, time, timezone, lat/lng)
- Swiss Ephemeris usage is isolated to a single adapter module (`swisseph_adapter.py`) so the engine can be swapped without touching the API or frontend
- Computes planetary positions, house cusps, and aspects
- Returns a full natal chart as JSON

### Geolocation Service (Python / FastAPI, port 8001)

- Converts city names to latitude and longitude via Nominatim (geopy)
- Resolves IANA timezone names from coordinates via TimezoneFinder
- Used by the frontend to prepare inputs for the Ephemeris API

### Interpretations Service (Go / net/http, port 8002)

- Serves astrological interpretation text for planets, signs, houses, aspects, and placement combinations
- All text is compiled into the binary — no database or external dependencies at runtime
- Falls back to composing a generic interpretation from base descriptions when a specific combination is not in the data files

### User Profile Service (Python / FastAPI, port 8003)

- Computes a daily forecast by comparing today's planetary positions against the user's natal positions
- Returns a green/yellow/red status and message for four life areas: Work, Social, Focus, Rest
- Uses the Swiss Ephemeris data files from the ephemeris-api directory
- Messages are seeded by `birth_jd + date` so the same user sees consistent text throughout the day

## Data Flow

### Natal Chart Generation

```
User selects profile
  → Frontend geocodes birth city   (GET port 8001 /location/geolocation)
  → Frontend resolves timezone     (GET port 8001 /location/geolocation/timezone)
  → Frontend requests natal chart  (POST port 8000 /api/v1/chart/natal)
  → Ephemeris API calls Swiss Ephemeris
  → JSON chart data returned
  → Frontend renders SVG chart wheel
  → User clicks element → Frontend fetches interpretation (GET port 8002)
```

### Daily Activity Forecast

```
User opens home page
  → Frontend loads profile from Supabase
  → Frontend computes Julian Day from birth date/time
  → Frontend requests forecast     (GET port 8003 /user-profile/daily-activity?birth_jd=...)
  → Service checks today's transits against natal chart
  → JSON status returned and displayed in DailyActivityCard
```

## License Boundary

Swiss Ephemeris is AGPL-licensed. Its usage is intentionally confined to the `swisseph_adapter.py` module in the ephemeris-api service and the `daily_activity.py` module in the user-profile service. The client UI and interpretations service have no dependency on Swiss Ephemeris. This isolation supports a future transition to a commercial Swiss Ephemeris license without requiring changes to the frontend or interpretations service.

## Languages

| Layer | Language |
|-------|----------|
| Frontend | TypeScript (Next.js / React) |
| Ephemeris API | Python |
| Geolocation Service | Python |
| Interpretations Service | Go |
| User Profile Service | Python |
| Chart Engine | C (Swiss Ephemeris, via pyswisseph bindings) |
