"use client";

import { useEffect, useRef } from "react";
import { NatalChartPlaceholder } from "./NatalChartPlaceholder";
import type { NatalChartResponse } from "./ChartResults";

// The library draws sign sectors in fixed ecliptic order starting from index 0 = Aries.
const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// Library axis key → normalized name used by interpretation endpoints
const AXIS_MAP: Record<string, string> = {
  As: "ASC", Ic: "IC", Ds: "DSC", Mc: "MC",
};

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
    "#a78bfa",
    "#60a5fa",
    "#f87171",
    "#34d399",
    "#60a5fa",
  ],
};

type Props = {
  chart: NatalChartResponse;
  size?: number;
  onElementClick?: (type: "planet" | "sign", name: string) => void;
};

export function ChartWheel({ chart, size = 500, onElementClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`astrochart-${Math.random().toString(36).slice(2)}`);

  // Keep a stable ref so click handlers always call the latest callback
  // without needing to be included in the useEffect dependency array.
  const onClickRef = useRef(onElementClick);
  useEffect(() => {
    onClickRef.current = onElementClick;
  });

  const hasData = chart.bodies.length > 0 && chart.houses.length === 12;

  useEffect(() => {
    if (!hasData || !containerRef.current) return;

    let cancelled = false;

    import("@astrodraw/astrochart").then(({ Chart }) => {
      if (cancelled) return;
      const container = containerRef.current;
      if (!container) return;

      container.innerHTML = "";

      const inner = document.createElement("div");
      inner.id = idRef.current;
      container.appendChild(inner);

      const planets: Record<string, number[]> = {};
      for (const body of chart.bodies) {
        planets[body.name] = [body.longitude, body.speed ?? 0];
      }

      const radix = new Chart(idRef.current, size, size, DARK_SETTINGS).radix({
        planets,
        cusps: chart.houses,
      });

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

      const svg = container.querySelector("svg");
      if (!svg) return;

      // Set pointer cursor on clickable elements
      svg.querySelectorAll<SVGElement>(`[id*="-radix-planets-"]`).forEach((el) => {
        el.style.cursor = "pointer";
      });
      svg.querySelectorAll<SVGElement>(`[id*="-radix-signs-"]`).forEach((el) => {
        el.style.cursor = "pointer";
      });

      // Axis labels (As, Ds, Mc, Ic) — library draws them in order: As, Ic, Ds, Mc
      const axisGroup = svg.querySelector<SVGGElement>(`[id$="-radix-axis"]`);
      if (axisGroup) {
        const axisKeys = ["As", "Ic", "Ds", "Mc"];
        Array.from(axisGroup.querySelectorAll<SVGElement>(":scope > g")).forEach((g, idx) => {
          const key = axisKeys[idx];
          if (!key) return;
          g.style.cursor = "pointer";
          g.addEventListener("click", (e) => {
            e.stopPropagation();
            onClickRef.current?.("planet", AXIS_MAP[key] ?? key);
          });
        });
      }

      // Delegated listener for planet symbols and sign sectors
      svg.addEventListener("click", (e) => {
        let el = e.target as SVGElement | null;
        while (el && el !== svg) {
          const id = el.id ?? "";

          if (id.includes("-radix-planets-")) {
            const name = id.split("-radix-planets-")[1];
            if (name) { onClickRef.current?.("planet", name); return; }
          }

          if (id.includes("-radix-signs-")) {
            const idxStr = id.split("-radix-signs-")[1];
            const idx = parseInt(idxStr, 10);
            if (!isNaN(idx) && idx >= 0 && idx < SIGN_NAMES.length) {
              onClickRef.current?.("sign", SIGN_NAMES[idx]);
              return;
            }
          }

          el = el.parentElement as SVGElement | null;
        }
      });
    });

    return () => {
      cancelled = true;
    };
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
