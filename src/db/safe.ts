import { db } from "@/db";
import { sessions, thoughts } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function loadRecentSessions(limit: number) {
  if (!db || !process.env.DATABASE_URL) {
    return [];
  }

  try {
    return await db.select().from(sessions).orderBy(desc(sessions.id)).limit(limit);
  } catch (error) {
    console.warn("Database unavailable; showing sessions as empty.", error);
    return [];
  }
}

export async function loadRecentThoughts(limit: number) {
  if (!db || !process.env.DATABASE_URL) {
    return [];
  }

  try {
    return await db.select().from(thoughts).orderBy(desc(thoughts.id)).limit(limit);
  } catch (error) {
    console.warn("Database unavailable; showing thoughts as empty.", error);
    return [];
  }
}

export function databaseUnavailable(error: unknown) {
  console.error("Database operation failed.", error);
  return Response.json(
    {
      error: "Database belum tersedia. Jalankan PostgreSQL dan periksa DATABASE_URL.",
    },
    { status: 503 },
  );
}
