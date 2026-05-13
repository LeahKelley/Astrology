# MyAstrology — Client UI

Next.js 16 frontend for the MyAstrology app. Calls four backend services over localhost for chart computation, geocoding, interpretation text, and daily forecasts.

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router), React 19 |
| Styling | Tailwind CSS 4 |
| Animations | Motion (Framer Motion) |
| Forms | React Hook Form + Zod |
| Auth & DB | Supabase (`@supabase/ssr`, `@supabase/supabase-js`) |
| Icons | Lucide React |

## Prerequisites

- **Node.js** >= 18
- All four backend services running (see root README)
- A `.env.local` file with your Supabase credentials

## Getting Started

```bash
npm install
npm run dev
```

App runs at **http://localhost:3000**.

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your values. The file is gitignored and never committed.

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon key |
| `NEXT_PUBLIC_EPHEMERIS_API` | No | Ephemeris service base URL (default: `http://127.0.0.1:8000`) |
| `NEXT_PUBLIC_GEO_API` | No | Geolocation service base URL (default: `http://127.0.0.1:8001`) |
| `NEXT_PUBLIC_INTERP_API` | No | Interpretations service base URL (default: `http://127.0.0.1:8002`) |
| `NEXT_PUBLIC_PROFILE_API` | No | User profile service base URL (default: `http://127.0.0.1:8003`) |

The four service URL variables are optional — if omitted, the app falls back to the default localhost ports. Override them if your services run on different ports or remote hosts.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home — daily forecast, Big Three placements, navigation tiles |
| `/natal` | Natal chart generator and viewer |
| `/resources` | Interactive learning center |
| `/settings` | Profile management |
| `/sign-in` | Sign in |
| `/sign-up` | Register |
| `/onboarding` | First-run profile setup |

## Key Components

| Component | Purpose |
|-----------|---------|
| `DailyActivityCard` | Fetches and displays daily Work/Social/Focus/Rest forecast from port 8003. Supports switching between saved profiles. |
| `PlacementsCard` | Shows Sun, Moon, and Rising sign for the user's own profile. Calls ports 8001 and 8000. Falls back gracefully if services are offline. |
| `ChartResults` | Renders the full natal chart output — planet positions, house placements, and aspects. |
| `ProfileForm` | Shared form used across onboarding, natal chart, and settings pages for entering birth details. |
| `Navbar` | Fixed top nav with auth state awareness and mobile hamburger menu. |
| `StarField` | Animated star background used across pages. |

## Backend Service Ports

| Port | Service |
|------|---------|
| 8000 | Ephemeris API — natal chart computation |
| 8001 | Geolocation — city geocoding and timezone lookup |
| 8002 | Interpretations — astrological text for all placement combos |
| 8003 | User Profile — daily activity forecast |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
