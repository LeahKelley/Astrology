# Client UI

Frontend application that collects user inputs, calls the Ephemeris API, and renders an astrology chart wheel.

## Tech Stack (Front + Back integration)

1. **Next.js** (core app shell, routing, and pages for the client UI)
2. **Firebase** (authentication and database for user accounts, saved charts, and preferences)
3. **Ephemeris backend (FastAPI + pyswisseph)** – backend “engine” that computes accurate natal chart data and exposes `/chart/natal`
4. **SWR** (data fetching and caching for calling `/chart/natal` from the Next.js client)
5. **AstroChart** – renders the interactive astrology chart wheel (houses, planets, aspects) using SVG
6. **React Hook Form** – manages the birth data input form and validation UX
7. **React Timezone Select** – provides a robust timezone picker for accurate chart calculations
8. **React DayPicker** – calendar UI for selecting the birth date
9. **Motion** – fluid animations for transitions, chart interactions, and micro-interactions
10. **shadcn** - UI component library
11. **Vercel AI** – AI-powered interpretations and learning content layered on top of the computed chart data