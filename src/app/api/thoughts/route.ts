import { NextResponse } from "next/server";
import { db } from "@/db";
import { thoughts } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL || !db) {
    return NextResponse.json({ thoughts: [] });
  }

  const rows = await db.select().from(thoughts).orderBy(desc(thoughts.id)).limit(100);
  return NextResponse.json({ thoughts: rows });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL || !db) {
    return NextResponse.json({ error: "Database belum tersedia." }, { status: 503 });
  }

  const body = (await request.json()) as { contents?: string[]; sessionId?: number };
  const list = (body.contents ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 10);

  if (list.length === 0) {
    return NextResponse.json({ error: "Tidak ada pikiran untuk disimpan" }, { status: 400 });
  }

  const rows = await db
    .insert(thoughts)
    .values(list.map((content) => ({ content, sessionId: body.sessionId ?? null })))
    .returning();

  return NextResponse.json({ thoughts: rows }, { status: 201 });
}
