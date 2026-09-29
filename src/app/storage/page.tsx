import { loadRecentThoughts } from "@/db/safe";
import StorageList from "@/components/StorageList";
import AppIcon from "@/components/AppIcon";

export const dynamic = "force-dynamic";

export default async function StoragePage() {
  const rows = await loadRecentThoughts(100);

  const stored = rows.filter((t) => t.status === "tersimpan").length;
  const done = rows.filter((t) => t.status === "selesai").length;

  return (
    <main className="mx-auto max-w-5xl">
      <p className="text-xs uppercase tracking-[0.3em] text-violet-300/80">Sleep Storage</p>
      <h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold text-white">Kotak pikiran kamu <AppIcon name="lock" className="h-7 w-7" /></h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
        Semua pikiran yang kamu titipkan sebelum tidur tersimpan di sini. Buka lagi besok pagi,
        tandai kalau sudah diurus, atau hapus kalau ternyata tidak sepenting itu.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="glass-card p-5">
          <div className="text-2xl font-semibold text-white">{rows.length}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">Total titipan</div>
        </div>
        <div className="glass-card p-5">
          <div className="text-2xl font-semibold text-amber-200">{stored}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
            Belum diurus
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-2xl font-semibold text-emerald-200">{done}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
            Sudah diurus
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-2xl font-semibold text-violet-200">∞</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
            Kapasitas
          </div>
        </div>
      </div>

      <div className="mt-8">
        <StorageList initial={rows} />
      </div>
    </main>
  );
}
