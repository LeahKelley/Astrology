"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Compass,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type {
  Profile,
  ProfileFormValues,
  StoredProfile,
} from "@/utils/supabase/types";
import { ChartWheel } from "../components/ChartWheel";
import { ProfileForm } from "../components/ProfileForm";
import { ChartResults } from "../components/ChartResults";
import type { NatalChartResponse } from "../components/ChartResults";
import { ChartClickPanel } from "../components/ChartClickPanel";
import type { ChartSelection } from "../components/ChartClickPanel";

async function fetchCoordsForCity(
  city: string
): Promise<{ latitude: number; longitude: number }> {
  const res = await fetch(
    `http://127.0.0.1:8001/location/geolocation?address=${encodeURIComponent(city)}`
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Geolocation failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const first = data["Latitude and Longitude"]?.[0];

  if (!first) {
    throw new Error("City not found by geolocation service.");
  }

  return { latitude: first.latitude, longitude: first.longitude };
}

async function fetchTimezoneForCoords(
  latitude: number,
  longitude: number
): Promise<string> {
  const res = await fetch(
    `http://127.0.0.1:8001/location/geolocation/timezone?lat=${latitude}&lng=${longitude}`
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Timezone lookup failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  if (!data.timezone) {
    throw new Error("Timezone not returned by geolocation service.");
  }

  return data.timezone;
}

type UnifiedProfile = {
  id: string;
  first_name: string;
  date_of_birth: string;
  time_of_birth: string | null;
  city_of_birth: string;
  timezone?: string;
  isOwn: boolean;
};

function toUnified(profile: Profile): UnifiedProfile {
  return {
    id: profile.id,
    first_name: profile.first_name,
    date_of_birth: profile.date_of_birth,
    time_of_birth: profile.time_of_birth,
    city_of_birth: profile.city_of_birth,
    timezone: profile.timezone,
    isOwn: true,
  };
}

function storedToUnified(sp: StoredProfile): UnifiedProfile {
  return {
    id: sp.id,
    first_name: sp.first_name,
    date_of_birth: sp.date_of_birth,
    time_of_birth: sp.time_of_birth,
    city_of_birth: sp.city_of_birth,
    isOwn: false,
  };
}

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const defaultChart: NatalChartResponse = {
  bodies: [],
  houses: [],
  aspects: [],
};

export default function NatalChartPage() {
  const supabase = createClient();

  const [ownProfile, setOwnProfile] = useState<Profile | null>(null);
  const [storedProfiles, setStoredProfiles] = useState<StoredProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [chart, setChart] = useState<NatalChartResponse>(defaultChart);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [chartSelection, setChartSelection] = useState<ChartSelection | null>(null);

  const allProfiles = useMemo(() => {
    const list: UnifiedProfile[] = [];
    if (ownProfile) list.push(toUnified(ownProfile));
    list.push(...storedProfiles.map(storedToUnified));
    return list;
  }, [ownProfile, storedProfiles]);

  const selectedProfile = useMemo(
    () => allProfiles.find((p) => p.id === selectedId) ?? null,
    [allProfiles, selectedId]
  );

  const editingProfile = useMemo(() => {
    if (!editingId) return null;
    return allProfiles.find((p) => p.id === editingId) ?? null;
  }, [allProfiles, editingId]);

  const loadProfiles = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAuthenticated(false);
      return;
    }
    setAuthenticated(true);

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profile) setOwnProfile(profile as Profile);

    const { data: stored } = await supabase
      .from("stored_profiles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (stored) setStoredProfiles(stored as StoredProfile[]);
  }, [supabase]);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  async function fetchChart(profile: UnifiedProfile) {
    setChartLoading(true);
    setChartError("");
    try {
      const coords = await fetchCoordsForCity(profile.city_of_birth);
      const resolvedTimezone = await fetchTimezoneForCoords(
        coords.latitude,
        coords.longitude
      );

      const payload = {
        date: profile.date_of_birth,
        time: profile.time_of_birth || "12:00",
        timezone: resolvedTimezone,
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: profile.city_of_birth,
        house_system: "placidus",
      };

      const res = await fetch("http://127.0.0.1:8000/api/v1/chart/natal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed: ${res.status} ${text}`);
      }

      const result: NatalChartResponse = await res.json();
      setChart(result);
      // Auto-open Sun so users see the panel is interactive
      setChartSelection({ type: "planet", name: "Sun" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setChartError(message);
      setChart(defaultChart);
    } finally {
      setChartLoading(false);
    }
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setChartSelection(null);
    const profile = allProfiles.find((p) => p.id === id);
    if (profile) fetchChart(profile);
  }

  function formValuesFromProfile(
    p: UnifiedProfile
  ): Partial<ProfileFormValues> {
    const [y, m, d] = p.date_of_birth.split("-").map(Number);
    return {
      firstName: p.first_name,
      dateOfBirth: new Date(y, m - 1, d),
      timeOfBirth: p.time_of_birth ?? "",
      city: p.city_of_birth,
      timezone: p.timezone || "America/New_York",
    };
  }

  async function handleCreateProfile(data: ProfileFormValues) {
    setFormLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const d = data.dateOfBirth!;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const { error } = await supabase.from("stored_profiles").insert({
        user_id: user.id,
        first_name: data.firstName,
        date_of_birth: dateStr,
        time_of_birth: data.timeOfBirth || null,
        city_of_birth: data.city,
      });

      if (error) throw error;

      await loadProfiles();
      setShowForm(false);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdateProfile(data: ProfileFormValues) {
    if (!editingId) return;
    setFormLoading(true);
    try {
      const d = data.dateOfBirth!;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const isOwn = editingProfile?.isOwn;
      const table = isOwn ? "profiles" : "stored_profiles";

      const updateData: Record<string, unknown> = {
        first_name: data.firstName,
        date_of_birth: dateStr,
        time_of_birth: data.timeOfBirth || null,
        city_of_birth: data.city,
        updated_at: new Date().toISOString(),
      };

      if (isOwn) {
        updateData.timezone = data.timezone;
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq("id", editingId);

      if (error) throw error;

      await loadProfiles();
      setEditingId(null);

      if (selectedId === editingId) {
        const updated = allProfiles.find((p) => p.id === editingId);
        if (updated) fetchChart(updated);
      }
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDeleteProfile(id: string) {
    const profile = allProfiles.find((p) => p.id === id);
    if (!profile || profile.isOwn) return;

    const { error } = await supabase
      .from("stored_profiles")
      .delete()
      .eq("id", id);

    if (error) return;

    if (selectedId === id) {
      setSelectedId(null);
      setChart(defaultChart);
      setChartSelection(null);
    }
    await loadProfiles();
  }

  const clickPanelKey = chartSelection
    ? `${chartSelection.type}-${chartSelection.name}`
    : null;

  return (
    <div className="min-h-screen bg-github-dark relative">
      <main className="relative pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold uppercase tracking-widest mb-4">
              <Compass className="w-3.5 h-3.5" />
              Natal Chart
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
              Your Cosmic{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Blueprint
              </span>
            </h1>
          </motion.div>

          {/* Top area: Chart + right column
              Mobile order: right column (profile card) first, then chart
              Desktop: chart left, right column right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* Left — Chart Wheel (below profile card on mobile) */}
            <motion.div
              className="flex items-center justify-center order-2 lg:order-1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <ChartWheel
                chart={chart}
                size={500}
                onElementClick={(type, name) =>
                  setChartSelection({ type, name })
                }
              />
            </motion.div>

            {/* Right — Profile card + desktop click panel (above chart on mobile) */}
            <motion.div
              className="order-1 lg:order-2 flex flex-col gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {authenticated === false && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
                  <p className="text-gray-400 mb-4">
                    Sign in to save and manage profiles.
                  </p>
                  <a
                    href="/sign-in"
                    className="inline-block rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500"
                  >
                    Sign in
                  </a>
                </div>
              )}

              {authenticated && !showForm && !editingId && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Add a Profile</h2>
                  </div>
                  <p className="text-sm text-gray-400 mb-5">
                    Create a profile to generate a natal chart. Enter birth
                    details and we&apos;ll compute planetary positions.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    New Profile
                  </button>
                </div>
              )}

              {authenticated && showForm && !editingId && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <h2 className="text-lg font-bold mb-4">New Profile</h2>
                  <ProfileForm
                    onSubmit={handleCreateProfile}
                    submitLabel="Create Profile"
                    loading={formLoading}
                    onCancel={() => setShowForm(false)}
                  />
                </div>
              )}

              {authenticated && editingId && editingProfile && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <h2 className="text-lg font-bold mb-4">
                    Edit {editingProfile.first_name}
                  </h2>
                  <ProfileForm
                    defaultValues={formValuesFromProfile(editingProfile)}
                    onSubmit={handleUpdateProfile}
                    submitLabel="Update"
                    loading={formLoading}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              )}

              {/* Click panel — desktop only (hidden on mobile) */}
              {chartSelection && clickPanelKey && (
                <div className="hidden lg:block">
                  <ChartClickPanel
                    key={clickPanelKey}
                    chart={chart}
                    selection={chartSelection}
                    onClose={() => setChartSelection(null)}
                  />
                </div>
              )}
            </motion.div>
          </div>

          {/* Click panel — mobile only, between chart and tables */}
          {chartSelection && clickPanelKey && (
            <div className="lg:hidden mb-8">
              <ChartClickPanel
                key={clickPanelKey + "-m"}
                chart={chart}
                selection={chartSelection}
                onClose={() => setChartSelection(null)}
              />
            </div>
          )}

          {/* Selected profile indicator + chart results tables */}
          {selectedProfile && (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">
                  Viewing chart for{" "}
                  <strong className="text-white">
                    {selectedProfile.first_name}
                  </strong>
                </span>
              </div>

              {chartError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-4">
                  {chartError}
                </div>
              )}

              {chartLoading ? (
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
                  <p className="text-sm text-gray-500">
                    Loading chart data…
                  </p>
                </div>
              ) : (
                <ChartResults
                  chart={chart}
                  profileName={selectedProfile.first_name}
                />
              )}
            </motion.div>
          )}

          {/* Profile list */}
          {authenticated && allProfiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Saved Profiles</h2>
                {!showForm && !editingId && (
                  <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-white/10 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProfiles.map((profile) => {
                  const isSelected = selectedId === profile.id;
                  return (
                    <div
                      key={profile.id}
                      onClick={() => handleSelect(profile.id)}
                      className={`relative rounded-xl border p-5 transition-all cursor-pointer group ${
                        isSelected
                          ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-sm font-bold">
                          {profile.first_name}
                        </h3>
                        {profile.isOwn && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-full px-2 py-0.5">
                            You
                          </span>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-gray-400">
                        <p>
                          Born {formatDisplayDate(profile.date_of_birth)}
                        </p>
                        {profile.time_of_birth && (
                          <p>at {profile.time_of_birth}</p>
                        )}
                        <p>{profile.city_of_birth}</p>
                      </div>

                      <div
                        className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingId(profile.id);
                            setShowForm(false);
                          }}
                          className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        {!profile.isOwn && (
                          <button
                            onClick={() => handleDeleteProfile(profile.id)}
                            className="flex items-center gap-1 rounded-md border border-red-500/20 bg-red-500/5 px-2 py-1 text-[11px] text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Empty state for authenticated users with no profiles */}
          {authenticated && allProfiles.length === 0 && !showForm && (
            <motion.div
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="text-gray-500 mb-4">
                No profiles yet. Create one to get started.
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Create Your First Profile
              </button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
