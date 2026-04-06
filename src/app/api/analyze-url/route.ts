import { NextRequest, NextResponse } from "next/server";
import { GlobalStyle } from "@/types/site";

const API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

const FONT_URL_MAP: Record<string, string> = {
  "Noto Sans JP":        "Noto+Sans+JP:wght@400;500;700",
  "Noto Serif JP":       "Noto+Serif+JP:wght@400;700",
  "Inter":               "Inter:wght@400;500;600;700",
  "Montserrat":          "Montserrat:wght@400;600;700",
  "Poppins":             "Poppins:wght@400;500;600;700",
  "Playfair Display":    "Playfair+Display:wght@400;700",
  "Cormorant Garamond":  "Cormorant+Garamond:wght@400;600;700",
  "Zen Kaku Gothic New": "Zen+Kaku+Gothic+New:wght@400;700",
  "M PLUS Rounded 1c":   "M+PLUS+Rounded+1c:wght@400;700",
  "BIZ UDPGothic":       "BIZ+UDPGothic:wght@400;700",
  "Zen Old Mincho":      "Zen+Old+Mincho:wght@400;700",
  "Shippori Mincho":     "Shippori+Mincho:wght@400;600;700",
};

function buildGoogleFontsUrl(headingFont?: string, bodyFont?: string): string {
  const families: string[] = [];
  const hf = headingFont ? FONT_URL_MAP[headingFont] ?? `${headingFont.replace(/ /g, "+")}:wght@400;700` : null;
  const bf = bodyFont    ? FONT_URL_MAP[bodyFont]    ?? `${bodyFont.replace(/ /g, "+")}:wght@400;700` : null;
  if (bf) families.push(bf);
  if (hf && hf !== bf) families.push(hf);
  if (families.length === 0) {
    families.push(FONT_URL_MAP["Noto Sans JP"]);
    families.push(FONT_URL_MAP["Inter"]);
  }
  return `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join("&")}&display=swap`;
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 500 });
  }

  const { url } = (await req.json()) as { url: string };
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  // ─── 1. HTMLフェッチ ──────────────────────────────────────
  let html = "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    return NextResponse.json(
      { error: `URLの取得に失敗しました: ${e instanceof Error ? e.message : String(e)}` },
      { status: 400 }
    );
  }

  // ─── 2. デザイン情報を抽出 ───────────────────────────────
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headHtml  = headMatch?.[1] ?? "";

  // Google Fonts
  const gfMatch   = headHtml.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/i);
  const detectedGF = gfMatch?.[1] ?? "";

  // CSS（最大 20,000 字）
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
  // インラインスタイルも一部含める
  const inlineStyles = [...html.matchAll(/style="([^"]{10,200})"/gi)].map(m => m[1]).slice(0, 100).join(" ");
  const cssText = (styleBlocks.join("\n") + "\n" + inlineStyles).slice(0, 20000);

  // ページ本文（色・構造把握用）
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodySnip  = bodyMatch?.[1]
    ?.replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .slice(0, 4000) ?? "";

  // ─── 3. Claude でデザインDNA解析 ─────────────────────────
  const prompt = `あなたはウェブデザイン解析の専門家です。
以下のウェブサイトのHTML/CSSを詳細に分析し、デザインDNAを完全に抽出してください。

【参考URL】${url}

【Google Fontsリンク（自動検出）】
${detectedGF || "なし（CSSから推定してください）"}

【CSSコンテンツ（インラインスタイル含む）】
${cssText || "取得できませんでした"}

【ページテキスト（構造・配色把握用）】
${bodySnip || "取得できませんでした"}

━━━━━━━━━━━━━━━━━━━━━━━━━━
以下のJSON形式でデザインDNAを返してください。\`\`\`json ... \`\`\` に包んで出力。
不明な値はnullにせず、CSSとテキストから積極的に推定してください。

{
  "headingFont":          "フォント名（例: Noto Serif JP）",
  "bodyFont":             "フォント名（例: Noto Sans JP）",

  "primaryColor":         "#hex — ブランドカラー（ナビ・ボタン・アクセントで最もよく使われる色）",
  "accentColor":          "#hex — CTAボタン・強調要素の色（primaryと異なる場合）",
  "heroBgColor":          "#hex — ファーストビューの背景色",
  "bgColor":              "#hex — ページ全体のメイン背景色",
  "cardBgColor":          "#hex — カードや白い囲み要素の背景色",
  "textColor":            "#hex — メインの本文テキストカラー",
  "buttonBgColor":        "#hex — 主要CTAボタンの背景色",
  "buttonTextColor":      "#hex — CTAボタンのテキスト色",
  "buttonRadius":         "px値 — ボタンの角丸（例: 8px, 24px, 999px）",

  "h1Size":               "px値（例: 56px）",
  "h2Size":               "px値（例: 38px）",
  "h3Size":               "px値（例: 24px）",
  "bodySize":             "px値（例: 16px）",
  "headingLineHeight":    1.2,
  "bodyLineHeight":       1.8,
  "headingLetterSpacing": "em値（例: -0.03em）",
  "headingWeight":        700,
  "sectionPaddingY":      "px値 — セクションの上下余白（例: 100px）",
  "cardBorderRadius":     "px値 — カードの角丸（例: 12px）",
  "containerMaxWidth":    "px値（例: 1200px）",

  "designStyle":          "minimal/bold/corporate/elegant/playful/modern のいずれか",
  "designNotes":          "このサイトのデザインの特徴を30字以内で"
}

【重要な指示】
- CSSの color, background-color, background プロパティから色を抽出する
- :root変数や --color-xxx 変数も必ず確認する
- ヘキサ値(#xxx)、rgb()値はすべて#hex形式に変換する
- 日本語サイトの場合は headingFont "Noto Serif JP"か"Noto Sans JP"を優先
- primaryColorが不明な場合はナビゲーションの色を使う
- heroBgColorが不明な場合はprimaryColorを使う`;

  // リトライ付きフェッチ（overloaded_error 対策）
  let aiData: { content?: Array<{ text: string }> } = {};
  for (let attempt = 0; attempt < 4; attempt++) {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1536,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const text = await upstream.text();
    if (upstream.ok) { aiData = JSON.parse(text); break; }
    if (text.includes("overloaded_error") && attempt < 3) {
      await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
      continue;
    }
    return NextResponse.json({ error: `API エラー: ${text}` }, { status: upstream.status });
  }
  const raw    = aiData.content?.[0]?.text ?? "";
  const match  = raw.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = match ? match[1] : raw;

  let parsed: Partial<GlobalStyle> = {};
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ error: "AI解析結果のパースに失敗", raw }, { status: 500 });
  }

  // ─── 4. Google Fonts URL を確定 ───────────────────────────
  const googleFontsUrl = detectedGF || buildGoogleFontsUrl(
    parsed.headingFont ?? undefined,
    parsed.bodyFont ?? undefined
  );

  const style: GlobalStyle = { ...parsed, googleFontsUrl, referenceUrl: url };

  return NextResponse.json({ style });
}
