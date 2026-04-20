import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export const maxDuration = 60;

const API_KEY    = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL      = "gemini-2.5-flash";

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

  // ── AIへの指示 ────────────────────────────────────────────
  const systemPrompt = `あなたはWebサイトのコンテンツ差し替えの専門家です。
HTMLファイルを受け取り、デザイン・構造・CSSはそのままに、テキストコンテンツだけをクライアントの事業情報に書き換えます。

【絶対に守るルール】
- HTML構造（タグ・クラス・ID・属性）を一切変えない
- CSS（<style>タグの中身）を一切変えない
- JavaScript（<script>タグの中身）を一切変えない
- 画像URL（src属性）を変えない
- Google Fontsの<link>タグを変えない
- アニメーション・レイアウト・色・フォントを変えない

【差し替えるもの】
- 塾名・サービス名 → 提供された事業名に変更
- キャッチコピー・見出し・説明文 → 事業の内容に合わせて書き換え
- 統計数字（合格率・人数・年数など）→ 事業情報から自然な数字を生成（なければ適切な値を設定）
- 口コミ・お客様の声 → 事業に合った内容に書き換え（名前はサンプルのまま可）
- FAQ → 事業に関連した内容に書き換え
- フッターの住所・電話番号・会社名 → 事業名に合わせてサンプル値で埋める
- ナビゲーションリンクのテキスト → 事業に合わせて調整

【出力形式】
- 完全なHTMLファイルを出力（DOCTYPE〜/htmlまで）
- \`\`\`html で始まり \`\`\` で終わるコードブロック形式
- HTMLコメントは追加しない`;

  const userPrompt = `以下のデモHTMLのテキストコンテンツを、この事業情報で書き換えてください。

事業名: ${bizName}
事業・サービスの説明: ${bizDesc}

【デモHTML】
${demoHtml}`;

  // ── Gemini API 呼び出し ───────────────────────────────────
  let raw = "";
  try {
    const res = await fetch(
      `${GEMINI_BASE}/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 16384, temperature: 0.4 },
        }),
        signal: AbortSignal.timeout(55000),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `Gemini APIエラー: ${err.slice(0, 200)}` }, { status: 503 });
    }
    const data = await res.json();
    raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "生成失敗" }, { status: 500 });
  }

  // ── HTMLを抽出 ────────────────────────────────────────────
  const m = raw.match(/```html\s*([\s\S]*?)\s*```/);
  const html = m ? m[1] : raw;

  if (!html.includes("<html") && !html.includes("<!DOCTYPE")) {
    return NextResponse.json({ error: "HTML生成に失敗しました。もう一度お試しください。" }, { status: 500 });
  }

  return NextResponse.json({ html });
}
