import { NextRequest, NextResponse } from "next/server";
import { GlobalStyle } from "@/types/site";

export const runtime = "edge";
export const maxDuration = 30; // Vercel Pro: 最大60秒

const API_KEY       = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE   = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];

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
      signal: AbortSignal.timeout(7000),
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
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyHtml  = bodyMatch?.[1] ?? "";

  // Google Fonts
  const gfMatch    = headHtml.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/i);
  const detectedGF = gfMatch?.[1] ?? "";

  // CSS — styleブロック + :root変数を優先的に抽出
  const styleBlocks  = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]);
  const cssAll       = styleBlocks.join("\n");
  const rootVars     = cssAll.match(/:root\s*\{[^}]+\}/g)?.join("\n") ?? "";
  const inlineStyles = [...html.matchAll(/style="([^"]{10,300})"/gi)].map(m => m[1]).slice(0, 60).join(" ");
  const cssText      = (rootVars + "\n" + cssAll + "\n" + inlineStyles).slice(0, 10000);

  // ナビゲーションリンクを抽出（サイト構成把握）
  const navHtml   = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i)?.[1]
                 ?? html.match(/<header[^>]*>([\s\S]*?)<\/header>/i)?.[1] ?? "";
  const navLinks  = [...navHtml.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, "").trim())
    .filter(t => t.length > 0 && t.length < 30)
    .slice(0, 10);

  // 見出しを抽出（コンテンツ構造把握）
  const headings = [...html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map(m => `H${m[1]}: ${m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()}`)
    .filter(t => t.length < 80)
    .slice(0, 20);

  // 構造を保ったHTML（スクリプト・SVGを除去、タグは残す）
  const structHtml = bodyHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\s+/g, " ")
    .slice(0, 6000);

  // ─── 3. Gemini でデザインDNA解析 ──────────────────────────
  const prompt = `あなたはウェブデザイン解析の専門家です。
以下のウェブサイトのHTML/CSSを詳細に分析し、デザインDNAと構造を完全に抽出してください。

【参考URL】${url}

【Google Fontsリンク（自動検出）】
${detectedGF || "なし"}

【CSS（:root変数＋スタイル）】
${cssText || "取得できませんでした"}

【ナビゲーションリンク】
${navLinks.length ? navLinks.join(" / ") : "検出できませんでした"}

【見出し一覧（H1〜H3）】
${headings.length ? headings.join("\n") : "検出できませんでした"}

【ページ構造HTML（簡略）】
${structHtml || "取得できませんでした"}

━━━━━━━━━━━━━━━━━━━━━━━━━━
以下のJSON形式でデザインDNAを返してください。\`\`\`json ... \`\`\` に包んで出力。
不明な値はnullにせず、HTMLとCSSから積極的に推定してください。

{
  "headingFont":     "フォント名（例: Noto Serif JP）",
  "bodyFont":        "フォント名（例: Noto Sans JP）",

  "primaryColor":    "#hex — ナビ・ボタン・アクセントで最もよく使われるブランドカラー",
  "accentColor":     "#hex — CTAボタン・強調要素の色（primaryと異なる場合）",
  "heroBgColor":     "#hex — ファーストビューの背景色",
  "bgColor":         "#hex — ページ全体のメイン背景色",
  "cardBgColor":     "#hex — カードや囲み要素の背景色",
  "textColor":       "#hex — メイン本文テキストカラー",
  "buttonBgColor":   "#hex — 主要CTAボタンの背景色",
  "buttonTextColor": "#hex — CTAボタンのテキスト色",
  "buttonRadius":    "px値（例: 8px, 24px, 999px）",

  "h1Size":               "px値（例: 56px）",
  "h2Size":               "px値（例: 38px）",
  "h3Size":               "px値（例: 24px）",
  "bodySize":             "px値（例: 16px）",
  "headingLineHeight":    1.2,
  "bodyLineHeight":       1.8,
  "headingLetterSpacing": "em値（例: -0.03em）",
  "headingWeight":        700,
  "sectionPaddingY":      "px値（例: 100px）",
  "cardBorderRadius":     "px値（例: 12px）",
  "containerMaxWidth":    "px値（例: 1200px）",

  "designStyle":  "minimal/bold/corporate/elegant/playful/modern のいずれか",
  "designNotes":  "このサイトのデザインの特徴を30字以内で",

  "heroLayout":       "split（左テキスト右画像）/ centered（中央配置）/ typographic（大文字タイポ）/ light（白背景クリーン）のいずれか",
  "featureColumns":   3,
  "sectionOrder":     ["hero","about","features","steps","testimonials","pricing","faq","cta"],
  "detectedNavLinks": ["サービス","実績","料金","お問い合わせ"]
}

【重要な指示】
- CSSの :root変数（--color-xxx, --primary等）を最優先で色抽出する
- rgb()/rgba()値はすべて#hex形式に変換する
- 日本語サイトは headingFont に "Noto Serif JP" か "Noto Sans JP" を優先
- sectionOrder は実際にページ上で見つかったセクションを上から順に並べる
- heroLayout: ファーストビューで画像が右側なら"split"、テキストが画面中央なら"centered"、大きなタイポグラフィなら"typographic"、白背景でシンプルなら"light"
- featureColumns: 特徴カードが何列で並んでいるかを推定（2〜4）`;

  // Gemini でデザイン解析（モデルフォールバック付き）
  let raw = "";
  let lastError = "";
  outer: for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const upstream = await fetch(
        `${GEMINI_BASE}/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 1536 },
          }),
          signal: AbortSignal.timeout(12000),
        }
      );
      if (upstream.ok) {
        const data = await upstream.json();
        raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        break outer;
      }
      const errText = await upstream.text();
      lastError = errText;
      const is503 = upstream.status === 503 || errText.includes("UNAVAILABLE");
      const is429 = upstream.status === 429 || errText.includes("RESOURCE_EXHAUSTED");
      if ((is503 || is429) && attempt === 0) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      break; // 次のモデルへ
    }
  }
  if (!raw) {
    return NextResponse.json({ error: `Gemini APIエラー: ${lastError}` }, { status: 503 });
  }
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
