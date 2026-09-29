import Link from "next/link";
import { loadRecentSessions, loadRecentThoughts } from "@/db/safe";
import SessionCard from "@/components/SessionCard";
import { THEMES } from "@/lib/themes";
import ThemeImage from "@/components/ThemeImage";
import AppIcon, { type IconName } from "@/components/AppIcon";

export const dynamic = "force-dynamic";

const QUICK_START = [
  { label: "Stres ringan", level: "ringan", minutes: 10, theme: "sunset", desc: "Sekedar rileks" },
  { label: "Stres sedang", level: "sedang", minutes: 15, theme: "hujan", desc: "Perlu ketenangan" },
  { label: "Stres berat", level: "berat", minutes: 20, theme: "ombak", desc: "Butuh dalam" },
];

const FEATURES = [
  { icon: "waves" as IconName, title: "6 Tema suasana", desc: "Ombak, hujan, hutan, senja, salju, api unggun" },
  { icon: "moon" as IconName, title: "Transisi senja → malam", desc: "Langit bergerak mengikuti durasi sesi" },
  { icon: "activity" as IconName, title: "Panduan napas visual", desc: "Ritme 4-4-7 / 4-7-8 mengikuti level stres" },
  { icon: "box" as IconName, title: "Cognitive Shutdown", desc: "Titipkan pikiran ke kotak, aman di Sleep Storage" },
  { icon: "sparkles" as IconName, title: "Rangkai bintang", desc: "Tahan pandangan, mirip menghitung domba" },
  { icon: "fire" as IconName, title: "Filter warm light", desc: "Kurangi paparan blue light bertahap" },
];

const fromId = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

export default async function DashboardPage() {
  const [recentSessions, recentThoughts] = await Promise.all([
    loadRecentSessions(3),
    loadRecentThoughts(50),
  ]);

  const totalSessions = recentSessions.length;
  const totalMinutes = Math.round(
    recentSessions.reduce((acc, r) => acc + r.completedSeconds, 0) / 60,
  );
  const totalBreath = recentSessions.reduce((acc, r) => acc + r.breathCycles, 0);
  const totalStars = recentSessions.reduce((acc, r) => acc + r.starsConnected, 0);
  const storedCount = recentThoughts.filter((t) => t.status === "tersimpan").length;

  const lastSession = recentSessions[0];
  const lastTheme = lastSession ? fromId(lastSession.theme) : null;

  return (
    <main className="mx-auto max-w-6xl space-y-8">
      {/* HERO CARD */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10">
        <div
          aria-hidden="true"
          className="h-[280px] w-full bg-[radial-gradient(circle_at_72%_24%,rgba(251,191,36,0.32),transparent_16%),radial-gradient(circle_at_65%_45%,rgba(139,92,246,0.24),transparent_32%),linear-gradient(145deg,#1e1b4b_0%,#111827_48%,#020617_100%)] sm:h-[340px]"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#05060f] via-[#05060f]/70 to-transparent" />
        <div className="absolute inset-0 flex items-end p-6 sm:p-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-violet-200 backdrop-blur">
              <AppIcon name="focus" className="h-3.5 w-3.5" /> VR Relaksasi Interaktif
            </span>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Tenangkan pikiran,
              <br />
              <span className="text-slate-300">lalu tidur lebih cepat.</span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300">
              Isi form stres, titipkan pikiran ke kotak, lalu masuk ke pemandangan senja → malam
              berbintang sambil mengikuti ritme napas.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/mulai"
                className="rounded-full bg-amber-400 px-6 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
              >
                Mulai sesi
              </Link>
              <Link
                href="/storage"
                className="glass-btn px-5 py-2.5 text-sm text-slate-200"
              >
                Sleep Storage
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon="moon"
          label="Sesi terakhir"
          value={totalSessions === 0 ? "—" : String(totalSessions)}
          hint={totalSessions === 0 ? "Belum ada" : "Sesi tersimpan"}
          gradient="from-violet-500/20 to-purple-500/10"
        />
        <StatCard
          icon="timer"
          label="Total menit"
          value={totalMinutes ? `${totalMinutes}` : "0"}
          hint="Waktu relaksasi"
          gradient="from-amber-500/20 to-orange-500/10"
        />
        <StatCard
          icon="activity"
          label="Siklus napas"
          value={String(totalBreath)}
          hint="Napas terbimbing"
          gradient="from-emerald-500/20 to-teal-500/10"
        />
        <StatCard
          icon="box"
          label="Pikiran tersimpan"
          value={String(storedCount)}
          hint="Di Sleep Storage"
          gradient="from-sky-500/20 to-cyan-500/10"
        />
      </section>

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT COL: Quick start */}
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Mulai cepat</h2>
              <p className="mt-1 text-xs text-slate-400">
                Pilih sesuai kondisi kepalamu sekarang
              </p>
            </div>
            <Link href="/mulai" className="text-xs text-violet-300 hover:underline">
              Kustom →
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {QUICK_START.map((q) => {
              const theme = fromId(q.theme);
              return (
                <Link
                  key={q.label}
                  href={`/mulai?level=${q.level}&theme=${q.theme}&minutes=${q.minutes}`}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-violet-400/40 hover:bg-white/[0.05]"
                >
                  <div className="relative mb-4 h-16 w-16 overflow-hidden rounded-2xl transition group-hover:scale-110">
                    <ThemeImage theme={theme} sizes="64px" />
                  </div>
                  <div className="text-sm font-semibold text-white">{q.label}</div>
                  <div className="mt-1 text-xs text-slate-400">{q.desc}</div>
                  <div className="mt-3 text-[11px] uppercase tracking-wider text-violet-300/80">
                    {theme.name} · {q.minutes} min
                  </div>
                  <div className="absolute right-4 top-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-white">
                    →
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Riwayat singkat */}
          <div className="mt-8 mb-4 flex items-end justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Sesi terakhir</h2>
              <p className="mt-1 text-xs text-slate-400">3 sesi paling baru</p>
            </div>
            <Link href="/riwayat" className="text-xs text-violet-300 hover:underline">
              Lihat semua →
            </Link>
          </div>

          <div className="space-y-3">
            {recentSessions.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <AppIcon name="moon" className="mx-auto h-10 w-10 text-violet-300" />
                <p className="mt-3 text-sm text-slate-300">Belum ada sesi tercatat.</p>
                <Link
                  href="/mulai"
                  className="mt-4 inline-block rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-400"
                >
                  Mulai sesi pertama
                </Link>
              </div>
            ) : (
              recentSessions.map((s) => <SessionCard key={s.id} session={s} />)
            )}
          </div>
        </section>

        {/* RIGHT COL: sidebar info */}
        <aside className="space-y-6">
          {/* Alur */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white">Alur pemakaian</h3>
            <ol className="mt-4 space-y-3">
              {[
                { n: "01", t: "Isi form stres", d: "Pilih sumber & gejala" },
                { n: "02", t: "Tulis isi pikiran", d: "Masukkan ke kotak" },
                { n: "03", t: "Kotak menghilang", d: "Dikunci & tersimpan" },
                { n: "04", t: "Sesi imersif", d: "Visual + napas + bintang" },
                { n: "05", t: "Tidur nyenyak", d: "Layar gelap & alarm lembut" },
              ].map((s) => (
                <li key={s.n} className="flex items-start gap-3">
                  <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-violet-500/15 text-xs font-semibold text-violet-200">
                    {s.n}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{s.t}</div>
                    <div className="text-xs text-slate-400">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          {/* Last theme */}
          {lastTheme && (
            <div className="relative overflow-hidden rounded-2xl border border-white/10">
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(150deg, ${lastTheme.dusk[0]}, ${lastTheme.night[2]})`,
                }}
              />
              <div className="relative p-5">
                <div className="text-xs text-white/70">Sesi terakhir dengan</div>
                <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
                  {lastTheme.name}
                </div>
                <p className="mt-2 text-xs text-white/70">{lastTheme.tagline}</p>
                <Link
                  href={`/mulai?theme=${lastTheme.id}&level=${lastSession!.stressLevel}&minutes=${lastSession!.plannedMinutes}`}
                  className="mt-4 inline-block rounded-full bg-white/20 px-4 py-2 text-xs font-medium text-white backdrop-blur transition hover:bg-white/30"
                >
                  Ulangi sesi ini →
                </Link>
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="glass-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <AppIcon name="lightbulb" className="h-4 w-4" /> Tips sesi
            </h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-300">
              <li>• Pakai headphone untuk ambience lebih dalam</li>
              <li>• Atur volume rendah supaya lebih menenangkan</li>
              <li>• Aktifkan mode fullscreen untuk imersi maksimal</li>
              <li>• Mode VR bagi layar untuk headset Cardboard</li>
              <li>• Tahan pandangan di bintang untuk merangkainya</li>
            </ul>
          </div>
        </aside>
      </div>

      {/* THEMES */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Tema suasana</h2>
            <p className="mt-1 text-xs text-slate-400">
              Klik untuk mulai langsung dengan tema pilihan
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((t) => (
            <Link
              key={t.id}
              href={`/mulai?theme=${t.id}&level=sedang&minutes=15`}
              className="group overflow-hidden rounded-2xl border border-white/10 transition hover:border-violet-400/40"
            >
              <div className="relative h-28 w-full overflow-hidden">
                <ThemeImage theme={t} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>
              <div className="bg-white/[0.02] p-4">
                <div className="text-sm font-semibold text-white">{t.name}</div>
                <p className="mt-1 line-clamp-1 text-xs text-slate-400">{t.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">Fitur di dalam sesi</h2>
          <p className="mt-1 text-xs text-slate-400">Yang bikin ini beda dari video relaksasi biasa</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="glass-card p-5">
              <AppIcon name={f.icon} className="h-6 w-6 text-violet-300" />
              <h3 className="mt-3 text-sm font-semibold text-white">{f.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODES */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent p-6">
          <AppIcon name="timer" className="h-6 w-6 text-sky-300" />
          <h3 className="mt-3 text-base font-semibold text-white">Pakai 10–20 menit</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Sesi berakhir sesuai durasi. Bel lembut berbunyi, lalu kamu lepas VR sendiri saat sudah
            terasa ngantuk.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-transparent to-transparent p-6">
          <AppIcon name="bed" className="h-6 w-6 text-violet-300" />
          <h3 className="mt-3 text-base font-semibold text-white">Pakai sampai tertidur</h3>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">
            Setelah waktu inti habis, layar makin gelap. Alarm lembut mengingatkan untuk melepas VR
            agar tidurmu tetap nyaman.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section>
        <div className="relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-purple-500/10 to-transparent p-8 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(1px_1px_at_20%_30%,#fff,transparent),radial-gradient(1px_1px_at_70%_20%,#fff,transparent),radial-gradient(1.5px_1.5px_at_40%_70%,#fff,transparent),radial-gradient(1px_1px_at_85%_60%,#fff,transparent)]" />
          <div className="relative">
            <AppIcon name="moon" className="mx-auto h-10 w-10 text-violet-300" />
            <h3 className="mt-3 text-xl font-semibold text-white">
              Siap menenangkan kepala malam ini?
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Cukup {totalMinutes ? "15" : "10"} menit untuk memulai kebiasaan tidur yang lebih baik.
            </p>
            <Link
              href="/mulai"
              className="mt-5 inline-block rounded-full bg-amber-400 px-8 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
            >
              Mulai sesi sekarang
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  gradient,
}: {
  icon: IconName;
  label: string;
  value: string;
  hint: string;
  gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${gradient} p-5`}>
      <div className="flex items-center justify-between">
        <AppIcon name={icon} className="h-6 w-6" />
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-2 text-[10px] text-slate-500">{hint}</div>
    </div>
  );
}
