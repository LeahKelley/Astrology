"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { ProfileForm } from "../components/ProfileForm";
import type { ProfileFormValues } from "@/utils/supabase/types";

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/sign-in");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (data) {
        router.push("/natal");
        return;
      }

      setChecking(false);
    }
    check();
  }, [supabase, router]);

  async function handleSubmit(data: ProfileFormValues) {
    setLoading(true);
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

      router.push("/natal");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-github-dark flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-github-dark flex items-center justify-center px-6 pt-20 pb-20">
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome! Set up your profile</h1>
          <p className="text-sm text-gray-400">
            Enter your birth details to get started with your natal chart.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
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
