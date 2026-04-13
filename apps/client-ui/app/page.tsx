"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ChevronDown, Moon } from "lucide-react";
import { PlaceholderCard } from "./components/Envelope";
import { NatalChartPlaceholder } from "./components/NatalChartPlaceholder";
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
          <div className="lg:col-span-3 flex justify-center lg:justify-start order-2 lg:order-1">
            <PlaceholderCard />
          </div>

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

            <div className="flex flex-col items-center gap-4 pt-8">
              <motion.div
                className="w-20 h-20 rounded-full border border-github-border p-1 bg-gradient-to-b from-purple-500/20 to-transparent flex items-center justify-center relative"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 bg-purple-500/10 blur-xl rounded-full" />
                <div className="w-full h-full rounded-full bg-github-dark flex items-center justify-center">
                  <Moon className="w-10 h-10 text-purple-400" />
                </div>
              </motion.div>
              <p className="text-xs text-gray-500 max-w-xs font-medium uppercase tracking-widest">
                Your cosmic blueprint awaits
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 flex justify-center lg:justify-end order-3">
            <NatalChartPlaceholder />
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em] font-semibold">
            More on scroll
          </span>
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </main>

      <section className="bg-github-dark border-t border-github-border py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold">Natal Chart</h3>
            <p className="text-sm text-gray-400">
              A natal chart is a snapshot of the sky at the exact moment of your
              birth. It maps the positions of the planets across the twelve
              zodiac signs and houses.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold">Planetary Positions</h3>
            <p className="text-sm text-gray-400">
              See where the Sun, Moon, and every planet were placed at your
              birth — including sign, degree, house, and whether each body was
              in retrograde.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-display font-bold">
              Houses &amp; Aspects
            </h3>
            <p className="text-sm text-gray-400">
              Explore your twelve house cusps and the angular relationships
              between planets — conjunctions, oppositions, trines, squares, and
              sextiles — calculated with Swiss Ephemeris precision.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
