export type ThemeId = "ombak" | "hujan" | "hutan" | "sunset" | "salju" | "apiunggun";

export type RelaxTheme = {
  id: ThemeId;
  name: string;
  image: string;
  tagline: string;
  /** gradient langit fase sore -> malam (top, mid, bottom) */
  dusk: [string, string, string];
  night: [string, string, string];
  accent: string;
  /** warna kartu di UI */
  cardFrom: string;
  cardTo: string;
  sound: string;
};

export const THEMES: RelaxTheme[] = [
  {
    id: "ombak",
    name: "Ombak Laut",
    image: "/images/themes/ocean.png",
    tagline: "Deburan ombak pelan di pantai sepi",
    dusk: ["#f9a26c", "#8d6a9f", "#2c3e6b"],
    night: ["#050a1f", "#0b1638", "#132a55"],
    accent: "#7dd3fc",
    cardFrom: "from-sky-500/25",
    cardTo: "to-indigo-900/40",
    sound: "Deburan ombak + angin laut",
  },
  {
    id: "hujan",
    name: "Hujan Malam",
    image: "/images/themes/rain.png",
    tagline: "Rintik hujan di jendela kamar",
    dusk: ["#6b7fa3", "#4a5a7d", "#2a3550"],
    night: ["#060912", "#0d1526", "#16223d"],
    accent: "#a5b4fc",
    cardFrom: "from-slate-400/25",
    cardTo: "to-slate-900/40",
    sound: "Rintik hujan + guruh jauh",
  },
  {
    id: "hutan",
    name: "Hutan Tenang",
    image: "/images/themes/forest.png",
    tagline: "Daun bergesek, kunang-kunang menyala",
    dusk: ["#f0b27a", "#6d8b74", "#243b2f"],
    night: ["#040d0a", "#0a1a14", "#122b20"],
    accent: "#86efac",
    cardFrom: "from-emerald-500/25",
    cardTo: "to-emerald-950/40",
    sound: "Angin daun + jangkrik lembut",
  },
  {
    id: "sunset",
    name: "Senja Bukit",
    image: "/images/themes/sunset.png",
    tagline: "Matahari turun perlahan jadi malam berbintang",
    dusk: ["#ffb37b", "#e2708a", "#4b3b73"],
    night: ["#070515", "#120b2b", "#241344"],
    accent: "#fbbf24",
    cardFrom: "from-amber-500/25",
    cardTo: "to-purple-900/40",
    sound: "Angin senja + drone hangat",
  },
  {
    id: "salju",
    name: "Malam Salju",
    image: "/images/themes/snow.png",
    tagline: "Butiran salju jatuh tanpa suara",
    dusk: ["#c6d6ea", "#8fa3c4", "#41527a"],
    night: ["#05070f", "#0b1224", "#18294a"],
    accent: "#bae6fd",
    cardFrom: "from-cyan-300/20",
    cardTo: "to-slate-900/40",
    sound: "Angin dingin lembut",
  },
  {
    id: "apiunggun",
    name: "Api Unggun",
    image: "/images/themes/campfire.png",
    tagline: "Bara hangat di bawah langit malam",
    dusk: ["#f5a25d", "#a05a4a", "#3a2440"],
    night: ["#0a0503", "#180b08", "#2a1410"],
    accent: "#fb923c",
    cardFrom: "from-orange-500/25",
    cardTo: "to-rose-950/40",
    sound: "Letikan api + malam sunyi",
  },
];

export const getTheme = (id: string): RelaxTheme =>
  THEMES.find((t) => t.id === id) ?? THEMES[0];

export const STRESS_LEVELS = [
  {
    id: "ringan",
    label: "Stres Ringan",
    desc: "Pikiran agak penuh tapi masih bisa santai",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    suggestMinutes: 10,
  },
  {
    id: "sedang",
    label: "Stres Sedang",
    desc: "Susah fokus, kepala rame, badan tegang",
    breath: { inhale: 4, hold: 4, exhale: 7 },
    suggestMinutes: 15,
  },
  {
    id: "berat",
    label: "Stres Berat",
    desc: "Dada sesak, susah tidur berhari-hari",
    breath: { inhale: 4, hold: 7, exhale: 8 },
    suggestMinutes: 20,
  },
] as const;

export type StressLevelId = (typeof STRESS_LEVELS)[number]["id"];

export const getLevel = (id: string) =>
  STRESS_LEVELS.find((l) => l.id === id) ?? STRESS_LEVELS[0];
