// needs to be a client component because it uses useEffect and randomness (can't run on the server)
"use client";

// useEffect to generate stars after mount, useState to hold the star data
import { useEffect, useState } from "react";
// motion/react for the twinkling and shooting star animations
import { motion } from "motion/react";

// decorative animated background, renders twinkling stars and occasional shooting stars
export const StarField = () => {
  // each star has a random position, size, and animation speed
  const [stars, setStars] = useState<
    { id: number; x: number; y: number; size: number; duration: number }[]
  >([]);
  // shooting stars have a random vertical position and a random delay between streaks
  const [shootingStars, setShootingStars] = useState<
    { id: number; top: number; repeatDelay: number }[]
  >([]);

  useEffect(() => {
    // generate stars after mount so the random values are consistent and don't cause hydration mismatches
    setStars(
      Array.from({ length: 150 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,      // horizontal position as a percentage of the container width
        y: Math.random() * 100,      // vertical position as a percentage of the container height
        size: Math.random() * 2 + 1, // diameter between 1px and 3px
        duration: Math.random() * 3 + 2, // twinkle cycle between 2 and 5 seconds
      }))
    );
    setShootingStars(
      // just 3 shooting stars, they loop with long random pauses between each streak
      Array.from({ length: 3 }).map((_, i) => ({
        id: i,
        top: Math.random() * 50,          // vertical start position in the top half of the screen
        repeatDelay: Math.random() * 10 + 5, // wait 5-15 seconds between each streak
      }))
    );
  }, []);

  return (
    // fill the parent container, pointer-events-none so clicks pass through to content underneath
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
            // fade in and out and pulse slightly in size to simulate twinkling
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
          // a thin horizontal line with a gradient to make it look like a streak of light
          className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent"
          style={{
            width: "100px",
            top: `${star.top}%`,
            left: "-10%",     // start just off the left edge of the screen
            rotate: "25deg",  // slight diagonal angle for a natural shooting star look
          }}
          animate={{
            // sweep from off the left edge to off the right edge
            left: ["-10%", "110%"],
            // fade in at the start of the streak and out at the end
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: star.repeatDelay,
            // stagger the start time of each shooting star so they don't all fire at once
            delay: star.id * 4,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};
