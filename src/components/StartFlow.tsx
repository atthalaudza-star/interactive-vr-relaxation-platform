"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ThoughtBox from "./ThoughtBox";
import SessionScene, { type SessionStats } from "./SessionScene";
import type { StressOption } from "@/db/schema";
import { STRESS_LEVELS, THEMES, getLevel, getTheme } from "@/lib/themes";
import ThemeImage from "./ThemeImage";
import AppIcon from "./AppIcon";

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_LABELS = ["Isi Pikiran & Stres", "Kotak Pikiran", "Pilih Suasana", "Sesi VR", "Ringkasan"];

function Stepper({ step }: { step: Step }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
      {STEP_LABELS.map((label, i) => (
        <li
          key={label}
          className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition ${
            i === step
              ? "border-violet-400/60 bg-violet-500/15 text-violet-200"
              : i < step
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200/80"
                : "border-white/10 hover:bg-white/5"
          }`}
        >
          <span
            className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
              i <= step ? "bg-violet-500/25 text-violet-200" : "bg-white/5 text-slate-500"
            }`}
          >
            {i + 1}
          </span>
          <span className={i < step ? "text-emerald-200/80" : ""}>{label}</span>
        </li>
      ))}
    </ol>
  );
}

export default function StartFlow({ initialOptions }: { initialOptions: StressOption[] }) {
  const [options, setOptions] = useState<StressOption[]>(initialOptions);
  const [step, setStep] = useState<Step>(0);

  const [sources, setSources] = useState<string[]>([]);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [level, setLevel] = useState<string>("sedang");
  const [thoughts, setThoughts] = useState<string[]>(["", "", ""]);

  const [themeId, setThemeId] = useState<string>("ombak");
  const [minutes, setMinutes] = useState<number>(15);
  const [mode, setMode] = useState<string>("lepas-sendiri");
  const [alarm, setAlarm] = useState(true);

  const [newLabel, setNewLabel] = useState("");
  const [newKind, setNewKind] = useState<"sumber" | "gejala">("gejala");
  const [adding, setAdding] = useState(false);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [saving, setSaving] = useState(false);

  const sumberOptions = useMemo(() => options.filter((o) => o.kind === "sumber"), [options]);
  const gejalaOptions = useMemo(() => options.filter((o) => o.kind === "gejala"), [options]);
  const activeLevel = getLevel(level);
  const activeTheme = getTheme(themeId);

  const toggle = (list: string[], set: (v: string[]) => void, label: string) => {
    set(list.includes(label) ? list.filter((l) => l !== label) : [...list, label]);
  };

  const addOption = async () => {
    const label = newLabel.trim();
    if (!label) return;
    setAdding(true);
    try {
      const res = await fetch("/api/options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, kind: newKind, emoji: "custom" }),
      });
      const data = (await res.json()) as { option?: StressOption };
      if (data.option) {
        setOptions((prev) =>
          prev.some((o) => o.id === data.option!.id) ? prev : [...prev, data.option!],
        );
        if (newKind === "sumber") setSources((p) => [...p, data.option!.label]);
        else setSymptoms((p) => [...p, data.option!.label]);
      }
      setNewLabel("");
    } finally {
      setAdding(false);
    }
  };

  const startSession = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stressSources: sources,
          stressSymptoms: symptoms,
          stressLevel: level,
          theme: themeId,
          mode,
          plannedMinutes: minutes,
          alarmEnabled: alarm,
          thoughts,
        }),
      });
      const data = (await res.json()) as { session?: { id: number } };
      if (data.session) setSessionId(data.session.id);
      setStep(3);
    } finally {
      setSaving(false);
    }
  };

  const finishSession = async (s: SessionStats) => {
    setStats(s);
    setStep(4);
    if (sessionId) {
      await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...s, status: "selesai" }),
      }).catch(() => undefined);
    }
  };

  if (step === 3) {
    return (
      <SessionScene
        themeId={themeId}
        levelId={level}
        plannedMinutes={minutes}
        mode={mode}
        alarmEnabled={alarm}
        onFinish={finishSession}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Stepper step={step} />

      {step === 0 && (
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-violet-300/80">Langkah 1</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Apa yang lagi bikin kamu stres?</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Pilih sebanyak yang kamu rasakan. Jawaban ini dipakai untuk menentukan ritme napas dan
            durasi sesi yang paling pas.
          </p>

          <h3 className="mt-8 text-sm font-semibold text-slate-200">1 · Sumber stres</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {sumberOptions.map((o) => (
              <Chip
                key={o.id}
                active={sources.includes(o.label)}
                onClick={() => toggle(sources, setSources, o.label)}
                label={o.label}
              />
            ))}
          </div>

          <h3 className="mt-8 text-sm font-semibold text-slate-200">
            2 · Yang kamu rasakan sekarang
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {gejalaOptions.map((o) => (
              <Chip
                key={o.id}
                active={symptoms.includes(o.label)}
                onClick={() => toggle(symptoms, setSymptoms, o.label)}
                label={o.label}
              />
            ))}
          </div>

          {/* tambah opsi baru */}
          <div className="mt-6 flex flex-wrap items-center gap-2 glass-card p-3">
            <span className="text-xs text-slate-400">Belum ada di daftar?</span>
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void addOption();
              }}
              placeholder="Tulis opsi baru, misal: cemas soal masa depan"
              className="input-glass min-w-[220px] flex-1"
            />
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as "sumber" | "gejala")}
              className="input-glass text-slate-200"
            >
              <option value="gejala">Yang dirasakan</option>
              <option value="sumber">Sumber stres</option>
            </select>
            <button
              onClick={() => void addOption()}
              disabled={adding || !newLabel.trim()}
              className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-violet-400"
            >
              {adding ? "Menambah…" : "Tambah"}
            </button>
          </div>

          <h3 className="mt-8 text-sm font-semibold text-slate-200">3 · Seberapa berat rasanya?</h3>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {STRESS_LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLevel(l.id);
                  setMinutes(l.suggestMinutes);
                }}
                className={`glass-card text-left transition hover:border-violet-400/40 ${
                  level === l.id ? "border-violet-400/70 bg-violet-500/15" : ""
                }`}
              >
                <div className="p-4">
                  <AppIcon name={l.id === "ringan" ? "leaf" : l.id === "sedang" ? "activity" : "heart"} className="h-6 w-6 text-violet-300" />
                  <div className="mt-2 text-sm font-semibold text-white">{l.label}</div>
                  <p className="mt-1 text-xs text-slate-400">{l.desc}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-wider text-violet-300/80">
                    Napas {l.breath.inhale}-{l.breath.hold}-{l.breath.exhale} · {l.suggestMinutes} menit
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Lanjut ke kotak pikiran →
            </button>
            <Link href="/" className="glass-btn px-6 py-3 text-sm text-slate-200">
              Batal
            </Link>
          </div>
        </section>
      )}

      {step === 1 && (
        <ThoughtBox
          value={thoughts}
          onChange={setThoughts}
          onDone={() => setStep(2)}
          onSkip={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-violet-300/80">Langkah 3</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">Pilih suasana yang bikin nyaman</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Setiap suasana punya visual dan bunyi ambience sendiri, semuanya bertransisi dari sore
            ke malam berbintang.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={`group overflow-hidden rounded-2xl border p-4 text-left transition ${
                  themeId === t.id
                    ? "border-violet-400/70 bg-violet-500/10"
                    : "border-white/10 glass-card hover:border-violet-400/30"
                }`}
              >
                <div className="relative mb-3 h-20 w-full overflow-hidden rounded-xl transition group-hover:scale-105">
                  <ThemeImage theme={t} />
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  {t.name}
                </div>
                <p className="mt-1 text-xs text-slate-400">{t.tagline}</p>
                <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500"><AppIcon name="volume" className="h-3.5 w-3.5" /> {t.sound}</p>
              </button>
            ))}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200">Durasi sesi</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {[10, 15, 20, 30].map((m) => (
                  <Chip
                    key={m}
                    active={minutes === m}
                    onClick={() => setMinutes(m)}
                    label={`${m} menit`}
                  />
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">
                Rekomendasi untuk {activeLevel.label.toLowerCase()}: {activeLevel.suggestMinutes} menit.
              </p>
            </div>

            <div className="glass-card p-5">
              <h3 className="text-sm font-semibold text-slate-200">Cara pakai</h3>
              <div className="mt-3 grid gap-2">
                <ModeCard
                  active={mode === "lepas-sendiri"}
                  onClick={() => setMode("lepas-sendiri")}
                  title="Pakai lalu dilepas sendiri"
                  desc="Sesi berhenti saat waktu habis, kamu lepas VR sendiri kalau sudah ngantuk."
                />
                <ModeCard
                  active={mode === "sampai-tertidur"}
                  onClick={() => setMode("sampai-tertidur")}
                  title="Pakai sampai tertidur"
                  desc="Layar makin gelap setelah waktu inti, dengan pengingat lembut untuk melepas VR."
                />
              </div>
              <label className="mt-4 flex cursor-pointer items-center gap-3 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={alarm}
                  onChange={(e) => setAlarm(e.target.checked)}
                  className="h-4 w-4 accent-violet-500"
                />
                Nyalakan alarm lembut (bel) untuk mengingatkan melepas VR
              </label>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => void startSession()}
              disabled={saving}
              className="rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 disabled:opacity-50"
            >
              {saving ? "Menyiapkan…" : `Mulai sesi ${activeTheme.name}`}
            </button>
            <button
              onClick={() => setStep(1)}
              className="glass-btn px-6 py-3 text-sm text-slate-200"
            >
              ← Kembali
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Tips: pakai headphone, atur volume rendah, lalu tekan Layar Penuh saat sesi dimulai.
            Mode VR membelah layar jadi dua lensa untuk headset kardus/Cardboard.
          </p>
        </section>
      )}

      {step === 4 && stats && (
        <section className="mx-auto max-w-2xl text-center">
          <AppIcon name="moon" className="mx-auto h-14 w-14 text-violet-300" />
          <h2 className="mt-4 text-3xl font-semibold text-white">Sesi selesai</h2>
          <p className="mt-3 text-sm text-slate-300">
            Semoga kepala terasa lebih ringan. Pikiran yang kamu titipkan aman di Sleep Storage.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <Stat label="Durasi" value={`${Math.round(stats.completedSeconds / 60)} mnt`} />
            <Stat label="Siklus napas" value={`${stats.breathCycles}`} />
            <Stat label="Bintang" value={`${stats.starsConnected}`} />
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/storage" className="glass-btn bg-violet-500/90 px-6 py-3 text-sm font-semibold text-white">
              Lihat Sleep Storage
            </Link>
            <Link href="/riwayat" className="glass-btn px-6 py-3 text-sm text-slate-200">
              Riwayat sesi
            </Link>
            <Link href="/" className="glass-btn px-6 py-3 text-sm text-slate-200">
              Beranda
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm transition ${
        active
          ? "border-violet-400/70 bg-violet-500/20 text-violet-100"
          : "border-white/12 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
      }`}
    >
      {label}
    </button>
  );
}

function ModeCard({
  title,
  desc,
  active,
  onClick,
}: {
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition ${
        active ? "border-violet-400/70 bg-violet-500/15" : "border-white/10 hover:bg-white/5"
      }`}
    >
      <div className="text-sm font-medium text-white">{title}</div>
      <p className="mt-1 text-xs text-slate-400">{desc}</p>
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}
