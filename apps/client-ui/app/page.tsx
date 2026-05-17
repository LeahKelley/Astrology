// uses motion animations so it needs to be a client component
"use client";

// motion for the hero section fade-in and scroll-triggered CTA animations
import { motion } from "motion/react";
// Next.js Link for client-side navigation
import Link from "next/link";
// icons for the CTA cards at the bottom of the page
import { BookOpen, Compass } from "lucide-react";
// the daily activity card showing today's planetary energy scores
import { DailyActivityCard } from "./components/DailyActivityCard";
// the card showing the user's Sun, Moon, and Rising placements
import { PlacementsCard } from "./components/PlacementsCard";
// the animated star background
import { StarField } from "./components/StarField";

export default function Home() {
  return (
    // full-height dark background with the star field layered behind everything
    <div className="min-h-screen flex flex-col bg-github-dark relative">
      <StarField />

      {/* hero section, vertically centered with generous top padding to clear the navbar */}
      <main className="flex-grow flex flex-col items-center justify-center pt-32 pb-20 px-6 relative overflow-hidden">
        {/* decorative ambient glows, the overflow-hidden on main clips these so they don't scroll */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[150px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-indigo-900/5 blur-[100px] rounded-full" />

        {/* three-column layout: sidebar card, hero copy, sidebar card */}
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* left sidebar: daily activity card, pushed to order-2 on mobile so the hero headline comes first */}
          <div className="lg:col-span-3 flex justify-center lg:justify-start order-2 lg:order-1">
            <DailyActivityCard />
          </div>

          {/* center: the main hero headline, subtext, and CTA button */}
          <div className="lg:col-span-6 text-center space-y-8 order-1 lg:order-2">
            {/* fade in and slide up on page load */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
                My{" "}
                {/* gradient on the second word for visual punch */}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  Astrology
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
                Discover your cosmic blueprint. Enter your birth details and
                MyAstrology computes your natal chart, planetary positions,
                house placements, and aspects, powered by Swiss Ephemeris.
              </p>
            </motion.div>

            {/* the primary CTA button, fades in slightly after the headline */}
            <motion.div
              className="flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link
                href="/natal"
                className="border border-github-border hover:bg-white/5 text-white px-6 py-2.5 rounded-md font-semibold transition-all"
              >
                Generate your chart
              </Link>
            </motion.div>
          </div>

          {/* right sidebar: the user's big three placements card */}
          <div className="lg:col-span-3 flex justify-center lg:justify-end order-3">
            <PlacementsCard />
          </div>
        </div>
      </main>

      {/* bottom CTA section, separated from the hero by a border */}
      <section className="bg-github-dark border-t border-github-border py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* natal chart CTA card, animates in when it scrolls into view */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              href="/natal"
              className="group flex flex-col h-full rounded-2xl border border-white/10 bg-white/[0.03] hover:border-purple-500/40 hover:bg-purple-500/5 p-8 transition-all"
            >
              {/* icon box, brightens on group hover */}
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-5 group-hover:bg-purple-600/30 transition-colors">
                <Compass className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-display font-bold mb-2 group-hover:text-purple-300 transition-colors">
                Your Natal Chart
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed flex-1">
                Enter your birth date, time, and city to generate a precise
                natal chart, every planet, house cusp, and aspect calculated
                with Swiss Ephemeris accuracy.
              </p>
              {/* the arrow nudges right on hover for a subtle interactive cue */}
              <span className="mt-5 text-xs font-semibold text-purple-400 group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                Generate your chart
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </Link>
          </motion.div>

          {/* learning center CTA card, delayed slightly so it staggers after the first card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Link
              href="/resources"
              className="group flex flex-col h-full rounded-2xl border border-white/10 bg-white/[0.03] hover:border-blue-500/40 hover:bg-blue-500/5 p-8 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-5 group-hover:bg-blue-600/30 transition-colors">
                <BookOpen className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-display font-bold mb-2 group-hover:text-blue-300 transition-colors">
                Learning Center
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed flex-1">
                Explore planets, signs, houses, and aspects through interactive
                explorers, look up any placement or combination and read the
                interpretation specific to your chart.
              </p>
              <span className="mt-5 text-xs font-semibold text-blue-400 group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                Explore the guides
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
