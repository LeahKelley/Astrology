# Astrology

## Licensing Notice

This repository is an academic capstone project released under the GNU AGPL
due to its dependency on the Swiss Ephemeris library.

This codebase is a functional prototype intended for educational purposes.

The authors reserve the right to develop future versions under different
licensing terms, including proprietary licenses, by using commercially
licensed dependencies.

If you fork, deploy, or modify this project, you must comply with the AGPL
and all third-party licenses.

Natal chart engine and interactive chart wheel. The frontend collects user inputs, calls the Ephemeris API, and renders an astrology chart.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend framework | Next.js 16 (App Router) |
| Styling | Tailwind CSS 4, shadcn/ui |
| Animations | Motion (Framer Motion) |
| Forms | React Hook Form |
| Date picker | React DayPicker |
| Timezone picker | React Timezone Select |
| Data fetching | SWR |
| Chart rendering | AstroChart (SVG) |
| AI layer | Vercel AI SDK |
| Auth & DB | Supabase |
| Backend API | FastAPI + pyswisseph |

## Prerequisites

- **Node.js** >= 18
- **Python** >= 3.10
- **pip** (comes with Python)

## Project Structure

```
Astrology/
├── apps/
│   └── client-ui/          # Next.js frontend
│       ├── app/             # App Router pages & components
│       ├── package.json
│       └── ...
└── services/
    └── ephemeris-api/       # Python backend
        ├── src/app/
        │   ├── main.py      # FastAPI entry point
        │   ├── api/         # Route handlers
        │   ├── core/        # Swiss Ephemeris adapter, models, logging
        │   └── services/    # Natal chart computation logic
        └── requirements.txt
```

## Getting Started

### 1. Backend (Ephemeris API)

```bash
cd Astrology/services/ephemeris-api

# Create and activate a virtual environment
python -m venv venv

# Windows (PowerShell)
venv\Scripts\Activate.ps1

# Windows (Command Prompt)
venv\Scripts\activate.bat

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn src.app.main:app --reload --port 8000
```

The API will be available at **http://127.0.0.1:8000**. Interactive docs at **http://127.0.0.1:8000/docs**.

### 2. Frontend (Next.js Client)

Open a **second terminal**:

```bash
cd Astrology/apps/client-ui

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at **http://localhost:3000**.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/chart/natal` | Compute a natal chart |

### Example: Natal Chart Request

```json
{
  "date": "1990-06-15",
  "time": "14:30",
  "timezone": "America/New_York",
  "latitude": 40.7128,
  "longitude": -74.006,
  "city": "New York",
  "house_system": "placidus"
}
```

## Available Scripts

### Frontend (`apps/client-ui`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |

### Backend (`services/ephemeris-api`)

| Command | Description |
|---------|-------------|
| `uvicorn src.app.main:app --reload --port 8000` | Start dev server with hot reload |
| `uvicorn src.app.main:app --port 8000` | Start without hot reload |
