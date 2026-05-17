// needs form state and event handlers, so it's a client component
"use client";

// useState for managing form fields, loading, and error state
import { useState } from "react";
// useRouter to redirect the new user after sign-up completes
import { useRouter } from "next/navigation";
// browser-side Supabase client for calling the sign-up method
import { createClient } from "@/utils/supabase/client";
// Next.js Link for the sign-in link at the bottom
import Link from "next/link";
// icons for the header and input decorations
import { UserPlus, Mail, Lock } from "lucide-react";

export default function SignUpPage() {
  // controlled inputs for email and password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // holds any error message from Supabase to show to the user
  const [error, setError] = useState("");
  // disables the submit button while the request is in flight
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // one Supabase client instance for this component
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    // stop the browser from reloading the page on form submit
    e.preventDefault();
    setLoading(true);
    // clear any previous error before trying again
    setError("");

    // create a new Supabase auth account with the given credentials
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      // show the error (e.g. "Email already in use") and re-enable the button
      setError(error.message);
      setLoading(false);
    } else {
      // account created, send the user to onboarding to fill in their birth info
      router.push("/onboarding");
      // refresh so server components pick up the new auth session
      router.refresh();
    }
  }

  // shared input styles extracted so we don't repeat the same Tailwind classes twice
  const inputClass =
    "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50";

  return (
    //full-height centered layout with top padding to clear the navbar
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="w-full max-w-sm space-y-6">
        {/* page header with icon, title, and subtitle */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-sm text-gray-400">
            Sign up to save your natal charts and preferences.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* error banner, only rendered if there's actually an error */}
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {/* email input with an icon inset on the left */}
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

          {/* password input with a lock icon and minimum length enforced by HTML */}
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="password"
              placeholder="Password (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
            />
          </div>

          {/* submit button, dimmed and disabled while the request is pending */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-purple-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        {/* link back to sign-in for users who already have an account */}
        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
