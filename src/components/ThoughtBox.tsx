"use client";

import { useState } from "react";
import AppIcon from "./AppIcon";

type Props = {
  value: string[];
  onChange: (v: string[]) => void;
  onDone: () => void;
  onSkip: () => void;
};

type Phase = "write" | "flying" | "sealed" | "gone";

export default function ThoughtBox({ value, onChange, onDone, onSkip }: Props) {
  const [phase, setPhase] = useState<Phase>("write");

  const filled = value.filter((v) => v.trim().length > 0);

  const setAt = (i: number, v: string) => {
    const next = [...value];
    next[i] = v;
    onChange(next);
  };

  const startSealing = () => {
    if (filled.length === 0) return;
    setPhase("flying");
    window.setTimeout(() => setPhase("sealed"), 1800);
    window.setTimeout(() => setPhase("gone"), 3600);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-violet-300/80">Langkah 2</p>
        <h2 className="mt-3 text-3xl font-semibold text-white">Apa yang masih kamu pikirkan?</h2>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
          Tulis hal-hal yang masih berputar di kepala. Semuanya akan dimasukkan ke kotak dan
          disimpan aman di <span className="text-violet-200">Sleep Storage</span> — bukan
          diabaikan, cuma dititipkan sampai besok pagi.
        </p>

        <div className="mt-6 space-y-3">
          {value.map((v, i) => (
            <div
              key={i}
              className={`transition-all duration-700 ${
                phase === "write"
                  ? "translate-y-0 opacity-100"
                  : "pointer-events-none -translate-y-6 scale-95 opacity-0"
              }`}
              style={{ transitionDelay: `${i * 160}ms` }}
            >
              <input
                value={v}
                onChange={(e) => setAt(i, e.target.value)}
                placeholder={
                  ["Tugas belum selesai…", "Ujian besok…", "Takut mengecewakan orang tua…"][i] ??
                  "Hal lain yang mengganggu…"
                }
                className="input-glass w-full"
              />
            </div>
          ))}
          {phase === "write" && value.length < 5 && (
            <button
              onClick={() => onChange([...value, ""])}
              className="text-xs text-violet-300 underline-offset-4 hover:underline"
            >
              + tambah satu pikiran lagi
            </button>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {phase === "write" && (
            <>
              <button
                onClick={startSealing}
                disabled={filled.length === 0}
                className="rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Masukkan ke kotak <AppIcon name="box" className="ml-1 inline h-4 w-4" />
              </button>
              <button onClick={onSkip} className="glass-btn px-6 py-3 text-sm text-slate-200">
                Lewati dulu
              </button>
            </>
          )}
          {phase === "gone" && (
            <button
              onClick={onDone}
              className="rounded-full bg-violet-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              Lanjut pilih suasana →
            </button>
          )}
        </div>
      </div>

        {/* visual kotak */}
        <div className="relative grid min-h-[340px] place-items-center overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-violet-500/20 to-slate-900/80">
          <div className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(1px_1px_at_20%_30%,#fff,transparent),radial-gradient(1px_1px_at_70%_20%,#fff,transparent),radial-gradient(1.5px_1.5px_at_40%_70%,#fff,transparent),radial-gradient(1px_1px_at_85%_60%,#fff,transparent)]" />

        {/* chip pikiran terbang */}
        {phase === "flying" &&
          filled.map((t, i) => (
            <span
              key={i}
              className="thought-fly absolute rounded-full border border-violet-300/40 bg-violet-500/20 px-3 py-1 text-xs text-violet-100 backdrop-blur"
              style={{
                left: `${18 + i * 12}%`,
                top: `${18 + i * 10}%`,
                animationDelay: `${i * 260}ms`,
              }}
            >
              {t.length > 26 ? `${t.slice(0, 26)}…` : t}
            </span>
          ))}

        <div
          className={`relative transition-all duration-[1600ms] ${
            phase === "sealed"
              ? "scale-110"
              : phase === "gone"
                ? "-translate-y-10 scale-50 opacity-0 blur-md"
                : ""
          }`}
        >
          <div className="text-[86px] leading-none drop-shadow-[0_0_28px_rgba(167,139,250,0.75)]">
            <AppIcon name={phase === "gone" ? "cloud" : "box"} className="h-14 w-14" />
          </div>
          {phase !== "write" && (
            <div className="absolute -inset-6 animate-ping rounded-full border border-violet-400/30" />
          )}
        </div>

        <p className="absolute bottom-6 px-6 text-center text-xs leading-relaxed text-slate-300">
          {phase === "write" && "Kotak siap menampung pikiranmu."}
          {phase === "flying" && "Pikiranmu sedang dimasukkan ke kotak…"}
          {phase === "sealed" && "Kotak dikunci. Aman."}
          {phase === "gone" && (
            <>
              <AppIcon name="lock" className="mr-1 inline h-4 w-4" /> Pikiranmu sudah disimpan aman di
              <br />
              <b className="text-violet-200">Sleep Storage</b>.
              <br />
              Bisa diambil lagi besok pagi.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
