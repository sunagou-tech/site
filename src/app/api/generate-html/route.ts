import { NextRequest, NextResponse } from "next/server";
import { GlobalStyle } from "@/types/site";

export const runtime = "edge";
export const maxDuration = 30;

const API_KEY   = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL     = "gemini-2.5-flash";

// ── System prompt (プロデザイナー基準) ───────────────────────
const SYSTEM = `あなたはプロのWebデザイナー兼フロントエンドエンジニアです。
ユーザーが入力した事業情報をもとに、一流のランディングページ HTML を1ファイルで生成してください。

【絶対に守るデザインルール】

■ タイポグラフィ
- 日本語フォントは必ず Google Fonts から読み込む
  - 見出し: Noto Serif JP（weight: 700 or 900）
  - 本文: Noto Sans JP（weight: 400, 500）
- 英数字の見出しには Playfair Display を使う
- フォントサイズは大きく使う。ヒーロー見出しは最低 clamp(2.5rem, 6vw, 5rem)
- 行間は 1.7〜1.9。見出しの文字詰めは letter-spacing: -0.02em

■ カラー
- 白背景＋青ボタンのデフォルト配色は絶対禁止
- 必ず以下のいずれかのカラーコンセプトを選ぶ（業種に合わせて選択）:
  A) ダーク高級感: #0D0D0D 背景 + ゴールドアクセント #C9A84C
  B) ナチュラル: #F7F4EE 背景 + ダークグリーン #2D4A3E
  C) モノクロームエディトリアル: #FAFAFA 背景 + #111111 テキスト + 赤アクセント #E63946
  D) ディープネイビー: #0A1628 背景 + #4FC3F7 アクセント
- ボタンは背景色と対照的な色にする。角丸は 0px か 100px（8px は禁止）

■ レイアウト
- 3カラムカードの繰り返しパターンは禁止
- セクションごとにレイアウトを変える（左右交互、全幅テキスト、オフセットグリッド等）
- ヒーローセクションは最低 100vh、テキストは縦中央ではなく意図的にオフセットさせる
- 余白を大胆に使う。padding は最低 80px〜120px
- display: grid + grid-template-columns で非対称なレイアウトを作る
  例: grid-template-columns: 1fr 2fr / 3fr 1fr 1fr

■ アニメーション
- スクロール時にフェードイン: @keyframes fadeUp + IntersectionObserver
- ヒーロータイトルは行単位でスライドイン
- ホバー時のボタンに transform: translateY(-2px) + transition: all 0.3s ease
- 過剰なアニメーションは禁止（1要素に1つまで）

【必須セクション構成（各セクションのデザインは必ず異なるレイアウト）】
1. Hero      - 事業の核心を1行で表現。大きなタイポグラフィ中心
2. Problem   - ターゲットの悩みを共感的に提示（2〜3つ）
3. Solution  - サービスがどう解決するか。左右分割レイアウト
4. Features  - 特徴・強み（カードではなくリスト or タイムライン形式）
5. Social Proof - 実績数字 or 顧客の声（大きな数字を使う）
6. Process   - 利用の流れ（ステップ）
7. FAQ       - よくある質問（アコーディオン）
8. CTA       - 最終行動喚起。フルスクリーン背景

【ヒーローセクション実装パターン（1つ選ぶ）】
パターンA: タイポグラフィ主役
  - 背景: ダーク or ディープカラー
  - 巨大な見出し（画面幅いっぱい）
  - CTAボタンは左下
  - 装飾: 細いラインや幾何学図形
パターンB: 左右分割
  - 左50%: テキスト（見出し + 説明 + CTA）
  - 右50%: 大きなビジュアル or 数字の強調表示
  - 背景: 左はホワイト、右はカラー
パターンC: センタリング + 背景装飾
  - 背景: グラデーションメッシュ（CSS only）
  - 中央: 見出し + サブテキスト + CTA

【禁止事項】
❌ font-family: Arial / system-ui
❌ 青背景 + 白テキストのヒーロー（#1976D2, #2196F3系）
❌ 全セクション白背景
❌ border-radius: 8px のカード大量配置
❌ Font Awesomeアイコンを3カラムに並べるだけのFeaturesセクション
❌ opacity: 0.5 の薄いグレーテキスト大量使用
❌ Bootstrap / Tailwind CDN の使用（オリジナルCSSを書くこと）

【出力形式】
- 単一のHTMLファイルとして出力
- <style>タグ内にすべてのCSSを記述
- <script>タグ内にすべてのJSを記述
- Google Fontsは<link>タグで読み込む
- コードブロック(\`\`\`html)で囲んで出力
- コメントは最小限（セクション名のみ）

【出力前の自己チェック】
✅ ヒーローが「青背景+白テキスト」になっていないか
✅ 全セクションが「見出し+3カラムカード」の繰り返しになっていないか
✅ Noto Serif JPが見出しに使われているか
✅ ファーストビューを見たとき「プロが作った」と感じるか
✅ セクションごとに背景色 or レイアウトが変わっているか`;

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY未設定" }, { status: 500 });

  const body = (await req.json()) as {
    businessName: string;
    serviceDesc: string;
    target?: string;
    strengths?: string;
    globalStyle?: GlobalStyle;
  };

  const { businessName, serviceDesc, target, strengths, globalStyle } = body;
  if (!businessName || !serviceDesc) {
    return NextResponse.json({ error: "businessName と serviceDesc は必須です" }, { status: 400 });
  }

  // ── ユーザー入力の構築 ────────────────────────────────────
  const colorHint = globalStyle
    ? `\n参考サイトの色情報（参考程度に）: primary=${globalStyle.primaryColor ?? ""}, accent=${globalStyle.accentColor ?? ""}, designStyle=${globalStyle.designStyle ?? ""}, designNotes=${globalStyle.designNotes ?? ""}`
    : "";

  const userInput = `以下の情報をもとに、ランディングページHTMLを生成してください。

事業・サービス名: ${businessName}
サービス・商品の説明: ${serviceDesc}
${target    ? `ターゲット: ${target}`       : ""}
${strengths ? `強み・特徴: ${strengths}` : ""}${colorHint}

上記ルールに従い、日本市場向けの一流LPをHTMLで出力してください。`;

  // ── Gemini API 呼び出し ───────────────────────────────────
  let raw = "";
  try {
    const res = await fetch(
      `${GEMINI_BASE}/${MODEL}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: userInput }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.8 },
        }),
        signal: AbortSignal.timeout(26000),
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
    return NextResponse.json({ error: "HTML生成に失敗しました。もう一度お試しください。", raw: raw.slice(0, 300) }, { status: 500 });
  }

  return NextResponse.json({ html });
}
