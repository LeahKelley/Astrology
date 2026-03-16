"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { CalendarDays } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  dateOfBirth: z.date({ error: "Date of birth is required" }),
  timeOfBirth: z.string(),
  timeUnknown: z.boolean(),
  city: z.string().min(1, "City of birth is required"),
  timezone: z.string().min(1, "Timezone is required"),
});

type ProfileFormData = z.infer<typeof profileSchema>;

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
  meta?: { request_id?: string; generated_at?: string };
  bodies: Body[];
  houses: number[];
  aspects: Aspect[];
};

function formatDegree(value: number): string {
  const deg = Math.floor(value);
  const min = Math.round((value - deg) * 60);
  const safeMin = min === 60 ? 59 : min;
  return `${deg}°${safeMin.toString().padStart(2, "0")}'`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function cityToCoords(city: string): { latitude: number; longitude: number } | null {
  const lookup: Record<string, { latitude: number; longitude: number }> = {
    "new york": { latitude: 40.7128, longitude: -74.006 },
    "los angeles": { latitude: 34.0522, longitude: -118.2437 },
    chicago: { latitude: 41.8781, longitude: -87.6298 },
    houston: { latitude: 29.7604, longitude: -95.3698 },
    london: { latitude: 51.5072, longitude: -0.1276 },
  };
  return lookup[city.trim().toLowerCase()] ?? null;
}

const defaultResponse: NatalChartResponse = { bodies: [], houses: [], aspects: [] };

function FieldRow({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="text-sm text-gray-400 mb-1">
        {required && <span className="text-red-400">* </span>}
        {label}
      </div>
      <div>{children}</div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 overflow-hidden">
      <div className="bg-purple-600/80 px-4 py-2 text-sm font-bold text-center">{title}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function DatePickerField({
  value,
  onChange,
  error,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
          error
            ? "border-red-500/30 bg-red-500/5"
            : "border-white/10 bg-white/5"
        }`}
      >
        <CalendarDays className="w-4 h-4 text-gray-500 shrink-0" />
        <span className={value ? "text-white" : "text-gray-500"}>
          {value ? formatDate(value) : "Select date…"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 left-0 rounded-xl border border-white/10 bg-github-dark shadow-2xl shadow-black/40 p-3 rdp-dark">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date ?? undefined);
              if (date) setOpen(false);
            }}
            defaultMonth={value ?? new Date(2000, 0)}
            captionLayout="dropdown"
            startMonth={new Date(1920, 0)}
            endMonth={new Date()}
            animate
          />
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      dateOfBirth: undefined,
      timeOfBirth: "12:00",
      timeUnknown: false,
      city: "New York",
      timezone: "America/New_York",
    },
  });

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [chart, setChart] = useState<NatalChartResponse>(defaultResponse);

  const firstName = watch("firstName");
  const timeUnknown = watch("timeUnknown");

  const displayName = useMemo(() => firstName.trim() || "Profile", [firstName]);

  const inputClass =
    "w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50";
  const inputErrorClass =
    "w-full rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50";

  async function onSubmit(data: ProfileFormData) {
    setLoading(true);
    setApiError("");

    try {
      const coords = cityToCoords(data.city);
      if (!coords) {
        throw new Error(
          "City not found in temporary test lookup. Add it to cityToCoords() or use a supported city."
        );
      }

      const d = data.dateOfBirth;
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      const payload: NatalChartRequest = {
        date: dateStr,
        time: data.timeUnknown ? "12:00" : data.timeOfBirth,
        timezone: data.timezone,
        latitude: coords.latitude,
        longitude: coords.longitude,
        city: data.city,
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

      const result: NatalChartResponse = await res.json();
      setChart(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setApiError(message);
      setChart(defaultResponse);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    reset();
    setChart(defaultResponse);
    setApiError("");
  }

  return (
    <div className="min-h-screen bg-github-dark pt-24 p-6 font-sans text-white">
      <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-8 lg:grid-cols-[340px_1fr]">
        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-lg border border-white/10 overflow-hidden"
        >
          <div className="bg-purple-600/80 px-4 py-2 text-center text-sm font-bold">
            Manual profile
          </div>

          <div className="p-4 space-y-1">
            <FieldRow label="First name" required error={errors.firstName?.message}>
              <input
                {...register("firstName")}
                className={errors.firstName ? inputErrorClass : inputClass}
                placeholder="Enter your name"
              />
            </FieldRow>

            <FieldRow label="Date of Birth" required error={errors.dateOfBirth?.message}>
              <Controller
                control={control}
                name="dateOfBirth"
                render={({ field }) => (
                  <DatePickerField
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.dateOfBirth?.message}
                  />
                )}
              />
            </FieldRow>

            <FieldRow label="Time of Birth" error={errors.timeOfBirth?.message}>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  {...register("timeOfBirth")}
                  disabled={timeUnknown}
                  className={`${errors.timeOfBirth ? inputErrorClass : inputClass} !w-[120px]`}
                />
                <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("timeUnknown")}
                    className="accent-purple-500"
                  />
                  Unknown
                </label>
              </div>
            </FieldRow>

            <FieldRow label="City of Birth" required error={errors.city?.message}>
              <input
                {...register("city")}
                className={errors.city ? inputErrorClass : inputClass}
                placeholder="e.g. New York"
              />
            </FieldRow>

            <FieldRow label="Timezone" required error={errors.timezone?.message}>
              <input
                {...register("timezone")}
                className={errors.timezone ? inputErrorClass : inputClass}
                placeholder="e.g. America/New_York"
              />
            </FieldRow>

            <div className="flex justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={handleReset}
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

            <p className="pt-3 text-center text-xs text-red-400/70">* Required field</p>
          </div>
        </form>

        {/* Results */}
        <div className="flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-purple-300">{displayName}</h2>

          {apiError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {apiError}
            </div>
          )}

          <Panel title="Positions of Planets">
            <table className="w-full">
              <tbody>
                {chart.bodies.map((body) => (
                  <tr key={body.name} className="border-b border-white/5 last:border-0">
                    <td className="py-1.5 pr-4 text-sm text-purple-300">{body.name}</td>
                    <td className="py-1.5 pr-4 text-sm text-gray-300">{formatDegree(body.degree_in_sign)}</td>
                    <td className="py-1.5 pr-4 text-sm text-gray-300">{body.sign}</td>
                    <td className="py-1.5 text-sm text-red-400">{body.retrograde ? "R" : ""}</td>
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
                    <tr key={`${body.name}-house`} className="border-b border-white/5 last:border-0">
                      <td className="py-1.5 pr-4 text-sm text-purple-300">{body.name}</td>
                      <td className="py-1.5 text-sm text-gray-300">House {body.house}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Positions of Houses">
            <table className="w-full">
              <tbody>
                {chart.houses.map((house, idx) => (
                  <tr key={idx} className="border-b border-white/5 last:border-0">
                    <td className="py-1.5 pr-4 text-sm text-purple-300">House {idx + 1}</td>
                    <td className="py-1.5 text-sm text-gray-300">{house.toFixed(2)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="List of Planetary Aspects">
            <table className="w-full">
              <tbody>
                {chart.aspects.map((aspect, idx) => (
                  <tr key={`${aspect.a}-${aspect.b}-${idx}`} className="border-b border-white/5 last:border-0">
                    <td className="py-1.5 pr-4 text-sm text-purple-300">{aspect.a}</td>
                    <td className="py-1.5 pr-4 text-sm text-gray-300">{aspect.type}</td>
                    <td className="py-1.5 pr-4 text-sm text-gray-300">{aspect.b}</td>
                    <td className="py-1.5 text-sm text-gray-400">Orb {formatDegree(aspect.orb)}</td>
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
