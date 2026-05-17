// manages async interpretation fetches and open/close accordion state, so it's a client component
"use client";

// useState for the accordion state and interpretation cache, useEffect for auto-opening the first item,
// useCallback to memoize the fetch function
import { useState, useEffect, useCallback } from "react";
// icons for the close button, accordion arrows, and loading spinner
import { X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
//we need the chart shape to look up which sign/house a planet is in
import type { NatalChartResponse } from "./ChartResults";
// the base URL for the interpretation API (endpoints are built dynamically based on what the user clicks)
import { INTERP_API as INTERP_BASE } from "@/lib/api";

// the 12 signs in ecliptic order, needed to convert angles to sign names
const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// converts an ecliptic longitude (0-360) to the zodiac sign it falls in
function signOfLongitude(lon: number): string {
  return SIGNS[Math.floor((((lon % 360) + 360) % 360) / 30)];
}

// formats a decimal degree value as degrees and minutes (e.g. 12.75 -> "12°45'")
function formatOrb(value: number): string {
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const min = Math.round((abs - deg) * 60);
  // clamp at 59 to avoid "60'" due to floating point rounding
  const safeMin = min === 60 ? 59 : min;
  return `${deg}°${safeMin.toString().padStart(2, "0")}'`;
}

// the shape of the planet/sign metadata returned by the interpretation API
type EntityData = {
  name: string;
  symbol: string;           // unicode glyph for the planet or sign
  keywords: string[];       // short trait words shown as chips
  description: string;      // a paragraph about what this planet/sign means generally
  in_chart: string;         // personalized text about this placement in the user's chart
};

// the state of an individual interpretation fetch
type InterpState = { status: "idle" | "loading" | "done" | "error"; text?: string };

// one clickable item inside an accordion section
type PanelItem = {
  key: string;        // unique ID for the cache and open-state tracking
  label: string;      // the display text for the accordion header
  sublabel?: string;  // optional secondary text (e.g. the orb value for aspects)
  url: string;        // the interpretation API URL to fetch when this item is opened
};

// a labeled group of accordion items (e.g. "In Aries", "In House 5", "Aspects")
type PanelSection = {
  title: string;
  items: PanelItem[];
};

// exported so the parent (ChartWheel) can pass the click info down
export type ChartSelection = { type: "planet" | "sign"; name: string };

type Props = {
  chart: NatalChartResponse;
  selection: ChartSelection;   // what the user clicked on
  onClose: () => void;         // called when the user hits the X button
};

// a single expandable row inside the panel, shows a label and loads interpretation text on click
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
      {/* the clickable header row with a chevron indicating open/closed state */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 py-2 text-left cursor-pointer hover:bg-white/[0.02] transition-colors group rounded"
      >
        {/* chevron rotates when open */}
        {open ? (
          <ChevronDown className="w-3 h-3 text-purple-400 flex-shrink-0" />
        ) : (
          <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-purple-400 transition-colors flex-shrink-0" />
        )}
        <span className="text-sm text-purple-300 font-medium flex-1">{item.label}</span>
        {/* optional sublabel like an orb value or "R" for retrograde */}
        {item.sublabel && (
          <span className="text-xs text-gray-500 pr-1">{item.sublabel}</span>
        )}
      </button>

      {/* the expanded content area, shown below the header when open */}
      {open && (
        <div className="pb-3 pl-5 pr-1">
          {/* loading spinner while the interpretation is being fetched */}
          {interp.status === "loading" && (
            <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin" />
              Loading…
            </div>
          )}
          {/* the interpretation text, with special formatting for retrograde notes */}
          {interp.status === "done" && interp.text && (
            <div className="rounded-md bg-white/[0.04] border border-purple-500/20 px-3 py-2 text-xs text-gray-300 leading-relaxed space-y-1.5">
              {/* split on double newlines to render separate paragraphs */}
              {interp.text.split("\n\n").filter(Boolean).map((p, i) => (
                <p key={i}>
                  {p.startsWith("Retrograde influence:") ? (
                    <span>
                      {/* highlight the retrograde label in red to draw the eye */}
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
          {/* if the fetch failed, show a simple error message */}
          {interp.status === "error" && (
            <p className="py-1 text-xs text-red-400">{interp.text}</p>
          )}
        </div>
      )}
    </div>
  );
}

// builds the accordion sections for a planet click
// looks up what sign and house the planet is in, plus all its aspects
function buildPlanetSections(
  chart: NatalChartResponse,
  planetName: string
): PanelSection[] {
  const sections: PanelSection[] = [];
  // find the planet in the chart bodies array
  const body = chart.bodies.find((b) => b.name === planetName);

  let sign: string | null = null;
  let house: number | null = null;

  if (body) {
    // regular planet, use its computed sign and house
    sign = body.sign;
    house = body.house ?? null;
  } else if (chart.angles) {
    // must be one of the four cardinal angles (ASC, DSC, MC, IC)
    // each angle has a fixed house number by definition
    const up = planetName.toUpperCase();
    if (up === "ASC") { sign = signOfLongitude(chart.angles.asc); house = 1; }
    else if (up === "DSC") { sign = signOfLongitude((chart.angles.asc + 180) % 360); house = 7; }
    else if (up === "MC") { sign = signOfLongitude(chart.angles.mc); house = 10; }
    else if (up === "IC") { sign = signOfLongitude((chart.angles.mc + 180) % 360); house = 4; }
  }

  // add a "Planet in Sign" section if we have a sign
  if (sign) {
    // pass &retrograde=true if the planet is retrograde so the API returns the right interpretation
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

  // add a "Planet in House" section if we have a house number
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

  // add an "Aspects" section listing every aspect this planet makes
  const relevantAspects = chart.aspects.filter(
    (a) => a.a === planetName || a.b === planetName
  );
  if (relevantAspects.length > 0) {
    sections.push({
      title: "Aspects",
      items: relevantAspects.map((aspect) => ({
        key: `aspect-${aspect.a}-${aspect.type}-${aspect.b}`,
        label: `${aspect.a} ${aspect.type} ${aspect.b}`,
        // show the orb as a sublabel so the user knows how exact the aspect is
        sublabel: `Orb ${formatOrb(aspect.orb)}`,
        url: `${INTERP_BASE}/interpret/combo/aspect?planet1=${aspect.a}&aspect=${aspect.type}&planet2=${aspect.b}`,
      })),
    });
  }

  return sections;
}

// builds the accordion sections for a sign click
// finds all planets, angles, and house cusps that fall in the clicked sign
function buildSignSections(
  chart: NatalChartResponse,
  signName: string
): PanelSection[] {
  const sections: PanelSection[] = [];

  // all planets whose sign matches the clicked sign
  const bodyItems: PanelItem[] = chart.bodies
    .filter((b) => b.sign === signName)
    .map((body) => ({
      key: `ps-${body.name}-${signName}`,
      label: `${body.name} in ${signName}`,
      // mark retrograde planets with "R" as a sublabel
      sublabel: body.retrograde ? "R" : undefined,
      url: `${INTERP_BASE}/interpret/combo/planet-in-sign?planet=${body.name}&sign=${signName}${body.retrograde ? "&retrograde=true" : ""}`,
    }));

  // check whether any of the four cardinal angles fall in this sign too
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

  // combine planets and angles into a single "Planets in Sign" section
  const allPlanetItems = [...bodyItems, ...angleItems];
  if (allPlanetItems.length > 0) {
    sections.push({ title: `Planets in ${signName}`, items: allPlanetItems });
  }

  // find all house cusps that fall in this sign
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

// the side panel that appears when the user clicks a planet or sign on the chart wheel
export function ChartClickPanel({ chart, selection, onClose }: Props) {
  // cache stores the interpretation text for each accordion item so we don't re-fetch on re-open
  const [cache, setCache] = useState<Record<string, InterpState>>({});
  // tracks which accordion item is currently expanded (only one at a time)
  const [openKey, setOpenKey] = useState<string | null>(null);
  // the general info for the selected planet or sign (symbol, keywords, description)
  const [entityData, setEntityData] = useState<EntityData | null>(null);
  // true while we're fetching the entity-level metadata for the panel header
  const [entityLoading, setEntityLoading] = useState(true);

  // fetch interpretation text for a specific accordion item and cache the result
  const fetchInterp = useCallback(async (key: string, url: string) => {
    setCache((c) => ({ ...c, [key]: { status: "loading" } }));
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // the API can return the text in different fields depending on the endpoint
      const text = data.text ?? data.description ?? data.in_chart ?? "";
      setCache((c) => ({ ...c, [key]: { status: "done", text } }));
    } catch {
      setCache((c) => ({
        ...c,
        [key]: { status: "error", text: "Could not load interpretation." },
      }));
    }
  }, []);

  // build the section structure based on whether a planet or sign was clicked
  const sections =
    selection.type === "planet"
      ? buildPlanetSections(chart, selection.name)
      : buildSignSections(chart, selection.name);

  // fetch the general entity info (symbol, keywords, description) for the panel header
  useEffect(() => {
    setEntityLoading(true);
    setEntityData(null);
    fetch(`${INTERP_BASE}/interpret/${selection.type}/${selection.name}`)
      .then((r) => r.json())
      .then((data) => setEntityData(data as EntityData))
      .catch(() => {})  // silently fail if the interpretation service is offline
      .finally(() => setEntityLoading(false));
  }, [selection.type, selection.name]);

  // auto-open and pre-fetch the first accordion item on mount
  // this component remounts via a key prop on every new selection, so empty deps is intentional here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const first = sections[0]?.items[0];
    if (first) {
      setOpenKey(first.key);
      fetchInterp(first.key, first.url);
    }
  }, [fetchInterp]);

  // toggle an accordion item open or closed, fetching its interpretation if it hasn't been loaded yet
  function handleToggle(item: PanelItem) {
    // clicking the open item closes it
    if (openKey === item.key) {
      setOpenKey(null);
      return;
    }
    setOpenKey(item.key);
    // only fetch if we haven't already loaded or started loading this item
    if (!cache[item.key] || cache[item.key].status === "idle") {
      fetchInterp(item.key, item.url);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 relative">
      {/* X button to dismiss the panel */}
      <button
        className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors cursor-pointer"
        onClick={onClose}
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>

      {/* panel header: shows the entity symbol (glyph) and name while the API loads */}
      <div className="flex items-center gap-3 mb-4 pr-6">
        {entityLoading ? (
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin flex-shrink-0" />
        ) : entityData?.symbol ? (
          <span className="text-3xl leading-none flex-shrink-0">{entityData.symbol}</span>
        ) : null}
        <div>
          {/* prefer the full name from the API over the raw selection name */}
          <h3 className="font-display font-bold text-lg leading-tight">
            {entityData?.name ?? selection.name}
          </h3>
          {/* "planet" or "sign" tag in different colors */}
          <span
            className={`text-[10px] font-semibold uppercase tracking-widest ${
              selection.type === "planet" ? "text-purple-400" : "text-blue-400"
            }`}
          >
            {selection.type}
          </span>
        </div>
      </div>

      {/* the chart-specific accordion sections (sign, house, aspects) */}
      {sections.length > 0 && (
        <div className="space-y-4 mb-4">
          {sections.map((section) => (
            <div key={section.title}>
              {/* section heading in small uppercase purple */}
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

      {/* a divider between the chart-specific section and the general entity info below */}
      {sections.length > 0 && !entityLoading && entityData && (
        <div className="border-t border-white/10 mb-4" />
      )}

      {/* spinner shown while the entity header info is still loading */}
      {entityLoading && !entityData && (
        <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
          <Loader2 className="w-3 h-3 animate-spin" />
          Loading…
        </div>
      )}

      {/* the general entity content: keywords, description paragraph, and personalized "in your chart" text */}
      {entityData && (
        <>
          {/* keyword chips */}
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

          {/* the general description of what this planet or sign means */}
          {entityData.description && (
            <p className="text-sm text-gray-300 leading-relaxed mb-3">
              {entityData.description}
            </p>
          )}

          {/* the personalized "in your chart" blurb, separated by a divider */}
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
