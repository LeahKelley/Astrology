"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { StarField } from "../components/StarField";
import {
  BookOpen,
  ChevronDown,
  Shuffle,
  Sun,
  Moon,
  Star,
  Orbit,
  Home,
  Waypoints,
  Clock,
  MapPin,
  Flame,
  Droplets,
  Wind,
  Mountain,
  CircleDot,
  ArrowUpDown,
  Square,
  Triangle,
  Hexagon,
  Target,
} from "lucide-react";

const INTERP_API = "http://localhost:8002";

type InterpData = {
  name: string;
  symbol: string;
  keywords: string[];
  description: string;
  in_chart: string;
};

type AllInterps = {
  planets: Record<string, InterpData>;
  signs: Record<string, InterpData>;
  houses: Record<string, InterpData>;
  aspects: Record<string, InterpData>;
};

function firstSentence(text: string): string {
  const idx = text.indexOf(".");
  return idx === -1 ? text : text.slice(0, idx + 1);
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const planetList = [
  { name: "Sun", icon: Sun, glyph: "☉", apiKey: "Sun" },
  { name: "Moon", icon: Moon, glyph: "☽", apiKey: "Moon" },
  { name: "Mercury", icon: Star, glyph: "☿", apiKey: "Mercury" },
  { name: "Venus", icon: Star, glyph: "♀", apiKey: "Venus" },
  { name: "Mars", icon: Flame, glyph: "♂", apiKey: "Mars" },
  { name: "Jupiter", icon: Star, glyph: "♃", apiKey: "Jupiter" },
  { name: "Saturn", icon: Star, glyph: "♄", apiKey: "Saturn" },
  { name: "Uranus", icon: Orbit, glyph: "♅", apiKey: "Uranus" },
  { name: "Neptune", icon: Droplets, glyph: "♆", apiKey: "Neptune" },
  { name: "Pluto", icon: Star, glyph: "♇", apiKey: "Pluto" },
  { name: "Ascendant", icon: Sun, glyph: "AC", apiKey: "ASC" },
  { name: "Midheaven", icon: Triangle, glyph: "MC", apiKey: "MC" },
];

const houseList = [
  { num: 1, title: "The Self" },
  { num: 2, title: "Values & Possessions" },
  { num: 3, title: "Communication & Learning" },
  { num: 4, title: "Home & Foundations" },
  { num: 5, title: "Creativity & Pleasure" },
  { num: 6, title: "Health & Daily Routines" },
  { num: 7, title: "Partnerships & Others" },
  { num: 8, title: "Transformation & Shared Resources" },
  { num: 9, title: "Beliefs & Exploration" },
  { num: 10, title: "Career & Public Image" },
  { num: 11, title: "Community & Aspirations" },
  { num: 12, title: "The Unconscious & Solitude" },
];

const signList = [
  { name: "Aries", glyph: "♈", element: "fire" },
  { name: "Taurus", glyph: "♉", element: "earth" },
  { name: "Gemini", glyph: "♊", element: "air" },
  { name: "Cancer", glyph: "♋", element: "water" },
  { name: "Leo", glyph: "♌", element: "fire" },
  { name: "Virgo", glyph: "♍", element: "earth" },
  { name: "Libra", glyph: "♎", element: "air" },
  { name: "Scorpio", glyph: "♏", element: "water" },
  { name: "Sagittarius", glyph: "♐", element: "fire" },
  { name: "Capricorn", glyph: "♑", element: "earth" },
  { name: "Aquarius", glyph: "♒", element: "air" },
  { name: "Pisces", glyph: "♓", element: "water" },
];

const aspectList = [
  { name: "Conjunction", angle: "0°", icon: CircleDot, strength: "Strongest", apiKey: "conjunction" },
  { name: "Opposition", angle: "180°", icon: ArrowUpDown, strength: "Strong", apiKey: "opposition" },
  { name: "Square", angle: "90°", icon: Square, strength: "Strong", apiKey: "square" },
  { name: "Trine", angle: "120°", icon: Triangle, strength: "Moderate", apiKey: "trine" },
  { name: "Sextile", angle: "60°", icon: Hexagon, strength: "Gentle", apiKey: "sextile" },
];

// Mercury (~28°) and Venus (~47°) have limited max elongation from the Sun.
// Two inner planets' max separation = sum of their elongations; one inner + outer = 180°.
const MAX_INNER_ELONGATION: Partial<Record<string, number>> = { Mercury: 28, Venus: 47 };

function maxAngularSep(a: string, b: string): number {
  if (a === b) return 0;
  const aE = MAX_INNER_ELONGATION[a];
  const bE = MAX_INNER_ELONGATION[b];
  if (a === "Sun") return bE ?? 180;
  if (b === "Sun") return aE ?? 180;
  if (aE !== undefined && bE !== undefined) return aE + bE;
  return 180;
}

// Minimum angular separation required to form each aspect (angle − typical orb)
const ASPECT_MIN_SEP: Record<string, number> = {
  conjunction: 0,
  sextile: 54,
  square: 82,
  trine: 112,
  opposition: 172,
};

const elementColor: Record<string, string> = {
  fire: "from-red-500/20 to-orange-500/20 border-red-500/20",
  earth: "from-green-500/20 to-emerald-500/20 border-green-500/20",
  air: "from-sky-500/20 to-cyan-500/20 border-sky-500/20",
  water: "from-blue-500/20 to-indigo-500/20 border-blue-500/20",
};

const elementTextColor: Record<string, string> = {
  fire: "text-orange-400",
  earth: "text-emerald-400",
  air: "text-sky-400",
  water: "text-blue-400",
};

const elementIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  fire: Flame,
  earth: Mountain,
  air: Wind,
  water: Droplets,
};


type ComboInterp = { title: string; text: string; keywords: string[] };

const selectCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

const labelCls = "text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block";

function ExplorerResultPanel({
  result,
  loading,
  title,
}: {
  result: ComboInterp | null;
  loading: boolean;
  title: string;
}) {
  if (!loading && !result) return null;
  return (
    <motion.div
      key={title}
      className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="px-6 py-6">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-6 w-2/3 rounded-lg bg-white/10" />
            <div className="h-3 w-1/3 rounded bg-white/5" />
            <div className="h-3 w-full rounded bg-white/5" />
            <div className="h-3 w-5/6 rounded bg-white/5" />
          </div>
        ) : result ? (
          <>
            <h3 className="text-xl font-display font-bold mb-2">{title}</h3>
            {result.keywords.length > 0 && (
              <p className="text-xs text-purple-300/70 mb-4">{result.keywords.join(" · ")}</p>
            )}
            {result.text.split("\n\n").map((para, i) => (
              <p key={i} className="text-sm text-gray-300 leading-relaxed mb-3 last:mb-0">
                {para}
              </p>
            ))}
          </>
        ) : null}
      </div>
    </motion.div>
  );
}

function PlanetPlacementExplorer() {
  const [planet, setPlanet] = useState("");
  const [placeType, setPlaceType] = useState<"house" | "sign" | "">("");
  const [value, setValue] = useState("");
  const [retrograde, setRetrograde] = useState(false);
  const [result, setResult] = useState<ComboInterp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!planet || !placeType || !value) { setResult(null); return; }
    let ignored = false;
    setResult(null);
    setLoading(true);
    const url =
      placeType === "house"
        ? `${INTERP_API}/interpret/combo/planet-in-house?planet=${planet}&house=${value}`
        : `${INTERP_API}/interpret/combo/planet-in-sign?planet=${planet}&sign=${value}${retrograde ? "&retrograde=true" : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (!ignored) { setResult(d); setLoading(false); } })
      .catch(() => { if (!ignored) { setResult(null); setLoading(false); } });
    return () => { ignored = true; };
  }, [planet, placeType, value, retrograde]);

  const surprise = () => {
    const rPlanet = planetList[Math.floor(Math.random() * planetList.length)];
    const rType = Math.random() > 0.5 ? "house" : "sign";
    const rValue =
      rType === "house"
        ? String(houseList[Math.floor(Math.random() * houseList.length)].num)
        : signList[Math.floor(Math.random() * signList.length)].name;
    setRetrograde(false);
    setPlanet(rPlanet.apiKey);
    setPlaceType(rType);
    setValue(rValue);
  };

  const selectedPlanetName = planetList.find((p) => p.apiKey === planet)?.name ?? "";
  const resultTitle =
    planet && placeType && value
      ? placeType === "house"
        ? `${selectedPlanetName} in House ${value} Meaning`
        : `${selectedPlanetName} in ${value}${retrograde ? " (Retrograde)" : ""} Meaning`
      : "";

  return (
    <div className="mt-16">
      <div className="text-center mb-8">
        <h3 className="text-xl font-display font-bold mb-2">Placement Explorer</h3>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Place a planet in a house or sign to see the specific interpretation for that position.
        </p>
        <button
          onClick={surprise}
          className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Surprise Me
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        <div>
          <label className={labelCls}>Planet</label>
          <div className="relative">
            <select
              value={planet}
              onChange={(e) => { setPlanet(e.target.value); setPlaceType(""); setValue(""); setRetrograde(false); }}
              className={selectCls}
            >
              <option value="">Select a planet…</option>
              {planetList.map((p) => (
                <option key={p.apiKey} value={p.apiKey}>{p.glyph} {p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Place in</label>
          <div className="relative">
            <select
              value={placeType}
              onChange={(e) => { setPlaceType(e.target.value as "house" | "sign"); setValue(""); setRetrograde(false); }}
              disabled={!planet}
              className={selectCls}
            >
              <option value="">Select…</option>
              <option value="house">A House</option>
              <option value="sign">A Sign</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={labelCls}>
            {placeType === "house" ? "House" : placeType === "sign" ? "Sign" : "House or Sign"}
          </label>
          <div className="relative">
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!planet || !placeType}
              className={selectCls}
            >
              <option value="">Select…</option>
              {placeType === "house" &&
                houseList.map((h) => (
                  <option key={h.num} value={String(h.num)}>House {h.num} — {h.title}</option>
                ))}
              {placeType === "sign" &&
                signList.map((s) => (
                  <option key={s.name} value={s.name}>{s.glyph} {s.name}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      {placeType === "sign" && value && (
        <div className="flex items-center justify-center gap-3 max-w-3xl mx-auto mt-4">
          <button
            onClick={() => setRetrograde((r) => !r)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              retrograde ? "bg-purple-600" : "bg-white/10"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                retrograde ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </button>
          <span
            className="text-xs text-gray-400 cursor-pointer select-none"
            onClick={() => setRetrograde((r) => !r)}
          >
            Retrograde — show how {selectedPlanetName} turns inward in {value}
          </span>
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        <ExplorerResultPanel result={result} loading={loading} title={resultTitle} />
      </div>
    </div>
  );
}

function HouseSignExplorer() {
  const [house, setHouse] = useState("");
  const [sign, setSign] = useState("");
  const [result, setResult] = useState<ComboInterp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!house || !sign) { setResult(null); return; }
    let ignored = false;
    setResult(null);
    setLoading(true);
    fetch(`${INTERP_API}/interpret/combo/house-cusp?house=${house}&sign=${sign}`)
      .then((r) => r.json())
      .then((d) => { if (!ignored) { setResult(d); setLoading(false); } })
      .catch(() => { if (!ignored) { setResult(null); setLoading(false); } });
    return () => { ignored = true; };
  }, [house, sign]);

  const surprise = () => {
    const rHouse = String(houseList[Math.floor(Math.random() * houseList.length)].num);
    const rSign = signList[Math.floor(Math.random() * signList.length)].name;
    setHouse(rHouse);
    setSign(rSign);
  };

  const resultTitle = house && sign ? `House ${house} in ${sign} Meaning` : "";

  return (
    <div className="mt-16">
      <div className="text-center mb-8">
        <h3 className="text-xl font-display font-bold mb-2">House Cusp Explorer</h3>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Select a house and the sign on its cusp to understand how that sign colors that area of life.
        </p>
        <button
          onClick={surprise}
          className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Surprise Me
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div>
          <label className={labelCls}>House</label>
          <div className="relative">
            <select
              value={house}
              onChange={(e) => { setHouse(e.target.value); setSign(""); }}
              className={selectCls}
            >
              <option value="">Select a house…</option>
              {houseList.map((h) => (
                <option key={h.num} value={String(h.num)}>House {h.num} — {h.title}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Sign</label>
          <div className="relative">
            <select
              value={sign}
              onChange={(e) => setSign(e.target.value)}
              disabled={!house}
              className={selectCls}
            >
              <option value="">Select a sign…</option>
              {signList.map((s) => (
                <option key={s.name} value={s.name}>{s.glyph} {s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      <div className="max-w-2xl mx-auto">
        <ExplorerResultPanel result={result} loading={loading} title={resultTitle} />
      </div>
    </div>
  );
}

function SignPlacementExplorer() {
  const [sign, setSign] = useState("");
  const [placeType, setPlaceType] = useState<"planet" | "house" | "">("");
  const [value, setValue] = useState("");
  const [retrograde, setRetrograde] = useState(false);
  const [result, setResult] = useState<ComboInterp | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sign || !placeType || !value) { setResult(null); return; }
    let ignored = false;
    setResult(null);
    setLoading(true);
    const url =
      placeType === "planet"
        ? `${INTERP_API}/interpret/combo/planet-in-sign?planet=${value}&sign=${sign}${retrograde ? "&retrograde=true" : ""}`
        : `${INTERP_API}/interpret/combo/house-cusp?house=${value}&sign=${sign}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (!ignored) { setResult(d); setLoading(false); } })
      .catch(() => { if (!ignored) { setResult(null); setLoading(false); } });
    return () => { ignored = true; };
  }, [sign, placeType, value, retrograde]);

  const surprise = () => {
    const rSign = signList[Math.floor(Math.random() * signList.length)];
    const rType = Math.random() > 0.5 ? "planet" : "house";
    const rValue =
      rType === "planet"
        ? planetList[Math.floor(Math.random() * planetList.length)].apiKey
        : String(houseList[Math.floor(Math.random() * houseList.length)].num);
    setRetrograde(false);
    setSign(rSign.name);
    setPlaceType(rType);
    setValue(rValue);
  };

  const selectedPlanetName =
    placeType === "planet" ? (planetList.find((p) => p.apiKey === value)?.name ?? value) : "";
  const resultTitle =
    sign && placeType && value
      ? placeType === "planet"
        ? `${selectedPlanetName} in ${sign}${retrograde ? " (Retrograde)" : ""} Meaning`
        : `House ${value} in ${sign} Meaning`
      : "";

  return (
    <div className="mt-16">
      <div className="text-center mb-8">
        <h3 className="text-xl font-display font-bold mb-2">Sign Placement Explorer</h3>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Choose a sign and explore how a planet or house cusp expresses through it.
        </p>
        <button
          onClick={surprise}
          className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
        >
          <Shuffle className="w-3.5 h-3.5" />
          Surprise Me
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        <div>
          <label className={labelCls}>Sign</label>
          <div className="relative">
            <select
              value={sign}
              onChange={(e) => { setSign(e.target.value); setPlaceType(""); setValue(""); setRetrograde(false); }}
              className={selectCls}
            >
              <option value="">Select a sign…</option>
              {signList.map((s) => (
                <option key={s.name} value={s.name}>{s.glyph} {s.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Explore by</label>
          <div className="relative">
            <select
              value={placeType}
              onChange={(e) => { setPlaceType(e.target.value as "planet" | "house"); setValue(""); setRetrograde(false); }}
              disabled={!sign}
              className={selectCls}
            >
              <option value="">Select…</option>
              <option value="planet">Planet</option>
              <option value="house">House Cusp</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div>
          <label className={labelCls}>
            {placeType === "planet" ? "Planet" : placeType === "house" ? "House" : "Planet or House"}
          </label>
          <div className="relative">
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={!sign || !placeType}
              className={selectCls}
            >
              <option value="">Select…</option>
              {placeType === "planet" &&
                planetList.map((p) => (
                  <option key={p.apiKey} value={p.apiKey}>{p.glyph} {p.name}</option>
                ))}
              {placeType === "house" &&
                houseList.map((h) => (
                  <option key={h.num} value={String(h.num)}>House {h.num} — {h.title}</option>
                ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
      {placeType === "planet" && value && (
        <div className="flex items-center justify-center gap-3 max-w-3xl mx-auto mt-4">
          <button
            onClick={() => setRetrograde((r) => !r)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
              retrograde ? "bg-purple-600" : "bg-white/10"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                retrograde ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </button>
          <span
            className="text-xs text-gray-400 cursor-pointer select-none"
            onClick={() => setRetrograde((r) => !r)}
          >
            Retrograde — show how {selectedPlanetName} turns inward in {sign}
          </span>
        </div>
      )}
      <div className="max-w-3xl mx-auto">
        <ExplorerResultPanel result={result} loading={loading} title={resultTitle} />
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      className="text-center mb-12"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      custom={0}
    >
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 mb-4">
        <Icon className="w-6 h-6 text-purple-400" />
      </div>
      <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight mb-3">{title}</h2>
      <p className="text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
    </motion.div>
  );
}

export default function ResourcesPage() {
  const [interps, setInterps] = useState<AllInterps | null>(null);
  const [p1Key, setP1Key] = useState("");
  const [aspKey, setAspKey] = useState("");
  const [p2Key, setP2Key] = useState("");

  const validP2 = useMemo(() => {
    if (!p1Key) return [];
    const minSep = aspKey ? (ASPECT_MIN_SEP[aspKey] ?? 0) : 0;
    return planetList.filter(
      (p) => p.apiKey !== p1Key && maxAngularSep(p1Key, p.apiKey) >= minSep
    );
  }, [p1Key, aspKey]);

  useEffect(() => {
    if (p2Key && !validP2.some((p) => p.apiKey === p2Key)) setP2Key("");
  }, [validP2, p2Key]);

  const selectedP1 = planetList.find((p) => p.apiKey === p1Key);
  const selectedP2 = planetList.find((p) => p.apiKey === p2Key);
  const selectedAsp = aspectList.find((a) => a.apiKey === aspKey);
  const p1Data = interps?.planets[p1Key];
  const p2Data = interps?.planets[p2Key];
  const aspInterpData = interps?.aspects[aspKey];
  const AspIcon = selectedAsp?.icon ?? CircleDot;
  const explorerReady = !!(p1Key && aspKey && p2Key);
  const hiddenCount = p1Key && aspKey ? planetList.length - 1 - validP2.length : 0;

  const aspectSurprise = () => {
    for (let i = 0; i < 20; i++) {
      const rAsp = aspectList[Math.floor(Math.random() * aspectList.length)];
      const rP1 = planetList[Math.floor(Math.random() * planetList.length)];
      const minSep = ASPECT_MIN_SEP[rAsp.apiKey] ?? 0;
      const eligible = planetList.filter(
        (p) => p.apiKey !== rP1.apiKey && maxAngularSep(rP1.apiKey, p.apiKey) >= minSep
      );
      if (!eligible.length) continue;
      const rP2 = eligible[Math.floor(Math.random() * eligible.length)];
      setP1Key(rP1.apiKey);
      setAspKey(rAsp.apiKey);
      setP2Key(rP2.apiKey);
      return;
    }
  };

  const [comboInterp, setComboInterp] = useState<ComboInterp | null>(null);
  const [comboLoading, setComboLoading] = useState(false);

  useEffect(() => {
    if (!p1Key || !aspKey || !p2Key) { setComboInterp(null); setComboLoading(false); return; }
    let ignored = false;
    setComboLoading(true);
    fetch(`${INTERP_API}/interpret/combo/aspect?planet1=${p1Key}&aspect=${aspKey}&planet2=${p2Key}`)
      .then((r) => r.json())
      .then((data) => { if (!ignored) { setComboInterp(data); setComboLoading(false); } })
      .catch(() => { if (!ignored) { setComboInterp(null); setComboLoading(false); } });
    return () => { ignored = true; };
  }, [p1Key, aspKey, p2Key]);

  useEffect(() => {
    Promise.all([
      fetch(`${INTERP_API}/interpret/planets`).then((r) => r.json()),
      fetch(`${INTERP_API}/interpret/signs`).then((r) => r.json()),
      fetch(`${INTERP_API}/interpret/houses`).then((r) => r.json()),
      fetch(`${INTERP_API}/interpret/aspects`).then((r) => r.json()),
    ])
      .then(([planets, signs, houses, aspects]) =>
        setInterps({ planets, signs, houses, aspects })
      )
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-github-dark relative">
      <StarField />

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full animate-pulse" />
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-900/10 blur-[150px] rounded-full animate-pulse"
          style={{ animationDelay: "2s" }}
        />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold uppercase tracking-widest mb-6">
              <BookOpen className="w-3.5 h-3.5" />
              Learning Center
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6">
              Understand Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                Birth Chart
              </span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
              A natal chart maps the sky at the moment of your birth — planets
              in signs, placed in houses, connected by aspects. This guide
              explains each building block so you can read your chart with
              confidence.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 1 — How to Read a Chart */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            icon={Target}
            title="How to Read a Chart"
            subtitle="The four building blocks that make every placement meaningful."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Planet",
                subtitle: "The What",
                color: "purple",
                desc: "Each planet represents a distinct psychological drive — from the conscious will of the Sun to the transformative depth of Pluto. They are the cast of characters in your natal story.",
              },
              {
                label: "Sign",
                subtitle: "The How",
                color: "blue",
                desc: "The sign a planet occupies describes how that drive naturally expresses itself. Aries acts boldly and fast; Taurus builds slowly and steadily. Sign is the style, not the story.",
              },
              {
                label: "House",
                subtitle: "The Where",
                color: "indigo",
                desc: "The twelve houses map the horoscope onto areas of lived experience — from identity and body (1st) to the unconscious (12th). A planet's house tells you where that energy plays out in life.",
              },
              {
                label: "Aspect",
                subtitle: "The Interaction",
                color: "violet",
                desc: "Aspects are the angular relationships between planets, describing how different drives interact — in natural harmony, creative tension, or dynamic friction that fuels growth.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                className="group rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 hover:border-purple-500/30 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-60px" }}
                variants={fadeUp}
                custom={i}
              >
                <span
                  className={`text-xs font-bold uppercase tracking-widest text-${item.color}-400 mb-1 block`}
                >
                  {item.subtitle}
                </span>
                <h3 className="text-xl font-display font-bold mb-3">
                  {item.label}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2 — Planets & Points */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            icon={Orbit}
            title="Planets & Points"
            subtitle="Each celestial body represents a different drive or dimension of your psyche."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {planetList.map((p, i) => {
              const data = interps?.planets[p.apiKey];
              return (
                <motion.div
                  key={p.name}
                  className="group rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 hover:border-purple-500/30 transition-colors"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={i}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl group-hover:scale-110 transition-transform inline-block">
                      {p.glyph}
                    </span>
                    <h4 className="text-sm font-bold">{p.name}</h4>
                  </div>
                  <p className="text-xs text-purple-300/70 leading-relaxed mb-2">
                    {data ? data.keywords.join(" · ") : ""}
                  </p>
                  {data?.description && (
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {data.description}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <PlanetPlacementExplorer />
        </div>
      </section>

      {/* 3 — Houses */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            icon={Home}
            title="The Twelve Houses"
            subtitle="Houses map the sky to areas of life — from identity to the unconscious."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {houseList.map((h, i) => {
              const data = interps?.houses[String(h.num)];
              return (
                <motion.div
                  key={h.num}
                  className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 hover:border-purple-500/30 transition-colors"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={i}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-300">
                      {h.num}
                    </div>
                    <h4 className="text-sm font-bold">{h.title}</h4>
                  </div>
                  <p className="text-xs text-purple-300/70 leading-relaxed mb-2">
                    {data ? data.keywords.join(" · ") : ""}
                  </p>
                  {data?.description && (
                    <p className="text-xs text-gray-400 leading-relaxed">
                      {data.description}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <HouseSignExplorer />
        </div>
      </section>

      {/* 4 — Signs */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <SectionHeading
            icon={Star}
            title="The Twelve Signs"
            subtitle="Signs describe how energy expresses — style, not prediction."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {signList.map((s, i) => {
              const ElemIcon = elementIcon[s.element];
              const data = interps?.signs[s.name];
              return (
                <motion.div
                  key={s.name}
                  className={`rounded-xl border bg-gradient-to-br ${elementColor[s.element]} backdrop-blur-sm p-5 hover:scale-[1.02] transition-transform`}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={i}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{s.glyph}</span>
                      <div>
                        <h4 className="text-sm font-bold leading-tight">{s.name}</h4>
                        <span className={`text-[10px] font-semibold uppercase tracking-widest ${elementTextColor[s.element]}`}>
                          {s.element}
                        </span>
                      </div>
                    </div>
                    <ElemIcon className={`w-4 h-4 ${elementTextColor[s.element]}`} />
                  </div>
                  <p className={`text-xs font-medium leading-relaxed mb-2 ${elementTextColor[s.element]} opacity-80`}>
                    {data ? data.keywords.join(" · ") : ""}
                  </p>
                  {data?.description && (
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {data.description}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>

          <SignPlacementExplorer />
        </div>
      </section>

      {/* 5 — Aspects */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <SectionHeading
            icon={Waypoints}
            title="Aspects & Orbs"
            subtitle="Aspects describe the geometric relationship — and tension or harmony — between planets."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {aspectList.map((a, i) => {
              const Icon = a.icon;
              const data = interps?.aspects[a.apiKey];
              return (
                <motion.div
                  key={a.name}
                  className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 text-center hover:border-purple-500/30 transition-colors"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={i}
                >
                  <Icon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <h4 className="text-sm font-bold">{a.name}</h4>
                  <span className="text-xs text-gray-500 block mb-2">{a.angle}</span>
                  <span className="inline-block text-[10px] font-semibold uppercase tracking-widest text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-0.5">
                    {a.strength}
                  </span>
                  <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                    {data ? firstSentence(data.description) : ""}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Aspect Explorer */}
          <motion.div
            className="mt-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            custom={0}
          >
            <div className="text-center mb-8">
              <h3 className="text-xl font-display font-bold mb-2">Aspect Explorer</h3>
              <p className="text-sm text-gray-400 max-w-xl mx-auto">
                Choose two planets and an aspect to explore what that dynamic means. Only
                physically possible combinations are shown in the second dropdown.
              </p>
              <button
                onClick={aspectSurprise}
                className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Surprise Me
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              {/* Planet 1 */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                  Planet 1
                </label>
                <div className="relative">
                  <select
                    value={p1Key}
                    onChange={(e) => { setP1Key(e.target.value); setAspKey(""); setP2Key(""); }}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500/40 transition-colors"
                  >
                    <option value="">Select a planet…</option>
                    {planetList.map((p) => (
                      <option key={p.apiKey} value={p.apiKey}>{p.glyph} {p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Aspect */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                  Aspect
                </label>
                <div className="relative">
                  <select
                    value={aspKey}
                    onChange={(e) => setAspKey(e.target.value)}
                    disabled={!p1Key}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">Select an aspect…</option>
                    {aspectList.map((a) => (
                      <option key={a.apiKey} value={a.apiKey}>{a.name} ({a.angle})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Planet 2 */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                  Planet 2
                </label>
                <div className="relative">
                  <select
                    value={p2Key}
                    onChange={(e) => setP2Key(e.target.value)}
                    disabled={!p1Key || !aspKey}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-purple-500/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">Select a planet…</option>
                    {validP2.map((p) => (
                      <option key={p.apiKey} value={p.apiKey}>{p.glyph} {p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {hiddenCount > 0 && (
                  <p className="text-[11px] text-amber-400/70 mt-2 leading-snug">
                    {hiddenCount} planet{hiddenCount > 1 ? "s" : ""} hidden — cannot physically reach this angle.
                  </p>
                )}
              </div>
            </div>

            {/* Result panel */}
            {explorerReady && (
              <motion.div
                key={`${p1Key}-${aspKey}-${p2Key}`}
                className="mt-10 max-w-3xl mx-auto rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_140px_1fr]">
                  {/* Planet 1 */}
                  <div className="p-6 border-b md:border-b-0 md:border-r border-white/5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{selectedP1?.glyph}</span>
                      <div>
                        <h4 className="font-display font-bold">{selectedP1?.name}</h4>
                        <p className="text-xs text-purple-300/70 mt-0.5">{p1Data?.keywords.join(" · ")}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{p1Data?.description}</p>
                  </div>

                  {/* Aspect connector */}
                  <div className="flex flex-col items-center justify-center gap-1.5 p-6 border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.02]">
                    <AspIcon className="w-8 h-8 text-purple-400" />
                    <span className="text-sm font-bold text-center leading-tight">{selectedAsp?.name}</span>
                    <span className="text-xs text-gray-500">{selectedAsp?.angle}</span>
                    <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-widest text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-full px-2.5 py-0.5">
                      {selectedAsp?.strength}
                    </span>
                  </div>

                  {/* Planet 2 */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{selectedP2?.glyph}</span>
                      <div>
                        <h4 className="font-display font-bold">{selectedP2?.name}</h4>
                        <p className="text-xs text-blue-300/70 mt-0.5">{p2Data?.keywords.join(" · ")}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{p2Data?.description}</p>
                  </div>
                </div>

                {/* Specific combo interpretation — most prominent */}
                <div className="px-6 py-6 border-t border-white/5">
                  {comboLoading && (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-6 w-2/3 rounded-lg bg-white/10" />
                      <div className="h-3 w-1/3 rounded bg-white/5" />
                      <div className="h-3 w-full rounded bg-white/5" />
                      <div className="h-3 w-5/6 rounded bg-white/5" />
                    </div>
                  )}
                  {!comboLoading && comboInterp && (
                    <>
                      <h3 className="text-2xl font-display font-bold mb-2">
                        {selectedP1?.name} {selectedAsp?.name} {selectedP2?.name} Meaning
                      </h3>
                      {comboInterp.keywords.length > 0 && (
                        <p className="text-xs text-purple-300/70 mb-4">
                          {comboInterp.keywords.join(" · ")}
                        </p>
                      )}
                      {comboInterp.text.split("\n\n").map((para, i) => (
                        <p key={i} className="text-sm text-gray-300 leading-relaxed mb-3 last:mb-0">
                          {para}
                        </p>
                      ))}
                    </>
                  )}
                </div>

                {aspInterpData?.description && (
                  <div className="px-6 py-5 border-t border-white/5 bg-white/[0.02]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-2">
                      About the {selectedAsp?.name}
                    </p>
                    <p className="text-sm text-gray-400 leading-relaxed">{aspInterpData.description}</p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* 7 — Why Birth Time & Location Matter */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            icon={Clock}
            title="Why Birth Time & Location Matter"
            subtitle="Small shifts in time or place can change your entire chart."
          />

          <motion.div
            className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={fadeUp}
            custom={0}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {[
                {
                  icon: Sun,
                  title: "Ascendant Accuracy",
                  desc: "Your rising sign shifts roughly every two hours as the Earth rotates. An incorrect birth time can place you in an entirely different Ascendant sign, altering the framing of your entire chart.",
                },
                {
                  icon: Home,
                  title: "House Cusp Shifts",
                  desc: "Even a 15-minute difference in birth time can move multiple house cusps. The Midheaven and Ascendant are the most time-sensitive points — a small error here ripples through every house placement.",
                },
                {
                  icon: MapPin,
                  title: "Location-Based Precision",
                  desc: "The same moment in time produces a different chart depending on where on Earth you were born. Latitude and longitude determine which degrees of the zodiac were on the horizon and at the zenith at your birth.",
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="p-6 md:p-8">
                    <Icon className="w-6 h-6 text-purple-400 mb-3" />
                    <h4 className="font-bold mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          <motion.p
            className="text-center text-sm text-gray-500 mt-8 max-w-xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={1}
          >
            MyAstrology computes every placement using Swiss Ephemeris precision
            — the same standard used by professional astrologers worldwide.
            Enter your exact birth time and birthplace for the most accurate
            results.
          </motion.p>
        </div>
      </section>

      <div className="h-20" />
    </div>
  );
}
