# Milestones

## M1: Repo foundation (done)
- AGPL license added
- README licensing notice added
- .gitignore added
- v0.1-capstone release created

## M2: Backend scaffold (done)
- Ephemeris API service created
- `/api/v1/health` endpoint working
- `/api/v1/chart/natal` returns mock JSON for UI development

## M3: Swiss Ephemeris integration (done)
- `swisseph_adapter.py` isolates all pyswisseph calls
- Returns real planetary longitudes for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
- Returns ASC/MC angles and 12 Placidus house cusps
- Aspect calculation with orb filtering

## M4: Supporting services (done)
- Geolocation service geocodes city names and resolves IANA timezones
- Interpretations service (Go) serves text for all placement combinations
- User Profile service computes daily Work/Social/Focus/Rest forecasts using transiting aspects

## M5: Frontend rendering (done)
- Interactive SVG chart wheel with planet and sign click handling
- Planet positions, house placements, and aspects displayed in tabular panels
- Click panel shows interpretation text with "Learn more" expansions
- DailyActivityCard and PlacementsCard on the home page

## M6: Auth and profiles (done)
- Supabase authentication (email/password)
- Onboarding flow creates the user's own profile
- Settings page: create, edit, search, sort, and delete profiles
- Stored profiles let users save and view charts for friends and family

## M7: Resources and polish (done)
- Interactive learning center with Placement, House Cusp, Sign Placement, and Aspect explorers
- "Surprise Me" random combination buttons throughout explorers
- Retrograde toggle on planet-in-sign lookups
- Impossible aspect combinations filtered from Planet 2 dropdown
- Animated star background, ambient glow effects, scroll-triggered animations
- Full inline code comments throughout frontend and backend
