"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { BookOpen, Compass } from "lucide-react";
import { DailyActivityCard } from "./components/DailyActivityCard";
import { PlacementsCard } from "./components/PlacementsCard";
import { StarField } from "./components/StarField";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-github-dark relative">
      <StarField />

      <main className="flex-grow flex flex-col items-center justify-center pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[150px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[150px] rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-indigo-900/5 blur-[100px] rounded-full" />

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left — Daily reading */}
          <div className="lg:col-span-3 flex justify-center lg:justify-start order-2 lg:order-1">
            <DailyActivityCard />
          </div>

          {/* Center — Hero */}
          <div className="lg:col-span-6 text-center space-y-8 order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
                My{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                  Astrology
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
                Discover your cosmic blueprint. Enter your birth details and
                MyAstrology computes your natal chart — planetary positions,
                house placements, and aspects — powered by Swiss Ephemeris.
              </p>
            </motion.div>

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

          {/* Right — Big Three placements */}
          <div className="lg:col-span-3 flex justify-center lg:justify-end order-3">
            <PlacementsCard />
          </div>
        </div>
      </main>

      {/* CTA Section */}
      <section className="bg-github-dark border-t border-github-border py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-5 group-hover:bg-purple-600/30 transition-colors">
                <Compass className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-display font-bold mb-2 group-hover:text-purple-300 transition-colors">
                Your Natal Chart
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed flex-1">
                Enter your birth date, time, and city to generate a precise
                natal chart — every planet, house cusp, and aspect calculated
                with Swiss Ephemeris accuracy.
              </p>
              <span className="mt-5 text-xs font-semibold text-purple-400 group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                Generate your chart
                <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
              </span>
            </Link>
          </motion.div>

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
                explorers — look up any placement or combination and read the
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
