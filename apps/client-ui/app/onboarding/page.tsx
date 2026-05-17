// needs hooks for auth checking and form submission, so it's a client component
"use client";

// useEffect to check auth status on mount, useState for loading/error/checking state
import { useEffect, useState } from "react";
// useRouter for programmatic navigation after submit or if auth fails
import { useRouter } from "next/navigation";
// motion for the fade-in entrance animation on the form card
import { motion } from "motion/react";
// sparkles icon for the page header
import { Sparkles } from "lucide-react";
// browser-side Supabase client for auth and profile reads/writes
import { createClient } from "@/utils/supabase/client";
// the reusable profile form used in both onboarding and settings
import { ProfileForm } from "../components/ProfileForm";
// the type for the form's output values
import type { ProfileFormValues } from "@/utils/supabase/types";

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  // true while the form is saving, disables the submit button
  const [loading, setLoading] = useState(false);
  // true while we're verifying auth and checking for an existing profile
  // keeps the form hidden until we know it's safe to show
  const [checking, setChecking] = useState(true);
  // holds any error from the profile save operation
  const [error, setError] = useState("");

  useEffect(() => {
    // run this check as soon as the component mounts
    async function check() {
      // make sure the user is actually logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // if no session, send them to sign-in first
      if (!user) {
        router.push("/sign-in");
        return;
      }

      // check if this user already has a profile row in the database
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      // if a profile already exists, skip onboarding and go straight to the chart
      if (data) {
        router.push("/natal");
        return;
      }

      // no existing profile, so show the onboarding form
      setChecking(false);
    }
    check();
  }, [supabase, router]);

  // called when the user submits the ProfileForm with their birth details
  async function handleSubmit(data: ProfileFormValues) {
    setLoading(true);
    setError("");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      // bail early if somehow the session disappeared mid-flow
      if (!user) return;

      // format the Date object into a YYYY-MM-DD string for Supabase
      const d = data.dateOfBirth!;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      // insert a new profile row, time_of_birth is optional so we send null if blank
      const { error } = await supabase.from("profiles").insert({
        user_id: user.id,
        first_name: data.firstName,
        date_of_birth: dateStr,
        time_of_birth: data.timeOfBirth || null,
        city_of_birth: data.city,
        timezone: data.timezone,
      });

      // let the catch block handle Supabase errors the same way as other errors
      if (error) throw error;

      // profile saved, head to the natal chart page
      router.push("/natal");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      // always re-enable the button even if something went wrong
      setLoading(false);
    }
  }

  // show a minimal loading state while we verify auth and check for an existing profile
  if (checking) {
    return (
      <div className="min-h-screen bg-github-dark flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    // full-height centered layout with generous padding
    <div className="min-h-screen bg-github-dark flex items-center justify-center px-6 pt-20 pb-20">
      {/* fade and slide up on mount for a welcoming entrance */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* page header with sparkle icon and welcome copy */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome! Set up your profile</h1>
          <p className="text-sm text-gray-400">
            Enter your birth details to get started with your natal chart.
          </p>
        </div>

        {/* the frosted card that wraps the form */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          {/* only show the error banner if there's actually an error */}
          {error && (
            <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}
          {/* reuse the shared ProfileForm, passing a first-time-user submit label */}
          <ProfileForm
            onSubmit={handleSubmit}
            submitLabel="Get Started"
            loading={loading}
          />
        </div>
      </motion.div>
    </div>
  );
}
