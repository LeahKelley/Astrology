// manages multiple pieces of interactive state (editing, sorting, searching), so this is a client component
"use client";

// useCallback to stabilize loadProfiles, useEffect to load on mount, useMemo for derived list state, useState for all UI state
import { useCallback, useEffect, useMemo, useState } from "react";
// motion for card entrance/exit animations, AnimatePresence to handle layout shifts when profiles are added or removed
import { motion, AnimatePresence } from "motion/react";
// icons used throughout the page
import {
  ArrowDownAZ,      // sort by name A-Z
  ArrowUpAZ,        // sort by name Z-A
  CalendarArrowDown, // sort by date added (oldest first)
  CalendarArrowUp,  // sort by date added (newest first)
  Pencil,           // edit button
  Plus,             // new profile button
  Search,           // search input prefix icon
  Settings,         // page header icon
  Star,             // "Your Profile" badge
  Trash2,           // delete button
  User,             // profile avatar placeholder
  X,                // clear search input
} from "lucide-react";
// browser-side Supabase client for reading and writing profile data
import { createClient } from "@/utils/supabase/client";
// the reusable birth details form, shared with onboarding
import { ProfileForm } from "../components/ProfileForm";
// type imports for the profile shapes and form values
import type { Profile, ProfileFormValues, StoredProfile } from "@/utils/supabase/types";

// a flattened profile shape that combines own and stored profiles so the grid can render them uniformly
type UnifiedProfile = {
  id: string;
  first_name: string;
  date_of_birth: string;
  time_of_birth: string | null;
  city_of_birth: string;
  timezone?: string;        // only present on the user's own profile, not on stored profiles
  created_at: string;
  isOwn: boolean;           //true for the user's own profile, false for profiles saved for others
};

// the two fields the user can sort the profile grid by
type SortField = "name" | "date_added";
// which direction the current sort is running
type SortDir = "asc" | "desc";

// formats a YYYY-MM-DD birth date as "January 5, 1990" for display in profile cards
function formatDisplayDate(dateStr: string): string {
  // split and reconstruct as a Date to avoid timezone shifting from the Date constructor
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// formats an ISO timestamp as "Jan 5, 2024" for the "Added" subtitle on each profile card
function formatAddedDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// the settings page, showing the user's account info and a searchable/sortable grid of all their profiles
export default function SettingsPage() {
  const supabase = createClient();

  // the user's own profile row from the profiles table
  const [ownProfile, setOwnProfile] = useState<Profile | null>(null);
  // any profiles the user has saved for other people from the stored_profiles table
  const [storedProfiles, setStoredProfiles] = useState<StoredProfile[]>([]);
  // true while the initial data fetch is running
  const [loading, setLoading] = useState(true);
  // the user's email address, shown as a subtitle in the page header
  const [email, setEmail] = useState("");

  // the current text in the search box
  const [searchQuery, setSearchQuery] = useState("");
  // which field the profile grid is sorted by
  const [sortField, setSortField] = useState<SortField>("date_added");
  // whether that sort is ascending or descending
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // the ID of the profile whose edit form is currently open, null if none
  const [editingId, setEditingId] = useState<string | null>(null);
  // true when the create-new-profile form is visible
  const [showCreateForm, setShowCreateForm] = useState(false);
  // true while a create or update operation is saving, disables the submit button
  const [formLoading, setFormLoading] = useState(false);
  // the ID of the profile whose delete confirmation is currently showing, null if none
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // load the current user's own profile and all stored profiles in parallel
  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // not logged in, nothing to show
    if (!user) return;
    setEmail(user.email ?? "");

    // fetch both tables at once to reduce wait time
    const [{ data: own }, { data: stored }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase
        .from("stored_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true }),
    ]);

    if (own) setOwnProfile(own as Profile);
    if (stored) setStoredProfiles(stored as StoredProfile[]);
    setLoading(false);
  }, [supabase]);

  // load once on mount
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // merge the user's own profile and stored profiles into one unified list for the grid
  const allProfiles = useMemo<UnifiedProfile[]>(() => {
    const list: UnifiedProfile[] = [];
    // always put the user's own profile first so it appears at the top
    if (ownProfile) {
      list.push({
        id: ownProfile.id,
        first_name: ownProfile.first_name,
        date_of_birth: ownProfile.date_of_birth,
        time_of_birth: ownProfile.time_of_birth,
        city_of_birth: ownProfile.city_of_birth,
        timezone: ownProfile.timezone,
        created_at: ownProfile.created_at,
        isOwn: true,
      });
    }
    // append any profiles for other people
    for (const sp of storedProfiles) {
      list.push({
        id: sp.id,
        first_name: sp.first_name,
        date_of_birth: sp.date_of_birth,
        time_of_birth: sp.time_of_birth,
        city_of_birth: sp.city_of_birth,
        created_at: sp.created_at,
        isOwn: false,
      });
    }
    return list;
  }, [ownProfile, storedProfiles]);

  // apply the current search query and sort settings to the unified profile list
  const filteredAndSorted = useMemo(() => {
    let list = allProfiles;

    // filter by first name or city, case-insensitive
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.first_name.toLowerCase().includes(q) ||
          p.city_of_birth.toLowerCase().includes(q)
      );
    }

    // sort by the selected field and direction
    list = [...list].sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.first_name.localeCompare(b.first_name);
        return sortDir === "asc" ? cmp : -cmp;
      }
      // sort by creation timestamp (milliseconds)
      const cmp =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [allProfiles, searchQuery, sortField, sortDir]);

  // the full profile object for whichever edit form is currently open
  const editingProfile = useMemo(
    () => allProfiles.find((p) => p.id === editingId) ?? null,
    [allProfiles, editingId]
  );

  // converts a UnifiedProfile back into the shape ProfileForm expects as defaultValues
  function formValuesFromProfile(
    p: UnifiedProfile
  ): Partial<ProfileFormValues> {
    // reconstruct as a Date object so the DayPicker shows the correct pre-selected date
    const [y, m, d] = p.date_of_birth.split("-").map(Number);
    return {
      firstName: p.first_name,
      dateOfBirth: new Date(y, m - 1, d),
      timeOfBirth: p.time_of_birth ?? "",
      city: p.city_of_birth,
      // fall back to Eastern if timezone is unknown so the hidden field has a valid value
      timezone: p.timezone || "America/New_York",
    };
  }

  // handles creating a new stored profile row in Supabase
  async function handleCreate(data: ProfileFormValues) {
    setFormLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // convert the Date object to YYYY-MM-DD string format that the database expects
      const d = data.dateOfBirth!;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const { error } = await supabase.from("stored_profiles").insert({
        user_id: user.id,
        first_name: data.firstName,
        date_of_birth: dateStr,
        // store null instead of an empty string if the user left birth time blank
        time_of_birth: data.timeOfBirth || null,
        city_of_birth: data.city,
      });

      if (error) throw error;
      // reload the list so the new card appears in the grid
      await loadProfiles();
      setShowCreateForm(false);
    } finally {
      setFormLoading(false);
    }
  }

  // handles saving edits to an existing profile (either the user's own or a stored one)
  async function handleUpdate(data: ProfileFormValues) {
    if (!editingId || !editingProfile) return;
    setFormLoading(true);
    try {
      const d = data.dateOfBirth!;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      // pick the right table based on whether we're editing the user's own profile or someone else's
      const table = editingProfile.isOwn ? "profiles" : "stored_profiles";
      const updateData: Record<string, unknown> = {
        first_name: data.firstName,
        date_of_birth: dateStr,
        time_of_birth: data.timeOfBirth || null,
        city_of_birth: data.city,
        updated_at: new Date().toISOString(),
      };
      // only write the timezone field when editing the user's own profile, stored profiles don't have it
      if (editingProfile.isOwn) updateData.timezone = data.timezone;

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq("id", editingId);

      if (error) throw error;
      await loadProfiles();
      setEditingId(null);
    } finally {
      setFormLoading(false);
    }
  }

  // handles deleting a stored profile after the user confirms
  async function handleDelete(id: string) {
    const profile = allProfiles.find((p) => p.id === id);
    // block deletion of the user's own profile, they can only delete stored ones
    if (!profile || profile.isOwn) return;

    const { error } = await supabase
      .from("stored_profiles")
      .delete()
      .eq("id", id);

    if (!error) {
      await loadProfiles();
      // if the deleted profile happened to be in the edit form, close the form too
      if (editingId === id) setEditingId(null);
    }
    // always dismiss the confirmation UI whether or not the delete succeeded
    setDeleteConfirmId(null);
  }

  // toggles between the two sort directions if the same field is clicked again, or switches to the new field
  function toggleSort(field: SortField) {
    if (sortField === field) {
      // same field clicked, flip the direction
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      // new field, default to ascending
      setSortField(field);
      setSortDir("asc");
    }
  }

  // show a minimal loading screen while the initial profile fetch is in progress
  if (loading) {
    return (
      <div className="min-h-screen bg-github-dark flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-github-dark pt-28 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* fade-up entrance animation wraps the whole page content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* page header: settings icon, page title, and the user's email */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              {/* show the user's email address as a subtle subtitle */}
              {email && (
                <p className="text-sm text-gray-500">{email}</p>
              )}
            </div>
          </div>

          {/* profiles section header: title with total count and the "New Profile" button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold">
              Profiles{" "}
              <span className="text-sm font-normal text-gray-500">
                ({allProfiles.length})
              </span>
            </h2>

            {/* hide the "New Profile" button when a form is already open */}
            {!showCreateForm && !editingId && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Profile
              </button>
            )}
          </div>

          {/* the create-new-profile form, slides down when showCreateForm is true */}
          <AnimatePresence>
            {showCreateForm && !editingId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                // overflow-hidden lets the height animation clip the content as it collapses
                className="overflow-hidden mb-6"
              >
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-lg font-bold mb-4">New Profile</h3>
                  <ProfileForm
                    onSubmit={handleCreate}
                    submitLabel="Create Profile"
                    loading={formLoading}
                    onCancel={() => setShowCreateForm(false)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* the edit-profile form, slides down when editingId is set */}
          <AnimatePresence>
            {editingId && editingProfile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  {/* personalize the heading with the profile's first name */}
                  <h3 className="text-lg font-bold mb-4">
                    Edit {editingProfile.first_name}
                  </h3>
                  {/* pre-fill the form with the profile's existing values */}
                  <ProfileForm
                    defaultValues={formValuesFromProfile(editingProfile)}
                    onSubmit={handleUpdate}
                    submitLabel="Update"
                    loading={formLoading}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* search bar and sort buttons, only shown when there are profiles to filter */}
          {allProfiles.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              {/* search field with an icon prefix and an "x" clear button */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or city…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] pl-10 pr-9 py-2.5 text-sm text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:border-white/20"
                />
                {/* clear button only appears when there is text to clear */}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* sort toggle buttons, highlighted purple when their field is currently active */}
              <div className="flex gap-2">
                <button
                  onClick={() => toggleSort("name")}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    sortField === "name"
                      ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
                      : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {/* swap between the two directional icons based on current sort direction */}
                  {sortField === "name" && sortDir === "desc" ? (
                    <ArrowUpAZ className="w-3.5 h-3.5" />
                  ) : (
                    <ArrowDownAZ className="w-3.5 h-3.5" />
                  )}
                  Name
                </button>
                <button
                  onClick={() => toggleSort("date_added")}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    sortField === "date_added"
                      ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
                      : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {sortField === "date_added" && sortDir === "desc" ? (
                    <CalendarArrowUp className="w-3.5 h-3.5" />
                  ) : (
                    <CalendarArrowDown className="w-3.5 h-3.5" />
                  )}
                  Date Added
                </button>
              </div>
            </div>
          )}

          {/* three-state content area: the grid, an empty-search message, or a first-time empty state */}
          {filteredAndSorted.length > 0 ? (
            /* profile cards grid, uses popLayout so cards animate in and out when search filters change */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredAndSorted.map((profile) => (
                  <motion.div
                    key={profile.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`relative rounded-xl border p-5 transition-all group ${
                      // the user's own profile gets a purple ring to make it stand out
                      profile.isOwn
                        ? "border-purple-500/40 bg-purple-500/5 ring-1 ring-purple-500/20"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    {/* "Your Profile" badge in the top-right corner, only on the user's own card */}
                    {profile.isOwn && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-purple-600/90 rounded-full px-2.5 py-1">
                        <Star className="w-3 h-3 text-white fill-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Your Profile
                        </span>
                      </div>
                    )}

                    {/* avatar circle and profile name with the "added" date subtitle */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          // own profile gets a solid purple avatar, others get a translucent grey one
                          profile.isOwn
                            ? "bg-purple-600"
                            : "bg-white/10"
                        }`}
                      >
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        {/* truncate long names so they don't overflow the card */}
                        <h3 className="text-sm font-bold truncate">
                          {profile.first_name}
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Added {formatAddedDate(profile.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* birth details: date, optional time, and city */}
                    <div className="space-y-1.5 text-xs text-gray-400 mb-4">
                      <p>
                        <span className="text-gray-500">Born:</span>{" "}
                        {formatDisplayDate(profile.date_of_birth)}
                      </p>
                      {/* only show the time row if we have a birth time */}
                      {profile.time_of_birth && (
                        <p>
                          <span className="text-gray-500">Time:</span>{" "}
                          {profile.time_of_birth}
                        </p>
                      )}
                      <p>
                        <span className="text-gray-500">City:</span>{" "}
                        {profile.city_of_birth}
                      </p>
                    </div>

                    {/* card action buttons: edit (always shown), delete (stored profiles only) */}
                    <div className="flex gap-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => {
                          setEditingId(profile.id);
                          // close the create form if it happens to be open at the same time
                          setShowCreateForm(false);
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      {/* only stored profiles can be deleted, the user's own profile is permanent */}
                      {!profile.isOwn && (
                        <>
                          {/* two-step delete: first click shows confirm/cancel, second click fires handleDelete */}
                          {deleteConfirmId === profile.id ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleDelete(profile.id)}
                                className="rounded-md bg-red-600 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-red-500 transition-colors cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-gray-400 hover:text-white transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(profile.id)}
                              className="flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-[11px] font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : allProfiles.length > 0 ? (
            /* search returned no matches, show a message with the query they typed */
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-sm text-gray-500">
                No profiles match &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            /* no profiles at all yet, prompt the user to create their first one */
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-sm text-gray-400 mb-4">
                You haven&apos;t created any profiles yet.
              </p>
              {/* only show this fallback CTA if the create form isn't already open */}
              {!showCreateForm && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Profile
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
