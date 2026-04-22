import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const API_KEY     = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const MODEL       = "gemini-2.5-flash";

function uid() { return Math.random().toString(36).slice(2, 9); }

const PROMPT = `
あなたはWebサイトのHTMLを解析し、構造化されたブロックJSONに変換するエキスパートです。

以下のHTMLを読み取り、ページのセクションを特定して、利用可能なブロック形式のJSON配列に変換してください。

【利用可能なブロック型と必須フィールド】

1. "hero" - メインヒーロー（幾何学シェイプ）
   { type:"hero", tagline:"見出し\\n改行可", taglineSub:"サブキャッチ", buttonText:"ボタン", buttonUrl:"/contact" }

2. "hero-centered" - 中央揃えヒーロー＋背景画像
   { type:"hero-centered", eyebrow:"上小見出し", tagline:"見出し", body:"説明文", buttonText:"ボタン1", buttonUrl:"/contact", buttonText2:"ボタン2", buttonUrl2:"", imageUrl:"" }

3. "about" - 会社・サービス紹介
   { type:"about", heading:"見出し", body:"本文（長めのテキスト）", buttonText:"詳しく見る", buttonUrl:"/about" }

4. "stats" - 実績・数字（必ず4つ）
   { type:"stats", heading:"実績", items:[ {value:"98",suffix:"%",label:"顧客満足度"}, {value:"15",suffix:"年",label:"運営実績"}, {value:"1200",suffix:"件+",label:"プロジェクト"}, {value:"200",suffix:"社",label:"導入企業"} ] }

5. "features" - 特徴・強み（必ず6つ）
   { type:"features", heading:"私たちが選ばれる理由", subheading:"Our Features", items:[
     { icon:{kind:"lucide",value:"Rocket",size:28}, title:"タイトル", desc:"説明" },
     { icon:{kind:"lucide",value:"Target",size:28}, title:"タイトル", desc:"説明" },
     { icon:{kind:"lucide",value:"Shield",size:28}, title:"タイトル", desc:"説明" },
     { icon:{kind:"lucide",value:"Star",size:28}, title:"タイトル", desc:"説明" },
     { icon:{kind:"lucide",value:"Heart",size:28}, title:"タイトル", desc:"説明" },
     { icon:{kind:"lucide",value:"BarChart2",size:28}, title:"タイトル", desc:"説明" }
   ]}
   ※ iconのvalueはLucideアイコン名。使えるもの: Rocket, Target, Shield, Star, Heart, BarChart2, Lightbulb, CheckCircle, Users, Zap, Globe, Award, BookOpen, Smile, Clock, ArrowRight, BookMarked, GraduationCap, Pencil, MessageCircle

6. "faq" - よくある質問
   { type:"faq", heading:"よくある質問", items:[ {question:"Q1?", answer:"A1"}, ... ] }

7. "cta" - CTAバナー（行動喚起）
   { type:"cta", heading:"見出し", body:"説明", buttonText:"ボタン1", buttonUrl:"/contact", buttonText2:"ボタン2", buttonUrl2:"" }

8. "steps" - 利用の流れ・ステップ
   { type:"steps", heading:"ご利用の流れ", subheading:"How it works", items:[ {number:"01",title:"タイトル",desc:"説明"}, ... ] }

9. "testimonials" - お客様の声
   { type:"testimonials", heading:"お客様の声", items:[ {quote:"感想", name:"会社名", role:"役職"}, ... ] }

10. "contact" - お問い合わせ
    { type:"contact", heading:"お問い合わせ", desc:"説明文", buttonUrl:"/contact" }

【変換ルール】
- HTMLのnav（ナビゲーション）とfooter（フッター）は無視する
- 各セクションに最も適したブロック型を選ぶ
- テキストはHTMLから実際の内容を抽出する（デフォルトのままにしない）
- 日本語コンテンツはそのまま日本語で出力
- 各ブロックにidフィールドは不要（後で付与する）
- ブロック数は最低3、最大8程度に絞る
- 必ずHeroブロックを最初に置く
- 最後はContactまたはCTAブロックで締める

【出力形式】
JSONのみを返してください。マークダウンコードブロックは使わない。
[
  { "type": "hero", ... },
  { "type": "stats", ... },
  ...
]
`;

export async function POST(req: NextRequest) {
  if (!API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY not set" }, { status: 500 });

  const { html } = (await req.json()) as { html: string };
  if (!html) return NextResponse.json({ error: "html required" }, { status: 400 });

  // HTMLを削減：script/style/svg除去してテキスト部分だけ渡す（トークン節約）
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "[SVG]")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 8000); // 最大8000文字に制限

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: PROMPT + "\n\n【変換対象HTML（テキスト抽出済み）】\n" + stripped }],
      },
    ],
    generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
  };

  let lastError = "";
  for (const model of [MODEL, "gemini-2.5-flash-lite", "gemini-2.0-flash"]) {
    try {
      const res = await fetch(
        `${GEMINI_BASE}/${model}:generateContent?key=${API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
      );
      if (!res.ok) { lastError = `HTTP ${res.status}`; continue; }
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      // JSON配列を抽出
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) { lastError = "no JSON array in response"; continue; }

      const blocks = JSON.parse(match[0]) as Record<string, unknown>[];
      // 各ブロックにidを付与
      const withIds = blocks.map(b => ({ ...b, id: uid() }));
      return NextResponse.json({ blocks: withIds });
    } catch (e) {
      lastError = String(e);
    }
  }

  return NextResponse.json({ error: lastError || "conversion failed" }, { status: 500 });
}
