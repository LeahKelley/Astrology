"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { StarField } from "../components/StarField";
import {
  BookOpen,
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

const placementExamples = [
  {
    label: "Mars in Taurus in the 4th",
    planetKey: "Mars",
    signKey: "Taurus",
    houseKey: "4",
    synthesis:
      "This placement combines Mars's assertive drive with Taurus's patient endurance, channeling it into the sphere of home and private life. You pursue domestic security with quiet, immovable determination — building slowly and building to last.",
  },
  {
    label: "Venus in Gemini in the 7th",
    planetKey: "Venus",
    signKey: "Gemini",
    houseKey: "7",
    synthesis:
      "Venus's desire for harmony meets Gemini's restless curiosity in the house of partnership. You are drawn to relationships that keep you mentally engaged — witty, conversational, and pleasantly unpredictable.",
  },
  {
    label: "Moon in Scorpio in the 12th",
    planetKey: "Moon",
    signKey: "Scorpio",
    houseKey: "12",
    synthesis:
      "The Moon's emotional sensitivity deepens through Scorpio's intensity and retreats into the chart's most hidden sector. Your inner life runs extraordinarily deep, largely invisible to others until moments of solitude or crisis bring it fully to the surface.",
  },
];

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
        </div>
      </section>

      {/* 5 — Placements Explained */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <SectionHeading
            icon={Waypoints}
            title="Placements Explained"
            subtitle="Combining planet, sign, and house into plain-language meaning."
          />

          <div className="space-y-6">
            {placementExamples.map((p, i) => {
              const planetData = interps?.planets[p.planetKey];
              const signData = interps?.signs[p.signKey];
              const houseData = interps?.houses[p.houseKey];
              return (
                <motion.div
                  key={p.label}
                  className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-40px" }}
                  variants={fadeUp}
                  custom={i}
                >
                  <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                    <h4 className="font-display font-bold text-lg">{p.label}</h4>
                  </div>
                  <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 block mb-1">
                        Planet (What)
                      </span>
                      <span className="text-sm font-semibold">{p.planetKey}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {planetData ? firstSentence(planetData.in_chart) : ""}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block mb-1">
                        Sign (How)
                      </span>
                      <span className="text-sm font-semibold">{p.signKey}</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {signData ? firstSentence(signData.in_chart) : ""}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-1">
                        House (Where)
                      </span>
                      <span className="text-sm font-semibold">{p.houseKey}th House</span>
                      <p className="text-xs text-gray-500 mt-1">
                        {houseData ? firstSentence(houseData.in_chart) : ""}
                      </p>
                    </div>
                  </div>
                  <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                    <p className="text-sm text-gray-400 leading-relaxed">{p.synthesis}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6 — Aspects */}
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
