"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  CalendarArrowDown,
  CalendarArrowUp,
  Pencil,
  Plus,
  Search,
  Settings,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ProfileForm } from "../components/ProfileForm";
import type { Profile, ProfileFormValues, StoredProfile } from "@/utils/supabase/types";

type UnifiedProfile = {
  id: string;
  first_name: string;
  date_of_birth: string;
  time_of_birth: string | null;
  city_of_birth: string;
  timezone?: string;
  created_at: string;
  isOwn: boolean;
};

type SortField = "name" | "date_added";
type SortDir = "asc" | "desc";

function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatAddedDate(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SettingsPage() {
  const supabase = createClient();

  const [ownProfile, setOwnProfile] = useState<Profile | null>(null);
  const [storedProfiles, setStoredProfiles] = useState<StoredProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("date_added");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email ?? "");

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

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const allProfiles = useMemo<UnifiedProfile[]>(() => {
    const list: UnifiedProfile[] = [];
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

  const filteredAndSorted = useMemo(() => {
    let list = allProfiles;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.first_name.toLowerCase().includes(q) ||
          p.city_of_birth.toLowerCase().includes(q)
      );
    }

    list = [...list].sort((a, b) => {
      if (sortField === "name") {
        const cmp = a.first_name.localeCompare(b.first_name);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [allProfiles, searchQuery, sortField, sortDir]);

  const editingProfile = useMemo(
    () => allProfiles.find((p) => p.id === editingId) ?? null,
    [allProfiles, editingId]
  );

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

  async function handleCreate(data: ProfileFormValues) {
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
      setShowCreateForm(false);
    } finally {
      setFormLoading(false);
    }
  }

  async function handleUpdate(data: ProfileFormValues) {
    if (!editingId || !editingProfile) return;
    setFormLoading(true);
    try {
      const d = data.dateOfBirth!;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const table = editingProfile.isOwn ? "profiles" : "stored_profiles";
      const updateData: Record<string, unknown> = {
        first_name: data.firstName,
        date_of_birth: dateStr,
        time_of_birth: data.timeOfBirth || null,
        city_of_birth: data.city,
        updated_at: new Date().toISOString(),
      };
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

  async function handleDelete(id: string) {
    const profile = allProfiles.find((p) => p.id === id);
    if (!profile || profile.isOwn) return;

    const { error } = await supabase
      .from("stored_profiles")
      .delete()
      .eq("id", id);

    if (!error) {
      await loadProfiles();
      if (editingId === id) setEditingId(null);
    }
    setDeleteConfirmId(null);
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
              <Settings className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              {email && (
                <p className="text-sm text-gray-500">{email}</p>
              )}
            </div>
          </div>

          {/* Profiles Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold">
              Profiles{" "}
              <span className="text-sm font-normal text-gray-500">
                ({allProfiles.length})
              </span>
            </h2>

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

          {/* Create Form */}
          <AnimatePresence>
            {showCreateForm && !editingId && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
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

          {/* Edit Form */}
          <AnimatePresence>
            {editingId && editingProfile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                  <h3 className="text-lg font-bold mb-4">
                    Edit {editingProfile.first_name}
                  </h3>
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

          {/* Search & Sort Bar */}
          {allProfiles.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search by name or city…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/[0.04] pl-10 pr-9 py-2.5 text-sm text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/50 hover:border-white/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleSort("name")}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                    sortField === "name"
                      ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
                      : "border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
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

          {/* Profile Cards Grid */}
          {filteredAndSorted.length > 0 ? (
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
                      profile.isOwn
                        ? "border-purple-500/40 bg-purple-500/5 ring-1 ring-purple-500/20"
                        : "border-white/10 bg-white/[0.03] hover:border-white/20"
                    }`}
                  >
                    {/* Your Profile Badge */}
                    {profile.isOwn && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-purple-600/90 rounded-full px-2.5 py-1">
                        <Star className="w-3 h-3 text-white fill-white" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Your Profile
                        </span>
                      </div>
                    )}

                    {/* Avatar + Name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          profile.isOwn
                            ? "bg-purple-600"
                            : "bg-white/10"
                        }`}
                      >
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate">
                          {profile.first_name}
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Added {formatAddedDate(profile.created_at)}
                        </p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs text-gray-400 mb-4">
                      <p>
                        <span className="text-gray-500">Born:</span>{" "}
                        {formatDisplayDate(profile.date_of_birth)}
                      </p>
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

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => {
                          setEditingId(profile.id);
                          setShowCreateForm(false);
                        }}
                        className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-medium text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      {!profile.isOwn && (
                        <>
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
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-sm text-gray-500">
                No profiles match &quot;{searchQuery}&quot;
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <p className="text-sm text-gray-400 mb-4">
                You haven&apos;t created any profiles yet.
              </p>
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
