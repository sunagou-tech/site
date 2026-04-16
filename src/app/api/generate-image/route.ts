import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const API_KEY     = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY未設定" }, { status: 500 });

  const body = (await req.json()) as { prompt: string; aspectRatio?: string };
  const { prompt, aspectRatio = "1:1" } = body;
  if (!prompt) return NextResponse.json({ error: "promptは必須です" }, { status: 400 });

  const enhancedPrompt = `${prompt}, professional high quality photo, sharp focus`;

  // まず Gemini 2.5 Flash Image (generateContent) を試み、失敗したら Imagen 4 Fast (predict) にフォールバック
  const attempts = [
    {
      model: "gemini-2.5-flash-image",
      endpoint: "generateContent",
      body: () => JSON.stringify({
        contents: [{ role: "user", parts: [{ text: enhancedPrompt }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
      parse: (data: Record<string, unknown>) => {
        const parts = ((data.candidates as {content:{parts:unknown[]}}[])?.[0]?.content?.parts ?? []) as Array<{ inlineData?: { mimeType: string; data: string } }>;
        return parts.filter(p => p.inlineData?.data).map(p => `data:${p.inlineData!.mimeType};base64,${p.inlineData!.data}`);
      },
    },
    {
      model: "imagen-4.0-fast-generate-001",
      endpoint: "predict",
      body: () => JSON.stringify({
        instances: [{ prompt: enhancedPrompt }],
        parameters: { sampleCount: 3, aspectRatio, safetyFilterLevel: "block_few", personGeneration: "allow_adult" },
      }),
      parse: (data: Record<string, unknown>) => {
        const preds = (data.predictions ?? []) as Array<{ bytesBase64Encoded: string; mimeType: string }>;
        return preds.map(p => `data:${p.mimeType ?? "image/png"};base64,${p.bytesBase64Encoded}`);
      },
    },
  ];

  for (const attempt of attempts) {
    try {
      const res = await fetch(
        `${GEMINI_BASE}/${attempt.model}:${attempt.endpoint}?key=${API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: attempt.body(), signal: AbortSignal.timeout(50000) }
      );
      if (!res.ok) continue; // 次のモデルを試す
      const data = await res.json() as Record<string, unknown>;
      const images = attempt.parse(data);
      if (images.length) return NextResponse.json({ images: images.map(dataUrl => ({ dataUrl })) });
    } catch {
      continue;
    }
  }

  return NextResponse.json({ error: "画像生成に失敗しました。プロンプトを変えて試してください。" }, { status: 500 });
}
