import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const maxDuration = 60;

const API_KEY     = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL       = "gemini-2.5-flash";

// ── CSSとJSを抜き出して「テキストだけのHTML」を作る ─────────────
function stripStyleScript(html: string): {
  stripped: string;
  styles: string[];
  scripts: string[];
} {
  const styles: string[] = [];
  const scripts: string[] = [];

  // <style>〜</style> を抜き出してプレースホルダに置換
  let stripped = html.replace(/<style[\s\S]*?<\/style>/gi, (m) => {
    styles.push(m);
    return `<!--STYLE_PLACEHOLDER_${styles.length - 1}-->`;
  });

  // <script>〜</script> を抜き出してプレースホルダに置換
  stripped = stripped.replace(/<script[\s\S]*?<\/script>/gi, (m) => {
    scripts.push(m);
    return `<!--SCRIPT_PLACEHOLDER_${scripts.length - 1}-->`;
  });

  return { stripped, styles, scripts };
}

// ── プレースホルダを元のstyle/scriptに戻す ──────────────────────
function restoreStyleScript(
  html: string,
  styles: string[],
  scripts: string[]
): string {
  let restored = html.replace(/<!--STYLE_PLACEHOLDER_(\d+)-->/g, (_, i) => styles[Number(i)] ?? "");
  restored = restored.replace(/<!--SCRIPT_PLACEHOLDER_(\d+)-->/g, (_, i) => scripts[Number(i)] ?? "");
  return restored;
}

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY未設定" }, { status: 500 });

  const body = (await req.json()) as {
    demoId: string;
    bizName: string;
    bizDesc: string;
  };

  const { demoId, bizName, bizDesc } = body;
  if (!demoId || !bizName || !bizDesc) {
    return NextResponse.json({ error: "demoId / bizName / bizDesc は必須です" }, { status: 400 });
  }

  // ── デモHTMLを読み込む ────────────────────────────────────
  let demoHtml: string;
  try {
    const filePath = join(process.cwd(), "public", "demos", `${demoId}.html`);
    demoHtml = await readFile(filePath, "utf-8");
  } catch {
    return NextResponse.json({ error: `デモファイルが見つかりません: ${demoId}` }, { status: 404 });
  }

  // ── CSS/JSを退避してテキストだけのHTMLを作る ──────────────
  const { stripped, styles, scripts } = stripStyleScript(demoHtml);

  // ── AIへの指示 ────────────────────────────────────────────
  const systemPrompt = `あなたはWebサイトのコンテンツ差し替えの専門家です。
受け取ったHTMLのテキストコンテンツだけを書き換えます。

【絶対に守るルール】
- HTML構造（タグ・クラス・ID・属性）を一切変えない
- <!--STYLE_PLACEHOLDER_N--> コメントを絶対に削除・変更しない（そのまま出力）
- <!--SCRIPT_PLACEHOLDER_N--> コメントを絶対に削除・変更しない（そのまま出力）
- 画像URL（src属性）を変えない
- Google Fontsの<link>タグを変えない
- href属性の値は変えない

【差し替えるもの（テキストノードのみ）】
- サービス名・塾名 → 提供された事業名に変更
- キャッチコピー・見出し・説明文 → 事業の内容に合わせて自然な日本語で書き換え
- 統計数字・実績数字 → 事業情報から自然な値を設定
- お客様の声・証言 → 事業に合った内容に書き換え
- FAQ → 事業に関連した内容に書き換え
- フッターの事業名・住所・連絡先 → 事業名に合わせてサンプル値で埋める

【出力形式】
- 完全なHTMLを出力（DOCTYPE〜/htmlまで）
- \`\`\`html〜\`\`\` のコードブロック形式
- プレースホルダコメントはそのまま残すこと`;

  const userPrompt = `事業名: ${bizName}
事業・サービスの説明: ${bizDesc}

【差し替え対象のHTML（CSSとJSはプレースホルダで省略済み）】
${stripped}`;

  // ── Gemini API 呼び出し（503時は最大3回リトライ）────────────
  let raw = "";
  const MAX_RETRY = 3;
  let lastErr = "";
  for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
    try {
      const res = await fetch(
        `${GEMINI_BASE}/${MODEL}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.4,
              thinkingConfig: { thinkingBudget: 0 },
            },
          }),
          signal: AbortSignal.timeout(50000),
        }
      );
      if (res.status === 503 || res.status === 429) {
        lastErr = `Gemini APIエラー (attempt ${attempt}): ${res.status}`;
        if (attempt < MAX_RETRY) {
          await new Promise(r => setTimeout(r, attempt * 3000)); // 3s, 6s
          continue;
        }
        const errText = await res.text();
        return NextResponse.json({ error: `Gemini APIが混雑しています。しばらく待ってから再試行してください。` }, { status: 503 });
      }
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: `Gemini APIエラー: ${err.slice(0, 200)}` }, { status: 503 });
      }
      const data = await res.json();
      raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      break; // 成功
    } catch (e) {
      lastErr = e instanceof Error ? e.message : "生成失敗";
      if (attempt < MAX_RETRY) {
        await new Promise(r => setTimeout(r, attempt * 3000));
        continue;
      }
      return NextResponse.json({ error: lastErr }, { status: 500 });
    }
  }

  // ── HTMLを抽出 ────────────────────────────────────────────
  const m = raw.match(/```html\s*([\s\S]*?)\s*```/);
  const injectedStripped = m ? m[1] : raw;

  if (!injectedStripped.includes("<html") && !injectedStripped.includes("<!DOCTYPE")) {
    return NextResponse.json({ error: "HTML生成に失敗しました。もう一度お試しください。" }, { status: 500 });
  }

  // ── 元のCSS/JSを戻して完成 ───────────────────────────────
  const html = restoreStyleScript(injectedStripped, styles, scripts);

  return NextResponse.json({ html });
}
