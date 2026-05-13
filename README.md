# MyAstrology

Full-stack natal chart application. Users enter their birth details to generate a precise natal chart — planetary positions, house placements, and aspects — powered by Swiss Ephemeris. The app also provides a daily cosmic forecast, interactive interpretation explorers, and saved profiles for friends and family.

## Licensing Notice

If you fork, deploy, or modify this project, you must comply with the AGPL and all third-party licenses.

## Architecture

Four services run concurrently. The Next.js frontend calls each over localhost during development.

```
Astrology/
├── apps/
│   └── client-ui/               # Next.js 16 frontend (port 3000)
└── services/
    ├── ephemeris-api/            # Natal chart computation — Python/FastAPI (port 8000)
    ├── geolocation/              # City geocoding & timezone lookup — Python/FastAPI (port 8001)
    ├── interpretations/          # Astrological interpretation text — Go/net/http (port 8002)
    └── user-profile/             # Daily activity forecast — Python/FastAPI (port 8003)
```

## Tech Stack

### Frontend

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS 4 |
| Animations | Motion (Framer Motion) |
| Forms | React Hook Form, Zod |
| Auth & DB | Supabase |
| Icons | Lucide React |

### Backend Services

| Service | Language | Key Libraries |
|---------|----------|---------------|
| Ephemeris API | Python | FastAPI, pyswisseph, pydantic |
| Geolocation | Python | FastAPI, geopy, timezonefinder |
| Interpretations | Go | net/http (stdlib) |
| User Profile | Python | FastAPI, pyswisseph |

## Prerequisites

- **Node.js** >= 18
- **Python** >= 3.10
- **Go** >= 1.21
- **pip** (comes with Python)

## Getting Started

Start all four services in separate terminal tabs, then start the frontend.

### 1. Ephemeris API (port 8000)

```bash
cd services/ephemeris-api
python -m venv venv
source venv/bin/activate        # macOS/Linux
# venv\Scripts\activate.bat     # Windows
pip install -r requirements.txt
uvicorn src.app.main:app --reload --port 8000
```

Interactive docs: **http://127.0.0.1:8000/docs**

### 2. Geolocation Service (port 8001)

```bash
cd services/geolocation
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn geolocation:app --reload --port 8001
```

### 3. Interpretations Service (port 8002)

```bash
cd services/interpretations
go run .
```

### 4. User Profile Service (port 8003)

```bash
cd services/user-profile
uvicorn daily_activity:app --reload --port 8003
```

> The user-profile service shares the same Python environment as the ephemeris-api. If you've already activated that venv and installed its dependencies, `pyswisseph` will already be present.

### 5. Frontend (port 3000)

```bash
cd apps/client-ui
npm install
npm run dev
```

The app will be available at **http://localhost:3000**.

## API Reference

### Ephemeris API — port 8000

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/chart/natal` | Compute a natal chart |

**Natal chart request body:**
```json
{
  "date": "1990-06-15",
  "time": "14:30",
  "timezone": "America/New_York",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Geolocation Service — port 8001

| Method | Path | Description |
|--------|------|-------------|
| GET | `/location/geolocation?address=...` | Geocode a city name to coordinates |
| GET | `/location/geolocation/timezone?lat=...&lng=...` | Get IANA timezone for coordinates |

### Interpretations Service — port 8002

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/interpret/planets` | All planet interpretations |
| GET | `/interpret/signs` | All sign interpretations |
| GET | `/interpret/houses` | All house interpretations |
| GET | `/interpret/aspects` | All aspect interpretations |
| GET | `/interpret/planet/:name` | Single planet |
| GET | `/interpret/sign/:name` | Single sign |
| GET | `/interpret/house/:num` | Single house |
| GET | `/interpret/aspect/:name` | Single aspect |
| GET | `/interpret/combo/planet-in-sign?planet=...&sign=...&retrograde=...` | Planet in sign combo |
| GET | `/interpret/combo/planet-in-house?planet=...&house=...` | Planet in house combo |
| GET | `/interpret/combo/house-cusp?house=...&sign=...` | House cusp combo |
| GET | `/interpret/combo/aspect?planet1=...&aspect=...&planet2=...` | Aspect combo |

### User Profile Service — port 8003

| Method | Path | Description |
|--------|------|-------------|
| GET | `/user-profile/daily-activity?birth_jd=...` | Daily Work/Social/Focus/Rest forecast |

`birth_jd` is the Julian Day number of the user's birth date and time.

## Database (Supabase)

| Table | Purpose |
|-------|---------|
| `profiles` | The signed-in user's own birth profile |
| `stored_profiles` | Additional saved profiles (friends, family) |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — daily forecast card, Big Three placements, navigation tiles |
| `/natal` | Natal chart generator — compute and view charts for any saved profile |
| `/resources` | Learning center — interactive planet, house, sign, and aspect explorers |
| `/settings` | Profile management — create, edit, search, and delete profiles |
| `/sign-in` | Email/password sign in |
| `/sign-up` | New account registration |
| `/onboarding` | First-run profile setup |

## Frontend Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
