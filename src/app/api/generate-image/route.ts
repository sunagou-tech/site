import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const OPENAI_KEY  = process.env.OPENAI_API_KEY ?? "";
const GEMINI_KEY  = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

function openaiSize(aspect: string): string {
  if (aspect === "16:9") return "1536x1024";
  if (aspect === "9:16") return "1024x1536";
  return "1024x1024";
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { prompt: string; aspectRatio?: string };
  const { prompt, aspectRatio = "1:1" } = body;
  if (!prompt) return NextResponse.json({ error: "promptは必須です" }, { status: 400 });

  const enhanced = `${prompt}, professional high quality photo, sharp focus, no text`;

  // ── 1. OpenAI gpt-image-1 ──────────────────────────────────
  if (OPENAI_KEY) {
    try {
      const res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({
          model: "gpt-image-1",
          prompt: enhanced,
          n: 1,
          size: openaiSize(aspectRatio),
          output_format: "png",
        }),
        signal: AbortSignal.timeout(55000),
      });
      if (res.ok) {
        const data = await res.json() as { data: { b64_json?: string; url?: string }[] };
        const item = data.data?.[0];
        if (item?.b64_json) {
          return NextResponse.json({ images: [{ dataUrl: `data:image/png;base64,${item.b64_json}` }] });
        }
        if (item?.url) {
          return NextResponse.json({ images: [{ dataUrl: item.url }] });
        }
      } else {
        // gpt-image-1に失敗したらdall-e-3を試す
        const res2 = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${OPENAI_KEY}` },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt: enhanced,
            n: 1,
            size: openaiSize(aspectRatio),
            response_format: "b64_json",
          }),
          signal: AbortSignal.timeout(55000),
        });
        if (res2.ok) {
          const data2 = await res2.json() as { data: { b64_json?: string; url?: string }[] };
          const item2 = data2.data?.[0];
          if (item2?.b64_json) {
            return NextResponse.json({ images: [{ dataUrl: `data:image/png;base64,${item2.b64_json}` }] });
          }
          if (item2?.url) {
            return NextResponse.json({ images: [{ dataUrl: item2.url }] });
          }
        }
      }
    } catch { /* fall through */ }
  }

  // ── 2. Gemini Imagen フォールバック ───────────────────────
  if (!GEMINI_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY または GEMINI_API_KEY が必要です" }, { status: 500 });
  }

  const geminiAttempts = [
    {
      model: "gemini-2.5-flash-image",
      endpoint: "generateContent",
      body: () => JSON.stringify({
        contents: [{ role: "user", parts: [{ text: enhanced }] }],
        generationConfig: { responseModalities: ["IMAGE", "TEXT"] },
      }),
      parse: (data: Record<string, unknown>) => {
        const parts = ((data.candidates as { content: { parts: unknown[] } }[])?.[0]?.content?.parts ?? []) as Array<{ inlineData?: { mimeType: string; data: string } }>;
        return parts.filter(p => p.inlineData?.data).map(p => `data:${p.inlineData!.mimeType};base64,${p.inlineData!.data}`);
      },
    },
    {
      model: "imagen-4.0-fast-generate-001",
      endpoint: "predict",
      body: () => JSON.stringify({
        instances: [{ prompt: enhanced }],
        parameters: { sampleCount: 3, aspectRatio, safetyFilterLevel: "block_few", personGeneration: "allow_adult" },
      }),
      parse: (data: Record<string, unknown>) => {
        const preds = (data.predictions ?? []) as Array<{ bytesBase64Encoded: string; mimeType: string }>;
        return preds.map(p => `data:${p.mimeType ?? "image/png"};base64,${p.bytesBase64Encoded}`);
      },
    },
  ];

  for (const attempt of geminiAttempts) {
    try {
      const res = await fetch(
        `${GEMINI_BASE}/${attempt.model}:${attempt.endpoint}?key=${GEMINI_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: attempt.body(), signal: AbortSignal.timeout(50000) }
      );
      if (!res.ok) continue;
      const data = await res.json() as Record<string, unknown>;
      const images = attempt.parse(data);
      if (images.length) return NextResponse.json({ images: images.map(dataUrl => ({ dataUrl })) });
    } catch { continue; }
  }

  return NextResponse.json({ error: "画像生成に失敗しました。プロンプトを変えてお試しください。" }, { status: 500 });
}
