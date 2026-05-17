// base URLs for each backend service, pulled from env vars in production and falling back to localhost ports for local development
// NEXT_PUBLIC_ prefix is required so Next.js exposes these to the browser bundle

// the ephemeris API that calculates planetary positions and natal charts
export const EPHEMERIS_API = process.env.NEXT_PUBLIC_EPHEMERIS_API ?? "http://127.0.0.1:8000";
// the geolocation service that converts addresses to lat/lng and timezones
export const GEO_API       = process.env.NEXT_PUBLIC_GEO_API       ?? "http://127.0.0.1:8001";
// the interpretation API for astrological text 
export const INTERP_API    = process.env.NEXT_PUBLIC_INTERP_API    ?? "http://127.0.0.1:8002";
// the user profile service that handles daily activity scores and birth data
export const PROFILE_API   = process.env.NEXT_PUBLIC_PROFILE_API   ?? "http://127.0.0.1:8003";
