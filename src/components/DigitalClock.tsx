"use client";

import { useEffect, useState } from "react";

type Props = {
  size?: "sm" | "md" | "lg";
  showDate?: boolean;
};

export default function DigitalClock({ size = "md", showDate = false }: Props) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const initialId = window.setTimeout(() => setTime(new Date()), 0);
    const id = window.setInterval(() => setTime(new Date()), 1000);
    return () => {
      window.clearTimeout(initialId);
      window.clearInterval(id);
    };
  }, []);

  const sizeClass =
    size === "lg" ? "text-3xl px-5 py-3" : size === "sm" ? "text-base px-3 py-1.5" : "text-xl px-4 py-2";

  if (!time) {
    return (
      <div className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] font-mono font-semibold tracking-wider text-white ${sizeClass}`}>
        <span className="opacity-40">--:--:--</span>
      </div>
    );
  }

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const dateStr = time.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });

  return (
    <div className="inline-flex flex-col">
      <div
        className={`inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] font-mono font-semibold tracking-wider text-white ${sizeClass}`}
      >
        <span>{hours}</span>
        <span className="text-violet-300/80 animate-pulse">:</span>
        <span>{minutes}</span>
        <span className="text-violet-300/60">:</span>
        <span className="text-violet-300/50">{seconds}</span>
      </div>
      {showDate && (
        <div className="mt-1.5 text-center text-[10px] uppercase tracking-widest text-slate-500">
          {dateStr}
        </div>
      )}
    </div>
  );
}
