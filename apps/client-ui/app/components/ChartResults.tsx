// interactive tables with expandable rows require click handlers, so this is a client component
"use client";

// useState for the open/closed row and the interpretation cache, useCallback to stabilize fetch_
import { useState, useCallback } from "react";
// ChevronDown/Right to show which rows are expanded, Loader2 for the spinner while fetching
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

// a single celestial body from the natal chart (planets, asteroids, etc.)
type Body = {
  name: string;
  longitude: number;        // ecliptic longitude in degrees (0-360)
  sign: string;             // zodiac sign name derived from longitude
  degree_in_sign: number;   // degrees within the sign (0-30)
  retrograde: boolean;      // true if the planet appeared to move backwards on this date
  house?: number;           // which of the 12 houses the planet falls in (optional, may not be calculated)
  speed?: number;           // degrees per day the planet is moving (negative = retrograde)
};

// a single angular relationship between two planets
type Aspect = {
  a: string;      // the first planet's name
  type: string;   // the aspect type (Conjunction, Trine, Square, etc.)
  b: string;      // the second planet's name
  orb: number;    // how many degrees off from the exact aspect angle it is
};

// the full response shape from the natal chart API, exported so ChartWheel and ChartClickPanel can share it
export type NatalChartResponse = {
  meta?: { request_id?: string; generated_at?: string };   // optional metadata from the backend
  angles?: { asc: number; mc: number };                    // the Ascendant and Midheaven angles in ecliptic degrees
  bodies: Body[];                                          // all calculated planetary positions
  houses: number[];                                        // the 12 house cusp longitudes
  aspects: Aspect[];                                       // all planetary aspects found in the chart
};

// the 12 signs in ecliptic order, indexed 0-11, used to convert raw longitude to a sign name
const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// the base URL for the interpretations service, imported separately because it lives on a different port
import { INTERP_API as INTERP_BASE } from "@/lib/api";

// converts a decimal degree value to the familiar 15°30' notation used in astrology
function formatDegree(value: number): string {
  const deg = Math.floor(value);
  const min = Math.round((value - deg) * 60);
  // clamp 60 back to 59 to avoid displaying "15°60'" when rounding pushes minutes over
  const safeMin = min === 60 ? 59 : min;
  return `${deg}°${safeMin.toString().padStart(2, "0")}'`;
}

// converts an ecliptic longitude (0-360) to a human-readable sign + degree string
function longitudeToSignDegree(longitude: number): { sign: string; degree: string } {
  // dividing by 30 gives the sign index (each sign spans 30 degrees), modulo 12 wraps 360 back to Aries
  const signIndex = Math.floor(longitude / 30) % 12;
  // the remainder after removing the sign offset is how far into that sign the point falls
  const degreeInSign = longitude % 30;
  return { sign: SIGNS[signIndex], degree: formatDegree(degreeInSign) };
}

// a simple titled card wrapper used for each of the four data sections (positions, houses, cusps, aspects)
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      {/* the purple header band with the section title */}
      <div className="bg-purple-600/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-center">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// the four states a single interpretation entry can be in
type InterpState = { status: "idle" | "loading" | "done" | "error"; text?: string; title?: string };

// a custom hook that manages a shared cache of interpretation API results across all rows
function useInterpretations() {
  // keyed by the row's unique key so each row gets its own cached result
  const [cache, setCache] = useState<Record<string, InterpState>>({});

  // fetch_ is memoized so its identity stays stable and rows don't re-render unnecessarily
  const fetch_ = useCallback(async (key: string, url: string) => {
    // mark this entry as loading before the fetch starts
    setCache((c) => ({ ...c, [key]: { status: "loading" } }));
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      // store the interpretation text and title once the API responds
      setCache((c) => ({ ...c, [key]: { status: "done", title: data.title, text: data.text } }));
    } catch {
      // use a generic message so the row still renders something instead of staying empty
      setCache((c) => ({ ...c, [key]: { status: "error", text: "Could not load interpretation." } }));
    }
  }, []);

  return { cache, fetch_ };
}

// a "Learn more" link that fetches additional info about a single planet, sign, or aspect when clicked
type ClickableLink = { label: string; url: string };

// the panel that slides in below a row to show the main interpretation text plus optional "Learn more" pills
function InterpDropdown({
  text,
  links,
}: {
  text: string;
  links?: ClickableLink[];
}) {
  // the currently expanded secondary panel (one of the "Learn more" topics), null means none
  const [secondary, setSecondary] = useState<{ label: string; text: string } | null>(null);
  // tracks which "Learn more" button is mid-fetch so we can show a spinner in it
  const [loadingLink, setLoadingLink] = useState<string | null>(null);

  // clicking a "Learn more" pill either opens its secondary panel or closes it if it's already open
  async function handleLinkClick(link: ClickableLink) {
    if (secondary?.label === link.label) {
      // toggle off if the same pill is clicked twice
      setSecondary(null);
      return;
    }
    setLoadingLink(link.label);
    try {
      const res = await fetch(link.url);
      const data = await res.json();
      // the API returns different field names for different entity types, try all of them
      setSecondary({ label: link.label, text: data.description ?? data.in_chart ?? data.text ?? "" });
    } finally {
      setLoadingLink(null);
    }
  }

  // split the text on blank lines to render each paragraph separately
  const paragraphs = text.split("\n\n").filter(Boolean);

  return (
    <div className="mt-2 rounded-md bg-white/[0.04] border border-purple-500/20 px-4 py-3 text-xs text-gray-300 leading-relaxed space-y-2">
      {paragraphs.map((p, i) => (
        <p key={i}>
          {/* give the retrograde prefix its own red color so it stands out visually */}
          {p.startsWith("Retrograde influence:") ? (
            <span><span className="text-red-400 font-medium">⟳ Retrograde influence:</span>{p.slice("Retrograde influence:".length)}</span>
          ) : p}
        </p>
      ))}

      {/* only render the "Learn more" section if there are links to show */}
      {links && links.length > 0 && (
        <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
          <span className="text-gray-500 text-[10px] uppercase tracking-wider self-center">Learn more:</span>
          {links.map((link) => (
            <button
              key={link.label}
              // stopPropagation prevents the row toggle from firing when clicking a pill
              onClick={(e) => { e.stopPropagation(); handleLinkClick(link); }}
              className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                // highlight the pill if its secondary panel is currently open
                secondary?.label === link.label
                  ? "border-purple-400/60 bg-purple-500/20 text-purple-300"
                  : "border-white/15 bg-white/5 text-gray-400 hover:border-purple-400/40 hover:text-purple-300"
              }`}
            >
              {/* show an ellipsis while the secondary fetch is in progress */}
              {loadingLink === link.label ? "…" : link.label}
            </button>
          ))}
        </div>
      )}

      {/* the secondary expansion panel that appears below the "Learn more" pills */}
      {secondary && (
        <div className="mt-2 rounded bg-white/[0.03] border border-white/10 px-3 py-2 text-[11px] text-gray-400 leading-relaxed">
          <span className="text-purple-300 font-medium text-xs">{secondary.label}</span>
          <p className="mt-1">{secondary.text}</p>
        </div>
      )}
    </div>
  );
}

// the props that each expandable table row needs from its parent
type ExpandableRowProps = {
  rowKey: string;           // unique identifier used as the open/close toggle key
  interpUrl: string;        // the API URL to call when this row is first opened
  open: boolean;            // whether this row's panel is currently expanded
  onToggle: (key: string, url: string) => void;  // called when the row is clicked
  interp: InterpState;      // the current interpretation state for this row
  cells: React.ReactNode;   // the table cells to render in the main row (name, degree, sign, etc.)
  links?: ClickableLink[];  // optional "Learn more" links to pass down to the InterpDropdown
};

// a table row that expands to show an interpretation when clicked, used for all four data sections
function ExpandableRow({ rowKey, interpUrl, open, onToggle, interp, cells, links }: ExpandableRowProps) {
  return (
    <>
      {/* the main data row, clicking it triggers the toggle callback */}
      <tr
        className="border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.03] transition-colors group"
        onClick={() => onToggle(rowKey, interpUrl)}
      >
        {/* the expand/collapse chevron in the first column */}
        <td className="py-1.5 pr-1 w-4">
          {open
            ? <ChevronDown className="w-3 h-3 text-purple-400" />
            : <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-purple-400 transition-colors" />}
        </td>
        {/* the actual data cells are passed in by the parent so each section can customize its columns */}
        {cells}
      </tr>
      {/* the expansion panel, only rendered when this row is open */}
      {open && (
        <tr className="border-b border-white/5">
          {/* first column stays empty to align with the chevron above */}
          <td />
          {/* colSpan 10 spans all remaining columns regardless of how many there are */}
          <td colSpan={10} className="pb-3 pr-2">
            {interp.status === "loading" && (
              <div className="flex items-center gap-2 py-2 text-xs text-gray-500">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading interpretation…
              </div>
            )}
            {interp.status === "done" && interp.text && (
              <InterpDropdown text={interp.text} links={links} />
            )}
            {interp.status === "error" && (
              <p className="py-2 text-xs text-red-400">{interp.text}</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

// the props for the main ChartResults component
type ChartResultsProps = {
  chart: NatalChartResponse;    // the full natal chart data from the ephemeris API
  profileName?: string;         // optional name to display as a heading above the tables
};

// the four-panel table view rendered below the chart wheel on the natal chart page
export function ChartResults({ chart, profileName }: ChartResultsProps) {
  // the shared interpretation cache and fetch function, shared across all four panels
  const { cache, fetch_ } = useInterpretations();
  // only one row can be open at a time, tracked by its unique key string
  const [openKey, setOpenKey] = useState<string | null>(null);

  // handles expanding and collapsing rows, only fetches interpretation data on first open
  function handleToggle(key: string, url: string) {
    if (openKey === key) {
      // clicking an already-open row closes it
      setOpenKey(null);
      return;
    }
    setOpenKey(key);
    // only call the API if we haven't fetched this interpretation before
    if (!cache[key] || cache[key].status === "idle") {
      fetch_(key, url);
    }
  }

  // check what data we actually have so we only render sections that have content
  const hasBodies = chart.bodies.length > 0;
  const hasHouses = chart.houses.length > 0;
  const hasAspects = chart.aspects.length > 0;

  // if the chart object has no data at all, show a prompt to pick a profile
  if (!hasBodies && !hasHouses && !hasAspects) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-gray-500">Select a profile to view chart calculations.</p>
      </div>
    );
  }

  // discriminated union type so we can mix planets and angle points in the same table row loop
  type BodyRow = { kind: "body"; body: Body };
  type AngleRow = { kind: "angle"; label: string; longitude: number };
  type Row = BodyRow | AngleRow;

  // build the ordered list of rows for the Planet Positions panel, inserting ASC right after Moon
  const planetRows: Row[] = [];
  for (const body of chart.bodies) {
    planetRows.push({ kind: "body", body });
    // insert ASC directly after the Moon row so the angles appear near the middle of the list
    if (body.name === "Moon" && chart.angles) {
      planetRows.push({ kind: "angle", label: "ASC", longitude: chart.angles.asc });
    }
  }
  // append DSC (opposite ASC), MC, and IC (opposite MC) at the end of the planet list
  if (chart.angles) {
    planetRows.push({ kind: "angle", label: "DSC", longitude: (chart.angles.asc + 180) % 360 });
    planetRows.push({ kind: "angle", label: "MC", longitude: chart.angles.mc });
    planetRows.push({ kind: "angle", label: "IC", longitude: (chart.angles.mc + 180) % 360 });
  }

  return (
    <div className="space-y-4">
      {/* optional heading above the four panels, shown when a specific profile's chart is loaded */}
      {profileName && (
        <h3 className="text-lg font-bold text-purple-300">{profileName}&apos;s Chart</h3>
      )}

      {/* two-column grid on medium screens and above, single column on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Panel 1: Planet Positions, shows each planet's sign and degree, plus the four angles */}
        {hasBodies && (
          <Panel title="Planet Positions">
            <table className="w-full">
              <tbody>
                {planetRows.map((row) => {
                  if (row.kind === "angle") {
                    // angle rows (ASC/DSC/MC/IC) don't have a retrograde flag, shown in blue to distinguish
                    const { sign, degree } = longitudeToSignDegree(row.longitude);
                    const key = `pos-${row.label}`;
                    // angles are interpreted the same way as planets, using the planet-in-sign endpoint
                    const url = `${INTERP_BASE}/interpret/combo/planet-in-sign?planet=${row.label}&sign=${sign}`;
                    return (
                      <ExpandableRow
                        key={key}
                        rowKey={key}
                        interpUrl={url}
                        open={openKey === key}
                        onToggle={handleToggle}
                        interp={cache[key] ?? { status: "idle" }}
                        // "Learn more" pills for the angle label and the sign it falls in
                        links={[
                          { label: row.label, url: `${INTERP_BASE}/interpret/planet/${row.label}` },
                          { label: sign, url: `${INTERP_BASE}/interpret/sign/${sign}` },
                        ]}
                        cells={
                          <>
                            {/* angle name in blue to visually separate it from planet rows in purple */}
                            <td className="py-1.5 pr-3 text-sm text-blue-300 font-medium">{row.label}</td>
                            <td className="py-1.5 pr-3 text-sm text-gray-300">{degree}</td>
                            <td className="py-1.5 pr-3 text-sm text-gray-300">{sign}</td>
                            {/* empty cell to align with the retrograde "R" column in planet rows */}
                            <td />
                          </>
                        }
                      />
                    );
                  }
                  // planet row, uses degree_in_sign directly instead of recomputing from raw longitude
                  const key = `pos-${row.body.name}`;
                  // append the retrograde flag to the URL so the interpretation text includes retrograde context
                  const url = `${INTERP_BASE}/interpret/combo/planet-in-sign?planet=${row.body.name}&sign=${row.body.sign}${row.body.retrograde ? "&retrograde=true" : ""}`;
                  return (
                    <ExpandableRow
                      key={key}
                      rowKey={key}
                      interpUrl={url}
                      open={openKey === key}
                      onToggle={handleToggle}
                      interp={cache[key] ?? { status: "idle" }}
                      links={[
                        { label: row.body.name, url: `${INTERP_BASE}/interpret/planet/${row.body.name}` },
                        { label: row.body.sign, url: `${INTERP_BASE}/interpret/sign/${row.body.sign}` },
                      ]}
                      cells={
                        <>
                          <td className="py-1.5 pr-3 text-sm text-purple-300 font-medium">{row.body.name}</td>
                          <td className="py-1.5 pr-3 text-sm text-gray-300">{formatDegree(row.body.degree_in_sign)}</td>
                          <td className="py-1.5 pr-3 text-sm text-gray-300">{row.body.sign}</td>
                          {/* show "R" in red for retrograde planets, empty string otherwise */}
                          <td className="py-1.5 text-sm text-red-400">{row.body.retrograde ? "R" : ""}</td>
                        </>
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )}

        {/* Panel 2: Planets in Houses, only rendered if house numbers were calculated */}
        {hasBodies && chart.bodies.some((b) => typeof b.house === "number") && (
          <Panel title="Planets in Houses">
            <table className="w-full">
              <tbody>
                {/* filter out bodies that don't have a house assignment (e.g., if house system wasn't requested) */}
                {chart.bodies
                  .filter((b) => typeof b.house === "number")
                  .map((body) => {
                    const key = `house-${body.name}`;
                    const url = `${INTERP_BASE}/interpret/combo/planet-in-house?planet=${body.name}&house=${body.house}`;
                    return (
                      <ExpandableRow
                        key={key}
                        rowKey={key}
                        interpUrl={url}
                        open={openKey === key}
                        onToggle={handleToggle}
                        interp={cache[key] ?? { status: "idle" }}
                        links={[
                          { label: body.name, url: `${INTERP_BASE}/interpret/planet/${body.name}` },
                          { label: `House ${body.house}`, url: `${INTERP_BASE}/interpret/house/${body.house}` },
                        ]}
                        cells={
                          <>
                            <td className="py-1.5 pr-3 text-sm text-purple-300 font-medium">{body.name}</td>
                            <td className="py-1.5 text-sm text-gray-300">House {body.house}</td>
                          </>
                        }
                      />
                    );
                  })}
              </tbody>
            </table>
          </Panel>
        )}

        {/* Panel 3: House Cusps, shows the sign and degree where each of the 12 houses begins */}
        {hasHouses && (
          <Panel title="House Cusps">
            <table className="w-full">
              <tbody>
                {/* chart.houses is an array of 12 longitude values, index 0 = House 1 */}
                {chart.houses.map((cusp, idx) => {
                  const { sign, degree } = longitudeToSignDegree(cusp);
                  // house numbers are 1-based, so we add 1 to the array index
                  const houseNum = idx + 1;
                  const key = `cusp-${houseNum}`;
                  const url = `${INTERP_BASE}/interpret/combo/house-cusp?house=${houseNum}&sign=${sign}`;
                  return (
                    <ExpandableRow
                      key={key}
                      rowKey={key}
                      interpUrl={url}
                      open={openKey === key}
                      onToggle={handleToggle}
                      interp={cache[key] ?? { status: "idle" }}
                      links={[
                        { label: `House ${houseNum}`, url: `${INTERP_BASE}/interpret/house/${houseNum}` },
                        { label: sign, url: `${INTERP_BASE}/interpret/sign/${sign}` },
                      ]}
                      cells={
                        <>
                          <td className="py-1.5 pr-3 text-sm text-purple-300 font-medium">House {houseNum}</td>
                          <td className="py-1.5 pr-3 text-sm text-gray-300">{degree}</td>
                          <td className="py-1.5 text-sm text-gray-300">{sign}</td>
                        </>
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )}

        {/* Panel 4: Planetary Aspects, shows each angular relationship found between planets */}
        {hasAspects && (
          <Panel title="Planetary Aspects">
            <table className="w-full">
              <tbody>
                {chart.aspects.map((aspect, idx) => {
                  // include idx in the key in case two planets share the same aspect type (rare but possible)
                  const key = `aspect-${aspect.a}-${aspect.type}-${aspect.b}-${idx}`;
                  const url = `${INTERP_BASE}/interpret/combo/aspect?planet1=${aspect.a}&aspect=${aspect.type}&planet2=${aspect.b}`;
                  return (
                    <ExpandableRow
                      key={key}
                      rowKey={key}
                      interpUrl={url}
                      open={openKey === key}
                      onToggle={handleToggle}
                      interp={cache[key] ?? { status: "idle" }}
                      // "Learn more" pills for both planets and the aspect type itself
                      links={[
                        { label: aspect.a, url: `${INTERP_BASE}/interpret/planet/${aspect.a}` },
                        { label: aspect.type, url: `${INTERP_BASE}/interpret/aspect/${aspect.type}` },
                        { label: aspect.b, url: `${INTERP_BASE}/interpret/planet/${aspect.b}` },
                      ]}
                      cells={
                        <>
                          <td className="py-1.5 pr-3 text-sm text-purple-300 font-medium">{aspect.a}</td>
                          {/* the aspect type (e.g. Trine, Square) in a slightly dimmer color */}
                          <td className="py-1.5 pr-3 text-sm text-gray-400">{aspect.type}</td>
                          <td className="py-1.5 pr-3 text-sm text-gray-300">{aspect.b}</td>
                          {/* the orb tells you how exact the aspect is, smaller = stronger influence */}
                          <td className="py-1.5 text-sm text-gray-500">Orb {formatDegree(aspect.orb)}</td>
                        </>
                      }
                    />
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )}

      </div>
    </div>
  );
}
