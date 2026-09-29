"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AudioEngine } from "@/lib/audio";
import { getLevel, getTheme, type RelaxTheme } from "@/lib/themes";
import AppIcon from "./AppIcon";

export type SessionStats = {
  completedSeconds: number;
  breathCycles: number;
  starsConnected: number;
};

type Props = {
  themeId: string;
  levelId: string;
  plannedMinutes: number;
  mode: string;
  alarmEnabled: boolean;
  onFinish: (stats: SessionStats) => void;
};

type Star = { x: number; y: number; r: number; tw: number };
type GameStar = { x: number; y: number; done: boolean };

const hexToRgb = (hex: string) => {
  const v = hex.replace("#", "");
  return [
    parseInt(v.slice(0, 2), 16),
    parseInt(v.slice(2, 4), 16),
    parseInt(v.slice(4, 6), 16),
  ] as [number, number, number];
};

const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bl})`;
};

const fmt = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function SessionScene({
  themeId,
  levelId,
  plannedMinutes,
  mode,
  alarmEnabled,
  onFinish,
}: Props) {
  const theme = getTheme(themeId);
  const level = getLevel(levelId);
  const totalSeconds = plannedMinutes * 60;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<AudioEngine | null>(null);
  const elapsedRef = useRef(0);
  const pausedRef = useRef(false);
  const cyclesRef = useRef(0);
  const starsRef = useRef(0);
  const lastPhaseRef = useRef<string>("");
  const pointerRef = useRef({ x: -999, y: -999, moveAt: 0 });
  const dwellRef = useRef({ index: -1, time: 0 });
  const bgStarsRef = useRef<Star[]>([]);
  const gameStarsRef = useRef<GameStar[]>([]);
  const lastActivityRef = useRef(0);
  const nudgeRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [vrMode, setVrMode] = useState(true);
  const [muted, setMuted] = useState(false);
  const [hud, setHud] = useState({
    elapsed: 0,
    phase: "Bersiap",
    cycles: 0,
    stars: 0,
    overtime: false,
  });
  const [message, setMessage] = useState<string | null>(null);

  const makeGameStars = useCallback(() => {
    const list: GameStar[] = [];
    const count = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i += 1) {
      list.push({
        x: 0.15 + Math.random() * 0.7,
        y: 0.12 + Math.random() * 0.36,
        done: false,
      });
    }
    gameStarsRef.current = list;
  }, []);

  // audio init
  useEffect(() => {
    const engine = new AudioEngine();
    audioRef.current = engine;
    void engine.start(theme.id, 0.55);
    return () => {
      void engine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    audioRef.current?.setVolume(muted ? 0 : 0.55);
  }, [muted]);

  const finish = useCallback(() => {
    onFinish({
      completedSeconds: Math.round(elapsedRef.current),
      breathCycles: cyclesRef.current,
      starsConnected: starsRef.current,
    });
  }, [onFinish]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext("2d");
    if (!g) return;

    // background stars
    const bg: Star[] = [];
    for (let i = 0; i < 260; i += 1) {
      bg.push({
        x: Math.random(),
        y: Math.random() * 0.62,
        r: Math.random() * 1.6 + 0.4,
        tw: Math.random() * Math.PI * 2,
      });
    }
    bgStarsRef.current = bg;
    makeGameStars();
    lastActivityRef.current = Date.now();

    let raf = 0;
    let last = performance.now();
    const cycleLen = level.breath.inhale + level.breath.hold + level.breath.exhale + 1.5;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const drawEye = (
      W: number,
      H: number,
      t: number,
      progress: number,
      breath: { phase: string; ratio: number; label: string },
      parallax: number,
    ) => {
      const night = Math.min(1, progress * 1.35);

      // langit
      const sky = g.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, mix(theme.dusk[0], theme.night[0], night));
      sky.addColorStop(0.55, mix(theme.dusk[1], theme.night[1], night));
      sky.addColorStop(1, mix(theme.dusk[2], theme.night[2], night));
      g.fillStyle = sky;
      g.fillRect(0, 0, W, H);

      // bintang latar
      g.save();
      bgStarsRef.current.forEach((s) => {
        const tw = 0.55 + 0.45 * Math.sin(t * 1.4 + s.tw);
        g.globalAlpha = night * tw;
        g.fillStyle = "#ffffff";
        g.beginPath();
        g.arc(s.x * W + parallax * 6, s.y * H, s.r, 0, Math.PI * 2);
        g.fill();
      });
      g.restore();

      // matahari turun -> bulan naik
      const horizon = H * 0.66;
      const sunY = H * 0.34 + progress * (horizon - H * 0.28);
      if (night < 0.95) {
        const sunR = Math.max(18, H * 0.06);
        const grd = g.createRadialGradient(W * 0.72 + parallax * 4, sunY, 2, W * 0.72 + parallax * 4, sunY, sunR * 4);
        grd.addColorStop(0, `rgba(255,220,160,${0.9 * (1 - night)})`);
        grd.addColorStop(0.25, `rgba(255,170,110,${0.5 * (1 - night)})`);
        grd.addColorStop(1, "rgba(255,150,90,0)");
        g.fillStyle = grd;
        g.beginPath();
        g.arc(W * 0.72 + parallax * 4, sunY, sunR * 4, 0, Math.PI * 2);
        g.fill();
      }
      if (night > 0.25) {
        const mAlpha = (night - 0.25) / 0.75;
        const mx = W * 0.24 + parallax * 5;
        const my = H * 0.3 - progress * H * 0.08;
        const mr = Math.max(14, H * 0.035);
        const glow = g.createRadialGradient(mx, my, 1, mx, my, mr * 6);
        glow.addColorStop(0, `rgba(226,236,255,${0.35 * mAlpha})`);
        glow.addColorStop(1, "rgba(226,236,255,0)");
        g.fillStyle = glow;
        g.beginPath();
        g.arc(mx, my, mr * 6, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = mAlpha;
        g.fillStyle = "#eef3ff";
        g.beginPath();
        g.arc(mx, my, mr, 0, Math.PI * 2);
        g.fill();
        g.globalAlpha = 1;
      }

      drawThemeLayer(g, theme, W, H, horizon, t, night, parallax);
      drawGameStars(g, W, H, t, night);
      drawBreathOrb(g, W, H, breath, theme, night);
    };

    const drawGameStars = (
      c: CanvasRenderingContext2D,
      W: number,
      H: number,
      t: number,
      night: number,
    ) => {
      if (night < 0.18) return;
      const list = gameStarsRef.current;
      const alpha = Math.min(1, (night - 0.18) / 0.4);
      c.save();
      c.globalAlpha = alpha;
      // garis rasi yang sudah terhubung
      c.strokeStyle = theme.accent;
      c.lineWidth = 1.4;
      c.shadowBlur = 14;
      c.shadowColor = theme.accent;
      c.beginPath();
      let started = false;
      list.forEach((s) => {
        if (!s.done) return;
        const x = s.x * W;
        const y = s.y * H;
        if (!started) {
          c.moveTo(x, y);
          started = true;
        } else c.lineTo(x, y);
      });
      c.stroke();

      list.forEach((s, i) => {
        const x = s.x * W;
        const y = s.y * H;
        const next = list.findIndex((k) => !k.done);
        const isNext = i === next;
        const pulse = 1 + 0.35 * Math.sin(t * 2 + i);
        const r = (s.done ? 4.5 : isNext ? 3.6 * pulse : 2.6) * (H / 800 + 0.6);
        c.fillStyle = s.done ? theme.accent : "rgba(255,255,255,0.85)";
        c.shadowBlur = s.done ? 18 : 10;
        c.beginPath();
        c.arc(x, y, r, 0, Math.PI * 2);
        c.fill();
        if (isNext) {
          c.strokeStyle = "rgba(255,255,255,0.35)";
          c.lineWidth = 1;
          c.shadowBlur = 0;
          const dwell = dwellRef.current.index === i ? dwellRef.current.time / 0.75 : 0;
          c.beginPath();
          c.arc(x, y, r * 5, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, dwell));
          c.stroke();
        }
      });
      c.restore();
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) elapsedRef.current += dt;

      const elapsed = elapsedRef.current;
      const progress = Math.min(1, elapsed / totalSeconds);
      const t = now / 1000;

      // fase napas
      const inCycle = elapsed % cycleLen;
      let phase = "inhale";
      let ratio = 0;
      let label = "Tarik napas";
      const { inhale, hold, exhale } = level.breath;
      if (inCycle < inhale) {
        phase = "inhale";
        ratio = inCycle / inhale;
        label = "Tarik napas pelan…";
      } else if (inCycle < inhale + hold) {
        phase = "hold";
        ratio = 1;
        label = "Tahan…";
      } else if (inCycle < inhale + hold + exhale) {
        phase = "exhale";
        ratio = 1 - (inCycle - inhale - hold) / exhale;
        label = "Buang napas…";
      } else {
        phase = "rest";
        ratio = 0;
        label = "Istirahat sejenak";
      }

      if (phase !== lastPhaseRef.current && !pausedRef.current) {
        lastPhaseRef.current = phase;
        if (phase === "inhale") {
          cyclesRef.current += 1;
          audioRef.current?.breathCue("inhale", inhale);
        } else if (phase === "exhale") {
          audioRef.current?.breathCue("exhale", exhale);
        } else if (phase === "hold") {
          audioRef.current?.breathCue("hold", hold);
        }
      }

      // interaksi bintang (dwell / "pandangan mata")
      const canvasEl = canvasRef.current;
      if (canvasEl) {
        const W = window.innerWidth;
        const H = window.innerHeight;
        let px = pointerRef.current.x;
        const py = pointerRef.current.y;
        if (vrMode) px = px % (W / 2);
        const eyeW = vrMode ? W / 2 : W;
        const list = gameStarsRef.current;
        const nextIdx = list.findIndex((s) => !s.done);
        if (nextIdx >= 0 && px > -100) {
          const s = list[nextIdx];
          const dx = px - s.x * eyeW;
          const dy = py - s.y * H;
          const dist = Math.hypot(dx, dy);
          if (dist < Math.max(48, H * 0.07)) {
            if (dwellRef.current.index !== nextIdx) {
              dwellRef.current = { index: nextIdx, time: 0 };
            }
            dwellRef.current.time += dt;
            if (dwellRef.current.time > 0.75) {
              list[nextIdx].done = true;
              starsRef.current += 1;
              dwellRef.current = { index: -1, time: 0 };
              audioRef.current?.breathCue("hold", 0.2);
              if (list.every((k) => k.done)) {
                window.setTimeout(() => makeGameStars(), 1400);
              }
            }
          } else if (dwellRef.current.index === nextIdx) {
            dwellRef.current.time = Math.max(0, dwellRef.current.time - dt * 1.5);
          }
        }
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = canvasEl ? canvasEl.width : 0;
      const H = canvasEl ? canvasEl.height : 0;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, W, H);

      const breath = { phase, ratio, label };
      if (vrMode) {
        const eyeW = W / 2;
        for (let eye = 0; eye < 2; eye += 1) {
          g.save();
          g.beginPath();
          g.rect(eye * eyeW, 0, eyeW, H);
          g.clip();
          g.translate(eye * eyeW, 0);
          g.scale(dpr, dpr);
          drawEye(eyeW / dpr, H / dpr, t, progress, breath, eye === 0 ? -1 : 1);
          g.restore();
        }
        // pemisah lensa
        g.fillStyle = "rgba(0,0,0,0.85)";
        g.fillRect(eyeW - 2 * dpr, 0, 4 * dpr, H);
      } else {
        g.save();
        g.scale(dpr, dpr);
        drawEye(W / dpr, H / dpr, t, progress, breath, 0);
        g.restore();
      }

      // pengingat lepas VR saat sesi sudah lewat & user diam (kemungkinan tertidur)
      if (elapsed > totalSeconds) {
        const idle = (Date.now() - lastActivityRef.current) / 1000;
        if (alarmEnabled && idle > 60 && Date.now() - nudgeRef.current > 120000) {
          nudgeRef.current = Date.now();
          audioRef.current?.chime(3);
          setMessage(
            mode === "sampai-tertidur"
              ? "Kalau sudah ngantuk, lepas VR-nya pelan-pelan ya."
              : "Sesi selesai. Lepas VR-nya pelan-pelan ya.",
          );
        }
      }
    };

    raf = requestAnimationFrame(loop);

    const sync = window.setInterval(() => {
      setHud({
        elapsed: elapsedRef.current,
        phase:
          lastPhaseRef.current === "inhale"
            ? "Tarik napas"
            : lastPhaseRef.current === "hold"
              ? "Tahan"
              : lastPhaseRef.current === "exhale"
                ? "Buang napas"
                : "Istirahat",
        cycles: cyclesRef.current,
        stars: starsRef.current,
        overtime: elapsedRef.current > totalSeconds,
      });
    }, 300);

    let ended = false;
    const endWatcher = window.setInterval(() => {
      if (ended) return;
      if (elapsedRef.current >= totalSeconds) {
        ended = true;
        audioRef.current?.chime(alarmEnabled ? 4 : 1);
        if (mode === "sampai-tertidur") {
          setMessage("Waktu inti selesai. Suasana dibuat makin gelap — biarkan matamu terpejam.");
          window.setTimeout(() => setMessage(null), 12000);
        } else {
          setMessage("Sesi selesai. Tarik napas terakhir, lalu lepas VR-nya.");
        }
      }
    }, 500);

    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(sync);
      window.clearInterval(endWatcher);
      window.removeEventListener("resize", resize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vrMode, themeId, levelId]);

  // pointer / gaze tracking
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY, moveAt: Date.now() };
      lastActivityRef.current = Date.now();
    };
    const onKey = (e: KeyboardEvent) => {
      lastActivityRef.current = Date.now();
      if (e.key === "Escape") finish();
      if (e.key === " ") setPaused((p) => !p);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish]);

  const progress = Math.min(1, hud.elapsed / totalSeconds);
  // filter cahaya hangat: makin lama makin hangat (mengurangi blue light)
  const warm = Math.min(0.42, progress * 0.42);
  const dim = hud.overtime && mode === "sampai-tertidur" ? Math.min(0.65, (hud.elapsed - totalSeconds) / 240) : 0;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* filter cahaya hangat + peredupan */}
      <div
        className="pointer-events-none absolute inset-0 transition-[background] duration-1000"
        style={{ background: `rgba(255,146,54,${warm})`, mixBlendMode: "multiply" }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `rgba(0,0,0,${dim})` }}
      />
      {/* vignette lensa VR */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 25% 50%, transparent 42%, rgba(0,0,0,0.75) 70%), radial-gradient(circle at 75% 50%, transparent 42%, rgba(0,0,0,0.75) 70%)",
          opacity: vrMode ? 1 : 0,
        }}
      />
      {!vrMode && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.6) 100%)" }}
        />
      )}

      {/* HUD atas */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 p-4 text-[11px] uppercase tracking-[0.2em] text-white/70 sm:text-xs">
        <div className="rounded-full bg-black/40 px-4 py-2 backdrop-blur">
          {theme.name} · {hud.phase}
        </div>
        <div className="rounded-full bg-black/40 px-4 py-2 backdrop-blur">
          {fmt(hud.elapsed)} / {fmt(totalSeconds)} · <AppIcon name="activity" className="inline h-3.5 w-3.5" /> {hud.cycles} · <AppIcon name="sparkles" className="inline h-3.5 w-3.5" /> {hud.stars}
        </div>
      </div>

      {/* pesan */}
      {message && (
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center px-6">
          <p className="max-w-md rounded-3xl bg-black/55 px-6 py-4 text-center text-sm text-amber-100 backdrop-blur">
            {message}
          </p>
        </div>
      )}

      {/* kontrol bawah */}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-center gap-2 p-4 text-xs">
        <button
          onClick={() => setPaused((p) => !p)}
          className="rounded-full bg-white/10 px-4 py-2 text-white/80 backdrop-blur transition hover:bg-white/20"
        >
          <AppIcon name={paused ? "play" : "pause"} className="mr-1 inline h-3.5 w-3.5" /> {paused ? "Lanjut" : "Jeda"}
        </button>
        <button
          onClick={() => setVrMode((v) => !v)}
          className="rounded-full bg-white/10 px-4 py-2 text-white/80 backdrop-blur transition hover:bg-white/20"
        >
          <AppIcon name={vrMode ? "monitor" : "focus"} className="mr-1 inline h-3.5 w-3.5" /> {vrMode ? "Mode Layar" : "Mode VR"}
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          className="rounded-full bg-white/10 px-4 py-2 text-white/80 backdrop-blur transition hover:bg-white/20"
        >
          <AppIcon name={muted ? "mute" : "volume"} className="mr-1 inline h-3.5 w-3.5" /> {muted ? "Suara Mati" : "Suara Hidup"}
        </button>
        <button
          onClick={() => {
            void document.documentElement.requestFullscreen?.().catch(() => undefined);
          }}
          className="rounded-full bg-white/10 px-4 py-2 text-white/80 backdrop-blur transition hover:bg-white/20"
        >
          <AppIcon name="maximize" className="mr-1 inline h-3.5 w-3.5" /> Layar Penuh
        </button>
        <button
          onClick={finish}
          className="rounded-full bg-amber-400/90 px-5 py-2 font-semibold text-slate-900 transition hover:bg-amber-300"
        >
          Akhiri Sesi
        </button>
      </div>
    </div>
  );
}

/* ---------- lapisan visual per tema ---------- */

function drawThemeLayer(
  g: CanvasRenderingContext2D,
  theme: RelaxTheme,
  W: number,
  H: number,
  horizon: number,
  t: number,
  night: number,
  parallax: number,
) {
  switch (theme.id) {
    case "ombak": {
      const water = g.createLinearGradient(0, horizon, 0, H);
      water.addColorStop(0, mix("#3b6ea5", "#0a1730", night));
      water.addColorStop(1, mix("#12395f", "#050a18", night));
      g.fillStyle = water;
      g.fillRect(0, horizon, W, H - horizon);
      for (let i = 0; i < 22; i += 1) {
        const y = horizon + ((H - horizon) * (i + 1)) / 23;
        const amp = 3 + i * 0.8;
        g.strokeStyle = `rgba(255,255,255,${0.05 + i * 0.006})`;
        g.lineWidth = 1 + i * 0.06;
        g.beginPath();
        for (let x = 0; x <= W; x += 12) {
          const yy = y + Math.sin(x * 0.012 + t * (0.6 + i * 0.05) + i) * amp;
          if (x === 0) g.moveTo(x, yy);
          else g.lineTo(x, yy);
        }
        g.stroke();
      }
      break;
    }
    case "hujan": {
      g.fillStyle = mix("#22304a", "#070c17", night);
      g.beginPath();
      g.moveTo(0, horizon + 40);
      for (let x = 0; x <= W; x += 24) {
        g.lineTo(x, horizon + 40 + Math.sin(x * 0.004 + parallax) * 18);
      }
      g.lineTo(W, H);
      g.lineTo(0, H);
      g.fill();
      g.strokeStyle = "rgba(190,215,255,0.35)";
      g.lineWidth = 1.1;
      for (let i = 0; i < 260; i += 1) {
        const seed = i * 97.13;
        const speed = 480 + (i % 7) * 90;
        const x = (seed * 7.3 + parallax * 10) % W;
        const y = (seed * 13.7 + t * speed) % (H + 120);
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x - 3, y + 16 + (i % 5) * 3);
        g.stroke();
      }
      break;
    }
    case "hutan": {
      g.fillStyle = mix("#1f3a2c", "#04120c", night);
      g.fillRect(horizon > 0 ? 0 : 0, horizon + 30, W, H);
      const layers = [
        { y: horizon + 10, h: 0.22, c: mix("#24402f", "#061a11", night) },
        { y: horizon + 60, h: 0.3, c: mix("#16291f", "#020d08", night) },
      ];
      layers.forEach((L, li) => {
        g.fillStyle = L.c;
        g.beginPath();
        g.moveTo(0, H);
        for (let x = -40; x <= W + 40; x += 46) {
          const bx = x + parallax * (li + 1) * 5;
          const th = H * L.h * (0.7 + ((x * 13) % 7) / 12);
          g.lineTo(bx, L.y);
          g.lineTo(bx + 23, L.y - th);
          g.lineTo(bx + 46, L.y);
        }
        g.lineTo(W, H);
        g.fill();
      });
      for (let i = 0; i < 26; i += 1) {
        const fx = ((i * 137.5) % 100) / 100;
        const x = fx * W + Math.sin(t * 0.6 + i) * 30;
        const y = horizon - 20 + Math.cos(t * 0.5 + i * 2) * 40 + (i % 5) * 12;
        const a = night * (0.35 + 0.35 * Math.sin(t * 2 + i));
        g.fillStyle = `rgba(190,255,140,${Math.max(0, a)})`;
        g.beginPath();
        g.arc(x, y, 2.2, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case "sunset": {
      const hills = [
        { y: horizon + 20, c: mix("#7a5478", "#160d26", night), amp: 40, f: 0.006 },
        { y: horizon + 90, c: mix("#4a3459", "#0c0718", night), amp: 60, f: 0.004 },
      ];
      hills.forEach((h, i) => {
        g.fillStyle = h.c;
        g.beginPath();
        g.moveTo(0, H);
        for (let x = 0; x <= W; x += 16) {
          g.lineTo(x, h.y + Math.sin(x * h.f + i * 2 + parallax * 0.2) * h.amp);
        }
        g.lineTo(W, H);
        g.fill();
      });
      break;
    }
    case "salju": {
      g.fillStyle = mix("#dfe9f7", "#182a45", night);
      g.beginPath();
      g.moveTo(0, H);
      for (let x = 0; x <= W; x += 20) {
        g.lineTo(x, horizon + 70 + Math.sin(x * 0.005 + parallax * 0.3) * 26);
      }
      g.lineTo(W, H);
      g.fill();
      for (let i = 0; i < 180; i += 1) {
        const seed = i * 53.7;
        const x = (seed * 11.1 + Math.sin(t * 0.5 + i) * 40 + parallax * 8) % W;
        const y = (seed * 17.3 + t * (30 + (i % 5) * 12)) % (H + 60);
        g.fillStyle = `rgba(255,255,255,${0.5 + (i % 4) * 0.1})`;
        g.beginPath();
        g.arc(x, y, 1 + (i % 3) * 0.9, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
    case "apiunggun": {
      g.fillStyle = mix("#2b1a16", "#0a0503", night);
      g.beginPath();
      g.moveTo(0, H);
      for (let x = 0; x <= W; x += 24) {
        g.lineTo(x, horizon + 60 + Math.sin(x * 0.005) * 16);
      }
      g.lineTo(W, H);
      g.fill();
      const fx = W / 2 + parallax * 6;
      const fy = H * 0.86;
      const glow = g.createRadialGradient(fx, fy, 4, fx, fy, H * 0.32);
      glow.addColorStop(0, "rgba(255,170,60,0.55)");
      glow.addColorStop(1, "rgba(255,120,30,0)");
      g.fillStyle = glow;
      g.beginPath();
      g.arc(fx, fy, H * 0.32, 0, Math.PI * 2);
      g.fill();
      for (let i = 0; i < 60; i += 1) {
        const life = (t * 0.55 + i * 0.13) % 1;
        const x = fx + Math.sin(i * 3.1 + t * 1.6) * 26 * life;
        const y = fy - life * H * 0.28;
        g.fillStyle = `rgba(255,${140 + Math.floor(90 * (1 - life))},60,${(1 - life) * 0.85})`;
        g.beginPath();
        g.arc(x, y, 2.6 * (1 - life) + 0.6, 0, Math.PI * 2);
        g.fill();
      }
      break;
    }
  }
}

function drawBreathOrb(
  g: CanvasRenderingContext2D,
  W: number,
  H: number,
  breath: { phase: string; ratio: number; label: string },
  theme: RelaxTheme,
  night: number,
) {
  const cx = W / 2;
  const cy = H * 0.46;
  const base = Math.min(W, H) * 0.11;
  const r = base * (0.72 + breath.ratio * 0.62);

  g.save();
  const glow = g.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 2.4);
  glow.addColorStop(0, `${theme.accent}55`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = glow;
  g.beginPath();
  g.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
  g.fill();

  g.strokeStyle = `rgba(255,255,255,${0.45 + 0.3 * breath.ratio})`;
  g.lineWidth = 2;
  g.shadowBlur = 24;
  g.shadowColor = theme.accent;
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
  g.stroke();

  g.shadowBlur = 0;
  g.strokeStyle = "rgba(255,255,255,0.16)";
  g.lineWidth = 1;
  g.beginPath();
  g.arc(cx, cy, base * 1.4, 0, Math.PI * 2);
  g.stroke();

  g.fillStyle = `rgba(255,255,255,${0.75 - night * 0.2})`;
  g.font = `${Math.max(13, Math.min(W, H) * 0.028)}px ui-sans-serif, system-ui, sans-serif`;
  g.textAlign = "center";
  g.fillText(breath.label, cx, cy + base * 2.3);
  g.restore();
}
