"use client";

import { useEffect, useState } from "react";
import { BookOpen, Compass, Menu, Sparkles, User } from "lucide-react";

export const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-github-dark/80 backdrop-blur-lg border-b border-white/10 py-3"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold tracking-tight">
            Placeholder
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <a
            href="#"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" /> Natal Chart
          </a>
          <a
            href="#"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4" /> Resources
          </a>
          <div className="h-4 w-px bg-github-border mx-2" />
          <a
            href="#"
            className="hover:text-white transition-colors flex items-center gap-1.5"
          >
            <User className="w-4 h-4" /> Sign in
          </a>
          <button className="bg-white text-github-dark px-4 py-2 rounded-md font-semibold hover:bg-gray-200 transition-colors">
            Sign up
          </button>
        </div>

        <button className="md:hidden text-gray-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </nav>
  );
};
