"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import DigitalClock from "./DigitalClock";
import AppIcon, { type IconName } from "./AppIcon";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  desc: string;
};

const NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: "home", desc: "Dashboard utama" },
  { href: "/mulai", label: "Mulai Sesi", icon: "focus", desc: "Sesi VR baru" },
  { href: "/storage", label: "Sleep Storage", icon: "box", desc: "Kotak pikiran" },
  { href: "/riwayat", label: "Riwayat", icon: "chart", desc: "Rekap sesi" },
];

const QUICK: NavItem[] = [
  { href: "/mulai?level=ringan&theme=sunset&minutes=10", label: "Cepat 10 mnt", icon: "timer", desc: "" },
  { href: "/mulai?level=sedang&theme=hujan&minutes=15", label: "Standar 15 mnt", icon: "cloud", desc: "" },
  { href: "/mulai?level=berat&theme=ombak&minutes=20", label: "Dalam 20 mnt", icon: "waves", desc: "" },
];

export default function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [greeting, setGreeting] = useState("Halo");

  useEffect(() => {
    const id = window.setTimeout(() => {
      const h = new Date().getHours();
      if (h < 5) setGreeting("Selamat malam");
      else if (h < 11) setGreeting("Selamat pagi");
      else if (h < 15) setGreeting("Selamat siang");
      else if (h < 18) setGreeting("Selamat sore");
      else setGreeting("Selamat malam");
    }, 0);

    return () => window.clearTimeout(id);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="relative min-h-screen">
      {/* Backdrop mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-[#0a0c1c]/95 backdrop-blur-xl transition-transform lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 text-lg shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <AppIcon name="moon" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-wide text-white">
              Tenang<span className="text-violet-400">VR</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
              Relaksasi imersif
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <AppIcon name="close" className="h-4 w-4" />
          </button>
        </div>

        {/* Greeting */}
        <div className="border-b border-white/5 px-6 py-4">
          <div className="text-xs text-slate-400">{greeting}</div>
          <div className="mt-1 text-base font-medium text-white">Siap istirahat?</div>
          <div className="mt-3">
            <DigitalClock size="md" showDate />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Menu
          </div>
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-violet-500/15 text-white shadow-[inset_0_0_0_1px_rgba(139,92,246,0.3)]"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span
                      className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-base transition ${
                        active
                          ? "bg-violet-500/25 shadow-[0_0_16px_rgba(139,92,246,0.35)]"
                          : "bg-white/5 group-hover:bg-white/10"
                      }`}
                    >
                      <AppIcon name={item.icon} className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">{item.label}</div>
                      <div className="truncate text-[11px] text-slate-500">{item.desc}</div>
                    </div>
                    {active && (
                      <span className="h-2 w-2 flex-shrink-0 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8)]" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-6 mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Mulai Cepat
          </div>
          <ul className="space-y-1">
            {QUICK.map((q) => (
              <li key={q.href}>
                <Link
                  href={q.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                  <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg bg-white/5 text-sm">
                    <AppIcon name={q.icon} className="h-4 w-4" />
                  </span>
                  <span className="truncate">{q.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer CTA */}
        <div className="border-t border-white/5 p-4">
          <Link
            href="/mulai"
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-3 text-sm font-semibold text-slate-900 shadow-[0_8px_24px_rgba(251,191,36,0.25)] transition hover:brightness-110"
          >
            <AppIcon name="moon" className="h-4 w-4" /> Mulai Sesi
          </Link>
          <p className="mt-3 text-center text-[10px] text-slate-500">
            v1.0 · Prototipe VR relaksasi
          </p>
        </div>
      </aside>

      {/* MAIN */}
      <div className="lg:pl-72">
        {/* Topbar (mobile) & breadcrumb */}
        <div className="sticky top-0 z-30 border-b border-white/5 bg-[#05060f]/85 backdrop-blur-lg">
          <div className="flex items-center gap-3 px-4 py-3 lg:px-8 lg:py-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
              aria-label="Buka menu"
            >
              <AppIcon name="menu" className="h-4 w-4" />
            </button>

            <Breadcrumb pathname={pathname} />

            <div className="ml-auto flex items-center gap-2">
              {pathname !== "/mulai" && (
                <Link
                  href="/mulai"
                  className="hidden rounded-full bg-violet-500/90 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-400 sm:inline-block"
                >
                  Mulai Sesi
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="min-h-[calc(100vh-4rem)] px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

function Breadcrumb({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  const labelMap: Record<string, string> = {
    "": "Beranda",
    mulai: "Mulai Sesi",
    storage: "Sleep Storage",
    riwayat: "Riwayat",
  };

  return (
    <nav className="flex items-center gap-2 text-xs text-slate-400">
      <Link href="/" className="hover:text-white">
        <AppIcon name="home" className="h-3.5 w-3.5" />
      </Link>
      {parts.length === 0 && (
        <>
          <span className="text-slate-600">/</span>
          <span className="text-white">Beranda</span>
        </>
      )}
      {parts.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          <span className="text-slate-600">/</span>
          <span className={i === parts.length - 1 ? "text-white" : ""}>
            {labelMap[p] ?? p}
          </span>
        </span>
      ))}
    </nav>
  );
}
