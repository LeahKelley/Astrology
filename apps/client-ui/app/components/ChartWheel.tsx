// the chart library manipulates the DOM directly, so this must be a client component
"use client";

// useEffect to render the chart after mount, useRef to hold the container DOM node and a stable ID
import { useEffect, useRef } from "react";
// shown before chart data is available
import { NatalChartPlaceholder } from "./NatalChartPlaceholder";
//the shape of the chart data we receive from the ephemeris API
import type { NatalChartResponse } from "./ChartResults";

// the astrochart library draws sign sectors in fixed ecliptic order starting from index 0 = Aries
// we need this to map a sign's numeric index back to its name when the user clicks a sector
const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// the astrochart library uses short keys (As, Ic, Ds, Mc) for axis labels
// this maps them to the longer names our click handler and interpretation endpoints expect
const AXIS_MAP: Record<string, string> = {
  As: "ASC", Ic: "IC", Ds: "DSC", Mc: "MC",
};

// visual theme for the chart, matched to the app's dark color palette
const DARK_SETTINGS = {
  COLOR_BACKGROUND: "transparent",       // let the page background show through
  CIRCLE_COLOR: "#6b7280",               // the ring borders in muted gray
  LINE_COLOR: "#6b7280",                 // house cusp lines
  POINTS_COLOR: "#e5e7eb",              // planet symbols in near-white
  POINTS_TEXT_SIZE: 9,
  POINTS_STROKE: 1.5,
  SIGNS_COLOR: "#e5e7eb",                 // zodiac glyph color
  SIGNS_STROKE: 1.2,
  SYMBOL_AXIS_FONT_COLOR: "#a78bfa",     // axis labels (ASC/DSC/MC/IC) in purple
  SYMBOL_AXIS_STROKE: 1.6,
  CUSPS_FONT_COLOR: "#9ca3af",           // house number labels in light gray
  CUSPS_STROKE: 0.7,
  // each sign gets one of four elemental colors, cycling fire/earth/air/water
  COLORS_SIGNS: [
    "#f87171", "#fb923c", "#fbbf24", "#4ade80",   // Aries, Taurus, Gemini, Cancer
    "#f87171", "#fb923c", "#fbbf24", "#4ade80",   // Leo, Virgo, Libra, Scorpio
    "#f87171", "#fb923c", "#fbbf24", "#4ade80",   // Sagittarius, Capricorn, Aquarius, Pisces
  ],
  // aspect line colors: conjunction, opposition, square, trine, sextile
  COLORS_ASPECTS: [
    "#a78bfa",   // conjunction, purple
    "#60a5fa",   // opposition, blue
    "#f87171",   // square, red (challenging)
    "#34d399",   // trine, green (harmonious)
    "#60a5fa",   // sextile, blue
  ],
};

type Props = {
  chart: NatalChartResponse;
  size?: number;                                          // side length in pixels, defaults to 500
  onElementClick?: (type: "planet" | "sign", name: string) => void;  // called when user taps a planet or sign
};

export function ChartWheel({ chart, size = 500, onElementClick }: Props) {
  // the DOM div the astrochart library will render its SVG into
  const containerRef = useRef<HTMLDivElement>(null);
  // a unique ID for the inner div the library targets, generated once per instance
  const idRef = useRef(`astrochart-${Math.random().toString(36).slice(2)}`);

  // store the click callback in a ref so the click event listeners always call the latest version
  // without the callback needing to be a dependency of the render useEffect
  const onClickRef = useRef(onElementClick);
  useEffect(() => {
    onClickRef.current = onElementClick;
  });

  // only render the chart if we have planets and all 12 house cusps
  const hasData = chart.bodies.length > 0 && chart.houses.length === 12;

  useEffect(() => {
    if (!hasData || !containerRef.current) return;

    // flag to prevent the library from rendering if this effect fires again before the import resolves
    let cancelled = false;

    // dynamically import the chart library so it doesn't bloat the initial bundle
    import("@astrodraw/astrochart").then(({ Chart }) => {
      if (cancelled) return;
      const container = containerRef.current;
      if (!container) return;

      // wipe any previous render before drawing a fresh one
      container.innerHTML = "";

      // create the inner div the library needs to target by ID
      const inner = document.createElement("div");
      inner.id = idRef.current;
      container.appendChild(inner);

      //build the planets object the library expects: { PlanetName: [longitude, speed] }
      const planets: Record<string, number[]> = {};
      for (const body of chart.bodies) {
        planets[body.name] = [body.longitude, body.speed ?? 0];
      }

      // initialize the chart and draw the radix (natal) wheel
      const radix = new Chart(idRef.current, size, size, DARK_SETTINGS).radix({
        planets,
        cusps: chart.houses,
      });

      // add the four cardinal angles as named points of interest on the wheel
      if (chart.angles) {
        const { asc, mc } = chart.angles;
        radix.addPointsOfInterest({
          As: [asc],
          Ds: [(asc + 180) % 360],   // Descendant is always exactly opposite the Ascendant
          Mc: [mc],
          Ic: [(mc + 180) % 360],    // IC is always exactly opposite the Midheaven
        });
      }

      // draw the aspect lines between planets
      radix.aspects();

      const svg = container.querySelector("svg");
      if (!svg) return;

      // make all planet symbols show a pointer cursor so users know they're clickable
      svg.querySelectorAll<SVGElement>(`[id*="-radix-planets-"]`).forEach((el) => {
        el.style.cursor = "pointer";
      });
      // same for sign sector glyphs
      svg.querySelectorAll<SVGElement>(`[id*="-radix-signs-"]`).forEach((el) => {
        el.style.cursor = "pointer";
      });

      // the axis label group is a single SVG group, we attach click listeners to each child
      // the library renders them in this order: As, Ic, Ds, Mc
      const axisGroup = svg.querySelector<SVGGElement>(`[id$="-radix-axis"]`);
      if (axisGroup) {
        const axisKeys = ["As", "Ic", "Ds", "Mc"];
        Array.from(axisGroup.querySelectorAll<SVGElement>(":scope > g")).forEach((g, idx) => {
          const key = axisKeys[idx];
          if (!key) return;
          g.style.cursor = "pointer";
          g.addEventListener("click", (e) => {
            // stopPropagation prevents the delegated listener below from also firing
            e.stopPropagation();
            onClickRef.current?.("planet", AXIS_MAP[key] ?? key);
          });
        });
      }

      // a single delegated click listener on the SVG handles both planet and sign clicks
      // we walk up the DOM tree from the click target to find a matching ID
      svg.addEventListener("click", (e) => {
        let el = e.target as SVGElement | null;
        while (el && el !== svg) {
          const id = el.id ?? "";

          // planet IDs contain "-radix-planets-PlanetName"
          if (id.includes("-radix-planets-")) {
            const name = id.split("-radix-planets-")[1];
            if (name) { onClickRef.current?.("planet", name); return; }
          }

          // sign IDs contain "-radix-signs-N" where N is the zero-based sign index
          if (id.includes("-radix-signs-")) {
            const idxStr = id.split("-radix-signs-")[1];
            const idx = parseInt(idxStr, 10);
            if (!isNaN(idx) && idx >= 0 && idx < SIGN_NAMES.length) {
              onClickRef.current?.("sign", SIGN_NAMES[idx]);
              return;
            }
          }

          // keep walking up toward the SVG root
          el = el.parentElement as SVGElement | null;
        }
      });
    });

    // if the chart data changes while the import is still loading, cancel the stale render
    return () => {
      cancelled = true;
    };
  }, [chart, hasData, size]);

  // no data yet, show the decorative placeholder instead of an empty container
  if (!hasData) {
    return <NatalChartPlaceholder />;
  }

  return (
    // the library will inject its SVG into this div
    <div
      ref={containerRef}
      style={{ width: size, height: size }}
      className="mx-auto"
    />
  );
}
