import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 30;

const API_KEY     = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];

type FormData = {
  businessName: string;
  serviceDesc:  string;
  target?:      string;
  strengths?:   string;
};

// ─── テキスト要素を抽出 ─────────────────────────────────────
type TextEntry = { tag: string; full: string; inner: string };

function extractTextEntries(html: string): TextEntry[] {
  const entries: TextEntry[] = [];

  // 優先度1: 見出し h1〜h5
  const headingPatterns: { tag: string; re: RegExp }[] = [
    { tag: "h1", re: /<h1([^>]*)>([\s\S]*?)<\/h1>/gi },
    { tag: "h2", re: /<h2([^>]*)>([\s\S]*?)<\/h2>/gi },
    { tag: "h3", re: /<h3([^>]*)>([\s\S]*?)<\/h3>/gi },
    { tag: "h4", re: /<h4([^>]*)>([\s\S]*?)<\/h4>/gi },
    { tag: "h5", re: /<h5([^>]*)>([\s\S]*?)<\/h5>/gi },
  ];
  for (const { tag, re } of headingPatterns) {
    for (const m of html.matchAll(re)) {
      const inner = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (inner.length >= 1 && inner.length <= 200) {
        entries.push({ tag, full: m[0], inner });
      }
    }
  }

  // 優先度2: 見出しが少ない場合は p タグも補完（短めのもの）
  if (entries.length < 5) {
    for (const m of html.matchAll(/<p([^>]*)>([\s\S]*?)<\/p>/gi)) {
      const inner = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (inner.length >= 10 && inner.length <= 150) {
        entries.push({ tag: "p", full: m[0], inner });
        if (entries.length >= 30) break;
      }
    }
  }

  return entries.slice(0, 30);
}

// ─── Gemini 呼び出し ─────────────────────────────────────────
async function geminiFetch(prompt: string): Promise<string> {
  for (const model of GEMINI_MODELS) {
    for (let i = 0; i < 2; i++) {
      const res = await fetch(
        `${GEMINI_BASE}/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048 },
          }),
          signal: AbortSignal.timeout(12000),
        }
      );
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }
      const err = await res.text();
      const retry = res.status === 503 || res.status === 429 ||
                    err.includes("UNAVAILABLE") || err.includes("RESOURCE_EXHAUSTED");
      if (retry && i === 0) { await new Promise(r => setTimeout(r, 1500)); continue; }
      break;
    }
  }
  throw new Error("AIサービスが一時的に利用できません。少し待ってから再試行してください。");
}

// ─── Route handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY未設定" }, { status: 500 });

  const { url, formData } = (await req.json()) as { url: string; formData: FormData };
  if (!url || !formData?.businessName) {
    return NextResponse.json({ error: "url と businessName は必須です" }, { status: 400 });
  }

  // ── 1. 参考サイトのHTML取得 ───────────────────────────────
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

  // ── 2. <base href> 注入（相対URLを全て解決）─────────────────
  const pageUrl = url.endsWith("/") ? url : url + "/";
  if (!html.includes("<base")) {
    html = html.replace(/(<head[^>]*>)/i, `$1\n<base href="${pageUrl}">`);
  }

  // ── 3. scriptタグ除去（セキュリティ）────────────────────────
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

  // ── 4. テキスト要素を抽出 ────────────────────────────────────
  const entries = extractTextEntries(html);

  // 抽出0件の場合: AIテキスト書き換えをスキップしてHTMLをそのまま返す
  if (entries.length === 0) {
    const credit = `<div style="position:fixed;bottom:12px;right:12px;z-index:99999;background:#1A365D;color:#fff;font-size:11px;padding:6px 12px;border-radius:20px;font-family:sans-serif;opacity:0.85">Made with ツクリエ</div>`;
    const fallback = html.replace("</body>", `${credit}</body>`);
    return NextResponse.json({ html: fallback });
  }

  // ── 5. AI でテキストを生成 ────────────────────────────────────
  const prompt = `あなたはプロのウェブコピーライターです。
以下のウェブサイトのテキスト要素を、指定されたビジネス情報に合わせて書き換えてください。

【ビジネス情報】
事業・サービス名: ${formData.businessName}
サービス内容: ${formData.serviceDesc}
${formData.target    ? `ターゲット: ${formData.target}`    : ""}
${formData.strengths ? `強み・特徴: ${formData.strengths}` : ""}

【現在のテキスト一覧（番号順に対応した書き換えが必要）】
${entries.map((e, i) => `[${i}] ${e.tag.toUpperCase()}: ${e.inner}`).join("\n")}

【ルール】
- 各テキストを${formData.businessName}のビジネスに合わせて自然な日本語で書き換える
- 元のテキストと同程度の長さを維持する（短いものは短く、長いものは長く）
- H1は最もインパクトのあるキャッチコピーにする
- H2はセクションの見出しとして適切な内容にする
- H3はH2の補足・詳細として書く
- プレースホルダー（〇〇、例：等）は絶対に使わない
- 絵文字は使わない

必ず以下のJSON形式のみで返してください（説明文は不要）:
{"replacements":["テキスト0","テキスト1","テキスト2"]}`;

  let raw = "";
  try {
    raw = await geminiFetch(prompt);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "AI生成失敗" }, { status: 500 });
  }

  // ── 6. JSON パース ────────────────────────────────────────────
  const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) ?? raw.match(/\{[\s\S]*\}/);
  const jsonStr   = jsonMatch ? (jsonMatch[1] ?? jsonMatch[0]) : raw;
  let replacements: string[] = [];
  try {
    replacements = JSON.parse(jsonStr).replacements ?? [];
  } catch {
    return NextResponse.json({ error: "AI応答のパースに失敗しました", raw }, { status: 500 });
  }

  // ── 7. テキストを差し替え ─────────────────────────────────────
  let modified = html;
  for (let i = 0; i < Math.min(entries.length, replacements.length); i++) {
    const { tag, full } = entries[i];
    const newText = replacements[i];
    if (!newText) continue;
    const attrMatch = full.match(new RegExp(`<${tag}([^>]*)>`));
    const attrs     = attrMatch?.[1] ?? "";
    modified = modified.replace(full, `<${tag}${attrs}>${newText}</${tag}>`);
  }

  // ── 8. ツクリエ表示用クレジット注入 ─────────────────────────
  const credit = `<div style="position:fixed;bottom:12px;right:12px;z-index:99999;background:#1A365D;color:#fff;font-size:11px;padding:6px 12px;border-radius:20px;font-family:sans-serif;opacity:0.85">Made with ツクリエ</div>`;
  modified = modified.replace("</body>", `${credit}</body>`);

  return NextResponse.json({ html: modified });
}
