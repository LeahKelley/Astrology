"use client";

import { useEffect, useRef } from "react";
import { NatalChartPlaceholder } from "./NatalChartPlaceholder";
import type { NatalChartResponse } from "./ChartResults";

const DARK_SETTINGS = {
  COLOR_BACKGROUND: "transparent",
  CIRCLE_COLOR: "#6b7280",
  LINE_COLOR: "#6b7280",
  POINTS_COLOR: "#e5e7eb",
  POINTS_TEXT_SIZE: 9,
  POINTS_STROKE: 1.5,
  SIGNS_COLOR: "#e5e7eb",
  SIGNS_STROKE: 1.2,
  SYMBOL_AXIS_FONT_COLOR: "#a78bfa",
  SYMBOL_AXIS_STROKE: 1.6,
  CUSPS_FONT_COLOR: "#9ca3af",
  CUSPS_STROKE: 0.7,
  COLORS_SIGNS: [
    "#f87171", "#fb923c", "#fbbf24", "#4ade80",
    "#f87171", "#fb923c", "#fbbf24", "#4ade80",
    "#f87171", "#fb923c", "#fbbf24", "#4ade80",
  ],
  COLORS_ASPECTS: [
    "#a78bfa", // conjunction
    "#60a5fa", // opposition
    "#f87171", // square
    "#34d399", // trine
    "#60a5fa", // sextile
  ],
};

type Props = {
  chart: NatalChartResponse;
  size?: number;
};

export function ChartWheel({ chart, size = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`astrochart-${Math.random().toString(36).slice(2)}`);

  const hasData = chart.bodies.length > 0 && chart.houses.length === 12;

  useEffect(() => {
    if (!hasData || !containerRef.current) return;

    import("@astrodraw/astrochart").then(({ Chart }) => {
      const container = containerRef.current;
      if (!container) return;

      // Clear any previous render
      container.innerHTML = "";

      // Re-attach a fresh div with the stable ID so the library can find it
      const inner = document.createElement("div");
      inner.id = idRef.current;
      container.appendChild(inner);

      // Build planets object — library expects { Name: [longitude, speed?] }
      const planets: Record<string, number[]> = {};
      for (const body of chart.bodies) {
        planets[body.name] = [body.longitude, body.speed ?? 0];
      }

      const data = {
        planets,
        cusps: chart.houses,
      };

      const radix = new Chart(idRef.current, size, size, DARK_SETTINGS).radix(data);

      // Add ASC / DSC / MC / IC as labelled axis points
      if (chart.angles) {
        const { asc, mc } = chart.angles;
        radix.addPointsOfInterest({
          As: [asc],
          Ds: [(asc + 180) % 360],
          Mc: [mc],
          Ic: [(mc + 180) % 360],
        });
      }

      radix.aspects();
    });
  }, [chart, hasData, size]);

  if (!hasData) {
    return <NatalChartPlaceholder />;
  }

  return (
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className="mx-auto"
    />
  );
}
