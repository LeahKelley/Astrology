// fetches user data and makes API calls, so this is a client component
"use client";

// useCallback to stabilize the loadProfiles function, useEffect for side effects, useState for all state
import { useCallback, useEffect, useState } from "react";
// motion for smooth transitions between loading/loaded/error states, AnimatePresence to handle exits
import { motion, AnimatePresence } from "motion/react";
// Supabase client to read the user's profiles
import { createClient } from "@/utils/supabase/client";
// type imports for the profile shapes
import type { Profile, StoredProfile } from "@/utils/supabase/types";
// the base URL for the user profile / daily activity service on port 8003
import { PROFILE_API as DAILY_API } from "@/lib/api";

// what the daily activity API returns for a single life category
type DailyStatus = {
  planet: string;                        // which planet drives this category
  status: "green" | "yellow" | "red";   // the energy level for today
  message: string;                       // the text advice for this status
};

// the full response shape from the daily activity endpoint
type DailyData = {
  current_date: string;                          // today's date in YYYY-MM-DD
  daily_status: Record<string, DailyStatus>;     // one entry per category (Work, Social, etc.)
};

// a unified profile type that covers both the user's own profile and stored profiles for others
type AnyProfile = {
  id: string;
  first_name: string;
  date_of_birth: string;
  time_of_birth: string | null;
  label: string;   // "You" for the user's own profile, the person's name for stored profiles
};

// converts a birth date + time into a Julian Day Number so the backend API can use it
function toJulianDay(dateStr: string, timeStr: string | null): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  // use solar noon as a fallback if the birth time is unknown
  let hour = 12;
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    // convert hours and minutes to a decimal hour (e.g. 14:30 = 14.5)
    hour = h + m / 60;
  }
  // the Gregorian to Julian Day Number algorithm
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m2 = month + 12 * a - 3;
  const jdn =
    day +
    Math.floor((153 * m2 + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045;
  // subtract 0.5 to start the day at midnight, then add the fractional hour
  return jdn - 0.5 + hour / 24;
}

// color and text classes for each energy status level
const STATUS_CONFIG = {
  green:  { dot: "bg-emerald-400", text: "text-emerald-400" },
  yellow: { dot: "bg-amber-400",   text: "text-amber-400"   },
  red:    { dot: "bg-red-400",     text: "text-red-400"     },
};

// the traditional planetary symbols for each life category
const CATEGORY_SYMBOL: Record<string, string> = {
  Work:   "♂",   // Mars drives ambition and action
  Social: "♀",   // Venus drives relationships and charm
  Focus:  "☿",   // Mercury drives communication and thought
  Rest:   "☽",   // Moon drives mood and recovery
};

// render the four categories in this fixed order
const CATEGORY_ORDER = ["Work", "Social", "Focus", "Rest"];

// a single row in the daily card showing one category's status and message
function StatusRow({ category, data }: { category: string; data: DailyStatus }) {
  const cfg = STATUS_CONFIG[data.status];
  return (
    <div className="flex items-start gap-3">
      {/* the planetary symbol for this category */}
      <span className="text-base text-gray-500 w-4 shrink-0 mt-0.5">
        {CATEGORY_SYMBOL[category] ?? "·"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {/* the category name label */}
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {category}
          </span>
          {/* the colored status dot (green/yellow/red) */}
          <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        </div>
        {/* the message text, colored to match the status */}
        <p className={`text-xs leading-relaxed ${cfg.text}`}>{data.message}</p>
      </div>
    </div>
  );
}

// animated skeleton shown while loading, matches the layout of the real content
function SkeletonCard() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* placeholder for the title/date line */}
      <div className="h-2 w-2/5 rounded bg-purple-400/30" />
      <div className="space-y-3">
        {/* four skeleton rows, one per category */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-3 w-3 mt-0.5 rounded-full bg-white/10 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-1.5 w-1/4 rounded bg-white/10" />
              <div className="h-1.5 w-full rounded bg-white/10" />
              <div className="h-1.5 w-3/4 rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// the sidebar card on the home page showing today's planetary energy for each life category
export function DailyActivityCard() {
  const supabase = createClient();

  // all profiles available to view (user's own + any stored profiles for others)
  const [profiles, setProfiles] = useState<AnyProfile[]>([]);
  // the ID of the currently selected profile in the dropdown
  const [selectedId, setSelectedId] = useState<string>("");
  // the daily activity data returned from the backend
  const [daily, setDaily] = useState<DailyData | null>(null);
  // true while loading either profiles or daily data
  const [loading, setLoading] = useState(true);
  // true if the daily activity API call failed
  const [error, setError] = useState(false);

  // fetch all profiles the user has access to (their own + stored ones)
  const loadProfiles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    // not logged in, nothing to show
    if (!user) { setLoading(false); return; }

    // load the user's own profile and their stored profiles in parallel
    const [{ data: own }, { data: stored }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("stored_profiles").select("*").eq("user_id", user.id),
    ]);

    const list: AnyProfile[] = [];
    // add the user's own profile first, labeled "You"
    if (own) list.push({ ...(own as Profile), label: "You" });
    // add any stored profiles (other people the user saved), labeled by first name
    if (stored) {
      (stored as StoredProfile[]).forEach((sp) =>
        list.push({ ...sp, label: sp.first_name })
      );
    }

    setProfiles(list);
    // auto-select the first profile in the list
    if (list.length > 0) setSelectedId(list[0].id);
    else setLoading(false);
  }, [supabase]);

  // load profiles once on mount
  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  // whenever the selected profile changes, fetch fresh daily data for that profile
  useEffect(() => {
    const profile = profiles.find((p) => p.id === selectedId);
    if (!profile) return;

    // use an ignored flag to prevent stale responses from updating state after unmount or re-render
    let ignored = false;
    setDaily(null);
    setLoading(true);
    setError(false);

    // convert the birth date/time to a Julian Day Number for the API
    const jd = toJulianDay(profile.date_of_birth, profile.time_of_birth);
    fetch(`${DAILY_API}/user-profile/daily-activity?birth_jd=${jd}`)
      .then((r) => r.json())
      .then((d) => { if (!ignored) { setDaily(d); setLoading(false); } })
      .catch(() => { if (!ignored) { setError(true); setLoading(false); } });

    return () => { ignored = true; };
  }, [selectedId, profiles]);

  // the full profile object for the currently selected ID
  const selected = profiles.find((p) => p.id === selectedId);

  return (
    <div className="relative w-full max-w-[320px]">
      {/* purple ambient glow behind the card */}
      <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="relative rounded-xl border border-github-border bg-white/5 backdrop-blur-md p-6 space-y-4">

        {/* card header: title, subtitle, and optional profile selector */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              Today&apos;s Reading
            </p>
            {/* personalized subtitle showing whose forecast this is */}
            {selected && (
              <p className="text-xs text-gray-300 font-medium mt-0.5">
                {selected.label === "You" ? "Your daily forecast" : `${selected.first_name}'s forecast`}
              </p>
            )}
          </div>
          {/* only show the profile dropdown if there's more than one profile to choose from */}
          {profiles.length > 1 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="text-xs bg-white/5 border border-github-border rounded-md px-2 py-1 text-gray-300 cursor-pointer focus:outline-none focus:border-purple-500 transition-colors"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id} className="bg-gray-900">
                  {p.label}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* AnimatePresence handles exit animations when switching between states */}
        <AnimatePresence mode="wait">
          {/* loading skeleton */}
          {loading && (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <SkeletonCard />
            </motion.div>
          )}

          {/* service error message */}
          {!loading && error && (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-gray-500 text-center py-4"
            >
              Could not load daily reading. Make sure the user-profile service is running on port 8003.
            </motion.p>
          )}

          {/* no profile set up yet, prompt the user to create one */}
          {!loading && !error && !daily && profiles.length === 0 && (
            <motion.p
              key="no-profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-gray-500 leading-relaxed"
            >
              Set up your profile to see your daily cosmic forecast here.
            </motion.p>
          )}

          {/* the actual daily reading content, key on selectedId so it re-animates when switching profiles */}
          {!loading && !error && daily && (
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="space-y-3.5"
            >
              {/* render the four categories in the fixed order defined above */}
              {CATEGORY_ORDER.map((cat) => {
                const data = daily.daily_status[cat];
                return data ? <StatusRow key={cat} category={cat} data={data} /> : null;
              })}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
