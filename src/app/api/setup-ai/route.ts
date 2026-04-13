import { NextRequest, NextResponse } from "next/server";
import { GlobalStyle, CanvasElement, uid } from "@/types/site";

export const runtime = "edge";
export const maxDuration = 30;

const API_KEY         = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE     = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS   = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];

// ── Chat system prompt ───────────────────────────────────────
const CHAT_SYSTEM = `あなたは日本市場向けウェブサイト制作の専門コンサルタントです。
ユーザーから情報を引き出すために、以下の5つの質問を1つずつ順番に行ってください。

【質問リスト（この順序で）】
1. どのような事業・サービスを行っていますか？（業種、提供サービス、商品など具体的に）
2. メインのターゲット客層はどのような方ですか？（年齢、職業、状況、お悩みなど）
3. あなたのサービスの強みや特徴を3つ教えてください（他社との違いも含めて）
4. お客様が普段抱えている悩みや課題は何ですか？（なるべく具体的に）
5. お問い合わせから成果・納品まで、どのようなステップがありますか？

【ルール】
- 最初のメッセージでは元気よく自己紹介し、質問①を聞いてください
- 回答1つにつき質問1つ、テンポよく進めてください
- ユーザーの回答に対して1文だけ共感・励ましてから次の質問へ
- 5つすべて完了したら「ありがとうございます！素晴らしいサイトが作れる情報が揃いました✨ 今すぐ自動生成します！」と言い、その後必ず「[GENERATE]」とだけ書かれた行を出力してください
- 絵文字は使わずプロフェッショナルな文体で統一すること`;

// ── Generate System Prompt（軽量版）────────────────────────────
const GENERATE_SYSTEM = `日本市場向けWebサイトのコンテンツをJSONで出力するAIです。
ルール：①思考過程は出力しない ②JSONブロックのみ出力 ③プレースホルダー禁止（〇〇、例：等）④絵文字禁止 ⑤数値は具体的に`;

// ── Generate prompt builder（軽量版）────────────────────────────
function buildGeneratePrompt(conversation: string, analysis?: GlobalStyle): string {
  const pc = analysis?.primaryColor ?? "#1E40AF";
  const ac = analysis?.accentColor  ?? "#EA580C";
  const hb = analysis?.heroBgColor  ?? pc;
  const bg = analysis?.bgColor      ?? "#FFFFFF";
  const cb = analysis?.cardBgColor  ?? "#F9FAFB";
  const bb = analysis?.buttonBgColor ?? ac;

  const structureInfo = analysis ? [
    `色: primary=${pc} accent=${ac} heroBg=${hb} bg=${bg} card=${cb} btn=${bb}`,
    analysis.heroLayout     ? `ヒーローレイアウト: ${analysis.heroLayout}` : "",
    analysis.featureColumns ? `特徴カード列数: ${analysis.featureColumns}列` : "",
    analysis.sectionOrder?.length ? `参考サイトのセクション構成: ${analysis.sectionOrder.join(" → ")}` : "",
    analysis.detectedNavLinks?.length ? `参考サイトのナビ: ${analysis.detectedNavLinks.join(" / ")}` : "",
    analysis.designNotes    ? `デザインの特徴: ${analysis.designNotes}` : "",
  ].filter(Boolean).join("\n") : "";

  return `ヒアリング内容：
${conversation}
${structureInfo}

以下のJSON構造でサイトコンテンツを生成してください。\`\`\`json ... \`\`\` に包んで出力。

\`\`\`json
{
  "title": "会社名",
  "primaryColor": "${pc}",
  "accentColor": "${ac}",
  "fontFamily": "sans",
  "catchCopy": "キャッチコピー（20字以内）",
  "navLinks": [
    {"id":"n1","label":"選ばれる理由","url":"#features"},
    {"id":"n2","label":"ご利用の流れ","url":"#steps"},
    {"id":"n3","label":"よくある質問","url":"#faq"},
    {"id":"n4","label":"お問い合わせ","url":"#cta"}
  ],
  "hero": {
    "bgColor": "${hb}",
    "eyebrow": "実績・権威ラベル（具体的数値入り）",
    "heading": "メインコピー1行目\\nメインコピー2行目",
    "body": "サブコピー2文。ターゲットの悩みと解決を示す。",
    "ctaText": "無料相談はこちら",
    "ctaHref": "#cta",
    "heroImagePrompt": "professional photo for [業種 in English], modern office, no text",
    "imageUrl": null,
    "stats": [
      {"value": "000件","label": "実績"},
      {"value": "00%", "label": "満足度"},
      {"value": "00日","label": "対応速度"}
    ]
  },
  "problem": {
    "bgColor": "${bg}",
    "heading": "こんなお悩みはありませんか？",
    "items": [
      {"title": "悩み1","desc": "詳細説明"},
      {"title": "悩み2","desc": "詳細説明"},
      {"title": "悩み3","desc": "詳細説明"}
    ]
  },
  "solution": {
    "bgColor": "${cb}",
    "heading": "解決策の見出し",
    "body": "解決策の説明2文。",
    "points": ["ポイント1","ポイント2","ポイント3","ポイント4"]
  },
  "features": {
    "bgColor": "${bg}",
    "heading": "選ばれる理由",
    "items": [
      {"title": "特徴1","desc": "説明"},
      {"title": "特徴2","desc": "説明"},
      {"title": "特徴3","desc": "説明"},
      {"title": "特徴4","desc": "説明"},
      {"title": "特徴5","desc": "説明"},
      {"title": "特徴6","desc": "説明"}
    ]
  },
  "steps": {
    "bgColor": "${bg}",
    "heading": "ご利用の流れ",
    "items": [
      {"number": "01","title": "ステップ1","desc": "説明"},
      {"number": "02","title": "ステップ2","desc": "説明"},
      {"number": "03","title": "ステップ3","desc": "説明"},
      {"number": "04","title": "ステップ4","desc": "説明"}
    ]
  },
  "testimonials": {
    "bgColor": "${cb}",
    "heading": "お客様の声",
    "items": [
      {"quote": "感想1（具体的な変化）","name": "A様","role": "職業・状況"},
      {"quote": "感想2","name": "B様","role": "職業・状況"},
      {"quote": "感想3","name": "C様","role": "職業・状況"}
    ]
  },
  "faq": {
    "bgColor": "${bg}",
    "heading": "よくある質問",
    "items": [
      {"q": "質問1","a": "回答1"},
      {"q": "質問2","a": "回答2"},
      {"q": "質問3","a": "回答3"},
      {"q": "質問4","a": "回答4"},
      {"q": "質問5","a": "回答5"}
    ]
  },
  "cta": {
    "bgColor": "${bb}",
    "heading": "CTA見出し（緊急性・限定感）",
    "body": "サポートや保証を1文で。",
    "buttonText": "無料相談はこちら",
    "buttonHref": "#contact"
  },
  "footer": {
    "bgColor": "#0F172A",
    "companyName": "会社名",
    "address": "東京都〇〇区",
    "tel": "03-0000-0000",
    "email": "info@example.com",
    "copyright": "© 2025 会社名 All Rights Reserved."
  }
}
\`\`\``;
}

// ── Canvas layout builder ────────────────────────────────────
type SectionData = {
  title: string;
  primaryColor: string;
  accentColor: string;
  fontFamily?: string;
  catchCopy?: string;
  navLinks?: Array<{ id: string; label: string; url: string }>;
  hero: {
    bgColor: string; eyebrow: string; heading: string; body: string;
    ctaText: string; ctaHref: string; imageUrl?: string | null;
    heroImagePrompt?: string | null;
    stats?: Array<{ value: string; label: string }>;
  };
  problem: {
    bgColor: string; heading: string;
    items: Array<{ title: string; desc: string }>;
  };
  solution: {
    bgColor: string; heading: string; body: string; points: string[];
  };
  features: {
    bgColor: string; heading: string;
    items: Array<{ title: string; desc: string }>;
  };
  steps: {
    bgColor: string; heading: string;
    items: Array<{ number: string; title: string; desc: string }>;
  };
  testimonials: {
    bgColor: string; heading: string;
    items: Array<{ quote: string; name: string; role: string }>;
  };
  faq: {
    bgColor: string; heading: string;
    items: Array<{ q: string; a: string }>;
  };
  cta: {
    bgColor: string; heading: string; body: string;
    buttonText: string; buttonHref: string;
  };
  footer: {
    bgColor: string; companyName: string; address: string;
    tel?: string; email?: string; copyright: string;
  };
};

// Design token resolver — merges AI content with Design DNA
function resolveTokens(data: SectionData, dna?: GlobalStyle) {
  const primary  = dna?.primaryColor  || data.primaryColor  || "#1E40AF";
  const accent   = dna?.accentColor   || data.accentColor   || "#EA580C";
  const heroBg   = dna?.heroBgColor   || data.hero.bgColor  || primary;
  const pageBg   = dna?.bgColor       || "#FFFFFF";
  const cardBg   = dna?.cardBgColor   || "#F9FAFB";
  const textMain = dna?.textColor     || "#111827";
  const textMid  = "#6B7280";
  const btnBg    = dna?.buttonBgColor || accent;
  const btnText  = dna?.buttonTextColor || "#FFFFFF";
  const btnR     = parseInt(dna?.buttonRadius || "31") || 31;
  const cardR    = parseInt(dna?.cardBorderRadius || "16") || 16;
  const secPad   = parseInt(dna?.sectionPaddingY || "80") || 80;
  // label color (eyebrow / section tags)
  const labelColor = dna?.accentColor || dna?.primaryColor || primary;

  return { primary, accent, heroBg, pageBg, cardBg, textMain, textMid, btnBg, btnText, btnR, cardR, secPad, labelColor };
}

// ── Hero templates ───────────────────────────────────────────
type HeroTpl = "split" | "centered" | "typographic" | "light";
type Tk = ReturnType<typeof resolveTokens>;
type AddFn = (el: Omit<CanvasElement, "id">) => void;

function heroSplit(data: SectionData, tk: Tk, dna: GlobalStyle | undefined, y0: number, CW: number, add: AddFn) {
  const H = 700;
  add({ type: "rect", x: 0, y: y0, width: CW, height: H, style: { backgroundColor: tk.heroBg }, zIndex: 1 });
  add({ type: "rect", x: -140, y: y0 + 300, width: 440, height: 440, style: { backgroundColor: tk.primary, borderRadius: 999, opacity: 0.1 }, zIndex: 1 });
  add({ type: "rect", x: CW - 100, y: y0 - 100, width: 320, height: 320, style: { backgroundColor: tk.accent, borderRadius: 999, opacity: 0.08 }, zIndex: 1 });
  const hf = dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {};
  const bf = dna?.bodyFont    ? { fontFamily: `'${dna.bodyFont}'`    } : {};
  add({ type: "text", x: 64, y: y0 + 88, width: 520, height: 26, html: data.hero.eyebrow,
    style: { fontSize: 11, color: tk.labelColor, textAlign: "left", letterSpacing: "0.22em", fontWeight: "700", ...hf }, zIndex: 3 });
  add({ type: "text", x: 64, y: y0 + 128, width: 580, height: 170, html: (data.hero.heading ?? "").replace(/\\n/g, "<br>"),
    style: { fontSize: parseInt(dna?.h1Size || "52") || 52, fontWeight: dna?.headingWeight ?? 900, color: "#FFFFFF", textAlign: "left", lineHeight: dna?.headingLineHeight ?? 1.2, ...hf }, zIndex: 3 });
  add({ type: "text", x: 64, y: y0 + 316, width: 520, height: 80, html: data.hero.body,
    style: { fontSize: 15, color: "rgba(255,255,255,0.82)", textAlign: "left", lineHeight: 1.85, ...bf }, zIndex: 3 });
  add({ type: "button", x: 64, y: y0 + 418, width: 240, height: 56, html: data.hero.ctaText, href: data.hero.ctaHref,
    style: { fontSize: 15, fontWeight: "bold", color: tk.btnText, backgroundColor: tk.btnBg, borderRadius: tk.btnR, textAlign: "center" }, zIndex: 3 });
  add({ type: "button", x: 316, y: y0 + 418, width: 180, height: 56, html: "詳しく見る", href: "#features",
    style: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", backgroundColor: "transparent", borderRadius: tk.btnR, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.35)" }, zIndex: 3 });
  (data.hero.stats ?? []).slice(0, 3).forEach((s, i) => {
    if (i > 0) add({ type: "rect", x: 64 + i * 162 - 10, y: y0 + 510, width: 1, height: 44, style: { backgroundColor: "rgba(255,255,255,0.18)" }, zIndex: 3 });
    add({ type: "text", x: 64 + i * 162, y: y0 + 502, width: 155, height: 70,
      html: `<div style="font-size:28px;font-weight:900;color:#FFFFFF;line-height:1.1">${s.value}</div><div style="font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.58);margin-top:4px">${s.label}</div>`,
      style: { textAlign: "left" }, zIndex: 3 });
  });
  // Right: image or card grid
  const GX = 640, GY = y0 + 36;
  if (data.hero.imageUrl) {
    add({ type: "image", x: GX, y: GY, width: 544, height: 610, style: { borderRadius: 18, objectFit: "cover" }, src: data.hero.imageUrl, zIndex: 2 });
  } else {
    const GC = [[tk.primary, tk.accent], [tk.accent, "#7C3AED"], ["#7C3AED", tk.primary], [tk.accent, tk.primary], [tk.primary, "#059669"], ["#2563EB", tk.accent]];
    const CW2 = 264, CH2 = 186, GAP = 12;
    (data.features?.items ?? []).slice(0, 6).forEach((item, i) => {
      const cx = GX + (i % 2) * (CW2 + GAP), cy = GY + Math.floor(i / 2) * (CH2 + GAP);
      const [c1, c2] = GC[i];
      add({ type: "rect", x: cx, y: cy, width: CW2, height: CH2, style: { backgroundColor: c1, borderRadius: 14, opacity: 0.92 }, zIndex: 2 });
      add({ type: "rect", x: cx + CW2 - 55, y: cy - 28, width: 90, height: 90, style: { backgroundColor: c2, borderRadius: 999, opacity: 0.26 }, zIndex: 2 });
      add({ type: "text", x: cx + 16, y: cy + 38, width: CW2 - 32, height: 70, html: item.title.slice(0, 22),
        style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", lineHeight: 1.38 }, zIndex: 3 });
      add({ type: "text", x: cx + 16, y: cy + 116, width: CW2 - 32, height: 44, html: item.desc.slice(0, 34) + "…",
        style: { fontSize: 10, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }, zIndex: 3 });
    });
  }
  return H;
}

function heroCentered(data: SectionData, tk: Tk, dna: GlobalStyle | undefined, y0: number, CW: number, add: AddFn) {
  const H = 720;
  add({ type: "rect", x: 0, y: y0, width: CW, height: H, style: { backgroundColor: tk.heroBg }, zIndex: 1 });
  // Large decorative rings
  add({ type: "rect", x: CW / 2 - 340, y: y0 - 120, width: 680, height: 680, style: { backgroundColor: "transparent", borderRadius: 999, border: `1px solid ${tk.accent}30` }, zIndex: 1 });
  add({ type: "rect", x: CW / 2 - 220, y: y0 - 20, width: 440, height: 440, style: { backgroundColor: tk.primary, borderRadius: 999, opacity: 0.07 }, zIndex: 1 });
  add({ type: "rect", x: CW / 2 - 160, y: y0 + 40, width: 320, height: 320, style: { backgroundColor: tk.accent, borderRadius: 999, opacity: 0.07 }, zIndex: 1 });
  const hf = dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {};
  const bf = dna?.bodyFont    ? { fontFamily: `'${dna.bodyFont}'`    } : {};
  // Eyebrow pill
  add({ type: "rect", x: CW / 2 - 160, y: y0 + 90, width: 320, height: 34, style: { backgroundColor: tk.accent + "28", borderRadius: 999 }, zIndex: 3 });
  add({ type: "text", x: CW / 2 - 160, y: y0 + 92, width: 320, height: 30, html: data.hero.eyebrow,
    style: { fontSize: 11, color: tk.accent, textAlign: "center", letterSpacing: "0.18em", fontWeight: "700", ...hf }, zIndex: 4 });
  add({ type: "text", x: 80, y: y0 + 148, width: CW - 160, height: 180, html: (data.hero.heading ?? "").replace(/\\n/g, "<br>"),
    style: { fontSize: parseInt(dna?.h1Size || "60") || 60, fontWeight: dna?.headingWeight ?? 900, color: "#FFFFFF", textAlign: "center", lineHeight: 1.2, ...hf }, zIndex: 3 });
  add({ type: "text", x: 200, y: y0 + 346, width: CW - 400, height: 80, html: data.hero.body,
    style: { fontSize: 16, color: "rgba(255,255,255,0.78)", textAlign: "center", lineHeight: 1.88, ...bf }, zIndex: 3 });
  add({ type: "button", x: CW / 2 - 220, y: y0 + 450, width: 210, height: 58, html: data.hero.ctaText, href: data.hero.ctaHref,
    style: { fontSize: 16, fontWeight: "bold", color: tk.btnText, backgroundColor: tk.btnBg, borderRadius: tk.btnR, textAlign: "center" }, zIndex: 3 });
  add({ type: "button", x: CW / 2 + 10, y: y0 + 450, width: 190, height: 58, html: "詳しく見る", href: "#features",
    style: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", backgroundColor: "transparent", borderRadius: tk.btnR, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.38)" }, zIndex: 3 });
  // Stats row
  const stats = (data.hero.stats ?? []).slice(0, 3);
  const sw = 260, sx0 = CW / 2 - (sw * stats.length + 24 * (stats.length - 1)) / 2;
  stats.forEach((s, i) => {
    add({ type: "rect", x: sx0 + i * (sw + 24), y: y0 + 558, width: sw, height: 76, style: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12 }, zIndex: 3 });
    add({ type: "text", x: sx0 + i * (sw + 24), y: y0 + 566, width: sw, height: 60,
      html: `<div style="font-size:30px;font-weight:900;color:#FFFFFF;line-height:1.1">${s.value}</div><div style="font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.55);margin-top:4px">${s.label}</div>`,
      style: { textAlign: "center" }, zIndex: 4 });
  });
  return H;
}

function heroTypographic(data: SectionData, tk: Tk, dna: GlobalStyle | undefined, y0: number, CW: number, add: AddFn) {
  const H = 680;
  add({ type: "rect", x: 0, y: y0, width: CW, height: H, style: { backgroundColor: tk.heroBg }, zIndex: 1 });
  // Large hollow circle (purely decorative)
  add({ type: "rect", x: CW - 480, y: y0 - 200, width: 600, height: 600, style: { backgroundColor: "transparent", borderRadius: 999, border: `2px solid ${tk.accent}22` }, zIndex: 1 });
  add({ type: "rect", x: CW - 360, y: y0 - 80, width: 360, height: 360, style: { backgroundColor: tk.accent, borderRadius: 999, opacity: 0.06 }, zIndex: 1 });
  const hf = dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {};
  const bf = dna?.bodyFont    ? { fontFamily: `'${dna.bodyFont}'`    } : {};
  // Vertical accent bar left
  add({ type: "rect", x: 64, y: y0 + 80, width: 4, height: 280, style: { backgroundColor: tk.accent, borderRadius: 2 }, zIndex: 2 });
  add({ type: "text", x: 88, y: y0 + 80, width: 740, height: 220, html: (data.hero.heading ?? "").replace(/\\n/g, "<br>"),
    style: { fontSize: parseInt(dna?.h1Size || "68") || 68, fontWeight: 900, color: "#FFFFFF", textAlign: "left", lineHeight: 1.12, ...hf }, zIndex: 3 });
  // Accent underline
  add({ type: "rect", x: 88, y: y0 + 308, width: 200, height: 5, style: { backgroundColor: tk.accent, borderRadius: 2 }, zIndex: 3 });
  add({ type: "text", x: 88, y: y0 + 86, width: 320, height: 22, html: data.hero.eyebrow,
    style: { fontSize: 10, color: tk.labelColor, letterSpacing: "0.28em", fontWeight: "700", ...hf }, zIndex: 4 });
  // Right: body + CTA
  add({ type: "text", x: 860, y: y0 + 120, width: 300, height: 160, html: data.hero.body,
    style: { fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.9, ...bf }, zIndex: 3 });
  add({ type: "button", x: 860, y: y0 + 300, width: 240, height: 54, html: data.hero.ctaText, href: data.hero.ctaHref,
    style: { fontSize: 15, fontWeight: "bold", color: tk.btnText, backgroundColor: tk.btnBg, borderRadius: tk.btnR, textAlign: "center" }, zIndex: 3 });
  // Bottom stats — horizontal strip
  add({ type: "rect", x: 0, y: y0 + H - 100, width: CW, height: 1, style: { backgroundColor: "rgba(255,255,255,0.08)" }, zIndex: 2 });
  (data.hero.stats ?? []).slice(0, 3).forEach((s, i) => {
    add({ type: "text", x: 88 + i * 260, y: y0 + H - 84, width: 240, height: 68,
      html: `<div style="font-size:32px;font-weight:900;color:#FFFFFF;line-height:1">${s.value}</div><div style="font-size:10px;letter-spacing:0.1em;color:rgba(255,255,255,0.5);margin-top:6px">${s.label}</div>`,
      style: { textAlign: "left" }, zIndex: 3 });
  });
  return H;
}

function heroLight(data: SectionData, tk: Tk, dna: GlobalStyle | undefined, y0: number, CW: number, add: AddFn) {
  const H = 680;
  const lightBg = "#F8FAFC";
  add({ type: "rect", x: 0, y: y0, width: CW, height: H, style: { backgroundColor: lightBg }, zIndex: 1 });
  // Subtle top-right color blob
  add({ type: "rect", x: CW - 300, y: y0 - 150, width: 500, height: 500, style: { backgroundColor: tk.primary, borderRadius: 999, opacity: 0.06 }, zIndex: 1 });
  const hf = dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {};
  const bf = dna?.bodyFont    ? { fontFamily: `'${dna.bodyFont}'`    } : {};
  // LEFT text
  add({ type: "text", x: 80, y: y0 + 100, width: 500, height: 24, html: data.hero.eyebrow,
    style: { fontSize: 11, color: tk.primary, letterSpacing: "0.2em", fontWeight: "700", ...hf }, zIndex: 3 });
  add({ type: "text", x: 80, y: y0 + 138, width: 560, height: 180, html: (data.hero.heading ?? "").replace(/\\n/g, "<br>"),
    style: { fontSize: parseInt(dna?.h1Size || "50") || 50, fontWeight: dna?.headingWeight ?? 900, color: "#0F172A", textAlign: "left", lineHeight: 1.22, ...hf }, zIndex: 3 });
  add({ type: "text", x: 80, y: y0 + 332, width: 500, height: 80, html: data.hero.body,
    style: { fontSize: 15, color: "#475569", textAlign: "left", lineHeight: 1.88, ...bf }, zIndex: 3 });
  add({ type: "button", x: 80, y: y0 + 430, width: 230, height: 56, html: data.hero.ctaText, href: data.hero.ctaHref,
    style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", backgroundColor: tk.primary, borderRadius: tk.btnR, textAlign: "center" }, zIndex: 3 });
  add({ type: "button", x: 322, y: y0 + 430, width: 160, height: 56, html: "詳しく見る", href: "#features",
    style: { fontSize: 14, fontWeight: "600", color: tk.primary, backgroundColor: "transparent", borderRadius: tk.btnR, textAlign: "center", border: `1.5px solid ${tk.primary}60` }, zIndex: 3 });
  // RIGHT: big stat card
  const rx = 700, ry = y0 + 60, rw = 420, rh = 420;
  add({ type: "rect", x: rx, y: ry, width: rw, height: rh, style: { backgroundColor: tk.primary, borderRadius: 24 }, zIndex: 2 });
  add({ type: "rect", x: rx + rw - 120, y: ry - 60, width: 200, height: 200, style: { backgroundColor: tk.accent, borderRadius: 999, opacity: 0.2 }, zIndex: 2 });
  add({ type: "rect", x: rx - 40, y: ry + rh - 100, width: 180, height: 180, style: { backgroundColor: "#FFFFFF", borderRadius: 999, opacity: 0.05 }, zIndex: 2 });
  const stats = (data.hero.stats ?? []).slice(0, 3);
  stats.forEach((s, i) => {
    add({ type: "text", x: rx + 44, y: ry + 56 + i * 114, width: rw - 88, height: 96,
      html: `<div style="font-size:42px;font-weight:900;color:#FFFFFF;line-height:1">${s.value}</div><div style="font-size:12px;letter-spacing:0.1em;color:rgba(255,255,255,0.62);margin-top:8px">${s.label}</div>`,
      style: { textAlign: "left" }, zIndex: 3 });
    if (i < 2) add({ type: "rect", x: rx + 44, y: ry + 150 + i * 114, width: rw - 88, height: 1, style: { backgroundColor: "rgba(255,255,255,0.12)" }, zIndex: 3 });
  });
  return H;
}

function buildCanvasFromSections(data: SectionData, dna?: GlobalStyle): CanvasElement[] {
  const els: CanvasElement[] = [];
  const tk = resolveTokens(data, dna);

  function add(el: Omit<CanvasElement, "id">): void {
    els.push({ id: uid(), ...el });
  }

  const CW = 1200;
  let y = 0;

  // ── HERO: 参考サイトのheroLayout → designStyle の順で選択 ───
  const tpl: HeroTpl = (() => {
    // URL解析で取得したheroLayoutを最優先
    if (dna?.heroLayout && ["split","centered","typographic","light"].includes(dna.heroLayout)) {
      return dna.heroLayout as HeroTpl;
    }
    // designStyleからフォールバック
    const s = dna?.designStyle?.toLowerCase() ?? "";
    if (s === "minimal" || s === "corporate") return "light";
    if (s === "elegant")                       return "typographic";
    if (s === "bold" || s === "playful")       return "centered";
    return "split";
  })();

  if      (tpl === "centered")    y += heroCentered(data, tk, dna, y, CW, add);
  else if (tpl === "typographic") y += heroTypographic(data, tk, dna, y, CW, add);
  else if (tpl === "light")       y += heroLight(data, tk, dna, y, CW, add);
  else                            y += heroSplit(data, tk, dna, y, CW, add);

  // ── PROBLEM ───────────────────────────────────────────────
  const H_PROB = 580;
  add({ type: "rect", x: 0, y, width: CW, height: H_PROB, style: { backgroundColor: data.problem.bgColor || tk.pageBg }, zIndex: 1 });
  add({ type: "text", x: 200, y: y + 64, width: 800, height: 26,
    html: "PROBLEM",
    style: { fontSize: 10, color: tk.labelColor, textAlign: "center", letterSpacing: "0.35em", fontWeight: "700" }, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 98, width: 1040, height: 68,
    html: data.problem.heading,
    style: { fontSize: 36, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  const probXs = [60, 430, 800];
  (data.problem.items ?? []).slice(0, 3).forEach((item, i) => {
    const cx = probXs[i];
    add({ type: "rect", x: cx, y: y + 196, width: 340, height: 320,
      style: { backgroundColor: "#FFFFFF", borderRadius: tk.cardR, border: "1px solid #FEE2E2",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }, zIndex: 2 });
    // red accent left bar
    add({ type: "rect", x: cx, y: y + 196, width: 5, height: 320,
      style: { backgroundColor: "#EF4444", borderRadius: tk.cardR }, zIndex: 3 });
    // number badge
    add({ type: "rect", x: cx + 20, y: y + 218, width: 36, height: 36,
      style: { backgroundColor: "#FEF2F2", borderRadius: 999, border: "1.5px solid #FCA5A5" }, zIndex: 3 });
    add({ type: "text", x: cx + 20, y: y + 223, width: 36, height: 26,
      html: `0${i + 1}`,
      style: { fontSize: 13, fontWeight: "900", color: "#EF4444", textAlign: "center" }, zIndex: 4 });
    add({ type: "text", x: cx + 68, y: y + 220, width: 252, height: 44,
      html: item.title,
      style: { fontSize: 16, fontWeight: "bold", color: tk.textMain, lineHeight: 1.35,
        ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 3 });
    add({ type: "text", x: cx + 20, y: y + 278, width: 300, height: 100,
      html: item.desc,
      style: { fontSize: 13, color: tk.textMid, lineHeight: 1.8 }, zIndex: 3 });
    // check mark at bottom
    add({ type: "text", x: cx + 20, y: y + 388, width: 300, height: 24,
      html: "→ このお悩み、私たちが解決します",
      style: { fontSize: 11, color: tk.primary, fontWeight: "700" }, zIndex: 3 });
  });
  y += H_PROB;

  // ── SOLUTION ──────────────────────────────────────────────
  const H_SOL = 520;
  add({ type: "rect", x: 0, y, width: CW, height: H_SOL, style: { backgroundColor: data.solution.bgColor || tk.cardBg }, zIndex: 1 });
  add({ type: "text", x: 200, y: y + 60, width: 800, height: 26,
    html: "SOLUTION",
    style: { fontSize: 10, color: tk.labelColor, textAlign: "center", letterSpacing: "0.35em", fontWeight: "700" }, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 94, width: 1040, height: 64,
    html: data.solution.heading,
    style: { fontSize: 36, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  add({ type: "text", x: 200, y: y + 172, width: 800, height: 68,
    html: data.solution.body,
    style: { fontSize: 16, color: tk.textMid, textAlign: "center", lineHeight: 1.85 }, zIndex: 2 });
  const ptXs = [60, 340, 620, 900];
  (data.solution.points ?? []).slice(0, 4).forEach((pt, i) => {
    add({ type: "button", x: ptXs[i], y: y + 272, width: 258, height: 56,
      html: pt,
      style: { fontSize: 14, fontWeight: "bold", color: tk.primary, backgroundColor: tk.primary + "18",
        borderRadius: tk.btnR * 0.7, textAlign: "center" }, zIndex: 2 });
  });
  y += H_SOL;

  // ── FEATURES ──────────────────────────────────────────────
  const H_FEAT = 620;
  add({ type: "rect", x: 0, y, width: CW, height: H_FEAT, style: { backgroundColor: data.features.bgColor || tk.pageBg }, zIndex: 1 });
  add({ type: "text", x: 200, y: y + 60, width: 800, height: 26,
    html: "FEATURES",
    style: { fontSize: 10, color: tk.labelColor, textAlign: "center", letterSpacing: "0.35em", fontWeight: "700" }, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 94, width: 1040, height: 60,
    html: data.features.heading,
    style: { fontSize: 36, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  // accent underline
  add({ type: "rect", x: 560, y: y + 166, width: 80, height: 4,
    style: { backgroundColor: tk.accent, borderRadius: 2 }, zIndex: 2 });
  const featXs = [60, 420, 780];
  const featRows = [y + 184, y + 414];
  const FEAT_COLORS = [tk.primary, tk.accent, "#7C3AED", "#059669", "#2563EB", "#DC2626"];
  (data.features.items ?? []).slice(0, 6).forEach((item, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const cx = featXs[col];
    const cy = featRows[row];
    const iconColor = FEAT_COLORS[i];
    // card bg
    add({ type: "rect", x: cx, y: cy, width: 320, height: 210,
      style: { backgroundColor: "#FFFFFF", borderRadius: tk.cardR, border: "1px solid #E5E7EB",
        boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }, zIndex: 2 });
    // colored top bar
    add({ type: "rect", x: cx, y: cy, width: 320, height: 6,
      style: { backgroundColor: iconColor, borderRadius: tk.cardR }, zIndex: 3 });
    // icon circle
    add({ type: "rect", x: cx + 20, y: cy + 22, width: 40, height: 40,
      style: { backgroundColor: iconColor + "20", borderRadius: 999 }, zIndex: 3 });
    add({ type: "text", x: cx + 20, y: cy + 28, width: 40, height: 28,
      html: item.title.match(/^\S+/)?.[0] ?? "●",
      style: { fontSize: 18, textAlign: "center", lineHeight: 1 }, zIndex: 4 });
    // title & desc
    add({ type: "text", x: cx + 72, y: cy + 24, width: 228, height: 40,
      html: item.title.replace(/^\S+\s*/, ""),
      style: { fontSize: 15, fontWeight: "bold", color: tk.textMain, lineHeight: 1.3,
        ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 3 });
    add({ type: "text", x: cx + 20, y: cy + 80, width: 280, height: 100,
      html: item.desc,
      style: { fontSize: 13, color: tk.textMid, lineHeight: 1.8 }, zIndex: 3 });
  });
  y += H_FEAT + 20;

  // ── STEPS ─────────────────────────────────────────────────
  const H_STEPS = 520;
  add({ type: "rect", x: 0, y, width: CW, height: H_STEPS, style: { backgroundColor: data.steps.bgColor || tk.pageBg }, zIndex: 1 });
  add({ type: "text", x: 200, y: y + 60, width: 800, height: 26,
    html: "FLOW",
    style: { fontSize: 10, color: tk.labelColor, textAlign: "center", letterSpacing: "0.35em", fontWeight: "700" }, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 94, width: 1040, height: 60,
    html: data.steps.heading,
    style: { fontSize: 36, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  const stepXs = [60, 340, 620, 900];
  (data.steps.items ?? []).slice(0, 4).forEach((step, i) => {
    const sx = stepXs[i];
    // connector
    if (i < 3) add({ type: "rect", x: sx + 244, y: y + 216, width: 100, height: 2,
      style: { backgroundColor: "#E5E7EB" }, zIndex: 2 });
    add({ type: "text", x: sx, y: y + 182, width: 240, height: 60,
      html: step.number,
      style: { fontSize: 44, fontWeight: 900, color: tk.accent, textAlign: "center" }, zIndex: 2 });
    add({ type: "text", x: sx, y: y + 254, width: 240, height: 36,
      html: step.title,
      style: { fontSize: 16, fontWeight: "bold", color: tk.textMain, textAlign: "center",
        ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
    add({ type: "text", x: sx, y: y + 298, width: 240, height: 64,
      html: step.desc,
      style: { fontSize: 13, color: tk.textMid, textAlign: "center", lineHeight: 1.7 }, zIndex: 2 });
  });
  y += H_STEPS;

  // ── TESTIMONIALS ──────────────────────────────────────────
  const H_TESTI = 520;
  add({ type: "rect", x: 0, y, width: CW, height: H_TESTI, style: { backgroundColor: data.testimonials.bgColor || tk.cardBg }, zIndex: 1 });
  add({ type: "text", x: 200, y: y + 60, width: 800, height: 26,
    html: "VOICE",
    style: { fontSize: 10, color: tk.labelColor, textAlign: "center", letterSpacing: "0.35em", fontWeight: "700" }, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 94, width: 1040, height: 60,
    html: data.testimonials.heading,
    style: { fontSize: 36, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  const testiXs = [60, 430, 800];
  (data.testimonials.items ?? []).slice(0, 3).forEach((item, i) => {
    const tx = testiXs[i];
    add({ type: "rect", x: tx, y: y + 184, width: 320, height: 280,
      style: { backgroundColor: "#FFFFFF", borderRadius: tk.cardR, border: "1px solid #E5E7EB",
        boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }, zIndex: 2 });
    add({ type: "text", x: tx + 20, y: y + 208, width: 280, height: 20,
      html: "★★★★★",
      style: { fontSize: 14, color: "#F59E0B", textAlign: "center" }, zIndex: 3 });
    add({ type: "text", x: tx + 20, y: y + 240, width: 280, height: 140,
      html: `"${item.quote}"`,
      style: { fontSize: 13, color: "#374151", textAlign: "center", lineHeight: 1.85 }, zIndex: 3 });
    add({ type: "text", x: tx + 20, y: y + 396, width: 280, height: 30,
      html: `— ${item.name}（${item.role}）`,
      style: { fontSize: 11, color: "#9CA3AF", textAlign: "center", fontWeight: "600" }, zIndex: 3 });
  });
  y += H_TESTI;

  // ── FAQ ───────────────────────────────────────────────────
  const H_FAQ = 620;
  add({ type: "rect", x: 0, y, width: CW, height: H_FAQ, style: { backgroundColor: data.faq.bgColor || tk.pageBg }, zIndex: 1 });
  add({ type: "text", x: 200, y: y + 60, width: 800, height: 26,
    html: "FAQ",
    style: { fontSize: 10, color: tk.labelColor, textAlign: "center", letterSpacing: "0.35em", fontWeight: "700" }, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 94, width: 1040, height: 60,
    html: data.faq.heading,
    style: { fontSize: 36, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  (data.faq.items ?? []).slice(0, 5).forEach((item, i) => {
    const fy = y + 186 + i * 88;
    add({ type: "rect", x: 160, y: fy, width: 880, height: 78,
      style: { backgroundColor: i % 2 === 0 ? tk.cardBg : "#FFFFFF",
        borderRadius: Math.min(tk.cardR, 10), border: "1px solid #E5E7EB" }, zIndex: 2 });
    add({ type: "text", x: 192, y: fy + 8, width: 816, height: 28,
      html: `Q. ${item.q}`,
      style: { fontSize: 14, fontWeight: "bold", color: tk.textMain }, zIndex: 3 });
    add({ type: "text", x: 192, y: fy + 42, width: 816, height: 26,
      html: `A. ${item.a}`,
      style: { fontSize: 13, color: tk.textMid }, zIndex: 3 });
  });
  y += H_FAQ;

  // ── CTA ───────────────────────────────────────────────────
  const H_CTA = 360;
  add({ type: "rect", x: 0, y, width: CW, height: H_CTA, style: { backgroundColor: data.cta.bgColor || tk.accent }, zIndex: 1 });
  // decorative circle
  add({ type: "rect", x: -100, y: y + 40, width: 400, height: 400,
    style: { backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 999 }, zIndex: 1 });
  add({ type: "text", x: 80, y: y + 72, width: 1040, height: 80,
    html: data.cta.heading,
    style: { fontSize: 40, fontWeight: 900, color: "#FFFFFF", textAlign: "center", lineHeight: 1.3,
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  add({ type: "text", x: 200, y: y + 168, width: 800, height: 48,
    html: data.cta.body,
    style: { fontSize: 15, color: "rgba(255,255,255,0.88)", textAlign: "center", lineHeight: 1.8 }, zIndex: 2 });
  add({ type: "button", x: 400, y: y + 240, width: 400, height: 64,
    html: data.cta.buttonText, href: data.cta.buttonHref,
    style: { fontSize: 17, fontWeight: "bold", color: data.cta.bgColor || tk.accent,
      backgroundColor: "#FFFFFF", borderRadius: tk.btnR, textAlign: "center" }, zIndex: 2 });
  y += H_CTA;

  // ── FOOTER ────────────────────────────────────────────────
  const H_FOOTER = 300;
  const foot = data.footer;
  add({ type: "rect", x: 0, y, width: CW, height: H_FOOTER, style: { backgroundColor: foot.bgColor || "#0F172A" }, zIndex: 1 });
  // Logo / company name
  add({ type: "text", x: 80, y: y + 52, width: 400, height: 44,
    html: foot.companyName,
    style: { fontSize: 20, fontWeight: "bold", color: "#FFFFFF",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  // Address & contact
  add({ type: "text", x: 80, y: y + 106, width: 440, height: 26,
    html: `📍 ${foot.address}`,
    style: { fontSize: 12, color: "rgba(255,255,255,0.55)" }, zIndex: 2 });
  if (foot.tel) {
    add({ type: "text", x: 80, y: y + 136, width: 440, height: 26,
      html: `📞 ${foot.tel}`,
      style: { fontSize: 12, color: "rgba(255,255,255,0.55)" }, zIndex: 2 });
  }
  if (foot.email) {
    add({ type: "text", x: 80, y: y + 166, width: 440, height: 26,
      html: `✉️ ${foot.email}`,
      style: { fontSize: 12, color: "rgba(255,255,255,0.55)" }, zIndex: 2 });
  }
  // Nav links (right side)
  const footLinks = data.navLinks ?? [];
  footLinks.slice(0, 4).forEach((link, i) => {
    add({ type: "text", x: CW - 320 + (i % 2) * 160, y: y + 52 + Math.floor(i / 2) * 36, width: 150, height: 28,
      html: link.label,
      style: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: "500" }, zIndex: 2 });
  });
  // Divider
  add({ type: "rect", x: 80, y: y + 218, width: CW - 160, height: 1,
    style: { backgroundColor: "rgba(255,255,255,0.12)" }, zIndex: 2 });
  // Copyright
  add({ type: "text", x: 80, y: y + 238, width: CW - 160, height: 28,
    html: foot.copyright,
    style: { fontSize: 11, color: "rgba(255,255,255,0.35)", textAlign: "center" }, zIndex: 2 });
  y += H_FOOTER;

  return els;
}

// ── Gemini fetch with retry + model fallback ─────────────────
async function geminiFetch(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 3072,
): Promise<string> {
  for (const model of GEMINI_MODELS) {
    for (let i = 0; i < 2; i++) {
      const res = await fetch(
        `${GEMINI_BASE}/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: { maxOutputTokens: maxTokens },
          }),
          signal: AbortSignal.timeout(20000),
        }
      );

      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }

      const errText = await res.text();
      const is503 = res.status === 503 || errText.includes("UNAVAILABLE");
      const is429 = res.status === 429 || errText.includes("RESOURCE_EXHAUSTED");

      if ((is503 || is429) && i === 0) {
        await new Promise(r => setTimeout(r, 1500));
        continue;
      }
      break; // 次のモデルへ
    }
  }
  throw new Error("APIが混雑しています。しばらく待ってからやり直してください。");
}

// ── Route handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY が設定されていません。.env.local に追加してください。" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { messages, phase, analysisResult, formData } = body as {
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
    phase: "generate" | "form-generate";
    analysisResult?: GlobalStyle;
    formData?: { businessName: string; serviceDesc: string; target?: string; strengths?: string };
  };

  // ── Generate phase（フォーム or チャット履歴）────────────────
  let conversationText: string;

  if (phase === "form-generate" && formData) {
    conversationText = [
      `事業・サービス名: ${formData.businessName}`,
      `サービス内容: ${formData.serviceDesc}`,
      formData.target    ? `ターゲット: ${formData.target}`    : "",
      formData.strengths ? `強み・特徴: ${formData.strengths}` : "",
    ].filter(Boolean).join("\n");
  } else {
    conversationText = (messages ?? [])
      .map(m => `${m.role === "user" ? "ユーザー" : "AI"}: ${m.content}`)
      .join("\n\n");
  }

  // ── Gemini でサイトコンテンツ生成 ───────────────────────────
  let raw: string;
  try {
    raw = await geminiFetch(
      GENERATE_SYSTEM,
      buildGeneratePrompt(conversationText, analysisResult),
      3072
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "生成に失敗しました" },
      { status: 500 }
    );
  }

  // JSON抽出（```json...``` 形式 or 直接JSON）
  const match   = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const jsonStr = match ? match[1] : raw.trim();

  try {
    const parsed = JSON.parse(jsonStr) as SectionData;

    if (!parsed.hero.imageUrl && parsed.hero.heroImagePrompt) {
      const prompt = encodeURIComponent(
        parsed.hero.heroImagePrompt + ", photorealistic, 4k, no watermark"
      );
      parsed.hero.imageUrl =
        `https://image.pollinations.ai/prompt/${prompt}?width=1080&height=720&nologo=true&seed=${Date.now() % 9999}`;
    }

    const elements = buildCanvasFromSections(parsed, analysisResult);

    const config = {
      title:        parsed.title,
      primaryColor: analysisResult?.primaryColor || parsed.primaryColor,
      accentColor:  analysisResult?.accentColor  || parsed.accentColor,
      fontFamily:   parsed.fontFamily ?? "sans",
      catchCopy:    parsed.catchCopy ?? "",
      navLinks:     parsed.navLinks  ?? [],
      canvasWidth:  1200,
      elements,
      sections: [], pages: [], articles: [],
      globalStyle: analysisResult ?? undefined,
    };
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "JSON解析失敗", raw }, { status: 500 });
  }
}
