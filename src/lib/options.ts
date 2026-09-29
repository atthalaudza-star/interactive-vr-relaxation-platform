import { db } from "@/db";
import { stressOptions, type StressOption } from "@/db/schema";
import { asc, inArray, sql } from "drizzle-orm";

export const DEFAULT_OPTIONS: { label: string; kind: string; emoji: string }[] = [
  // Sumber stres
  { label: "Pekerjaan", kind: "sumber", emoji: "work" },
  { label: "Sekolah / Kuliah", kind: "sumber", emoji: "school" },
  { label: "Tugas & Deadline", kind: "sumber", emoji: "book" },
  { label: "Keluarga", kind: "sumber", emoji: "home" },
  { label: "Keuangan", kind: "sumber", emoji: "money" },
  { label: "Hubungan / Teman", kind: "sumber", emoji: "chat" },
  { label: "Kesehatan", kind: "sumber", emoji: "health" },
  { label: "Overthinking Malam", kind: "sumber", emoji: "thought" },
  // Yang dirasakan (opsi tambahan)
  { label: "Susah tidur", kind: "gejala", emoji: "sleep" },
  { label: "Banyak tugas", kind: "gejala", emoji: "tasks" },
  { label: "Stres", kind: "gejala", emoji: "stress" },
  { label: "Pekerjaan banyak", kind: "gejala", emoji: "work" },
  { label: "Tekanan sekolah", kind: "gejala", emoji: "school" },
  { label: "Badan tegang", kind: "gejala", emoji: "body" },
  { label: "Cemas / gelisah", kind: "gejala", emoji: "worry" },
  { label: "Kelelahan", kind: "gejala", emoji: "energy" },
];

/** Ambil semua opsi; kalau tabel masih kosong, isi dengan opsi bawaan. */
export async function loadStressOptions(): Promise<StressOption[]> {
  if (!process.env.DATABASE_URL || !db) {
    const now = new Date();
    return DEFAULT_OPTIONS.map((option, index) => ({
      id: -(index + 1),
      ...option,
      isCustom: false,
      usageCount: 0,
      createdAt: now,
    }));
  }

  try {
    const rows = await db.select().from(stressOptions).orderBy(asc(stressOptions.id));
    if (rows.length > 0) return rows;

    await db.insert(stressOptions).values(DEFAULT_OPTIONS).onConflictDoNothing();
    return db.select().from(stressOptions).orderBy(asc(stressOptions.id));
  } catch (error) {
    console.warn("Database unavailable; using default stress options.", error);
    const now = new Date();
    return DEFAULT_OPTIONS.map((option, index) => ({
      id: -(index + 1),
      ...option,
      isCustom: false,
      usageCount: 0,
      createdAt: now,
    }));
  }
}

export async function bumpUsage(labels: string[]) {
  if (labels.length === 0 || !process.env.DATABASE_URL || !db) return;
  await db
    .update(stressOptions)
    .set({ usageCount: sql`${stressOptions.usageCount} + 1` })
    .where(inArray(stressOptions.label, labels));
}
