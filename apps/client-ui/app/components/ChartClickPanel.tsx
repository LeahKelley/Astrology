"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import type { NatalChartResponse } from "./ChartResults";

const INTERP_BASE = "http://localhost:8002";

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

function signOfLongitude(lon: number): string {
  return SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)];
}

function formatOrb(value: number): string {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = Math.round((abs - deg) * 60);
  const safeMin = min === 60 ? 59 : min;
  return `${deg}°${safeMin.toString().padStart(2, "0")}'`;
}

type EntityData = {
  name: string;
  symbol: string;
  keywords: string[];
  description: string;
  in_chart: string;
};

type InterpState = { status: "idle" | "loading" | "done" | "error"; text?: string };

type PanelItem = {
  key: string;
  label: string;
  sublabel?: string;
  url: string;
};

type PanelSection = {
  title: string;
  items: PanelItem[];
};

export type ChartSelection = { type: "planet" | "sign"; name: string };

type Props = {
  chart: NatalChartResponse;
  selection: ChartSelection;
  onClose: () => void;
};

function AccordionItem({
  item,
  open,
  interp,
  onToggle,
}: {
  item: PanelItem;
  open: boolean;
  interp: InterpState;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 py-2 text-left cursor-pointer hover:bg-white/[0.02] transition-colors group rounded"
      >
        {open ? (
          <ChevronDown className="w-3 h-3 text-purple-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
        )}
        <span className="text-sm text-purple-300 font-medium flex-1">{item.label}</span>
        {item.sublabel && (
          <span className="text-xs text-gray-500 pr-1">{item.sublabel}</span>
        )}
      </button>

      {open && (
        <div className="pb-3 pl-5 pr-1">
          {interp.status === "loading" && (
            <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading…
            </div>
          )}
          {interp.status === "done" && interp.text && (
            <div className="rounded-md bg-white/[0.04] border border-purple-500/20 px-3 py-2 text-xs text-gray-300 leading-relaxed space-y-1.5">
              {interp.text.split("\n\n").filter(Boolean).map((p, i) => (
                <p key={i}>
                  {p.startsWith("Retrograde influence:") ? (
                    <span>
                      <span className="text-red-400 font-medium">⟳ Retrograde influence:</span>
                      {p.slice("Retrograde influence:".length)}
                    </span>
                  ) : (
                    p
                  )}
                </p>
              ))}
            </div>
          )}
          {interp.status === "error" && (
            <p className="py-1 text-xs text-red-400">{interp.text}</p>
          )}
        </div>
      )}
    </div>
  );
}

function buildPlanetSections(
  chart: NatalChartResponse,
  planetName: string
): PanelSection[] {
  const sections: PanelSection[] = [];
  const body = chart.bodies.find((b) => b.name === planetName);

  let sign: string | null = null;
  let house: number | null = null;

  if (body) {
    sign = body.sign;
    house = body.house ?? null;
  } else if (chart.angles) {
    const up = planetName.toUpperCase();
    if (up === "ASC") { sign = signOfLongitude(chart.angles.asc); house = 1; }
    else if (up === "DSC") { sign = signOfLongitude((chart.angles.asc + 180) % 360); house = 7; }
    else if (up === "MC") { sign = signOfLongitude(chart.angles.mc); house = 10; }
    else if (up === "IC") { sign = signOfLongitude((chart.angles.mc + 180) % 360); house = 4; }
  }

  if (sign) {
    const retroParam = body?.retrograde ? "&retrograde=true" : "";
    sections.push({
      title: `In ${sign}`,
      items: [{
        key: `ps-${planetName}-${sign}`,
        label: `${planetName} in ${sign}`,
        url: `${INTERP_BASE}/interpret/combo/planet-in-sign?planet=${planetName}&sign=${sign}${retroParam}`,
      }],
    });
  }

  if (house !== null) {
    sections.push({
      title: `In House ${house}`,
      items: [{
        key: `ph-${planetName}-${house}`,
        label: `${planetName} in House ${house}`,
        url: `${INTERP_BASE}/interpret/combo/planet-in-house?planet=${planetName}&house=${house}`,
      }],
    });
  }

  const relevantAspects = chart.aspects.filter(
    (a) => a.a === planetName || a.b === planetName
  );
  if (relevantAspects.length > 0) {
    sections.push({
      title: "Aspects",
      items: relevantAspects.map((aspect) => ({
        key: `aspect-${aspect.a}-${aspect.type}-${aspect.b}`,
        label: `${aspect.a} ${aspect.type} ${aspect.b}`,
        sublabel: `Orb ${formatOrb(aspect.orb)}`,
        url: `${INTERP_BASE}/interpret/combo/aspect?planet1=${aspect.a}&aspect=${aspect.type}&planet2=${aspect.b}`,
      })),
    });
  }

  return sections;
}

function buildSignSections(
  chart: NatalChartResponse,
  signName: string
): PanelSection[] {
  const sections: PanelSection[] = [];

  const bodyItems: PanelItem[] = chart.bodies
    .filter((b) => b.sign === signName)
    .map((body) => ({
      key: `ps-${body.name}-${signName}`,
      label: `${body.name} in ${signName}`,
      sublabel: body.retrograde ? "R" : undefined,
      url: `${INTERP_BASE}/interpret/combo/planet-in-sign?planet=${body.name}&sign=${signName}${body.retrograde ? "&retrograde=true" : ""}`,
    }));

  const angleItems: PanelItem[] = [];
  if (chart.angles) {
    const angles = [
      { name: "ASC", lon: chart.angles.asc },
      { name: "DSC", lon: (chart.angles.asc + 180) % 360 },
      { name: "MC", lon: chart.angles.mc },
      { name: "IC", lon: (chart.angles.mc + 180) % 360 },
    ];
    for (const angle of angles) {
      if (signOfLongitude(angle.lon) === signName) {
        angleItems.push({
          key: `ps-${angle.name}-${signName}`,
          label: `${angle.name} in ${signName}`,
          url: `${INTERP_BASE}/interpret/combo/planet-in-sign?planet=${angle.name}&sign=${signName}`,
        });
      }
    }
  }

  const allPlanetItems = [...bodyItems, ...angleItems];
  if (allPlanetItems.length > 0) {
    sections.push({ title: `Planets in ${signName}`, items: allPlanetItems });
  }

  const houseItems: PanelItem[] = [];
  chart.houses.forEach((lon, idx) => {
    if (signOfLongitude(lon) === signName) {
      const houseNum = idx + 1;
      houseItems.push({
        key: `cusp-${houseNum}-${signName}`,
        label: `House ${houseNum} in ${signName}`,
        url: `${INTERP_BASE}/interpret/combo/house-cusp?house=${houseNum}&sign=${signName}`,
      });
    }
  });
  if (houseItems.length > 0) {
    sections.push({ title: `Houses in ${signName}`, items: houseItems });
  }

  return sections;
}

export function ChartClickPanel({ chart, selection, onClose }: Props) {
  const [cache, setCache] = useState<Record<string, InterpState>>({});
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [entityData, setEntityData] = useState<EntityData | null>(null);
  const [entityLoading, setEntityLoading] = useState(true);

  const fetchInterp = useCallback(async (key: string, url: string) => {
    setCache((c) => ({ ...c, [key]: { status: "loading" } }));
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const text = data.text ?? data.description ?? data.in_chart ?? "";
      setCache((c) => ({ ...c, [key]: { status: "done", text } }));
    } catch {
      setCache((c) => ({
        ...c,
        [key]: { status: "error", text: "Could not load interpretation." },
      }));
    }
  }, []);

  const sections =
    selection.type === "planet"
      ? buildPlanetSections(chart, selection.name)
      : buildSignSections(chart, selection.name);

  // Fetch entity-level info (symbol, keywords, description) for the header + generic section.
  useEffect(() => {
    setEntityLoading(true);
    setEntityData(null);
    fetch(`${INTERP_BASE}/interpret/${selection.type}/${selection.name}`)
      .then((r) => r.json())
      .then((data) => setEntityData(data as EntityData))
      .catch(() => {})
      .finally(() => setEntityLoading(false));
  }, [selection.type, selection.name]);

  // Auto-open and pre-fetch the first item so users see an active result on load.
  // Safe with empty deps: this component remounts (via key prop) on every selection change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const first = sections[0]?.items[0];
    if (first) {
      setOpenKey(first.key);
      fetchInterp(first.key, first.url);
    }
  }, [fetchInterp]);

  function handleToggle(item: PanelItem) {
    if (openKey === item.key) {
      setOpenKey(null);
      return;
    }
    setOpenKey(item.key);
    if (!cache[item.key] || cache[item.key].status === "idle") {
      fetchInterp(item.key, item.url);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 relative">
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors cursor-pointer"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-3 mb-4 pr-6">
        {entityLoading ? (
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin flex-shrink-0" />
        ) : entityData?.symbol ? (
          <span className="text-3xl leading-none flex-shrink-0">{entityData.symbol}</span>
        ) : null}
        <div>
          <h3 className="font-display font-bold text-lg leading-tight">
            {entityData?.name ?? selection.name}
          </h3>
          <span
            className={`text-[10px] font-semibold uppercase tracking-widest ${
              selection.type === "planet" ? "text-purple-400" : "text-blue-400"
            }`}
          >
            {selection.type}
          </span>
        </div>
      </div>

      {/* Specific birthchart results */}
      {sections.length > 0 && (
        <div className="space-y-4 mb-4">
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">
                {section.title}
              </h4>
              <div>
                {section.items.map((item) => (
                  <AccordionItem
                    key={item.key}
                    item={item}
                    open={openKey === item.key}
                    interp={cache[item.key] ?? { status: "idle" }}
                    onToggle={() => handleToggle(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Divider between specific results and generic info */}
      {sections.length > 0 && !entityLoading && entityData && (
        <div className="border-t border-white/10 mb-4" />
      )}

      {/* Generic info: keywords, description, in_chart */}
      {entityLoading && !entityData && (
        <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading…
        </div>
      )}

      {entityData && (
        <>
          {entityData.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {entityData.keywords.map((kw) => (
                <span
                  key={kw}
                  className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-white/5 border border-white/10 rounded-full px-2.5 py-0.5"
                >
                  {kw}
                </span>
              ))}
            </div>
          )}

          {entityData.description && (
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              {entityData.description}
            </p>
          )}

          {entityData.in_chart && (
            <div className="border-t border-white/10 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 block mb-1">
                In Your Chart
              </span>
              <p className="text-xs text-gray-400 leading-relaxed">
                {entityData.in_chart}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
