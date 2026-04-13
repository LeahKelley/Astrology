"use client";

type Body = {
  name: string;
  longitude: number;
  sign: string;
  degree_in_sign: number;
  retrograde: boolean;
  house?: number;
};

type Aspect = {
  a: string;
  type: string;
  b: string;
  orb: number;
};

export type NatalChartResponse = {
  meta?: { request_id?: string; generated_at?: string };
  bodies: Body[];
  houses: number[];
  aspects: Aspect[];
};

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

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

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <div className="bg-purple-600/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-center">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

type ChartResultsProps = {
  chart: NatalChartResponse;
  profileName?: string;
};

export function ChartResults({ chart, profileName }: ChartResultsProps) {
  const hasBodies = chart.bodies.length > 0;
  const hasHouses = chart.houses.length > 0;
  const hasAspects = chart.aspects.length > 0;

  if (!hasBodies && !hasHouses && !hasAspects) {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-gray-500">
          Select a profile to view chart calculations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {profileName && (
        <h3 className="text-lg font-bold text-purple-300">{profileName}&apos;s Chart</h3>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hasBodies && (
          <Panel title="Planet Positions">
            <table className="w-full">
              <tbody>
                {chart.bodies.map((body) => (
                  <tr
                    key={body.name}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-1.5 pr-3 text-sm text-purple-300 font-medium">
                      {body.name}
                    </td>
                    <td className="py-1.5 pr-3 text-sm text-gray-300">
                      {formatDegree(body.degree_in_sign)}
                    </td>
                    <td className="py-1.5 pr-3 text-sm text-gray-300">
                      {body.sign}
                    </td>
                    <td className="py-1.5 text-sm text-red-400">
                      {body.retrograde ? "R" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}

        {hasBodies && chart.bodies.some((b) => typeof b.house === "number") && (
          <Panel title="Planets in Houses">
            <table className="w-full">
              <tbody>
                {chart.bodies
                  .filter((b) => typeof b.house === "number")
                  .map((body) => (
                    <tr
                      key={`${body.name}-house`}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-1.5 pr-3 text-sm text-purple-300 font-medium">
                        {body.name}
                      </td>
                      <td className="py-1.5 text-sm text-gray-300">
                        House {body.house}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Panel>
        )}

        {hasHouses && (
          <Panel title="House Cusps">
            <table className="w-full">
              <tbody>
                {chart.houses.map((cusp, idx) => {
                  const { sign, degree } = longitudeToSignDegree(cusp);
                  return (
                    <tr
                      key={idx}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-1.5 pr-3 text-sm text-purple-300 font-medium">
                        House {idx + 1}
                      </td>
                      <td className="py-1.5 pr-3 text-sm text-gray-300">{degree}</td>
                      <td className="py-1.5 text-sm text-gray-300">{sign}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>
        )}

        {hasAspects && (
          <Panel title="Planetary Aspects">
            <table className="w-full">
              <tbody>
                {chart.aspects.map((aspect, idx) => (
                  <tr
                    key={`${aspect.a}-${aspect.b}-${idx}`}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-1.5 pr-3 text-sm text-purple-300 font-medium">
                      {aspect.a}
                    </td>
                    <td className="py-1.5 pr-3 text-sm text-gray-400">
                      {aspect.type}
                    </td>
                    <td className="py-1.5 pr-3 text-sm text-gray-300">
                      {aspect.b}
                    </td>
                    <td className="py-1.5 text-sm text-gray-500">
                      Orb {formatDegree(aspect.orb)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        )}
      </div>
    </div>
  );
}
