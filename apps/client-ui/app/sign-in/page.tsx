// needs state and event handlers so it must be a client component
"use client";

// useState for managing the form fields, error message, and loading state
import { useState } from "react";
// browser-side Supabase client for calling auth methods
import { createClient } from "@/utils/supabase/client";
// useRouter lets us programmatically navigate after a successful login
import { useRouter } from "next/navigation";
// Next.js's Link component for the sign-up link at the bottom
import Link from "next/link";
// icons for the page header and input field decorations
import { LogIn, Mail, Lock } from "lucide-react";

export default function SignInPage() {
  // controlled inputs for the email and password fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // holds any error message returned from Supabase so we can show it to the user
  const [error, setError] = useState("");
  // disables the button and shows "Signing in..." while the auth request is in flight
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // create the Supabase client once for this component instance
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    // prevent the default browser form submission from reloading the page
    e.preventDefault();
    setLoading(true);
    // clear any previous error before trying again
    setError("");

    // attempt to sign in with email and password
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // surface the error to the user and re-enable the button
      setError(error.message);
      setLoading(false);
    } else {
      // success, send the user to their settings page
      router.push("/settings");
      // refresh so the server components pick up the new session cookies
      router.refresh();
    }
  }

  // shared Tailwind class for both input fields, extracted to avoid repetition
  const inputClass =
    "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50";

  return (
    // full-height centered layout with top padding to clear the navbar
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="w-full max-w-sm space-y-6">
        {/* page header with icon, title, and subtitle */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
            <LogIn className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-gray-400">
            Welcome back. Enter your credentials to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* show the error banner only when there's an error to display */}
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* email input with a mail icon positioned absolutely inside the field */}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* password input with a lock icon */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* submit button, dimmed while loading to prevent double-submits */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-purple-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* link to the sign-up page for new users */}
        <p className="text-center text-sm text-gray-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
