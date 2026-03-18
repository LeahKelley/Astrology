"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Compass, Moon, Sparkles, Star, Sun } from "lucide-react";

export const NatalChartPlaceholder = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const aspects = [
    { from: 30, to: 180, color: "rgba(239, 68, 68, 0.4)" },
    { from: 60, to: 240, color: "rgba(59, 130, 246, 0.4)" },
    { from: 90, to: 270, color: "rgba(239, 68, 68, 0.4)" },
    { from: 120, to: 300, color: "rgba(59, 130, 246, 0.4)" },
    { from: 45, to: 210, color: "rgba(34, 197, 94, 0.4)" },
    { from: 150, to: 330, color: "rgba(59, 130, 246, 0.4)" },
    { from: 10, to: 190, color: "rgba(239, 68, 68, 0.4)" },
  ];

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

      <motion.div
        className={`relative w-full h-full rounded-full border-2 flex items-center justify-center overflow-hidden transition-all duration-700 ${
          isHovered
            ? "border-white/20 bg-white/5"
            : "border-github-border bg-black/20"
        }`}
        animate={{ rotate: -360 }}
        transition={{
          duration: isHovered ? 40 : 80,
          repeat: Infinity,
          ease: "linear",
        }}
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

        <svg className="absolute inset-12 w-[calc(100%-6rem)] h-[calc(100%-6rem)] overflow-visible">
          {mounted &&
            aspects.map((aspect, i) => {
              const x1 = 50 + 50 * Math.cos((aspect.from * Math.PI) / 180);
              const y1 = 50 + 50 * Math.sin((aspect.from * Math.PI) / 180);
              const x2 = 50 + 50 * Math.cos((aspect.to * Math.PI) / 180);
              const y2 = 50 + 50 * Math.sin((aspect.to * Math.PI) / 180);

              return (
                <motion.line
                  key={i}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  stroke={aspect.color}
                  strokeWidth={isHovered ? "1.5" : "1"}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 2, delay: i * 0.1 }}
                />
              );
            })}
        </svg>

        {[
          { icon: Sun, angle: 45, label: "17°", color: "text-orange-400" },
          { icon: Moon, angle: 130, label: "23°", color: "text-blue-300" },
          { icon: Star, angle: 210, label: "8°", color: "text-purple-400" },
          { icon: Sparkles, angle: 280, label: "12°", color: "text-emerald-400" },
          { icon: Compass, angle: 15, label: "29°", color: "text-red-400" },
        ].map((planet, i) => (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center gap-0.5"
            style={{
              top: `${50 + 38 * Math.sin((planet.angle * Math.PI) / 180)}%`,
              left: `${50 + 38 * Math.cos((planet.angle * Math.PI) / 180)}%`,
            }}
            animate={{
              rotate: 360,
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{
              rotate: {
                duration: isHovered ? 40 : 80,
                repeat: Infinity,
                ease: "linear",
              },
              scale: { duration: 0.3 },
            }}
          >
            <planet.icon
              className={`w-4 h-4 ${planet.color} drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]`}
            />
            <span className="text-[8px] font-mono font-bold text-white/60">
              {planet.label}
            </span>
          </motion.div>
        ))}

        <div className="absolute w-16 h-16 rounded-full border border-github-border/40 bg-github-dark/80 flex items-center justify-center z-20">
          <div className="text-[8px] uppercase tracking-widest text-gray-500 font-bold">
            Center
          </div>
        </div>
      </motion.div>

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
