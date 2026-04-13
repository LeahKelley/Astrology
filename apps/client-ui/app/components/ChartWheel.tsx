"use client";

import { motion } from "motion/react";
import { Construction } from "lucide-react";

const zodiacSigns = [
  "♈", "♉", "♊", "♋", "♌", "♍",
  "♎", "♏", "♐", "♑", "♒", "♓",
];

export function ChartWheel({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full aspect-square ${className}`}>
      <div className="absolute inset-0 bg-purple-600/5 blur-[120px] rounded-full" />

      <motion.div
        className="relative w-full h-full rounded-full border-2 border-github-border bg-black/20 overflow-hidden"
        animate={{ rotate: -360 }}
        transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      >
        {[...Array(72)].map((_, i) => (
          <div
            key={`tick-${i}`}
            className="absolute inset-0"
            style={{ transform: `rotate(${i * 5}deg)` }}
          >
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-px bg-github-border/30 ${
                i % 6 === 0 ? "h-5" : "h-2"
              }`}
            />
          </div>
        ))}

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

        {[...Array(12)].map((_, i) => (
          <div
            key={`house-${i}`}
            className="absolute inset-0"
            style={{ transform: `rotate(${i * 30}deg)` }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-github-border/15" />
          </div>
        ))}

        <div className="absolute inset-14 rounded-full border border-github-border/40 bg-github-dark/60" />
        <div className="absolute inset-28 rounded-full border border-github-border/20 bg-github-dark/80" />
      </motion.div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-github-dark/90 border border-purple-500/20 backdrop-blur-sm">
          <Construction className="w-5 h-5 text-purple-400" />
          <span className="text-xs font-bold uppercase tracking-widest text-purple-300">
            Work in Progress
          </span>
        </div>
      </div>

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
  );
}
