# Architecture (Draft)

## Goal
Build an astrology chart engine that computes chart data using Swiss Ephemeris (AGPL) and renders a chart wheel in a client UI. The system is designed so the ephemeris engine can be swapped later for a commercially licensed build without changing the UI.

## High-level components
1. Client UI (TypeScript/React)
   - Collects user inputs (date, time, timezone, latitude, longitude, house system)
   - Calls the Ephemeris API
   - Renders chart wheel (SVG)
   - Displays positions, houses, aspects

2. Ephemeris API (Python/FastAPI)
   - Validates inputs
   - Calls Swiss Ephemeris through a single adapter module
   - Returns JSON chart data (positions, houses, aspects)

## Data flow
User Input → Client UI → POST /chart/natal → Ephemeris API → Swiss Ephemeris → JSON Response → Client UI renders wheel

## License boundary (important)
Swiss Ephemeris usage is isolated to one backend module (swisseph_adapter). The client UI never links to or embeds Swiss Ephemeris. This supports a future transition to a commercial Swiss Ephemeris license or a different ephemeris backend.

## Languages and platforms
Languages:
- C (Swiss Ephemeris)
- Python (Ephemeris API)
- TypeScript (Client UI)

Platforms:
- Backend runs on Linux (Docker or server)
- Client runs on macOS/Windows (browser or desktop wrapper)
