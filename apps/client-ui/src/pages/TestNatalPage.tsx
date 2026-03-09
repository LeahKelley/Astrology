import React, { useMemo, useState } from "react";

type NatalChartRequest = {
  date: string;      // YYYY-MM-DD
  time: string;      // HH:mm
  timezone: string;        // e.g. America/New_York
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

type House = number;

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
  houses: House[];
  aspects: Aspect[];
};

const SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

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

const defaultResponse: NatalChartResponse = {
  bodies: [],
  houses: [],
  aspects: [],
};

export default function TestNatalPage() {
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
        throw new Error("City not found in temporary test lookup. Add it to cityToCoords() or use a supported city.");
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

      const res = await fetch("http://127.0.0.1:8000/chart/natal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.leftColumn}>
          <form onSubmit={handleSubmit} style={styles.formCard}>
            <div style={styles.cardHeader}>Manual profile</div>

            <div style={styles.formBody}>
              <FieldRow label="Firstname" required>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={styles.input}
                />
              </FieldRow>

              <FieldRow label="Date of Birth">
                <div style={styles.inlineGroup}>
                  <select value={day} onChange={(e) => setDay(e.target.value)} style={styles.selectSmall}>
                    {Array.from({ length: 31 }, (_, i) => {
                      const val = String(i + 1).padStart(2, "0");
                      return (
                        <option key={val} value={val}>
                          {val}
                        </option>
                      );
                    })}
                  </select>

                  <select value={month} onChange={(e) => setMonth(e.target.value)} style={styles.selectMedium}>
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <input
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    style={{ ...styles.input, width: 80 }}
                  />
                </div>
              </FieldRow>

              <FieldRow label="Time of Birth">
                <div style={styles.inlineGroup}>
                  <input
                    type="time"
                    value={timeOfBirth}
                    onChange={(e) => setTimeOfBirth(e.target.value)}
                    disabled={timeUnknown}
                    style={{ ...styles.input, width: 120 }}
                  />
                  <label style={styles.checkboxLabel}>
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
                  style={styles.input}
                />
              </FieldRow>

              <FieldRow label="Timezone">
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={styles.input}
                />
              </FieldRow>

              <div style={styles.buttonRow}>
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
                  style={styles.secondaryButton}
                >
                  Reset
                </button>

                <button type="submit" style={styles.primaryButton} disabled={loading}>
                  {loading ? "Loading..." : "Next"}
                </button>
              </div>

              <div style={styles.requiredText}>* Required field</div>
            </div>
          </form>
        </div>

        <div style={styles.rightColumn}>
          <h2 style={styles.pageTitle}>{displayName}</h2>

          {error && <div style={styles.errorBox}>{error}</div>}

          <Panel title="Positions of Planets">
            <table style={styles.table}>
              <tbody>
                {chart.bodies.map((body) => (
                  <tr key={body.name}>
                    <td style={styles.cellName}>{body.name}</td>
                    <td style={styles.cellValue}>{formatDegree(body.degree_in_sign)}</td>
                    <td style={styles.cellValue}>{body.sign}</td>
                    <td style={styles.cellValue}>{body.retrograde ? "R" : ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Planets in Houses">
            <table style={styles.table}>
              <tbody>
                {chart.bodies
                  .filter((body) => typeof body.house === "number")
                  .map((body) => (
                    <tr key={`${body.name}-house`}>
                      <td style={styles.cellName}>{body.name}</td>
                      <td style={styles.cellValue}>House {body.house}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="Positions of Houses">
            <table style={styles.table}>
              <tbody>
                {chart.houses.map((house, idx) => (
                  <tr key={idx}>
                    <td style={styles.cellName}>House {idx + 1}</td>
                    <td style={styles.cellValue}>{house.toFixed(2)}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          <Panel title="List of Planetary Aspects">
            <table style={styles.table}>
              <tbody>
                {chart.aspects.map((aspect, idx) => (
                  <tr key={`${aspect.a}-${aspect.b}-${idx}`}>
                    <td style={styles.cellName}>{aspect.a}</td>
                    <td style={styles.cellValue}>{aspect.type}</td>
                    <td style={styles.cellValue}>{aspect.b}</td>
                    <td style={styles.cellValue}>Orb {formatDegree(aspect.orb)}</td>
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
    <div style={styles.fieldRow}>
      <div style={styles.fieldLabel}>
        {required ? <span style={{ color: "#b31b1b" }}>* </span> : null}
        {label}
      </div>
      <div style={styles.fieldControl}>{children}</div>
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
    <div style={styles.panel}>
      <div style={styles.cardHeader}>{title}</div>
      <div style={styles.panelBody}>{children}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#eef2f7",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#1e2b4a",
  },
  container: {
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: "24px",
    alignItems: "start",
  },
  leftColumn: {},
  rightColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  pageTitle: {
    margin: 0,
    fontSize: "24px",
    color: "#2b4f85",
  },
  formCard: {
    background: "#dbe3f2",
    border: "1px solid #aebbd5",
    borderRadius: "4px",
    overflow: "hidden",
  },
  cardHeader: {
    background: "#2f5b98",
    color: "white",
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: "16px",
    textAlign: "center",
  },
  formBody: {
    padding: "14px",
  },
  fieldRow: {
    display: "grid",
    gridTemplateColumns: "110px 1fr",
    gap: "10px",
    alignItems: "center",
    marginBottom: "10px",
  },
  fieldLabel: {
    fontSize: "14px",
    color: "#334c78",
  },
  fieldControl: {},
  input: {
    width: "100%",
    padding: "6px 8px",
    border: "1px solid #9eb0cf",
    borderRadius: "3px",
    background: "white",
  },
  selectSmall: {
    padding: "6px 8px",
    border: "1px solid #9eb0cf",
    borderRadius: "3px",
    background: "white",
    width: 62,
  },
  selectMedium: {
    padding: "6px 8px",
    border: "1px solid #9eb0cf",
    borderRadius: "3px",
    background: "white",
    width: 120,
  },
  inlineGroup: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "13px",
  },
  buttonRow: {
    display: "flex",
    gap: "8px",
    justifyContent: "center",
    marginTop: "14px",
  },
  primaryButton: {
    background: "#2f5b98",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 700,
  },
  secondaryButton: {
    background: "#ffffff",
    color: "#2f5b98",
    border: "1px solid #9eb0cf",
    padding: "8px 16px",
    borderRadius: "4px",
    cursor: "pointer",
    fontWeight: 700,
  },
  requiredText: {
    marginTop: "12px",
    fontSize: "12px",
    color: "#7a2230",
    textAlign: "center",
  },
  panel: {
    background: "#ffffff",
    border: "1px solid #b9c7dd",
    borderRadius: "4px",
    overflow: "hidden",
  },
  panelBody: {
    padding: "12px 18px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  cellName: {
    padding: "4px 8px",
    color: "#344f7b",
    whiteSpace: "nowrap",
  },
  cellValue: {
    padding: "4px 8px",
    color: "#23385e",
    whiteSpace: "nowrap",
  },
  errorBox: {
    background: "#ffe9e9",
    color: "#8a1f1f",
    border: "1px solid #d9a3a3",
    padding: "10px 12px",
    borderRadius: "4px",
  },
};