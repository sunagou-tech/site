import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const API_KEY     = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
// Gemini 2.0 Flash image generation — works with standard AI Studio key
const MODEL       = "gemini-2.0-flash-preview-image-generation";

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY未設定" }, { status: 500 });

  const body = (await req.json()) as { prompt: string; aspectRatio?: string };
  const { prompt } = body;

  if (!prompt) return NextResponse.json({ error: "promptは必須です" }, { status: 400 });

  const enhancedPrompt = `${prompt}, professional high quality photo, sharp focus`;

  try {
    const res = await fetch(
      `${GEMINI_BASE}/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
          generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
        }),
        signal: AbortSignal.timeout(55000),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `APIエラー: ${err.slice(0, 400)}` }, { status: 503 });
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];

    const images = (parts as Array<{ inlineData?: { mimeType: string; data: string } }>)
      .filter(p => p.inlineData?.data)
      .map(p => ({
        dataUrl: `data:${p.inlineData!.mimeType};base64,${p.inlineData!.data}`,
      }));

    if (!images.length) {
      return NextResponse.json({ error: "画像が生成されませんでした。プロンプトを変えて試してください。" }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "生成失敗" }, { status: 500 });
  }
}
