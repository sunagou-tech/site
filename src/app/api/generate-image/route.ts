import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const API_KEY    = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL      = "imagen-3.0-generate-001";

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY未設定" }, { status: 500 });

  const body = (await req.json()) as { prompt: string; aspectRatio?: string };
  const { prompt, aspectRatio = "1:1" } = body;

  if (!prompt) return NextResponse.json({ error: "promptは必須です" }, { status: 400 });

  // Imagen 3 expects English prompts — append quality modifiers
  const enhancedPrompt = `${prompt}, professional photo, high quality, sharp focus, clean background`;

  try {
    const res = await fetch(
      `${GEMINI_BASE}/${MODEL}:predict?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt: enhancedPrompt }],
          parameters: {
            sampleCount: 3,
            aspectRatio,
            safetyFilterLevel: "block_few",
            personGeneration: "allow_adult",
          },
        }),
        signal: AbortSignal.timeout(55000),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Imagen APIエラー: ${err.slice(0, 300)}` }, { status: 503 });
    }

    const data = await res.json();
    // predictions[].bytesBase64Encoded + mimeType
    const predictions = (data.predictions ?? []) as Array<{ bytesBase64Encoded: string; mimeType: string }>;

    if (!predictions.length) {
      return NextResponse.json({ error: "画像が生成されませんでした" }, { status: 500 });
    }

    const images = predictions.map(p => ({
      dataUrl: `data:${p.mimeType ?? "image/png"};base64,${p.bytesBase64Encoded}`,
    }));

    return NextResponse.json({ images });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "生成失敗" }, { status: 500 });
  }
}
