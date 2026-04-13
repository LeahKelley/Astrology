"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import { User } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ProfileForm } from "../components/ProfileForm";
import type { Profile, ProfileFormValues } from "@/utils/supabase/types";

export default function ProfilePage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email ?? "");

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) setProfile(data as Profile);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  function formValuesFromProfile(p: Profile): Partial<ProfileFormValues> {
    const [y, m, d] = p.date_of_birth.split("-").map(Number);
    return {
      firstName: p.first_name,
      dateOfBirth: new Date(y, m - 1, d),
      timeOfBirth: p.time_of_birth ?? "",
      city: p.city_of_birth,
      timezone: p.timezone,
    };
  }

  async function handleUpdate(data: ProfileFormValues) {
    if (!profile) return;
    setSaving(true);
    try {
      const d = data.dateOfBirth!;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: data.firstName,
          date_of_birth: dateStr,
          time_of_birth: data.timeOfBirth || null,
          city_of_birth: data.city,
          timezone: data.timezone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) throw error;

      await loadProfile();
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  function formatDisplayDate(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
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
      <div className="max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {profile ? profile.first_name : "Your Profile"}
              </h1>
              {email && (
                <p className="text-sm text-gray-500">{email}</p>
              )}
            </div>
          </div>

          {/* No profile yet */}
          {!profile && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <p className="text-sm text-gray-400 mb-4">
                You haven&apos;t set up your profile yet. Add your birth
                details so they appear in your natal chart.
              </p>
              <ProfileForm
                onSubmit={async (data) => {
                  setSaving(true);
                  try {
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();
                    if (!user) return;

                    const d = data.dateOfBirth!;
                    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

                    const { error } = await supabase.from("profiles").insert({
                      user_id: user.id,
                      first_name: data.firstName,
                      date_of_birth: dateStr,
                      time_of_birth: data.timeOfBirth || null,
                      city_of_birth: data.city,
                      timezone: data.timezone,
                    });

                    if (error) throw error;
                    await loadProfile();
                  } finally {
                    setSaving(false);
                  }
                }}
                submitLabel="Save Profile"
                loading={saving}
              />
            </div>
          )}

          {/* Profile display */}
          {profile && !editing && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Name
                  </span>
                  <p className="text-sm text-white mt-0.5">
                    {profile.first_name}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date of Birth
                  </span>
                  <p className="text-sm text-white mt-0.5">
                    {formatDisplayDate(profile.date_of_birth)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time of Birth
                  </span>
                  <p className="text-sm text-white mt-0.5">
                    {profile.time_of_birth ?? "Not provided"}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City of Birth
                  </span>
                  <p className="text-sm text-white mt-0.5">
                    {profile.city_of_birth}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEditing(true)}
                className="mt-6 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          )}

          {/* Profile edit */}
          {profile && editing && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="text-lg font-bold mb-4">Edit Profile</h2>
              <ProfileForm
                defaultValues={formValuesFromProfile(profile)}
                onSubmit={handleUpdate}
                submitLabel="Update"
                loading={saving}
                onCancel={() => setEditing(false)}
              />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
