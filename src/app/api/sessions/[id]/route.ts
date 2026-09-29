import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.DATABASE_URL || !db) {
    return NextResponse.json({ error: "Database belum tersedia." }, { status: 503 });
  }

  const { id } = await params;
  const sessionId = Number(id);
  if (!Number.isFinite(sessionId)) {
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  }

  const body = (await request.json()) as {
    status?: string;
    completedSeconds?: number;
    breathCycles?: number;
    starsConnected?: number;
    calmnessAfter?: number;
    note?: string;
  };

  const [row] = await db
    .update(sessions)
    .set({
      status: body.status ?? "selesai",
      completedSeconds: Math.max(0, Math.round(body.completedSeconds ?? 0)),
      breathCycles: Math.max(0, Math.round(body.breathCycles ?? 0)),
      starsConnected: Math.max(0, Math.round(body.starsConnected ?? 0)),
      calmnessAfter: body.calmnessAfter ?? null,
      note: body.note ?? null,
      completedAt: new Date(),
    })
    .where(eq(sessions.id, sessionId))
    .returning();

  if (!row) return NextResponse.json({ error: "sesi tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ session: row });
}
