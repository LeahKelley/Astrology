"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";

type Body = {
  name: string;
  longitude: number;
  sign: string;
  degree_in_sign: number;
  retrograde: boolean;
  house?: number;
  speed?: number;
};

type Aspect = {
  a: string;
  type: string;
  b: string;
  orb: number;
};

export type NatalChartResponse = {
  meta?: { request_id?: string; generated_at?: string };
  angles?: { asc: number; mc: number };
  bodies: Body[];
  houses: number[];
  aspects: Aspect[];
};

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const INTERP_BASE = "http://localhost:8002";

function formatDegree(value: number): string {
  const deg = Math.floor(value);
  const min = Math.round((value - deg) * 60);
  const safeMin = min === 60 ? 59 : min;
  return `${deg}°${safeMin.toString().padStart(2, "0")}'`;
}

function longitudeToSignDegree(longitude: number): { sign: string; degree: string } {
  const signIndex = Math.floor(longitude / 30) % 12;
  const degreeInSign = longitude % 30;
  return { sign: SIGNS[signIndex], degree: formatDegree(degreeInSign) };
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <div className="bg-purple-600/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-center">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

type InterpState = { status: "idle" | "loading" | "done" | "error"; text?: string; title?: string };

function useInterpretations() {
  const [cache, setCache] = useState<Record<string, InterpState>>({});

  const fetch_ = useCallback(async (key: string, url: string) => {
    setCache((c) => ({ ...c, [key]: { status: "loading" } }));
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setCache((c) => ({ ...c, [key]: { status: "done", title: data.title, text: data.text } }));
    } catch {
      setCache((c) => ({ ...c, [key]: { status: "error", text: "Could not load interpretation." } }));
    }
  }, []);

  return { cache, fetch_ };
}

type ClickableLink = { label: string; url: string };

function InterpDropdown({
  text,
  links,
}: {
  text: string;
  links?: ClickableLink[];
}) {
  const [secondary, setSecondary] = useState<{ label: string; text: string } | null>(null);
  const [loadingLink, setLoadingLink] = useState<string | null>(null);

  async function handleLinkClick(link: ClickableLink) {
    if (secondary?.label === link.label) {
      setSecondary(null);
      return;
    }
    setLoadingLink(link.label);
    try {
      const res = await fetch(link.url);
      const data = await res.json();
      setSecondary({ label: link.label, text: data.description ?? data.in_chart ?? data.text ?? "" });
    } finally {
      setLoadingLink(null);
    }
  }

  const paragraphs = text.split("\n\n").filter(Boolean);

  return (
    <div className="mt-2 rounded-md bg-white/[0.04] border border-purple-500/20 px-4 py-3 text-xs text-gray-300 leading-relaxed space-y-2">
      {paragraphs.map((p, i) => (
        <p key={i}>
          {p.startsWith("Retrograde influence:") ? (
            <span><span className="text-red-400 font-medium">⟳ Retrograde influence:</span>{p.slice("Retrograde influence:".length)}</span>
          ) : p}
        </p>
      ))}

      {links && links.length > 0 && (
        <div className="pt-2 border-t border-white/10 flex flex-wrap gap-2">
          <span className="text-gray-500 text-[10px] uppercase tracking-wider self-center">Learn more:</span>
          {links.map((link) => (
            <button
              key={link.label}
              onClick={(e) => { e.stopPropagation(); handleLinkClick(link); }}
              className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                secondary?.label === link.label
                  ? "border-purple-400/60 bg-purple-500/20 text-purple-300"
                  : "border-white/15 bg-white/5 text-gray-400 hover:border-purple-400/40 hover:text-purple-300"
              }`}
            >
              {loadingLink === link.label ? "…" : link.label}
            </button>
          ))}
        </div>
      )}

      {secondary && (
        <div className="mt-2 rounded bg-white/[0.03] border border-white/10 px-3 py-2 text-[11px] text-gray-400 leading-relaxed">
          <span className="text-purple-300 font-medium text-xs">{secondary.label}</span>
          <p className="mt-1">{secondary.text}</p>
        </div>
      )}
    </div>
  );
}

type ExpandableRowProps = {
  rowKey: string;
  interpUrl: string;
  open: boolean;
  onToggle: (key: string, url: string) => void;
  interp: InterpState;
  cells: React.ReactNode;
  links?: ClickableLink[];
};

function ExpandableRow({ rowKey, interpUrl, open, onToggle, interp, cells, links }: ExpandableRowProps) {
  return (
    <>
      <tr
        className="border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.03] transition-colors group"
        onClick={() => onToggle(rowKey, interpUrl)}
      >
        <td className="py-1.5 pr-1 w-4">
          {open
            ? <ChevronDown className="w-3 h-3 text-purple-400" />
            : <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-purple-400 transition-colors" />}
        </td>
        {cells}
      </tr>
      {open && (
        <tr className="border-b border-white/5">
          <td />
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

type ChartResultsProps = {
  chart: NatalChartResponse;
  profileName?: string;
};

export function ChartResults({ chart, profileName }: ChartResultsProps) {
  const { cache, fetch_ } = useInterpretations();
  const [openKey, setOpenKey] = useState<string | null>(null);

  function handleToggle(key: string, url: string) {
    if (openKey === key) {
      setOpenKey(null);
      return;
    }
    setOpenKey(key);
    if (!cache[key] || cache[key].status === "idle") {
      fetch_(key, url);
    }
  }

  const hasBodies = chart.bodies.length > 0;
  const hasHouses = chart.houses.length > 0;
  const hasAspects = chart.aspects.length > 0;

  if (!hasBodies && !hasHouses && !hasAspects) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-gray-500">Select a profile to view chart calculations.</p>
      </div>
    );
  }

  type BodyRow = { kind: "body"; body: Body };
  type AngleRow = { kind: "angle"; label: string; longitude: number };
  type Row = BodyRow | AngleRow;

  const planetRows: Row[] = [];
  for (const body of chart.bodies) {
    planetRows.push({ kind: "body", body });
    if (body.name === "Moon" && chart.angles) {
      planetRows.push({ kind: "angle", label: "ASC", longitude: chart.angles.asc });
    }
  }
  if (chart.angles) {
    planetRows.push({ kind: "angle", label: "DSC", longitude: (chart.angles.asc + 180) % 360 });
    planetRows.push({ kind: "angle", label: "MC", longitude: chart.angles.mc });
    planetRows.push({ kind: "angle", label: "IC", longitude: (chart.angles.mc + 180) % 360 });
  }

  return (
    <div className="space-y-4">
      {profileName && (
        <h3 className="text-lg font-bold text-purple-300">{profileName}&apos;s Chart</h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Planet Positions */}
        {hasBodies && (
          <Panel title="Planet Positions">
            <table className="w-full">
              <tbody>
                {planetRows.map((row) => {
                  if (row.kind === "angle") {
                    const { sign, degree } = longitudeToSignDegree(row.longitude);
                    const key = `pos-${row.label}`;
                    const url = `${INTERP_BASE}/interpret/combo/planet-in-sign?planet=${row.label}&sign=${sign}`;
                    return (
                      <ExpandableRow
                        key={key}
                        rowKey={key}
                        interpUrl={url}
                        open={openKey === key}
                        onToggle={handleToggle}
                        interp={cache[key] ?? { status: "idle" }}
                        links={[
                          { label: row.label, url: `${INTERP_BASE}/interpret/planet/${row.label}` },
                          { label: sign, url: `${INTERP_BASE}/interpret/sign/${sign}` },
                        ]}
                        cells={
                          <>
                            <td className="py-1.5 pr-3 text-sm text-blue-300 font-medium">{row.label}</td>
                            <td className="py-1.5 pr-3 text-sm text-gray-300">{degree}</td>
                            <td className="py-1.5 pr-3 text-sm text-gray-300">{sign}</td>
                            <td />
                          </>
                        }
                      />
                    );
                  }
                  const key = `pos-${row.body.name}`;
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

        {/* Planets in Houses */}
        {hasBodies && chart.bodies.some((b) => typeof b.house === "number") && (
          <Panel title="Planets in Houses">
            <table className="w-full">
              <tbody>
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

        {/* House Cusps */}
        {hasHouses && (
          <Panel title="House Cusps">
            <table className="w-full">
              <tbody>
                {chart.houses.map((cusp, idx) => {
                  const { sign, degree } = longitudeToSignDegree(cusp);
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

        {/* Planetary Aspects */}
        {hasAspects && (
          <Panel title="Planetary Aspects">
            <table className="w-full">
              <tbody>
                {chart.aspects.map((aspect, idx) => {
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
                      links={[
                        { label: aspect.a, url: `${INTERP_BASE}/interpret/planet/${aspect.a}` },
                        { label: aspect.type, url: `${INTERP_BASE}/interpret/aspect/${aspect.type}` },
                        { label: aspect.b, url: `${INTERP_BASE}/interpret/planet/${aspect.b}` },
                      ]}
                      cells={
                        <>
                          <td className="py-1.5 pr-3 text-sm text-purple-300 font-medium">{aspect.a}</td>
                          <td className="py-1.5 pr-3 text-sm text-gray-400">{aspect.type}</td>
                          <td className="py-1.5 pr-3 text-sm text-gray-300">{aspect.b}</td>
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
