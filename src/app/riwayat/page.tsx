import { loadRecentSessions } from "@/db/safe";
import SessionCard from "@/components/SessionCard";
import StatCard from "@/components/StatCard";
import AppIcon from "@/components/AppIcon";

export const dynamic = "force-dynamic";

export default async function RiwayatPage() {
  const rows = await loadRecentSessions(50);

  const totalMinutes = Math.round(rows.reduce((acc, r) => acc + r.completedSeconds, 0) / 60);
  const totalBreath = rows.reduce((acc, r) => acc + r.breathCycles, 0);
  const totalStars = rows.reduce((acc, r) => acc + r.starsConnected, 0);
  const avgCalmness = rows.length > 0
    ? Math.round(rows.reduce((acc, r) => acc + (r.calmnessAfter ?? 50), 0) / rows.length)
    : 0;

  return (
    <main className="mx-auto max-w-5xl">
      <p className="text-xs uppercase tracking-[0.3em] text-violet-300/80">Riwayat</p>
      <h1 className="mt-2 text-3xl font-semibold text-white">Perjalanan tidurmu</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
        Rekap semua sesi yang sudah kamu lakukan. Semakin sering, semakin cepat tidurmu.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sesi" value={rows.length} icon="moon" color="violet" />
        <StatCard label="Total menit" value={totalMinutes} icon="timer" color="amber" />
        <StatCard label="Siklus napas" value={totalBreath} icon="activity" color="emerald" />
        <StatCard label="Bintang" value={totalStars} icon="sparkles" color="slate" />
      </div>

      {avgCalmness > 0 && (
        <div className="mt-6 glass-card p-6">
          <div className="flex items-center gap-4">
            <AppIcon name="heart" className="h-8 w-8 text-violet-300" />
            <div>
              <div className="text-xl font-semibold text-white">Rata-rata ketenangan</div>
              <div className="mt-1 text-xs text-slate-400">
                Setelah sesi (skala 0-100)
              </div>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-1000"
              style={{ width: `${avgCalmness}%` }}
            />
          </div>
          <div className="mt-2 text-center text-2xl font-semibold text-white">
            {avgCalmness}%
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {rows.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-sm text-slate-400">Belum ada sesi tercatat.</p>
            <div className="mt-4 flex justify-center gap-3">
              <a
                href="/mulai"
                className="rounded-full bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-400"
              >
                Mulai sesi pertama
              </a>
            </div>
          </div>
        ) : (
          rows.map((r) => <SessionCard key={r.id} session={r} />)
        )}
      </div>
    </main>
  );
}
