// uses scroll events, auth state, and router, so this is a client component
"use client";

// useEffect for scroll listening and auth setup, useState for scroll/menu/user state
import { useEffect, useState } from "react";
// useRouter to navigate and refresh after sign out
import { useRouter } from "next/navigation";
// Next.js link component for client-side navigation
import Link from "next/link";
// icons for nav links and the mobile menu toggle
import {
  BookOpen,
  Compass,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  User,
  X,
} from "lucide-react";
// browser-side Supabase client for reading auth state
import { createClient } from "@/utils/supabase/client";
// the Supabase user type, aliased so it doesn't collide with our own variable name
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const Navbar = () => {
  //true once the user scrolls down past 20px, triggers the frosted glass background
  const [isScrolled, setIsScrolled] = useState(false);
  // controls whether the mobile menu drawer is open
  const [menuOpen, setMenuOpen] = useState(false);
  // the currently logged-in user, null if logged out
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // listen to scroll events to know when to switch the navbar from transparent to frosted
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    // clean up the listener when the component unmounts
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // get the current user on mount and subscribe to auth state changes
  useEffect(() => {
    // get the user immediately so the nav renders correctly on first load
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    // subscribe to login/logout events so the nav updates without a page refresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // clean up the subscription when the component unmounts
    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // signs the user out and sends them back to the homepage
  async function handleSignOut() {
    await supabase.auth.signOut();
     // close the mobile menu if it was open
    setMenuOpen(false);
    router.push("/");
    // refresh so server components lose their session context
    router.refresh();
  }

  // shared Tailwind class for all nav link items, extracted to avoid repetition
  const navLinkClass =
    "hover:text-white transition-colors flex items-center gap-2 text-sm font-medium text-gray-400 cursor-pointer";

  return (
    // fixed to the top, switches from transparent to frosted glass when scrolled or when the mobile menu is open
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || menuOpen
          ? "bg-github-dark/80 backdrop-blur-lg border-b border-white/10 py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* the logo and brand name, clicking either goes home */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          {/* the sparkle icon rotates slightly on hover */}
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">
            MyAstrology
          </span>
        </Link>

        {/* desktop navigation links, hidden on mobile */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href="/natal" className={navLinkClass}>
            <Compass className="w-4 h-4" /> Natal Chart
          </Link>
          <Link href="/resources" className={navLinkClass}>
            <BookOpen className="w-4 h-4" /> Resources
          </Link>
          {/* visual separator between content links and auth links */}
          <div className="h-4 w-px bg-github-border mx-2" />

          {/* show settings + sign out when logged in, sign in + sign up when logged out */}
          {user ? (
            <>
              {/* the avatar/settings button shows the user's email as a tooltip */}
              <Link
                href="/settings"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 transition-colors"
                title={user.email ?? "Settings"}
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
              {/* sign up gets a filled button to stand out as the primary CTA */}
              <Link
                href="/sign-up"
                className="bg-white text-github-dark px-4 py-2 rounded-md font-semibold hover:bg-gray-200 transition-colors"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        {/* mobile hamburger button, hidden on desktop, toggles the drawer below */}
        <button
          className="md:hidden text-gray-400 hover:text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {/* swap icon based on whether the menu is open */}
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* mobile dropdown menu, only rendered when menuOpen is true */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 mt-3 px-6 py-4 space-y-4 bg-github-dark/95 backdrop-blur-lg">
          {/* clicking any link closes the menu */}
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

          {/* thin divider between content links and auth links */}
          <div className="h-px bg-white/10" />

          {/* same logged-in/logged-out split as the desktop nav */}
          {user ? (
            <>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className={navLinkClass}
              >
                <Settings className="w-4 h-4" /> Settings
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
              {/* full-width sign up button for easier tapping on mobile */}
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
