"use client";

import { useMemo } from "react";
import AppIcon, { type IconName } from "./AppIcon";

type Props = {
  label: string;
  value: string | number;
  icon?: IconName;
  trend?: string;
  color?: "violet" | "emerald" | "amber" | "slate";
};

export default function StatCard({ label, value, icon, trend, color = "violet" }: Props) {
  const colorMap = {
    violet: { bg: "bg-violet-500/10", text: "text-violet-200", border: "border-violet-500/20" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-200", border: "border-emerald-500/20" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-200", border: "border-amber-500/20" },
    slate: { bg: "bg-slate-500/10", text: "text-slate-200", border: "border-slate-500/20" },
  };
  const c = colorMap[color];

  const display = useMemo(() => {
    if (typeof value === "number") {
      if (value >= 1000) return (value / 1000).toFixed(1) + "k";
      return value.toLocaleString("id-ID");
    }
    return value;
  }, [value]);

  return (
    <div className={`glass-card p-5 transition hover:border-${color}-400/40`}>
      <div className="flex items-center gap-3">
        {icon && <AppIcon name={icon} className="h-6 w-6" />}
        <div>
          <div className="text-2xl font-semibold text-white">{display}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
        </div>
      </div>
      {trend && (
        <div className={`mt-3 text-xs ${c.text}`}>
          {trend}
        </div>
      )}
    </div>
  );
}
