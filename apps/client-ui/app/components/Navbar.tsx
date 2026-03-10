"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Compass,
  LogOut,
  Menu,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const navLinkClass =
    "hover:text-white transition-colors flex items-center gap-2 text-sm font-medium text-gray-400";

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || menuOpen
          ? "bg-github-dark/80 backdrop-blur-lg border-b border-white/10 py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">
            Placeholder
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="/natal" className={navLinkClass}>
            <Compass className="w-4 h-4" /> Natal Chart
          </Link>
          <Link href="/resources" className={navLinkClass}>
            <BookOpen className="w-4 h-4" /> Resources
          </Link>
          <div className="h-4 w-px bg-github-border mx-2" />

          {user ? (
            <>
              <Link
                href="/profile"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors"
                title={user.email ?? "Profile"}
              >
                <User className="w-4 h-4 text-white" />
              </Link>
              <button onClick={handleSignOut} className={navLinkClass}>
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/sign-in" className={navLinkClass}>
                <User className="w-4 h-4" /> Sign in
              </Link>
              <Link
                href="/sign-up"
                className="bg-white text-github-dark px-4 py-2 rounded-md font-semibold hover:bg-gray-200 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 mt-3 px-6 py-4 space-y-4 bg-github-dark/95 backdrop-blur-lg">
          <Link
            href="/natal"
            onClick={() => setMenuOpen(false)}
            className={navLinkClass}
          >
            <Compass className="w-4 h-4" /> Natal Chart
          </Link>
          <Link
            href="/resources"
            onClick={() => setMenuOpen(false)}
            className={navLinkClass}
          >
            <BookOpen className="w-4 h-4" /> Resources
          </Link>

          <div className="h-px bg-white/10" />

          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setMenuOpen(false)}
                className={navLinkClass}
              >
                <User className="w-4 h-4" /> Profile
              </Link>
              <button onClick={handleSignOut} className={navLinkClass}>
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className={navLinkClass}
              >
                <User className="w-4 h-4" /> Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-center bg-white text-github-dark px-4 py-2 rounded-md font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};
