// manages profile selection, form states, chart fetching, and click interactions, so this is a client component
"use client";

// useCallback to stabilize loadProfiles, useEffect to load on mount, useMemo for derived profile state, useState for everything else
import { useCallback, useEffect, useMemo, useState } from "react";
// motion for the page entrance animations
import { motion } from "motion/react";
// icons used in the profile cards and page chrome
import {
  Check,    // checkmark on the selected profile card and the "viewing chart for" label
  Compass,  // icon in the "Natal Chart" pill above the page title
  Pencil,   // edit button on profile cards
  Plus,     // add profile button
  Trash2,   // delete button on profile cards
} from "lucide-react";
// browser-side Supabase client for reading profiles
import { createClient } from "@/utils/supabase/client";
// type imports for the two profile shapes and the form value shape
import type {
  Profile,
  ProfileFormValues,
  StoredProfile,
} from "@/utils/supabase/types";
// the SVG chart wheel component
import { ChartWheel } from "../components/ChartWheel";
// the reusable birth details form
import { ProfileForm } from "../components/ProfileForm";
// the four tabular data panels below the chart wheel
import { ChartResults } from "../components/ChartResults";
// the response shape that ChartWheel, ChartResults, and ChartClickPanel all share
import type { NatalChartResponse } from "../components/ChartResults";
// the side panel that opens when the user clicks a planet or sign on the wheel
import { ChartClickPanel } from "../components/ChartClickPanel";
// the selection state type that tracks which element was clicked
import type { ChartSelection } from "../components/ChartClickPanel";
// the base URLs for the ephemeris and geolocation services
import { EPHEMERIS_API, GEO_API } from "@/lib/api";

// geocodes a city name to lat/lng using the geolocation service
async function fetchCoordsForCity(
  city: string
): Promise<{ latitude: number; longitude: number }> {
  const res = await fetch(
    `${GEO_API}/location/geolocation?address=${encodeURIComponent(city)}`
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Geolocation failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  // the API returns an array of results, we take the first (best) match
  const first = data["Latitude and Longitude"]?.[0];

  if (!first) {
    throw new Error("City not found by geolocation service.");
  }

  return { latitude: first.latitude, longitude: first.longitude };
}

// looks up the IANA timezone identifier for a given lat/lng pair
async function fetchTimezoneForCoords(
  latitude: number,
  longitude: number
): Promise<string> {
  const res = await fetch(
    `${GEO_API}/location/geolocation/timezone?lat=${latitude}&lng=${longitude}`
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

// a flattened profile shape that lets the page treat own and stored profiles the same way
type UnifiedProfile = {
  id: string;
  first_name: string;
  date_of_birth: string;
  time_of_birth: string | null;
  city_of_birth: string;
  timezone?: string;   // only set on own profiles, used for the ephemeris request
  isOwn: boolean;      // true for the user's own profile row from the profiles table
};

// converts a Profile (own) into the unified shape with isOwn set to true
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

// converts a StoredProfile (someone else) into the unified shape with isOwn set to false
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

// formats a YYYY-MM-DD birth date as "Jan 5, 1990" for the compact profile card display
function formatDisplayDate(dateStr: string): string {
  // split instead of passing directly to Date to avoid timezone offset shifting the day
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// an empty chart object used as the initial state and as the fallback when a fetch fails
const defaultChart: NatalChartResponse = {
  bodies: [],
  houses: [],
  aspects: [],
};

// the natal chart page, the main feature page of the app
export default function NatalChartPage() {
  const supabase = createClient();

  // the logged-in user's own profile from the profiles table
  const [ownProfile, setOwnProfile] = useState<Profile | null>(null);
  // any profiles the user has saved for other people
  const [storedProfiles, setStoredProfiles] = useState<StoredProfile[]>([]);
  // the ID of the currently selected profile whose chart is being shown
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // true when the create-new-profile form is visible above the chart
  const [showForm, setShowForm] = useState(false);
  // the ID of the profile whose edit form is open, null if none
  const [editingId, setEditingId] = useState<string | null>(null);
  // true while a create or update operation is saving
  const [formLoading, setFormLoading] = useState(false);
  // the natal chart data currently being displayed on the wheel and in the tables
  const [chart, setChart] = useState<NatalChartResponse>(defaultChart);
  // true while the ephemeris and geocoding API calls are in flight
  const [chartLoading, setChartLoading] = useState(false);
  // an error message to show the user if any step of the chart fetch fails
  const [chartError, setChartError] = useState("");
  // null = auth check pending, false = logged out, true = logged in
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  // the planet or sign the user most recently clicked on the chart wheel
  const [chartSelection, setChartSelection] = useState<ChartSelection | null>(null);

  // merge own and stored profiles into one flat list in a stable order
  const allProfiles = useMemo(() => {
    const list: UnifiedProfile[] = [];
    if (ownProfile) list.push(toUnified(ownProfile));
    // stored profiles are appended after the own profile
    list.push(...storedProfiles.map(storedToUnified));
    return list;
  }, [ownProfile, storedProfiles]);

  // the full profile object for whichever profile is currently selected
  const selectedProfile = useMemo(
    () => allProfiles.find((p) => p.id === selectedId) ?? null,
    [allProfiles, selectedId]
  );

  // the full profile object for whichever profile is currently being edited
  const editingProfile = useMemo(() => {
    if (!editingId) return null;
    return allProfiles.find((p) => p.id === editingId) ?? null;
  }, [allProfiles, editingId]);

  // fetches both profile tables and updates component state
  const loadProfiles = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      // mark as unauthenticated so the sign-in prompt is shown
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

  // load profiles once on mount
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // orchestrates the full chart calculation: geocode city -> get timezone -> call ephemeris API
  async function fetchChart(profile: UnifiedProfile) {
    setChartLoading(true);
    setChartError("");
    try {
      // step 1: convert the city name to lat/lng
      const coords = await fetchCoordsForCity(profile.city_of_birth);
      // step 2: look up the IANA timezone for those coordinates
      const resolvedTimezone = await fetchTimezoneForCoords(
        coords.latitude,
        coords.longitude
      );

      // step 3: request the full natal chart from the ephemeris service
      const payload = {
        date: profile.date_of_birth,
        // fall back to solar noon if birth time is unknown
        time: profile.time_of_birth || "12:00",
        timezone: resolvedTimezone,
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: profile.city_of_birth,
        // Placidus is the most commonly used house system in modern Western astrology
        house_system: "placidus",
      };

      const res = await fetch(`${EPHEMERIS_API}/api/v1/chart/natal`, {
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
      // auto-open the Sun in the click panel so new users immediately see that the wheel is interactive
      setChartSelection({ type: "planet", name: "Sun" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setChartError(message);
      // reset the chart to empty so the wheel and tables don't show stale data
      setChart(defaultChart);
    } finally {
      setChartLoading(false);
    }
  }

  // called when the user clicks a profile card, clears the previous selection and fetches the new chart
  function handleSelect(id: string) {
    setSelectedId(id);
    // clear the click panel selection so it doesn't carry over from the previous profile
    setChartSelection(null);
    const profile = allProfiles.find((p) => p.id === id);
    if (profile) fetchChart(profile);
  }

  // converts a UnifiedProfile back into the shape ProfileForm expects as defaultValues
  function formValuesFromProfile(
    p: UnifiedProfile
  ): Partial<ProfileFormValues> {
    // reconstruct as a Date so DayPicker shows the correct pre-selected date
    const [y, m, d] = p.date_of_birth.split("-").map(Number);
    return {
      firstName: p.first_name,
      dateOfBirth: new Date(y, m - 1, d),
      timeOfBirth: p.time_of_birth ?? "",
      city: p.city_of_birth,
      timezone: p.timezone || "America/New_York",
    };
  }

  // handles creating a new stored profile row in Supabase
  async function handleCreateProfile(data: ProfileFormValues) {
    setFormLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // convert the Date object to YYYY-MM-DD string for the database
      const d = data.dateOfBirth!;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const { error } = await supabase.from("stored_profiles").insert({
        user_id: user.id,
        first_name: data.firstName,
        date_of_birth: dateStr,
        // store null instead of empty string if birth time wasn't entered
        time_of_birth: data.timeOfBirth || null,
        city_of_birth: data.city,
      });

      if (error) throw error;

      // reload the list so the new card appears in the grid immediately
      await loadProfiles();
      setShowForm(false);
    } finally {
      setFormLoading(false);
    }
  }

  // handles saving edits to an existing profile (own or stored)
  async function handleUpdateProfile(data: ProfileFormValues) {
    if (!editingId) return;
    setFormLoading(true);
    try {
      const d = data.dateOfBirth!;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      // pick the right table depending on which type of profile we're editing
      const isOwn = editingProfile?.isOwn;
      const table = isOwn ? "profiles" : "stored_profiles";

      const updateData: Record<string, unknown> = {
        first_name: data.firstName,
        date_of_birth: dateStr,
        time_of_birth: data.timeOfBirth || null,
        city_of_birth: data.city,
        updated_at: new Date().toISOString(),
      };

      // the timezone field only exists on the own profile table
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

      // if the profile that was just edited is also the currently selected one, re-fetch its chart
      if (selectedId === editingId) {
        const updated = allProfiles.find((p) => p.id === editingId);
        if (updated) fetchChart(updated);
      }
    } finally {
      setFormLoading(false);
    }
  }

  // handles deleting a stored profile, guarded against accidentally deleting the own profile
  async function handleDeleteProfile(id: string) {
    const profile = allProfiles.find((p) => p.id === id);
    // the user's own profile is permanent and cannot be deleted from this page
    if (!profile || profile.isOwn) return;

    const { error } = await supabase
      .from("stored_profiles")
      .delete()
      .eq("id", id);

    if (error) return;

    // if the deleted profile was being viewed, clear the chart and selection
    if (selectedId === id) {
      setSelectedId(null);
      setChart(defaultChart);
      setChartSelection(null);
    }
    await loadProfiles();
  }

  // a stable string key for the click panel that changes whenever the user clicks a different element
  const clickPanelKey = chartSelection
    ? `${chartSelection.type}-${chartSelection.name}`
    : null;

  return (
    <div className="min-h-screen bg-github-dark relative">
      <main className="relative pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">

          {/* page header: the "Natal Chart" pill badge and the gradient "Cosmic Blueprint" title */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* decorative pill that labels the page type */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold uppercase tracking-widest mb-4">
              <Compass className="w-3.5 h-3.5" />
              Natal Chart
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight">
              Your Cosmic{" "}
              {/* the gradient text effect on "Blueprint" */}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Blueprint
              </span>
            </h1>
          </motion.div>

          {/* two-column layout: chart wheel on the left, profile card and click panel on the right
              on mobile the right column (profile card) moves above the chart via order-1/order-2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

            {/* left: the chart wheel, takes up order-2 on mobile so it renders below the profile card */}
            <motion.div
              className="flex items-center justify-center order-2 lg:order-1"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <ChartWheel
                chart={chart}
                size={500}
                // when the user clicks a planet or sign on the wheel, update the selection state
                onElementClick={(type, name) =>
                  setChartSelection({ type, name })
                }
              />
            </motion.div>

            {/* right: the profile/form area, takes order-1 on mobile so it renders above the chart */}
            <motion.div
              className="order-1 lg:order-2 flex flex-col gap-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* sign-in prompt shown when the user is not authenticated */}
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

              {/* default card shown to logged-in users when no form is open, with a "New Profile" button */}
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

              {/* create-new-profile form, shown when showForm is true */}
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

              {/* edit-profile form, shown when an editingId is set */}
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

              {/* the click panel on desktop, hidden on mobile (shown separately between chart and tables) */}
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

          {/* click panel on mobile only, placed between the chart wheel and the data tables */}
          {chartSelection && clickPanelKey && (
            <div className="lg:hidden mb-8">
              {/* the "-m" suffix on the key ensures the mobile panel is a separate instance from the desktop one */}
              <ChartClickPanel
                key={clickPanelKey + "-m"}
                chart={chart}
                selection={chartSelection}
                onClose={() => setChartSelection(null)}
              />
            </div>
          )}

          {/* the "Viewing chart for X" indicator and the four data tables, only shown when a profile is selected */}
          {selectedProfile && (
            <motion.div
              className="mb-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* the selected profile banner with the checkmark and name */}
              <div className="flex items-center gap-2 mb-4">
                <Check className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">
                  Viewing chart for{" "}
                  <strong className="text-white">
                    {selectedProfile.first_name}
                  </strong>
                </span>
              </div>

              {/* error banner shown if any step of the chart calculation failed */}
              {chartError && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 mb-4">
                  {chartError}
                </div>
              )}

              {/* show a loading placeholder while the chart APIs are running */}
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

          {/* the saved profiles grid at the bottom of the page, only shown when logged in and profiles exist */}
          {authenticated && allProfiles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Saved Profiles</h2>
                {/* the secondary "Add" button in the section header, only shown when no form is already open */}
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

              {/* responsive grid of profile cards, 1/2/3 columns at sm/lg breakpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProfiles.map((profile) => {
                  const isSelected = selectedId === profile.id;
                  return (
                    <div
                      key={profile.id}
                      // clicking anywhere on the card selects that profile and fetches its chart
                      onClick={() => handleSelect(profile.id)}
                      className={`relative rounded-xl border p-5 transition-all cursor-pointer group ${
                        // highlight the selected card with a purple ring
                        isSelected
                          ? "border-purple-500 bg-purple-500/10 ring-1 ring-purple-500/30"
                          : "border-white/10 bg-white/[0.03] hover:border-white/20"
                      }`}
                    >
                      {/* checkmark badge in the top-right corner for the currently selected profile */}
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}

                      {/* profile name with a "You" badge for the user's own profile */}
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

                      {/* birth details: date, optional time, and city */}
                      <div className="space-y-1 text-xs text-gray-400">
                        <p>
                          Born {formatDisplayDate(profile.date_of_birth)}
                        </p>
                        {/* only show the time line if a birth time was saved */}
                        {profile.time_of_birth && (
                          <p>at {profile.time_of_birth}</p>
                        )}
                        <p>{profile.city_of_birth}</p>
                      </div>

                      {/* edit/delete action buttons, fade in on card hover */}
                      <div
                        className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        // stop propagation so clicking the buttons doesn't also trigger the card's onClick
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setEditingId(profile.id);
                            // close the create form if it's open
                            setShowForm(false);
                          }}
                          className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                          Edit
                        </button>
                        {/* only stored profiles can be deleted, own profile is permanent */}
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

          {/* empty state for authenticated users who haven't created any profiles yet */}
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
