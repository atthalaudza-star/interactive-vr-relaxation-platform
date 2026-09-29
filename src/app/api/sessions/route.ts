import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, thoughts } from "@/db/schema";
import { bumpUsage } from "@/lib/options";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL || !db) {
    return NextResponse.json({ sessions: [] });
  }

  const rows = await db.select().from(sessions).orderBy(desc(sessions.id)).limit(30);
  return NextResponse.json({ sessions: rows });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL || !db) {
    return NextResponse.json({ error: "Database belum tersedia." }, { status: 503 });
  }

  const body = (await request.json()) as {
    stressSources?: string[];
    stressSymptoms?: string[];
    stressLevel?: string;
    theme?: string;
    mode?: string;
    plannedMinutes?: number;
    alarmEnabled?: boolean;
    thoughts?: string[];
  };

  const sources = (body.stressSources ?? []).filter(Boolean).slice(0, 20);
  const symptoms = (body.stressSymptoms ?? []).filter(Boolean).slice(0, 20);

  const [row] = await db
    .insert(sessions)
    .values({
      stressSources: sources,
      stressSymptoms: symptoms,
      stressLevel: body.stressLevel ?? "ringan",
      theme: body.theme ?? "ombak",
      mode: body.mode ?? "lepas-sendiri",
      plannedMinutes: Math.min(Math.max(body.plannedMinutes ?? 15, 1), 60),
      alarmEnabled: body.alarmEnabled ?? true,
      status: "berjalan",
    })
    .returning();

  const list = (body.thoughts ?? [])
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .slice(0, 10);

  if (list.length > 0) {
    await db
      .insert(thoughts)
      .values(list.map((content) => ({ sessionId: row.id, content })));
  }

  await bumpUsage([...sources, ...symptoms]);

  return NextResponse.json({ session: row }, { status: 201 });
}
