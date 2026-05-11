"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createClient } from "@/utils/supabase/client";
import type { Profile, StoredProfile } from "@/utils/supabase/types";

const DAILY_API = "http://127.0.0.1:8003";

type DailyStatus = {
  planet: string;
  status: "green" | "yellow" | "red";
  message: string;
};

type DailyData = {
  current_date: string;
  daily_status: Record<string, DailyStatus>;
};

type AnyProfile = {
  id: string;
  first_name: string;
  date_of_birth: string;
  time_of_birth: string | null;
  label: string;
};

function toJulianDay(dateStr: string, timeStr: string | null): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  let hour = 12;
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    hour = h + m / 60;
  }
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
  return jdn - 0.5 + hour / 24;
}

const STATUS_CONFIG = {
  green:  { dot: "bg-emerald-400", text: "text-emerald-400" },
  yellow: { dot: "bg-amber-400",   text: "text-amber-400"   },
  red:    { dot: "bg-red-400",     text: "text-red-400"     },
};

const CATEGORY_SYMBOL: Record<string, string> = {
  Work:   "♂",
  Social: "♀",
  Focus:  "☿",
  Rest:   "☽",
};

const CATEGORY_ORDER = ["Work", "Social", "Focus", "Rest"];

function StatusRow({ category, data }: { category: string; data: DailyStatus }) {
  const cfg = STATUS_CONFIG[data.status];
  return (
    <div className="flex items-start gap-3">
      <span className="text-base text-gray-500 w-4 shrink-0 mt-0.5">
        {CATEGORY_SYMBOL[category] ?? "·"}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {category}
          </span>
          <span className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
        </div>
        <p className={`text-xs leading-relaxed ${cfg.text}`}>{data.message}</p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-2 w-2/5 rounded bg-purple-400/30" />
      <div className="space-y-3">
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

export function DailyActivityCard() {
  const supabase = createClient();

  const [profiles, setProfiles] = useState<AnyProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [daily, setDaily] = useState<DailyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadProfiles = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: own }, { data: stored }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("stored_profiles").select("*").eq("user_id", user.id),
    ]);

    const list: AnyProfile[] = [];
    if (own) list.push({ ...(own as Profile), label: "You" });
    if (stored) {
      (stored as StoredProfile[]).forEach((sp) =>
        list.push({ ...sp, label: sp.first_name })
      );
    }

    setProfiles(list);
    if (list.length > 0) setSelectedId(list[0].id);
    else setLoading(false);
  }, [supabase]);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  useEffect(() => {
    const profile = profiles.find((p) => p.id === selectedId);
    if (!profile) return;

    let ignored = false;
    setDaily(null);
    setLoading(true);
    setError(false);

    const jd = toJulianDay(profile.date_of_birth, profile.time_of_birth);
    fetch(`${DAILY_API}/user-profile/daily-activity?birth_jd=${jd}`)
      .then((r) => r.json())
      .then((d) => { if (!ignored) { setDaily(d); setLoading(false); } })
      .catch(() => { if (!ignored) { setError(true); setLoading(false); } });

    return () => { ignored = true; };
  }, [selectedId, profiles]);

  const selected = profiles.find((p) => p.id === selectedId);

  return (
    <div className="relative w-full max-w-[320px]">
      <div className="absolute inset-0 bg-purple-600/20 blur-3xl rounded-full pointer-events-none" />
      <div className="relative rounded-xl border border-github-border bg-white/5 backdrop-blur-md p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">
              Today&apos;s Reading
            </p>
            {selected && (
              <p className="text-xs text-gray-300 font-medium mt-0.5">
                {selected.label === "You" ? "Your daily forecast" : `${selected.first_name}'s forecast`}
              </p>
            )}
          </div>
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

        {/* Content */}
        <AnimatePresence mode="wait">
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

          {!loading && !error && daily && (
            <motion.div
              key={selectedId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="space-y-3.5"
            >
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
