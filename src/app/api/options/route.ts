import { NextResponse } from "next/server";
import { db } from "@/db";
import { stressOptions } from "@/db/schema";
import { loadStressOptions } from "@/lib/options";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await loadStressOptions();
  return NextResponse.json({ options: rows });
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL || !db) {
    return NextResponse.json({ error: "Database belum tersedia." }, { status: 503 });
  }

  const body = (await request.json()) as {
    label?: string;
    kind?: string;
    emoji?: string;
  };

  const label = (body.label ?? "").trim();
  if (!label) {
    return NextResponse.json({ error: "Label tidak boleh kosong" }, { status: 400 });
  }

  const kind = body.kind === "gejala" ? "gejala" : "sumber";
  const existing = await loadStressOptions();
  const dup = existing.find(
    (o) => o.label.toLowerCase() === label.toLowerCase() && o.kind === kind,
  );
  if (dup) return NextResponse.json({ option: dup, duplicated: true });

  const [row] = await db
    .insert(stressOptions)
    .values({
      label: label.slice(0, 120),
      kind,
      emoji: (body.emoji ?? "custom").slice(0, 8),
      isCustom: true,
    })
    .returning();

  return NextResponse.json({ option: row }, { status: 201 });
}
