"use client";

import Link from "next/link";
import type { SessionRow } from "@/db/schema";
import { getLevel, getTheme } from "@/lib/themes";
import ThemeImage from "./ThemeImage";
import AppIcon from "./AppIcon";

type Props = {
  session: SessionRow;
};

export default function SessionCard({ session }: Props) {
  const theme = getTheme(session.theme);
  const level = getLevel(session.stressLevel);
  const tags = [...(session.stressSources ?? []), ...(session.stressSymptoms ?? [])];
  const minutes = Math.round(session.completedSeconds / 60);
  const isComplete = session.status === "selesai";

  return (
    <article className="glass-card p-5 transition hover:border-violet-400/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-xl shadow-[0_0_20px_rgba(0,0,0,0.3)]">
            <ThemeImage theme={theme} sizes="48px" />
          </div>
          <div className="min-w-[180px]">
            <div className="text-base font-semibold text-white">
              {theme.name}
              <span className="ml-2 text-[11px] uppercase tracking-wider text-slate-400">
                {level.label}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {new Date(session.createdAt).toLocaleString("id-ID", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-xs text-slate-300">
          <span className="whitespace-nowrap">
            <AppIcon name="timer" className="mr-1 inline h-3.5 w-3.5" /> {minutes}/{session.plannedMinutes} menit
          </span>
          <span className="whitespace-nowrap"><AppIcon name="activity" className="mr-1 inline h-3.5 w-3.5" />{session.breathCycles}</span>
          <span className="whitespace-nowrap"><AppIcon name="sparkles" className="mr-1 inline h-3.5 w-3.5" />{session.starsConnected}</span>
          <span
            className={`whitespace-nowrap ${isComplete ? "text-emerald-300" : "text-amber-300"}`}
          >
            {session.status}
          </span>
        </div>
      </div>
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 6).map((t) => (
            <span key={t} className="tag-pill text-slate-300">
              {t}
            </span>
          ))}
          {tags.length > 6 && (
            <span className="tag-pill text-slate-500">+{tags.length - 6} lagi</span>
          )}
        </div>
      )}
    </article>
  );
}
