"use client";

import { motion } from "motion/react";
import { StarField } from "../components/StarField";
import { Compass, Construction } from "lucide-react";

const zodiacSigns = [
  "♈", "♉", "♊", "♋", "♌", "♍",
  "♎", "♏", "♐", "♑", "♒", "♓",
];

export default function NatalChartPage() {
  return (
    <div className="min-h-screen bg-github-dark relative">
      <StarField />

      <main className="relative pt-32 pb-20 px-6">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-900/10 blur-[150px] rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        <div className="max-w-5xl mx-auto relative">
          {/* Header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold uppercase tracking-widest mb-6">
              <Compass className="w-3.5 h-3.5" />
              Natal Chart
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
              Your Cosmic{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Blueprint
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris.
            </p>
          </motion.div>

          {/* Chart placeholder */}
          <motion.div
            className="flex justify-center mb-16"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="relative w-full max-w-[520px] aspect-square">
              <div className="absolute inset-0 bg-purple-600/5 blur-[120px] rounded-full" />

              {/* Outer ring */}
              <motion.div
                className="relative w-full h-full rounded-full border-2 border-github-border bg-black/20 overflow-hidden"
                animate={{ rotate: -360 }}
                transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
              >
                {/* Degree ticks */}
                {[...Array(72)].map((_, i) => (
                  <div
                    key={`tick-${i}`}
                    className="absolute inset-0"
                    style={{ transform: `rotate(${i * 5}deg)` }}
                  >
                    <div
                      className={`absolute top-0 left-1/2 -translate-x-1/2 w-px bg-github-border/30 ${i % 6 === 0 ? "h-5" : "h-2"
                        }`}
                    />
                  </div>
                ))}

                {/* Zodiac glyphs */}
                {zodiacSigns.map((sign, i) => (
                  <div
                    key={`sign-${i}`}
                    className="absolute inset-0"
                    style={{ transform: `rotate(${i * 30 + 15}deg)` }}
                  >
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 text-sm text-gray-500 font-bold">
                      {sign}
                    </div>
                  </div>
                ))}

                {/* House dividers */}
                {[...Array(12)].map((_, i) => (
                  <div
                    key={`house-${i}`}
                    className="absolute inset-0"
                    style={{ transform: `rotate(${i * 30}deg)` }}
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-github-border/15" />
                  </div>
                ))}

                {/* Inner ring */}
                <div className="absolute inset-14 rounded-full border border-github-border/40 bg-github-dark/60" />

                {/* Innermost ring */}
                <div className="absolute inset-28 rounded-full border border-github-border/20 bg-github-dark/80" />
              </motion.div>

              {/* Center label — counter-rotates to stay still */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-github-dark/90 border border-purple-500/20 backdrop-blur-sm">
                  <Construction className="w-5 h-5 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-300">
                    Work in Progress
                  </span>
                </div>
              </div>

              {/* Axis labels */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-10 text-[10px] font-mono text-gray-600 font-bold">
                  ASC
                </div>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-10 text-[10px] font-mono text-gray-600 font-bold">
                  DSC
                </div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-10 text-[10px] font-mono text-gray-600 font-bold">
                  MC
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-10 text-[10px] font-mono text-gray-600 font-bold">
                  IC
                </div>
              </div>
            </div>
          </motion.div>

          {/* Description cards */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {[
              {
                title: "Generate Your Chart",
                desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
              },
              {
                title: "Explore Placements",
                desc: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
              },
              {
                title: "Understand Aspects",
                desc: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6"
              >
                <h3 className="text-sm font-bold mb-2">{card.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
