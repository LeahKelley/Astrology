// fetches user data and makes API calls, so this is a client component
"use client";

// useCallback to memoize the load function so useEffect doesn't re-run unnecessarily
import { useCallback, useEffect, useState } from "react";
// motion for the fade-in when placements finish loading
import { motion } from "motion/react";
// Link for the CTAs that send the user to their chart
import Link from "next/link";
// arrow icon for the CTA buttons
import { ArrowRight } from "lucide-react";
// Supabase client to read the current user's profile
import { createClient } from "@/utils/supabase/client";
// the base URLs for the ephemeris and geolocation services
import { EPHEMERIS_API, GEO_API } from "@/lib/api";
// the Profile type for the data we read from Supabase
import type { Profile } from "@/utils/supabase/types";

// the 12 signs in ecliptic order, used for the fallback glyph display when no user is logged in
const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// unicode zodiac glyphs keyed by sign name
const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

// a single placement entry shown in the card (e.g. Sun in Aries)
type Placement = { label: string; symbol: string; sign: string };

// converts an ecliptic longitude (0-360) to the zodiac sign name it falls in
function longitudeToSign(lon: number): string {
  // normalize to 0-360, then divide by 30 to get the sign index (0-11)
  return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

// makes the API calls needed to compute the user's Sun, Moon, and Rising signs
async function fetchBigThree(profile: Profile): Promise<Placement[]> {
  // first, geocode the birth city to get lat/lng
  const geoRes = await fetch(
    `${GEO_API}/location/geolocation?address=${encodeURIComponent(profile.city_of_birth)}`
  );
  const geoData = await geoRes.json();
  const loc = geoData["Latitude and Longitude"]?.[0];
  if (!loc) throw new Error("Geocoding failed");
  const { latitude, longitude } = loc;

  // then get the timezone for those coordinates
  const tzRes = await fetch(
    `${GEO_API}/location/geolocation/timezone?lat=${latitude}&lng=${longitude}`
  );
  const tzData = await tzRes.json();
  // fall back to the stored timezone or UTC if the API doesn't return one
  const timezone = tzData.timezone ?? profile.timezone ?? "UTC";

  // with all the info we need, request the full natal chart from the ephemeris API
  const chartRes = await fetch(`${EPHEMERIS_API}/api/v1/chart/natal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: profile.date_of_birth,
      // if we don't have a birth time, use solar noon as an approximation
      time: profile.time_of_birth || "12:00",
      timezone,
      latitude,
      longitude,
    }),
  });
  const chart = await chartRes.json();

  // pull out the three placements we care about from the full chart response
  const sun = chart.bodies?.find((b: { name: string }) => b.name === "Sun");
  const moon = chart.bodies?.find((b: { name: string }) => b.name === "Moon");
  const asc = chart.angles?.asc;

  return [
    // prefer the pre-computed sign name from the API, fall back to computing from longitude
    { label: "Sun",    symbol: "☉", sign: sun?.sign  ?? longitudeToSign(sun?.longitude  ?? 0) },
    { label: "Moon",   symbol: "☽", sign: moon?.sign ?? longitudeToSign(moon?.longitude ?? 0) },
    // the rising sign comes from the ascendant angle, not a planet body
    { label: "Rising", symbol: "↑", sign: asc != null ? longitudeToSign(asc) : "—" },
  ];
}

// the sidebar card on the home page that shows the user's Sun, Moon, and Rising signs
export function PlacementsCard() {
  const supabase = createClient();
  // undefined = still checking, null = no user or no profile, Profile = loaded
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  // the three placement objects once the chart API responds
  const [placements, setPlacements] = useState<Placement[] | null>(null);
  // true while we're loading auth, profile, or chart data
  const [loading, setLoading] = useState(true);
  // true if the chart API call failed (services might be offline)
  const [error, setError] = useState(false);

  // memoize the load function so it doesn't change on every render
  const load = useCallback(async () => {
    // first check if there's a logged-in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProfile(null); setLoading(false); return; }

    // then check if that user has a profile row
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data) { setProfile(null); setLoading(false); return; }

    const p = data as Profile;
    setProfile(p);

    // use an ignored flag to prevent stale API responses from updating state after unmount
    let ignored = false;
    fetchBigThree(p)
      .then((result) => { if (!ignored) { setPlacements(result); setLoading(false); } })
      .catch(() => { if (!ignored) { setError(true); setLoading(false); } });

    // return a cleanup function that marks this fetch as stale
    return () => { ignored = true; };
  }, [supabase]);

  // run the load function once on mount
  useEffect(() => { load(); }, [load]);

  return (
    <div className="relative w-full max-w-[320px]">
      {/* blue ambient glow behind the card */}
      <div className="absolute inset-0 bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />
      <div className="relative rounded-xl border border-github-border bg-white/5 backdrop-blur-md p-6 space-y-4">

        {/* no user logged in or no profile yet, show a teaser with sign glyphs */}
        {!loading && (profile === null) && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              Your Birth Chart
            </p>
            {/* show the first 6 zodiac glyphs as decorative placeholders */}
            <div className="flex flex-wrap gap-3 justify-center py-2">
              {SIGNS.slice(0, 6).map((s) => (
                <span key={s} className="text-2xl text-gray-600 hover:text-gray-400 transition-colors">
                  {SIGN_GLYPHS[s]}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 leading-relaxed text-center">
              Discover where the planets were at the exact moment of your birth.
            </p>
            <Link
              href="/natal"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors px-4 py-2.5 text-sm font-semibold text-white"
            >
              Generate your chart
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </>
        )}

        {/* pulsing skeleton while data is loading */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-2 w-1/3 rounded bg-blue-400/30" />
            <div className="space-y-3 pt-1">
              {/* three skeleton rows, one per placement */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-white/10 shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2 w-1/4 rounded bg-white/10" />
                    <div className="h-2 w-1/2 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* placements successfully loaded, fade them in */}
        {!loading && placements && profile && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              {profile.first_name}&apos;s Big Three
            </p>
            <div className="space-y-3">
              {placements.map(({ label, symbol, sign }) => (
                <div key={label} className="flex items-center gap-3">
                  {/* the planetary symbol (Sun, Moon, Rising) in purple */}
                  <span className="text-xl text-purple-300 w-6 text-center shrink-0">{symbol}</span>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold leading-none mb-0.5">
                      {label}
                    </p>
                    {/* the sign glyph and name in bold white */}
                    <p className="text-sm font-bold text-white leading-none">
                      {SIGN_GLYPHS[sign]} {sign}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* link to the full chart page */}
            <Link
              href="/natal"
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-2 text-xs font-semibold text-gray-300"
            >
              View full natal chart
              <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}

        {/* API call failed but the user has a profile, show a helpful message with a CTA */}
        {!loading && error && profile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              {profile.first_name}&apos;s Chart
            </p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Start the ephemeris and geolocation services to see your placements here.
            </p>
            <Link
              href="/natal"
              className="flex items-center justify-center gap-2 w-full rounded-lg bg-purple-600 hover:bg-purple-500 transition-colors px-4 py-2.5 text-sm font-semibold text-white"
            >
              View your chart
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </motion.div>
        )}

      </div>
    </div>
  );
}
