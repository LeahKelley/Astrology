// needs hover state, so it must be a client component
"use client";

// useState tracks whether the user is hovering so we can animate the glow
import { useState } from "react";
// motion for the subtle scale-up on hover
import { motion } from "motion/react";

// a decorative chart wheel shown before the user has a real natal chart
// looks like the real thing (degree marks, zodiac signs, angle labels) but contains no actual data
export const NatalChartPlaceholder = () => {
  // tracks whether the mouse is over the chart to brighten the glow effect
  const [isHovered, setIsHovered] = useState(false);

  // the 12 Unicode zodiac glyphs in order starting from Aries
  const zodiacSigns = [
    "♈", "♉", "♊", "♋", "♌", "♍",
    "♎", "♏", "♐", "♑", "♒", "♓",
  ];

  return (
    // the outer motion wrapper handles the hover scale animation and the hover state tracking
    <motion.div
      className="relative w-full aspect-square max-w-[450px] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      {/* soft blue glow behind the chart, brightens on hover */}
      <div
        className={`absolute inset-0 bg-blue-600/10 blur-[100px] rounded-full transition-opacity duration-700 ${
          isHovered ? "opacity-100" : "opacity-40"
        }`}
      />

      {/* the main circular chart body, border and background shift on hover */}
      <div
        className={`relative w-full h-full rounded-full border-2 flex items-center justify-center overflow-hidden transition-all duration-700 ${
          isHovered
            ? "border-white/20 bg-white/5"
            : "border-github-border bg-black/20"
        }`}
      >
        {/* faint inner ring just inside the outer border */}
        <div className="absolute inset-0 rounded-full border border-github-border/40" />

        {/* 12 zodiac sign markers, one per 30-degree segment */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0"
            // rotate each marker into position around the circle
            style={{ transform: `rotate(${i * 30}deg)` }}
          >
            {/* the zodiac glyph at the top of each rotated slice */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500">
              {zodiacSigns[i]}
            </div>
            {/* a tick mark at the top of each 30-degree boundary */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-github-border/40" />
          </div>
        ))}

        {/* 72 degree tick marks, one every 5 degrees around the outer ring */}
        {[...Array(72)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{ transform: `rotate(${i * 5}deg)` }}
          >
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-px bg-github-border/20 ${
                // every 6th tick (30-degree boundary) is taller to mark the sign divisions
                i % 6 === 0 ? "h-4" : "h-2"
              }`}
            />
          </div>
        ))}

        {/* inner circle representing the chart interior, slightly inset from the outer ring */}
        <div className="absolute inset-12 rounded-full border-2 border-github-border/60 bg-github-dark/40 shadow-inner" />

        {/* the center point of the chart */}
        <div className="absolute w-16 h-16 rounded-full border border-github-border/40 bg-github-dark/80 flex items-center justify-center z-20">
          <div className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">
            Center
          </div>
        </div>
      </div>

      {/* the four cardinal angle labels positioned just outside the chart circle */}
      <div className="absolute inset-0 pointer-events-none">
        {/* ASC = Ascendant, the rising sign on the left (east) */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-8 text-[10px] font-mono text-gray-600 font-bold">
          ASC
        </div>
        {/* DSC = Descendant, directly opposite the ascendant on the right (west) */}
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-8 text-[10px] font-mono text-gray-600 font-bold">
          DSC
        </div>
        {/* MC = Midheaven, the top of the chart representing career and public image */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 text-[10px] font-mono text-gray-600 font-bold">
          MC
        </div>
        {/* IC = Imum Coeli, the bottom of the chart representing home and roots */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-[10px] font-mono text-gray-600 font-bold">
          IC
        </div>
      </div>
    </motion.div>
  );
};
