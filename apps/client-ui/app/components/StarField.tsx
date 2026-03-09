"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

export const StarField = () => {
  const [stars, setStars] = useState<
    { id: number; x: number; y: number; size: number; duration: number }[]
  >([]);
  const [shootingStars, setShootingStars] = useState<
    { id: number; top: number; repeatDelay: number }[]
  >([]);

  useEffect(() => {
    setStars(
      Array.from({ length: 150 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 3 + 2,
      }))
    );
    setShootingStars(
      Array.from({ length: 3 }).map((_, i) => ({
        id: i,
        top: Math.random() * 50,
        repeatDelay: Math.random() * 10 + 5,
      }))
    );
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute bg-white rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {shootingStars.map((star) => (
        <motion.div
          key={`shooting-${star.id}`}
          className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent"
          style={{
            width: "100px",
            top: `${star.top}%`,
            left: "-10%",
            rotate: "25deg",
          }}
          animate={{
            left: ["-10%", "110%"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: star.repeatDelay,
            delay: star.id * 4,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};
