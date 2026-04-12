"use client";

import { useState } from "react";
import { motion } from "motion/react";



export const NatalChartPlaceholder = () => {
  const [isHovered, setIsHovered] = useState(false);

  const zodiacSigns = [
    "♈", "♉", "♊", "♋", "♌", "♍",
    "♎", "♏", "♐", "♑", "♒", "♓",
  ];

  return (
    <motion.div
      className="relative w-full aspect-square max-w-[450px] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div
        className={`absolute inset-0 bg-blue-600/10 blur-[100px] rounded-full transition-opacity duration-700 ${
          isHovered ? "opacity-100" : "opacity-40"
        }`}
      />

      <div
        className={`relative w-full h-full rounded-full border-2 flex items-center justify-center overflow-hidden transition-all duration-700 ${
          isHovered
            ? "border-white/20 bg-white/5"
            : "border-github-border bg-black/20"
        }`}
      >
        <div className="absolute inset-0 rounded-full border border-github-border/40" />
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{ transform: `rotate(${i * 30}deg)` }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-gray-500">
              {zodiacSigns[i]}
            </div>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-github-border/40" />
          </div>
        ))}

        {[...Array(72)].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{ transform: `rotate(${i * 5}deg)` }}
          >
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-px bg-github-border/20 ${
                i % 6 === 0 ? "h-4" : "h-2"
              }`}
            />
          </div>
        ))}

        <div className="absolute inset-12 rounded-full border-2 border-github-border/60 bg-github-dark/40 shadow-inner" />

        <div className="absolute w-16 h-16 rounded-full border border-github-border/40 bg-github-dark/80 flex items-center justify-center z-20">
          <div className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">
            Center
          </div>
        </div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-8 text-[10px] font-mono text-gray-600 font-bold">
          ASC
        </div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-8 text-[10px] font-mono text-gray-600 font-bold">
          DSC
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-8 text-[10px] font-mono text-gray-600 font-bold">
          MC
        </div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-8 text-[10px] font-mono text-gray-600 font-bold">
          IC
        </div>
      </div>
    </motion.div>
  );
};
