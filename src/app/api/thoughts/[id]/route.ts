import { NextResponse } from "next/server";
import { db } from "@/db";
import { thoughts } from "@/db/schema";
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
  const thoughtId = Number(id);
  if (!Number.isFinite(thoughtId)) {
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  }

  const body = (await request.json()) as { status?: string };
  const status = body.status === "selesai" ? "selesai" : "tersimpan";

  const [row] = await db
    .update(thoughts)
    .set({ status, reopenedAt: new Date() })
    .where(eq(thoughts.id, thoughtId))
    .returning();

  if (!row) return NextResponse.json({ error: "tidak ditemukan" }, { status: 404 });
  return NextResponse.json({ thought: row });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.DATABASE_URL || !db) {
    return NextResponse.json({ error: "Database belum tersedia." }, { status: 503 });
  }

  const { id } = await params;
  const thoughtId = Number(id);
  if (!Number.isFinite(thoughtId)) {
    return NextResponse.json({ error: "id tidak valid" }, { status: 400 });
  }
  await db.delete(thoughts).where(eq(thoughts.id, thoughtId));
  return NextResponse.json({ ok: true });
}
