import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Opsi stres yang bisa dipilih user pada form pra-sesi.
 * kind = "sumber"  -> penyebab stres (pekerjaan, sekolah, tugas, ...)
 * kind = "gejala"  -> yang dirasakan (susah tidur, banyak tugas, ...)
 * User bisa menambah opsi baru yang belum tersedia (isCustom = true).
 */
export const stressOptions = pgTable("stress_options", {
  id: serial("id").primaryKey(),
  label: varchar("label", { length: 120 }).notNull(),
  kind: varchar("kind", { length: 16 }).notNull().default("sumber"),
  emoji: varchar("emoji", { length: 8 }).notNull().default("moon"),
  isCustom: boolean("is_custom").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Satu sesi relaksasi VR. */
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  stressSources: jsonb("stress_sources").$type<string[]>().notNull().default([]),
  stressSymptoms: jsonb("stress_symptoms").$type<string[]>().notNull().default([]),
  stressLevel: varchar("stress_level", { length: 16 }).notNull().default("ringan"),
  theme: varchar("theme", { length: 32 }).notNull().default("ombak"),
  mode: varchar("mode", { length: 24 }).notNull().default("lepas-sendiri"),
  plannedMinutes: integer("planned_minutes").notNull().default(15),
  alarmEnabled: boolean("alarm_enabled").notNull().default(true),
  status: varchar("status", { length: 16 }).notNull().default("berjalan"),
  completedSeconds: integer("completed_seconds").notNull().default(0),
  breathCycles: integer("breath_cycles").notNull().default(0),
  starsConnected: integer("stars_connected").notNull().default(0),
  calmnessAfter: integer("calmness_after"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

/** Isi pikiran user yang "dimasukkan ke kotak" lalu disimpan di Sleep Storage. */
export const thoughts = pgTable("thoughts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id"),
  content: text("content").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("tersimpan"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  reopenedAt: timestamp("reopened_at", { withTimezone: true }),
});

export type StressOption = typeof stressOptions.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type ThoughtRow = typeof thoughts.$inferSelect;
