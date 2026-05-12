import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET() {
  const key = process.env.GEMINI_API_KEY ?? "";
  if (!key) return NextResponse.json({ ok: false, error: "GEMINI_API_KEY not set" });

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ ok: false, status: res.status, error: data });
    const models = (data.models ?? []).map((m: { name: string }) => m.name);
    return NextResponse.json({ ok: true, modelCount: models.length, models });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
