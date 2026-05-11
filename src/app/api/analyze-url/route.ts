import { NextRequest, NextResponse } from "next/server";
import { GlobalStyle } from "@/types/site";

export const runtime = "edge";
export const maxDuration = 30;

const API_KEY       = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE   = "https://generativelanguage.googleapis.com/v1beta/models";
// 軽量モデルを先にして速度優先
const GEMINI_MODELS = ["gemini-2.0-flash-lite", "gemini-2.5-flash-lite", "gemini-2.5-flash"];

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
    return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });
  }

  const { url } = (await req.json()) as { url: string };
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  // ─── 1. HTMLフェッチ（5秒で打ち切り）──────────────────────
  let html = "";
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (e) {
    return NextResponse.json(
      { error: `URLの取得に失敗しました: ${e instanceof Error ? e.message : String(e)}` },
      { status: 400 }
    );
  }

  // ─── 2. デザイン情報を抽出 ─────────────────────────────────
  const headHtml = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? "";
  const bodyHtml = html.match(/<body[^>]*>([\s\S]*)/i)?.[1] ?? html;

  // Google Fonts
  const detectedGF = headHtml.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/i)?.[1] ?? "";

  // メタ説明
  const metaDesc =
    headHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{10,200})["']/i)?.[1] ??
    headHtml.match(/<meta[^>]+content=["']([^"']{10,200})["'][^>]+name=["']description["']/i)?.[1] ??
    "";

  // CSS — :root変数 + インラインスタイルの色指定のみ
  const cssAll   = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join("\n");
  const rootVars = cssAll.match(/:root\s*\{[^}]+\}/g)?.join("\n") ?? "";
  const colorInlines = [...html.matchAll(/style="([^"]{10,300})"/gi)]
    .map(m => m[1])
    .filter(s => /color|background|bg/i.test(s))
    .slice(0, 20).join(" ");
  const cssText  = (rootVars + "\n" + colorInlines).slice(0, 2500);

  // ナビゲーション（<nav> or <header> の <a> テキスト）
  const navBlock  = bodyHtml.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i)?.[1]
    ?? bodyHtml.match(/<header[^>]*>([\s\S]*?)<\/header>/i)?.[1] ?? "";
  const navLinks  = [...navBlock.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
    .filter(t => t.length > 0 && t.length < 25)
    .slice(0, 8);

  // セクション構造（id/class から推測）
  const sectionIds = [...bodyHtml.matchAll(/<(?:section|div|article)[^>]+(?:id|class)="([^"]+)"/gi)]
    .map(m => m[1].split(/\s+/)[0])
    .filter(id => !id.match(/^(wrapper|container|main|app|root|js-|is-|l-|p-|u-)/i))
    .slice(0, 12);

  // 見出し（H1〜H3）
  const headings = [...html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map(m => `H${m[1]}: ${m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()}`)
    .filter(t => t.length > 4 && t.length < 80)
    .slice(0, 12);

  // ─── 3. Gemini でデザイン解析 ────────────────────────────
  const prompt = `ウェブサイトのHTML・CSSを分析し、デザインDNAをJSON形式で返してください。

【メタ説明】${metaDesc || "なし"}
【Google Fonts】${detectedGF || "なし"}
【CSS（:root変数・色指定）】
${cssText || "なし"}
【ナビゲーション】${navLinks.length > 0 ? navLinks.join(" / ") : "なし"}
【セクション構造（id/class）】${sectionIds.length > 0 ? sectionIds.join(", ") : "なし"}
【見出し一覧】
${headings.length ? headings.join("\n") : "なし"}

以下のJSON形式のみで返答（\`\`\`json ... \`\`\` に包む）:
{
  "headingFont": "フォント名（不明ならNoto Sans JP）",
  "bodyFont": "フォント名（不明ならNoto Sans JP）",
  "primaryColor": "#hex（メインカラー）",
  "accentColor": "#hex（アクセントカラー）",
  "heroBgColor": "#hex（ヒーロー背景色）",
  "bgColor": "#hex（ページ背景色）",
  "cardBgColor": "#hex（カード背景色）",
  "buttonBgColor": "#hex（ボタン背景色）",
  "buttonTextColor": "#hex（ボタン文字色）",
  "textColor": "#hex（本文テキスト色）",
  "designStyle": "minimal/bold/corporate/elegant/playful/modern のいずれか",
  "designNotes": "サイトの特徴を20字以内で",
  "heroLayout": "split/centered/typographic/light のいずれか",
  "featureColumns": 3,
  "sectionOrder": ["hero","problem","features","steps","testimonials","faq","cta"],
  "detectedNavLinks": ["サービス","料金","お問い合わせ"]
}

ルール:
- rgb()はhex変換。不明な値はデフォルト推定値を入れる（nullにしない）
- detectedNavLinksは必ず上記【ナビゲーション】の実際のテキストを使用
- sectionOrderは上記【セクション構造】と【見出し】から実際のページ構成を推測
- heroLayoutはファーストビューの構成から判断（画像左+テキスト右→split、中央配置→centered、大きなタイポ→typographic、明るい白背景→light）`;

  // Gemini 呼び出し（モデルフォールバック・遅延なし・8秒タイムアウト）
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
            generationConfig: { maxOutputTokens: 1200 },
          }),
          signal: AbortSignal.timeout(8000),
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
        // 遅延なしで即リトライ
        continue;
      }
      break; // 次のモデルへ
    }
  }

  if (!raw) {
    return NextResponse.json({ error: `Gemini APIエラー: ${lastError}` }, { status: 503 });
  }

  const match   = raw.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = match ? match[1] : raw;

  let parsed: Partial<GlobalStyle> = {};
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return NextResponse.json({ error: "AI解析結果のパースに失敗", raw }, { status: 500 });
  }

  // ─── 4. Google Fonts URL を確定 ─────────────────────────────
  const googleFontsUrl = detectedGF || buildGoogleFontsUrl(
    parsed.headingFont ?? undefined,
    parsed.bodyFont ?? undefined
  );

  const style: GlobalStyle = { ...parsed, googleFontsUrl, referenceUrl: url };

  return NextResponse.json({ style });
}
