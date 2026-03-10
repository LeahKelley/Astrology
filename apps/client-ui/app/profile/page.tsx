"use client";

import { useMemo, useState } from "react";

type NatalChartRequest = {
  date: string;
  time: string;
  timezone: string;
  latitude: number;
  longitude: number;
  city?: string;
  house_system: string;
};

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

type NatalChartResponse = {
  meta?: {
    request_id?: string;
    generated_at?: string;
  };
  bodies: Body[];
  houses: number[];
  aspects: Aspect[];
};

const MONTHS = [
  { label: "January", value: "01" },
  { label: "February", value: "02" },
  { label: "March", value: "03" },
  { label: "April", value: "04" },
  { label: "May", value: "05" },
  { label: "June", value: "06" },
  { label: "July", value: "07" },
  { label: "August", value: "08" },
  { label: "September", value: "09" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
];

function formatDegree(value: number): string {
  const deg = Math.floor(value);
  const min = Math.round((value - deg) * 60);
  const safeMin = min === 60 ? 59 : min;
  return `${deg}°${safeMin.toString().padStart(2, "0")}'`;
}

function buildDate(year: string, month: string, day: string): string {
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

function cityToCoords(
  city: string
): { latitude: number; longitude: number } | null {
  const lookup: Record<string, { latitude: number; longitude: number }> = {
    "new york": { latitude: 40.7128, longitude: -74.006 },
    "los angeles": { latitude: 34.0522, longitude: -118.2437 },
    chicago: { latitude: 41.8781, longitude: -87.6298 },
    houston: { latitude: 29.7604, longitude: -95.3698 },
    london: { latitude: 51.5072, longitude: -0.1276 },
  };
  return lookup[city.trim().toLowerCase()] ?? null;
}

const defaultResponse: NatalChartResponse = {
  bodies: [],
  houses: [],
  aspects: [],
};

function FieldRow({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 items-center mb-3">
      <div className="text-sm text-gray-400">
        {required && <span className="text-red-400">* </span>}
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
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
      <div className="bg-purple-600/80 px-4 py-2 text-sm font-bold text-center">
        {title}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function ProfilePage() {
  const [firstName, setFirstName] = useState("");
  const [day, setDay] = useState("01");
  const [month, setMonth] = useState("01");
  const [year, setYear] = useState("1970");
  const [timeOfBirth, setTimeOfBirth] = useState("12:00");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [city, setCity] = useState("New York");
  const [timezone, setTimezone] = useState("America/New_York");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [chart, setChart] = useState<NatalChartResponse>(defaultResponse);

  const displayName = useMemo(() => {
    return firstName.trim() || "Profile";
  }, [firstName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const coords = cityToCoords(city);
      if (!coords) {
        throw new Error(
          "City not found in temporary test lookup. Add it to cityToCoords() or use a supported city."
        );
      }

      const payload: NatalChartRequest = {
        date: buildDate(year, month, day),
        time: timeUnknown ? "12:00" : timeOfBirth,
        timezone,
        latitude: coords.latitude,
        longitude: coords.longitude,
        city,
        house_system: "placidus",
      };

      const res = await fetch("http://127.0.0.1:8000/api/v1/chart/natal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Request failed: ${res.status} ${text}`);
      }

      const data: NatalChartResponse = await res.json();
      setChart(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      setChart(defaultResponse);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50";
  const selectClass =
    "rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50";

  return (
    <div className="min-h-screen bg-github-dark pt-24 p-6 font-sans text-white">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-8 lg:grid-cols-[320px_1fr]">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-white/10 overflow-hidden"
        >
          <div className="bg-purple-600/80 px-4 py-2 text-center text-sm font-bold">
            Manual profile
          </div>

          <div className="p-4 space-y-1">
            <FieldRow label="Firstname" required>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputClass}
              />
            </FieldRow>

            <FieldRow label="Date of Birth">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  className={`${selectClass} w-[62px]`}
                >
                  {Array.from({ length: 31 }, (_, i) => {
                    const val = String(i + 1).padStart(2, "0");
                    return (
                      <option key={val} value={val}>
                        {val}
                      </option>
                    );
                  })}
                </select>

                <select
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className={`${selectClass} w-[130px]`}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                <input
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className={`${inputClass} !w-[80px]`}
                />
              </div>
            </FieldRow>

            <FieldRow label="Time of Birth">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={timeOfBirth}
                  onChange={(e) => setTimeOfBirth(e.target.value)}
                  disabled={timeUnknown}
                  className={`${inputClass} !w-[120px]`}
                />
                <label className="flex items-center gap-1.5 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={timeUnknown}
                    onChange={(e) => setTimeUnknown(e.target.checked)}
                  />
                  Unknown
                </label>
              </div>
            </FieldRow>

            <FieldRow label="City of Birth" required>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
              />
            </FieldRow>

            <FieldRow label="Timezone">
              <input
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={inputClass}
              />
            </FieldRow>

            <div className="flex justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setFirstName("");
                  setDay("01");
                  setMonth("01");
                  setYear("1970");
                  setTimeOfBirth("12:00");
                  setTimeUnknown(false);
                  setCity("New York");
                  setTimezone("America/New_York");
                  setChart(defaultResponse);
                  setError("");
                }}
                className="rounded-md border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-gray-300 transition-colors hover:bg-white/10"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-purple-500 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Next"}
              </button>
            </div>

            <p className="pt-3 text-center text-xs text-red-400/70">
              * Required field
            </p>
          </div>
        </form>

        {/* Results */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-purple-300">{displayName}</h2>

          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <Panel title="Positions of Planets">
            <table className="w-full">
              <tbody>
                {chart.bodies.map((body) => (
                  <tr
                    key={body.name}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-1.5 pr-4 text-sm text-purple-300">
                      {body.name}
                    </td>
                    <td className="py-1.5 pr-4 text-sm text-gray-300">
                      {formatDegree(body.degree_in_sign)}
                    </td>
                    <td className="py-1.5 pr-4 text-sm text-gray-300">
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

          <Panel title="Planets in Houses">
            <table className="w-full">
              <tbody>
                {chart.bodies
                  .filter((body) => typeof body.house === "number")
                  .map((body) => (
                    <tr
                      key={`${body.name}-house`}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-1.5 pr-4 text-sm text-purple-300">
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

          <Panel title="Positions of Houses">
            <table className="w-full">
              <tbody>
                {chart.houses.map((house, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-1.5 pr-4 text-sm text-purple-300">
                      House {idx + 1}
                    </td>
                    <td className="py-1.5 text-sm text-gray-300">
                      {house.toFixed(2)}°
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="List of Planetary Aspects">
            <table className="w-full">
              <tbody>
                {chart.aspects.map((aspect, idx) => (
                  <tr
                    key={`${aspect.a}-${aspect.b}-${idx}`}
                    className="border-b border-white/5 last:border-0"
                  >
                    <td className="py-1.5 pr-4 text-sm text-purple-300">
                      {aspect.a}
                    </td>
                    <td className="py-1.5 pr-4 text-sm text-gray-300">
                      {aspect.type}
                    </td>
                    <td className="py-1.5 pr-4 text-sm text-gray-300">
                      {aspect.b}
                    </td>
                    <td className="py-1.5 text-sm text-gray-400">
                      Orb {formatDegree(aspect.orb)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>
        </div>
      </div>
    </div>
  );
}
