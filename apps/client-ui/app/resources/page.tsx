"use client";

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

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const },
  }),
};

const planets = [
  { name: "Sun", icon: Sun, glyph: "☉" },
  { name: "Moon", icon: Moon, glyph: "☽" },
  { name: "Mercury", icon: Star, glyph: "☿" },
  { name: "Venus", icon: Star, glyph: "♀" },
  { name: "Mars", icon: Flame, glyph: "♂" },
  { name: "Jupiter", icon: Star, glyph: "♃" },
  { name: "Saturn", icon: Star, glyph: "♄" },
  { name: "Uranus", icon: Orbit, glyph: "♅" },
  { name: "Neptune", icon: Droplets, glyph: "♆" },
  { name: "Pluto", icon: Star, glyph: "♇" },
  { name: "Ascendant", icon: Sun, glyph: "AC" },
  { name: "Midheaven", icon: Triangle, glyph: "MC" },
];

const houses = [
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

const signs = [
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

const aspects = [
  { name: "Conjunction", angle: "0°", icon: CircleDot, strength: "Strongest" },
  { name: "Opposition", angle: "180°", icon: ArrowUpDown, strength: "Strong" },
  { name: "Square", angle: "90°", icon: Square, strength: "Strong" },
  { name: "Trine", angle: "120°", icon: Triangle, strength: "Moderate" },
  { name: "Sextile", angle: "60°", icon: Hexagon, strength: "Gentle" },
];

const placements = [
  { placement: "Mars in Taurus in the 4th", planet: "Mars", sign: "Taurus", house: "4th House" },
  { placement: "Venus in Gemini in the 7th", planet: "Venus", sign: "Gemini", house: "7th House" },
  { placement: "Moon in Scorpio in the 12th", planet: "Moon", sign: "Scorpio", house: "12th House" },
];

function SectionHeading({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
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
  return (
    <div className="min-h-screen bg-github-dark relative">
      <StarField />

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6 overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-purple-900/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-900/10 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
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
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Everything you need to make sense
              of the cosmic blueprint.
            </p>
          </motion.div>
        </div>
      </section>

      {/* 1 — How to Read a Chart */}
      <section className="relative py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHeading icon={Target} title="How to Read a Chart" subtitle="The four building blocks that make every placement meaningful." />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Planet", subtitle: "The What", desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.", color: "purple" },
              { label: "Sign", subtitle: "The How", desc: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo.", color: "blue" },
              { label: "House", subtitle: "The Where", desc: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.", color: "indigo" },
              { label: "Aspect", subtitle: "The Interaction", desc: "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est.", color: "violet" },
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
                <span className={`text-xs font-bold uppercase tracking-widest text-${item.color}-400 mb-1 block`}>
                  {item.subtitle}
                </span>
                <h3 className="text-xl font-display font-bold mb-3">{item.label}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2 — Planets & Points */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <SectionHeading icon={Orbit} title="Planets & Points" subtitle="Each celestial body represents a different drive or dimension of your psyche." />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {planets.map((p, i) => (
              <motion.div
                key={p.name}
                className="group rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 text-center hover:border-purple-500/30 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={i}
              >
                <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform inline-block">
                  {p.glyph}
                </span>
                <h4 className="text-sm font-bold mb-1">{p.name}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">Lorem ipsum dolor sit amet consectetur.</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Houses */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <SectionHeading icon={Home} title="The Twelve Houses" subtitle="Houses map the sky to areas of life — from identity to the unconscious." />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {houses.map((h, i) => (
              <motion.div
                key={h.num}
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-5 hover:border-purple-500/30 transition-colors"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={i}
              >
                <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600/30 to-blue-600/30 border border-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-300">
                  {h.num}
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-1">{h.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod.
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Signs */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <SectionHeading icon={Star} title="The Twelve Signs" subtitle="Signs describe how energy expresses — style, not prediction." />

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {signs.map((s, i) => {
              const ElemIcon = elementIcon[s.element];
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
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{s.glyph}</span>
                    <ElemIcon className={`w-4 h-4 ${elementTextColor[s.element]}`} />
                  </div>
                  <h4 className="text-sm font-bold mb-0.5">{s.name}</h4>
                  <span className={`text-[10px] font-semibold uppercase tracking-widest ${elementTextColor[s.element]}`}>
                    {s.element}
                  </span>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5 — Placements Explained */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <SectionHeading icon={Waypoints} title="Placements Explained" subtitle="Combining planet, sign, and house into plain-language meaning." />

          <div className="space-y-6">
            {placements.map((p, i) => (
              <motion.div
                key={p.placement}
                className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm overflow-hidden"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
                custom={i}
              >
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02]">
                  <h4 className="font-display font-bold text-lg">{p.placement}</h4>
                </div>
                <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 block mb-1">Planet (What)</span>
                    <span className="text-sm font-semibold">{p.planet}</span>
                    <p className="text-xs text-gray-500 mt-1">Lorem ipsum dolor sit amet consectetur.</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 block mb-1">Sign (How)</span>
                    <span className="text-sm font-semibold">{p.sign}</span>
                    <p className="text-xs text-gray-500 mt-1">Ut enim ad minim veniam quis nostrud.</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-1">House (Where)</span>
                    <span className="text-sm font-semibold">{p.house}</span>
                    <p className="text-xs text-gray-500 mt-1">Duis aute irure dolor in reprehenderit.</p>
                  </div>
                </div>
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02]">
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore
                    et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi
                    ut aliquip ex ea commodo consequat.
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 — Aspects */}
      <section className="relative py-20 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <SectionHeading icon={Waypoints} title="Aspects & Orbs" subtitle="Aspects describe the geometric relationship — and tension or harmony — between planets." />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {aspects.map((a, i) => {
              const Icon = a.icon;
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
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod.
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
          <SectionHeading icon={Clock} title="Why Birth Time & Location Matter" subtitle="Small shifts in time or place can change your entire chart." />

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
                { icon: Sun, title: "Ascendant Accuracy", desc: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
                { icon: Home, title: "House Cusp Shifts", desc: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
                { icon: MapPin, title: "Location-Based Precision", desc: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur." },
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
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua. Accurate birth data ensures every
            placement in your chart is precise.
          </motion.p>
        </div>
      </section>

      {/* Bottom spacer */}
      <div className="h-20" />
    </div>
  );
}
