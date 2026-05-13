"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { EPHEMERIS_API, GEO_API } from "@/lib/api";
import type { Profile } from "@/utils/supabase/types";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

type Placement = { label: string; symbol: string; sign: string };

function longitudeToSign(lon: number): string {
  return SIGNS[Math.floor(((lon % 360) + 360) % 360 / 30)];
}

async function fetchBigThree(profile: Profile): Promise<Placement[]> {
  const geoRes = await fetch(
    `${GEO_API}/location/geolocation?address=${encodeURIComponent(profile.city_of_birth)}`
  );
  const geoData = await geoRes.json();
  const loc = geoData["Latitude and Longitude"]?.[0];
  if (!loc) throw new Error("Geocoding failed");
  const { latitude, longitude } = loc;

  const tzRes = await fetch(
    `${GEO_API}/location/geolocation/timezone?lat=${latitude}&lng=${longitude}`
  );
  const tzData = await tzRes.json();
  const timezone = tzData.timezone ?? profile.timezone ?? "UTC";

  const chartRes = await fetch(`${EPHEMERIS_API}/api/v1/chart/natal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      date: profile.date_of_birth,
      time: profile.time_of_birth || "12:00",
      timezone,
      latitude,
      longitude,
    }),
  });
  const chart = await chartRes.json();

  const sun = chart.bodies?.find((b: { name: string }) => b.name === "Sun");
  const moon = chart.bodies?.find((b: { name: string }) => b.name === "Moon");
  const asc = chart.angles?.asc;

  return [
    { label: "Sun",    symbol: "☉", sign: sun?.sign  ?? longitudeToSign(sun?.longitude  ?? 0) },
    { label: "Moon",   symbol: "☽", sign: moon?.sign ?? longitudeToSign(moon?.longitude ?? 0) },
    { label: "Rising", symbol: "↑", sign: asc != null ? longitudeToSign(asc) : "—" },
  ];
}

export function PlacementsCard() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null | undefined>(undefined);
  const [placements, setPlacements] = useState<Placement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setProfile(null); setLoading(false); return; }

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!data) { setProfile(null); setLoading(false); return; }

    const p = data as Profile;
    setProfile(p);

    let ignored = false;
    fetchBigThree(p)
      .then((result) => { if (!ignored) { setPlacements(result); setLoading(false); } })
      .catch(() => { if (!ignored) { setError(true); setLoading(false); } });

    return () => { ignored = true; };
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="relative w-full max-w-[320px]">
      <div className="absolute inset-0 bg-blue-600/15 blur-3xl rounded-full pointer-events-none" />
      <div className="relative rounded-xl border border-github-border bg-white/5 backdrop-blur-md p-6 space-y-4">

        {/* No user or no profile */}
        {!loading && (profile === null) && (
          <>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              Your Birth Chart
            </p>
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

        {/* Loading */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-2 w-1/3 rounded bg-blue-400/30" />
            <div className="space-y-3 pt-1">
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

        {/* Placements loaded */}
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
                  <span className="text-xl text-purple-300 w-6 text-center shrink-0">{symbol}</span>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold leading-none mb-0.5">
                      {label}
                    </p>
                    <p className="text-sm font-bold text-white leading-none">
                      {SIGN_GLYPHS[sign]} {sign}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/natal"
              className="flex items-center justify-center gap-2 w-full rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors px-4 py-2 text-xs font-semibold text-gray-300"
            >
              View full natal chart
              <ArrowRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}

        {/* Error — show CTA anyway */}
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
