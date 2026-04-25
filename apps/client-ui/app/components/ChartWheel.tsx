"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { NatalChartPlaceholder } from "./NatalChartPlaceholder";
import type { NatalChartResponse } from "./ChartResults";

const INTERP_API = "http://localhost:8002";

// The library draws sign sectors in fixed ecliptic order starting from index 0 = Aries.
const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

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

type InterpData = {
  name: string;
  symbol: string;
  keywords: string[];
  description: string;
  in_chart: string;
};

type ActiveInterp = InterpData & {
  entityType: "planet" | "sign" | "aspect";
  aspectBetween?: { a: string; b: string };
};

type Props = {
  chart: NatalChartResponse;
  size?: number;
};

export function ChartWheel({ chart, size = 500 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(`astrochart-${Math.random().toString(36).slice(2)}`);
  const [activeInterp, setActiveInterp] = useState<ActiveInterp | null>(null);
  const [loading, setLoading] = useState(false);

  const hasData = chart.bodies.length > 0 && chart.houses.length === 12;

  const fetchInterp = useCallback(
    async (
      type: "planet" | "sign" | "aspect",
      name: string,
      extra?: { a: string; b: string }
    ) => {
      setLoading(true);
      setActiveInterp(null);
      try {
        const res = await fetch(`${INTERP_API}/interpret/${type}/${name}`);
        if (!res.ok) return;
        const data: InterpData = await res.json();
        setActiveInterp({ ...data, entityType: type, aspectBetween: extra });
      } catch {
        // interpretation service not running — fail silently
      } finally {
        setLoading(false);
      }
    },
    []
  );

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

      // Set pointer cursor on planet groups, sign sectors, and aspect lines.
      svg.querySelectorAll<SVGElement>(`[id*="-radix-planets-"]`).forEach((el) => {
        el.style.cursor = "pointer";
      });
      svg.querySelectorAll<SVGElement>(`[id*="-radix-signs-"]`).forEach((el) => {
        el.style.cursor = "pointer";
      });
      svg.querySelectorAll<SVGElement>(`[data-name]`).forEach((el) => {
        el.style.cursor = "pointer";
      });

      // Axis labels (As, Ds, Mc, Ic) are drawn by drawAxis() with no IDs.
      // The library forEach([0,3,6,9]) appends <g> symbols in order: As, Ic, Ds, Mc.
      const axisGroup = svg.querySelector<SVGGElement>(`[id$="-radix-axis"]`);
      if (axisGroup) {
        const axisKeys = ["As", "Ic", "Ds", "Mc"];
        Array.from(axisGroup.querySelectorAll<SVGElement>(":scope > g")).forEach((g, idx) => {
          const key = axisKeys[idx];
          if (!key) return;
          g.style.cursor = "pointer";
          g.addEventListener("click", (e) => {
            e.stopPropagation();
            fetchInterp("planet", key);
          });
        });
      }

      // Single delegated listener for everything else — walks up the DOM.
      svg.addEventListener("click", (e) => {
        let el = e.target as SVGElement | null;
        while (el && el !== svg) {
          const id = el.id ?? "";

          // Planet symbols (planets group has IDs)
          if (id.includes("-radix-planets-")) {
            const name = id.split("-radix-planets-")[1];
            if (name) { fetchInterp("planet", name); return; }
          }

          // Sign sector (library uses index 0–11, map to sign name)
          if (id.includes("-radix-signs-")) {
            const idxStr = id.split("-radix-signs-")[1];
            const idx = parseInt(idxStr, 10);
            if (!isNaN(idx) && idx >= 0 && idx < SIGN_NAMES.length) {
              fetchInterp("sign", SIGN_NAMES[idx]);
              return;
            }
          }

          // Aspect line (has data-name, data-point, data-toPoint attributes)
          const aspectName = el.getAttribute("data-name");
          if (aspectName) {
            const a = el.getAttribute("data-point") ?? "";
            const b = el.getAttribute("data-toPoint") ?? "";
            fetchInterp("aspect", aspectName, { a, b });
            return;
          }

          el = el.parentElement as SVGElement | null;
        }
      });
    });

    return () => {
      cancelled = true;
    };
  }, [chart, hasData, size, fetchInterp]);

  if (!hasData) {
    return <NatalChartPlaceholder />;
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        style={{ width: size, height: size }}
        className="mx-auto"
      />

      {/* Interpretation panel — appears below the wheel on click */}
      {(loading || activeInterp) && (
        <div className="w-full rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 relative">
          {loading && (
            <p className="text-center text-sm text-gray-500 py-4">Loading…</p>
          )}

          {activeInterp && !loading && (
            <>
              <button
                className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
                onClick={() => setActiveInterp(null)}
                aria-label="Close interpretation"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl leading-none">{activeInterp.symbol}</span>
                <div>
                  <h3 className="font-display font-bold text-lg leading-tight">
                    {activeInterp.name}
                  </h3>
                  {activeInterp.entityType === "aspect" && activeInterp.aspectBetween ? (
                    <span className="text-xs text-gray-400">
                      {activeInterp.aspectBetween.a} — {activeInterp.aspectBetween.b}
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-widest ${
                        activeInterp.entityType === "planet"
                          ? "text-purple-400"
                          : "text-blue-400"
                      }`}
                    >
                      {activeInterp.entityType}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {activeInterp.keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5"
                  >
                    {kw}
                  </span>
                ))}
              </div>

              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                {activeInterp.description}
              </p>

              <div className="border-t border-white/10 pt-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 block mb-1">
                  In Your Chart
                </span>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {activeInterp.in_chart}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
