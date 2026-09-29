"use client";

import { useState } from "react";
import type { ThoughtRow } from "@/db/schema";
import AppIcon from "./AppIcon";

export default function StorageList({ initial }: { initial: ThoughtRow[] }) {
  const [items, setItems] = useState(initial);
  const [busy, setBusy] = useState<number | null>(null);
  const [draft, setDraft] = useState("");

  const update = async (id: number, status: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/thoughts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { thought?: ThoughtRow };
      if (data.thought) {
        setItems((prev) => prev.map((t) => (t.id === id ? data.thought! : t)));
      }
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Hapus titipan ini?")) return;
    setBusy(id);
    try {
      await fetch(`/api/thoughts/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setBusy(null);
    }
  };

  const add = async () => {
    const content = draft.trim();
    if (!content) return;
    const res = await fetch("/api/thoughts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [content] }),
    });
    const data = (await res.json()) as { thoughts?: ThoughtRow[] };
    if (data.thoughts) setItems((prev) => [...data.thoughts!, ...prev]);
    setDraft("");
  };

  const stored = items.filter((t) => t.status === "tersimpan");
  const done = items.filter((t) => t.status !== "tersimpan");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 glass-card p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
          }}
          placeholder="Titipkan satu pikiran lagi ke kotak…"
          className="input-glass min-w-[220px] flex-1"
        />
        <button
          onClick={() => void add()}
          className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
        >
          Simpan
        </button>
      </div>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300/80">
          <AppIcon name="box" className="mr-1 inline h-4 w-4" /> Tersimpan ({stored.length})
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {stored.length === 0 && (
            <p className="text-sm text-slate-500">Belum ada pikiran yang dititipkan.</p>
          )}
          {stored.map((t) => (
            <article key={t.id} className="glass-card p-5">
              <p className="text-sm leading-relaxed text-slate-100">{t.content}</p>
              <p className="mt-3 text-[11px] uppercase tracking-wider text-slate-500">
                {new Date(t.createdAt).toLocaleString("id-ID", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {t.sessionId ? ` · sesi #${t.sessionId}` : ""}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  disabled={busy === t.id}
                  onClick={() => void update(t.id, "selesai")}
                  className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50"
                >
                  <AppIcon name="check" className="mr-1 inline h-3.5 w-3.5" /> Sudah diurus
                </button>
                <button
                  disabled={busy === t.id}
                  onClick={() => void remove(t.id)}
                  className="glass-btn px-3 py-1.5 text-xs text-slate-300 disabled:opacity-50"
                >
                  Hapus
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {done.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300/70">
            <AppIcon name="check" className="mr-1 inline h-4 w-4" /> Sudah diurus ({done.length})
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {done.map((t) => (
              <article key={t.id} className="glass-card p-5">
                <p className="text-sm text-slate-400 line-through">{t.content}</p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => void update(t.id, "tersimpan")}
                    className="glass-btn px-3 py-1.5 text-xs text-slate-300"
                  >
                    Kembalikan
                  </button>
                  <button
                    onClick={() => void remove(t.id)}
                    className="glass-btn px-3 py-1.5 text-xs text-slate-300"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
