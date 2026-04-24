import { NextRequest, NextResponse } from "next/server";
import { GlobalStyle, CanvasElement, SectionBlock, FeatureItem, IconValue, uid } from "@/types/site";

export const maxDuration = 60;

const API_KEY         = process.env.GEMINI_API_KEY ?? "";
const GEMINI_BASE     = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_MODELS   = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.5-pro"];

// ── 6種のデザインシステム定義 ────────────────────────────────
const DESIGN_SYSTEMS: Record<string, GlobalStyle & { _desc: string }> = {
  corporate: {
    _desc: "BtoB・士業・コンサル・金融・製造向け。深いネイビーで重厚な信頼感を演出。数値と実績で説得する構成。",
    primaryColor: "#0F2B5B", accentColor: "#1E6FBF",
    heroBgColor: "#0A1E42", bgColor: "#FFFFFF",
    cardBgColor: "#F0F4F8", buttonBgColor: "#1E6FBF",
    buttonTextColor: "#FFFFFF", buttonRadius: "6", cardBorderRadius: "12",
    heroLayout: "split", designStyle: "corporate",
    designNotes: "法人向け,BtoB,士業,コンサル,金融,製造,不動産,重厚,信頼,実績重視,ネイビー,白,清潔感",
    h1Size: "54", headingWeight: 900, sectionPaddingY: "88",
    textColor: "#0F172A",
  },
  creative: {
    _desc: "デザイン事務所・写真家・映像制作・クリエイター向け。ほぼ黒の背景に強烈なアクセント。タイポグラフィで魅せる。",
    primaryColor: "#111111", accentColor: "#FF3D00",
    heroBgColor: "#0A0A0A", bgColor: "#F5F5F5",
    cardBgColor: "#FFFFFF", buttonBgColor: "#FF3D00",
    buttonTextColor: "#FFFFFF", buttonRadius: "2", cardBorderRadius: "4",
    heroLayout: "typographic", designStyle: "bold",
    designNotes: "クリエイター,デザイン,写真,映像,ブランディング,ほぼ黒,赤アクセント,大胆,エッジ,ストロング",
    h1Size: "68", headingWeight: 900, sectionPaddingY: "96",
    textColor: "#111111",
  },
  warm: {
    _desc: "地域密着サービス・飲食・整体・美容室・リフォーム向け。温かみのあるテラコッタ×クリームで親しみやすく。",
    primaryColor: "#92400E", accentColor: "#F97316",
    heroBgColor: "#1C0A00", bgColor: "#FFFBF5",
    cardBgColor: "#FFF7ED", buttonBgColor: "#F97316",
    buttonTextColor: "#FFFFFF", buttonRadius: "8", cardBorderRadius: "20",
    heroLayout: "centered", designStyle: "warm",
    designNotes: "地域密着,BtoC,飲食,整体,リフォーム,美容,温かみ,人情,オレンジ,テラコッタ,アースカラー",
    h1Size: "52", headingWeight: 900, sectionPaddingY: "80",
    textColor: "#1C0A00",
  },
  medical: {
    _desc: "クリニック・歯科・整骨院・カウンセリング・ウェルネス向け。清潔感あるティール×白で安心感を最優先。",
    primaryColor: "#0E7490", accentColor: "#22D3EE",
    heroBgColor: "#F0FDFE", bgColor: "#FFFFFF",
    cardBgColor: "#F0FDFE", buttonBgColor: "#0E7490",
    buttonTextColor: "#FFFFFF", buttonRadius: "999", cardBorderRadius: "16",
    heroLayout: "light", designStyle: "minimal",
    designNotes: "医療,クリニック,歯科,整骨院,ウェルネス,カウンセリング,清潔,安心,ティール,水色,白,信頼",
    h1Size: "46", headingWeight: 700, sectionPaddingY: "80",
    textColor: "#164E63",
  },
  tech: {
    _desc: "SaaS・スタートアップ・IT・DX・AI系向け。インディゴ×バイオレットのグラデーションで先進性を演出。",
    primaryColor: "#4338CA", accentColor: "#7C3AED",
    heroBgColor: "#1E1B4B", bgColor: "#FAFAFA",
    cardBgColor: "#F5F3FF", buttonBgColor: "#4338CA",
    buttonTextColor: "#FFFFFF", buttonRadius: "8", cardBorderRadius: "12",
    heroLayout: "centered", designStyle: "bold",
    designNotes: "SaaS,スタートアップ,IT,DX,AI,テクノロジー,インディゴ,バイオレット,モダン,グラデ,先進",
    h1Size: "60", headingWeight: 900, sectionPaddingY: "88",
    textColor: "#1E1B4B",
  },
  lifestyle: {
    _desc: "ビューティ・ファッション・パーソナルコーチ・女性向けサービス向け。ローズ×ゴールドで上品さとエレガンスを。",
    primaryColor: "#9F1239", accentColor: "#E11D48",
    heroBgColor: "#4C0519", bgColor: "#FFF1F2",
    cardBgColor: "#FFE4E6", buttonBgColor: "#E11D48",
    buttonTextColor: "#FFFFFF", buttonRadius: "999", cardBorderRadius: "24",
    heroLayout: "split", designStyle: "elegant",
    designNotes: "女性向け,ビューティ,コスメ,ファッション,コーチング,ライフスタイル,エレガント,ローズ,上品",
    h1Size: "50", headingWeight: 900, sectionPaddingY: "80",
    textColor: "#4C0519",
  },
};

// ── Chat system prompt ───────────────────────────────────────
const CHAT_SYSTEM = `あなたは日本市場向けウェブサイト制作の専門コンサルタントです。
ユーザーから情報を引き出すために、以下の5つの質問を1つずつ丁寧に行ってください。

【質問リスト（この順序で）】
1. どのような事業・サービスを行っていますか？（業種、提供サービス、商品など具体的に）
2. メインのターゲット客層はどのような方ですか？（年齢、職業、状況、お悩みなど）
3. あなたのサービスの強みや特徴を教えてください（他社との違いも含めて）
4. お客様が普段抱えている悩みや課題は何ですか？（なるべく具体的に）
5. お問い合わせから成果・納品まで、どのようなステップがありますか？

【返答スタイル（必ず守ること）】
- 最初のメッセージは「こんにちは！サイト制作のヒアリングを始めましょう。まず最初に教えてください。」のように温かく始め、質問①を聞く
- ユーザーの回答には必ず前向きな一言を添えてから次の質問へ
- 回答が短い・抽象的なときは「もう少し具体的に教えていただけますか？たとえば〜」と掘り下げる
- 回答が十分なら次の質問へ進む。1回のメッセージで質問は1つだけ
- 会話のテンポを大切に。3〜4文以内で返す
- 5つすべて完了したら「ありがとうございます！情報が揃いました。最適なデザインでサイトを自動生成します！」と言う
- その後、事業内容・ターゲット・雰囲気から最も適したデザインスタイルを1つ選んで「[DESIGN:キー]」と出力してから「[GENERATE]」を出力する

【デザインスタイルの選び方】
- corporate → BtoB・士業・コンサル・金融・製造・不動産など法人向け
- creative  → デザイン事務所・写真・映像・ブランディングなどクリエイター系
- warm      → 地域密着・飲食・整体・美容室・リフォームなど身近なBtoC
- medical   → クリニック・歯科・整骨院・カウンセリング・ウェルネス系
- tech      → SaaS・スタートアップ・IT・DX・AI・テクノロジー系
- lifestyle → ビューティ・コスメ・ファッション・女性向けコーチングなど
- 迷ったら corporate を選ぶ

- 絵文字は使わずプロフェッショナルかつ温かみのある文体で統一すること`;

// ── Generate System Prompt（awesome-design-md-jp品質基準）──────
const GENERATE_SYSTEM = `日本市場向けWebサイトのコンテンツをJSONで出力するAIです。

【出力ルール】
①思考過程は出力しない ②JSONブロックのみ出力 ③プレースホルダー禁止（〇〇、例：等）④絵文字禁止 ⑤数値は必ず具体的に（98%、247社、3日など）

【日本プロサイト品質基準（awesome-design-md-jp準拠）】
- キャッチコピー：読んだ瞬間に価値が伝わる動詞始め。例「〇〇を、もっと自由に。」
- 課題提起：ターゲットが「まさに自分のことだ」と感じる具体的な悩みを書く
- 強み：抽象的な言葉（高品質、丁寧）は使わず、数値・実績・仕組みで証明する
- お客様の声：「〜が改善されました」ではなく「〜が3倍になりました」と具体的変化
- CTA：「無料相談はこちら」+「初回30分無料」など安心感のある補足を必ず添える
- 数字の格式：件数・割合・日数・年数など複数の数値軸を組み合わせてリアリティを出す`;

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

// ── Color utility ────────────────────────────────────────────
/** true if hex is a light color (luminance > 0.45) */
function isLight(hex: string): boolean {
  if (!hex?.startsWith("#") || hex.length < 7) return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.45;
}

/** Return a guaranteed-dark color (falls back to deep navy) */
function toDark(hex: string, fallback = "#1E3A5F"): string {
  return isLight(hex) ? fallback : hex;
}

// Design token resolver — merges AI content with Design DNA
function resolveTokens(data: SectionData, dna?: GlobalStyle) {
  const primary  = dna?.primaryColor  || data.primaryColor  || "#1E40AF";
  const accent   = dna?.accentColor   || data.accentColor   || "#EA580C";
  const rawHeroBg = dna?.heroBgColor  || data.hero.bgColor  || primary;
  // heroBg: use as-is.  heroBgDark: ALWAYS a dark color for dark-text templates
  const heroBg     = rawHeroBg;
  const heroBgDark = toDark(rawHeroBg, isLight(primary) ? "#1E3A5F" : primary);
  const pageBg   = dna?.bgColor       || "#FFFFFF";
  const cardBg   = dna?.cardBgColor   || "#F9FAFB";
  const textMain = dna?.textColor     || "#111827";
  const textMid  = "#6B7280";
  const btnBg    = isLight(dna?.buttonBgColor || accent) ? (isLight(accent) ? "#1E40AF" : accent) : (dna?.buttonBgColor || accent);
  const btnText  = dna?.buttonTextColor || "#FFFFFF";
  const btnR     = parseInt(dna?.buttonRadius || "31") || 31;
  const cardR    = parseInt(dna?.cardBorderRadius || "16") || 16;
  const secPad   = parseInt(dna?.sectionPaddingY || "80") || 80;
  const labelColor = dna?.accentColor || dna?.primaryColor || primary;

  return { primary, accent, heroBg, heroBgDark, pageBg, cardBg, textMain, textMid, btnBg, btnText, btnR, cardR, secPad, labelColor };
}

// ── Hero templates ───────────────────────────────────────────
type HeroTpl = "split" | "centered" | "typographic" | "light";
type Tk = ReturnType<typeof resolveTokens>;
type AddFn = (el: Omit<CanvasElement, "id">) => void;

function heroSplit(data: SectionData, tk: Tk, dna: GlobalStyle | undefined, y0: number, CW: number, add: AddFn) {
  const H = 700;
  add({ type: "rect", x: 0, y: y0, width: CW, height: H, style: { backgroundColor: tk.heroBgDark }, zIndex: 1 });
  // Gradient glow blobs
  add({ type: "rect", x: -160, y: y0 + 260, width: 480, height: 480, style: { backgroundColor: tk.accent, borderRadius: 999, opacity: 0.12 }, zIndex: 1 });
  add({ type: "rect", x: CW - 80, y: y0 - 80, width: 340, height: 340, style: { backgroundColor: tk.primary, borderRadius: 999, opacity: 0.1 }, zIndex: 1 });

  const hf = dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {};
  const bf = dna?.bodyFont    ? { fontFamily: `'${dna.bodyFont}'`    } : {};

  // Left accent bar
  add({ type: "rect", x: 64, y: y0 + 88, width: 3, height: 32, style: { backgroundColor: tk.accent, borderRadius: 2 }, zIndex: 3 });
  add({ type: "text", x: 76, y: y0 + 88, width: 520, height: 28, html: data.hero.eyebrow,
    style: { fontSize: 11, color: tk.labelColor, textAlign: "left", letterSpacing: "0.22em", fontWeight: "700", ...hf }, zIndex: 3 });
  add({ type: "text", x: 64, y: y0 + 136, width: 565, height: 175,
    html: (data.hero.heading ?? "").replace(/\\n/g, "<br>"),
    style: { fontSize: parseInt(dna?.h1Size || "54") || 54, fontWeight: dna?.headingWeight ?? 900, color: "#FFFFFF", textAlign: "left", lineHeight: dna?.headingLineHeight ?? 1.18, ...hf }, zIndex: 3 });
  add({ type: "text", x: 64, y: y0 + 326, width: 510, height: 80, html: data.hero.body,
    style: { fontSize: 15, color: "rgba(255,255,255,0.80)", textAlign: "left", lineHeight: 1.88, ...bf }, zIndex: 3 });
  add({ type: "button", x: 64, y: y0 + 428, width: 242, height: 58, html: data.hero.ctaText, href: data.hero.ctaHref,
    style: { fontSize: 15, fontWeight: "bold", color: tk.btnText, backgroundColor: tk.btnBg, borderRadius: tk.btnR, textAlign: "center" }, zIndex: 3 });
  add({ type: "button", x: 320, y: y0 + 428, width: 176, height: 58, html: "詳しく見る", href: "#features",
    style: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", backgroundColor: "transparent", borderRadius: tk.btnR, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.35)" }, zIndex: 3 });

  // Stats row with separator lines
  (data.hero.stats ?? []).slice(0, 3).forEach((s, i) => {
    if (i > 0) add({ type: "rect", x: 64 + i * 162 - 12, y: y0 + 516, width: 1, height: 42, style: { backgroundColor: "rgba(255,255,255,0.2)" }, zIndex: 3 });
    add({ type: "text", x: 64 + i * 162, y: y0 + 508, width: 154, height: 68,
      html: `<div style="font-size:30px;font-weight:900;color:#FFFFFF;line-height:1.1">${s.value}</div><div style="font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.55);margin-top:5px">${s.label}</div>`,
      style: { textAlign: "left" }, zIndex: 3 });
  });

  // ── Right: image or styled feature card grid ──────────────────
  const GX = 652, GY = y0 + 32;
  if (data.hero.imageUrl) {
    add({ type: "image", x: GX, y: GY, width: 526, height: 618, style: { borderRadius: 20, objectFit: "cover" }, src: data.hero.imageUrl, zIndex: 2 });
  } else {
    const GC = [
      { bg: tk.primary,  acc: tk.accent   },
      { bg: tk.accent,   acc: "#FFFFFF"   },
      { bg: "#7C3AED",   acc: tk.primary  },
      { bg: tk.accent,   acc: tk.primary  },
      { bg: "#0F172A",   acc: tk.accent   },
      { bg: tk.primary,  acc: "#7C3AED"   },
    ];
    const CW2 = 258, CH2 = 188, GAP = 10;
    (data.features?.items ?? []).slice(0, 6).forEach((item, i) => {
      const cx = GX + (i % 2) * (CW2 + GAP), cy = GY + Math.floor(i / 2) * (CH2 + GAP);
      const { bg: c1, acc: c2 } = GC[i];
      // Card background
      add({ type: "rect", x: cx, y: cy, width: CW2, height: CH2, style: { backgroundColor: c1, borderRadius: 16 }, zIndex: 2 });
      // Decorative blob
      add({ type: "rect", x: cx + CW2 - 50, y: cy - 25, width: 88, height: 88, style: { backgroundColor: c2, borderRadius: 999, opacity: 0.22 }, zIndex: 2 });
      // Number badge
      add({ type: "rect", x: cx + 16, y: cy + 16, width: 36, height: 36, style: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8 }, zIndex: 3 });
      add({ type: "text", x: cx + 16, y: cy + 17, width: 36, height: 34,
        html: `0${i+1}`, style: { fontSize: 14, fontWeight: "900", color: "#FFFFFF", textAlign: "center" }, zIndex: 4 });
      // Title + desc
      add({ type: "text", x: cx + 16, y: cy + 68, width: CW2 - 32, height: 56,
        html: item.title.slice(0, 24), style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", lineHeight: 1.35 }, zIndex: 3 });
      add({ type: "text", x: cx + 16, y: cy + 128, width: CW2 - 32, height: 44,
        html: item.desc.slice(0, 38) + (item.desc.length > 38 ? "…" : ""),
        style: { fontSize: 11, color: "rgba(255,255,255,0.68)", lineHeight: 1.5 }, zIndex: 3 });
    });
  }
  return H;
}

function heroCentered(data: SectionData, tk: Tk, dna: GlobalStyle | undefined, y0: number, CW: number, add: AddFn) {
  const H = 720;
  // Background + gradient glow blobs (NOT rings — rings look like wireframes)
  add({ type: "rect", x: 0, y: y0, width: CW, height: H, style: { backgroundColor: tk.heroBgDark }, zIndex: 1 });
  add({ type: "rect", x: -120, y: y0 + 80, width: 520, height: 520, style: { backgroundColor: tk.primary, borderRadius: 999, opacity: 0.14 }, zIndex: 1 });
  add({ type: "rect", x: CW - 300, y: y0 + 180, width: 440, height: 440, style: { backgroundColor: tk.accent, borderRadius: 999, opacity: 0.11 }, zIndex: 1 });
  add({ type: "rect", x: CW / 2 - 180, y: y0 - 60, width: 360, height: 360, style: { backgroundColor: tk.accent, borderRadius: 999, opacity: 0.07 }, zIndex: 1 });

  const hf = dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {};
  const bf = dna?.bodyFont    ? { fontFamily: `'${dna.bodyFont}'`    } : {};

  // ── Floating stat cards (left side) ──────────────────────────
  const stats = (data.hero.stats ?? []).slice(0, 3);
  if (stats[0]) {
    add({ type: "text", x: 40, y: y0 + 260, width: 200, height: 96,
      html: `<div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.22);border-radius:16px;padding:18px 20px;backdrop-filter:blur(8px)">
        <div style="font-size:32px;font-weight:900;color:#FFFFFF;line-height:1">${stats[0].value}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.62);margin-top:5px;letter-spacing:0.05em">${stats[0].label}</div>
      </div>`, style: {}, zIndex: 3 });
  }
  if (stats[1]) {
    add({ type: "text", x: CW - 240, y: y0 + 190, width: 200, height: 96,
      html: `<div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.22);border-radius:16px;padding:18px 20px;backdrop-filter:blur(8px)">
        <div style="font-size:32px;font-weight:900;color:#FFFFFF;line-height:1">${stats[1].value}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.62);margin-top:5px;letter-spacing:0.05em">${stats[1].label}</div>
      </div>`, style: {}, zIndex: 3 });
  }
  if (stats[2]) {
    add({ type: "text", x: CW - 230, y: y0 + 440, width: 190, height: 96,
      html: `<div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.22);border-radius:16px;padding:18px 20px;backdrop-filter:blur(8px)">
        <div style="font-size:32px;font-weight:900;color:#FFFFFF;line-height:1">${stats[2].value}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.62);margin-top:5px;letter-spacing:0.05em">${stats[2].label}</div>
      </div>`, style: {}, zIndex: 3 });
  }

  // ── Center content ────────────────────────────────────────────
  // Eyebrow badge
  add({ type: "rect", x: CW / 2 - 170, y: y0 + 88, width: 340, height: 36, style: { backgroundColor: tk.accent + "2A", borderRadius: 999, border: `1px solid ${tk.accent}45` }, zIndex: 3 });
  add({ type: "text", x: CW / 2 - 158, y: y0 + 92, width: 316, height: 28, html: data.hero.eyebrow,
    style: { fontSize: 11, color: tk.accent, textAlign: "center", letterSpacing: "0.18em", fontWeight: "700", ...hf }, zIndex: 4 });

  // Heading
  add({ type: "text", x: 80, y: y0 + 148, width: CW - 160, height: 190,
    html: (data.hero.heading ?? "").replace(/\\n/g, "<br>"),
    style: { fontSize: parseInt(dna?.h1Size || "62") || 62, fontWeight: dna?.headingWeight ?? 900, color: "#FFFFFF", textAlign: "center", lineHeight: 1.15, ...hf }, zIndex: 3 });

  // Body
  add({ type: "text", x: 220, y: y0 + 352, width: CW - 440, height: 72, html: data.hero.body,
    style: { fontSize: 16, color: "rgba(255,255,255,0.76)", textAlign: "center", lineHeight: 1.9, ...bf }, zIndex: 3 });

  // CTA buttons
  add({ type: "button", x: CW / 2 - 224, y: y0 + 448, width: 214, height: 58, html: data.hero.ctaText, href: data.hero.ctaHref,
    style: { fontSize: 16, fontWeight: "bold", color: tk.btnText, backgroundColor: tk.btnBg, borderRadius: tk.btnR, textAlign: "center" }, zIndex: 3 });
  add({ type: "button", x: CW / 2 + 10, y: y0 + 448, width: 190, height: 58, html: "詳しく見る", href: "#features",
    style: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", backgroundColor: "transparent", borderRadius: tk.btnR, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.36)" }, zIndex: 3 });

  // Bottom subtle separator + trust text
  add({ type: "rect", x: CW / 2 - 220, y: y0 + H - 70, width: 440, height: 1, style: { backgroundColor: "rgba(255,255,255,0.1)" }, zIndex: 2 });
  add({ type: "text", x: CW / 2 - 280, y: y0 + H - 58, width: 560, height: 36,
    html: `<div style="display:flex;align-items:center;justify-content:center;gap:32px">
      ${stats.map(s => `<span style="font-size:12px;color:rgba(255,255,255,0.5)"><b style="color:rgba(255,255,255,0.85)">${s.value}</b> ${s.label}</span>`).join('<span style="color:rgba(255,255,255,0.2)">|</span>')}
    </div>`, style: {}, zIndex: 3 });

  return H;
}

function heroTypographic(data: SectionData, tk: Tk, dna: GlobalStyle | undefined, y0: number, CW: number, add: AddFn) {
  const H = 700;
  add({ type: "rect", x: 0, y: y0, width: CW, height: H, style: { backgroundColor: tk.heroBgDark }, zIndex: 1 });
  // Background blobs (fill, not rings)
  add({ type: "rect", x: CW - 440, y: y0 - 140, width: 520, height: 520, style: { backgroundColor: tk.accent, borderRadius: 999, opacity: 0.1 }, zIndex: 1 });
  add({ type: "rect", x: CW - 280, y: y0 + 300, width: 320, height: 320, style: { backgroundColor: tk.primary, borderRadius: 999, opacity: 0.08 }, zIndex: 1 });

  const hf = dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {};
  const bf = dna?.bodyFont    ? { fontFamily: `'${dna.bodyFont}'`    } : {};

  // Vertical accent bar + eyebrow
  add({ type: "rect", x: 64, y: y0 + 80, width: 4, height: 300, style: { backgroundColor: tk.accent, borderRadius: 2 }, zIndex: 2 });
  add({ type: "text", x: 88, y: y0 + 82, width: 360, height: 22, html: data.hero.eyebrow,
    style: { fontSize: 10, color: tk.labelColor, letterSpacing: "0.28em", fontWeight: "700", ...hf }, zIndex: 4 });

  // Large heading
  add({ type: "text", x: 88, y: y0 + 116, width: 730, height: 240,
    html: (data.hero.heading ?? "").replace(/\\n/g, "<br>"),
    style: { fontSize: parseInt(dna?.h1Size || "66") || 66, fontWeight: 900, color: "#FFFFFF", textAlign: "left", lineHeight: 1.1, ...hf }, zIndex: 3 });

  // Accent underline
  add({ type: "rect", x: 88, y: y0 + 362, width: 220, height: 5, style: { backgroundColor: tk.accent, borderRadius: 2 }, zIndex: 3 });

  // Right column: body + CTA + mini stat cards
  add({ type: "text", x: 850, y: y0 + 110, width: 300, height: 160, html: data.hero.body,
    style: { fontSize: 14, color: "rgba(255,255,255,0.74)", lineHeight: 1.9, ...bf }, zIndex: 3 });
  add({ type: "button", x: 850, y: y0 + 290, width: 242, height: 56, html: data.hero.ctaText, href: data.hero.ctaHref,
    style: { fontSize: 15, fontWeight: "bold", color: tk.btnText, backgroundColor: tk.btnBg, borderRadius: tk.btnR, textAlign: "center" }, zIndex: 3 });
  add({ type: "button", x: 850, y: y0 + 360, width: 242, height: 50, html: "詳しく見る", href: "#features",
    style: { fontSize: 14, color: "#FFFFFF", backgroundColor: "transparent", borderRadius: tk.btnR, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.3)" }, zIndex: 3 });

  // Right: 3 mini stat cards stacked
  const stats = (data.hero.stats ?? []).slice(0, 3);
  stats.forEach((s, i) => {
    add({ type: "text", x: 850, y: y0 + 434 + i * 74, width: 300, height: 64,
      html: `<div style="background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:12px 18px;display:flex;align-items:center;gap:14px">
        <span style="font-size:26px;font-weight:900;color:#FFFFFF;line-height:1">${s.value}</span>
        <span style="font-size:11px;color:rgba(255,255,255,0.55);letter-spacing:0.04em">${s.label}</span>
      </div>`, style: {}, zIndex: 3 });
  });

  // Bottom stats strip
  add({ type: "rect", x: 0, y: y0 + H - 94, width: CW, height: 1, style: { backgroundColor: "rgba(255,255,255,0.08)" }, zIndex: 2 });
  stats.forEach((s, i) => {
    add({ type: "text", x: 88 + i * 256, y: y0 + H - 78, width: 234, height: 64,
      html: `<div style="font-size:30px;font-weight:900;color:#FFFFFF;line-height:1">${s.value}</div><div style="font-size:10px;letter-spacing:0.1em;color:rgba(255,255,255,0.48);margin-top:6px">${s.label}</div>`,
      style: { textAlign: "left" }, zIndex: 3 });
  });
  return H;
}

function heroLight(data: SectionData, tk: Tk, dna: GlobalStyle | undefined, y0: number, CW: number, add: AddFn) {
  const H = 700;
  // Background: very light with subtle accent blob
  add({ type: "rect", x: 0, y: y0, width: CW, height: H, style: { backgroundColor: "#F8FAFC" }, zIndex: 1 });
  add({ type: "rect", x: CW - 360, y: y0 - 120, width: 560, height: 560, style: { backgroundColor: tk.primary, borderRadius: 999, opacity: 0.07 }, zIndex: 1 });
  add({ type: "rect", x: -80, y: y0 + 400, width: 280, height: 280, style: { backgroundColor: tk.accent, borderRadius: 999, opacity: 0.07 }, zIndex: 1 });

  const hf = dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {};
  const bf = dna?.bodyFont    ? { fontFamily: `'${dna.bodyFont}'`    } : {};

  // ── LEFT: text content ────────────────────────────────────────
  // Eyebrow tag
  add({ type: "rect", x: 80, y: y0 + 96, width: 240, height: 30, style: { backgroundColor: tk.primary + "18", borderRadius: 6 }, zIndex: 3 });
  add({ type: "text", x: 84, y: y0 + 99, width: 232, height: 24, html: data.hero.eyebrow,
    style: { fontSize: 11, color: tk.primary, letterSpacing: "0.18em", fontWeight: "700", ...hf }, zIndex: 4 });

  // Heading
  add({ type: "text", x: 80, y: y0 + 144, width: 560, height: 200,
    html: (data.hero.heading ?? "").replace(/\\n/g, "<br>"),
    style: { fontSize: parseInt(dna?.h1Size || "52") || 52, fontWeight: dna?.headingWeight ?? 900, color: "#0F172A", textAlign: "left", lineHeight: 1.2, ...hf }, zIndex: 3 });

  // Body
  add({ type: "text", x: 80, y: y0 + 358, width: 500, height: 80, html: data.hero.body,
    style: { fontSize: 15, color: "#475569", textAlign: "left", lineHeight: 1.9, ...bf }, zIndex: 3 });

  // CTA buttons
  add({ type: "button", x: 80, y: y0 + 458, width: 230, height: 58, html: data.hero.ctaText, href: data.hero.ctaHref,
    style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", backgroundColor: tk.primary, borderRadius: tk.btnR, textAlign: "center" }, zIndex: 3 });
  add({ type: "button", x: 326, y: y0 + 458, width: 162, height: 58, html: "詳しく見る", href: "#features",
    style: { fontSize: 14, fontWeight: "600", color: tk.primary, backgroundColor: "transparent", borderRadius: tk.btnR, textAlign: "center", border: `1.5px solid ${tk.primary}55` }, zIndex: 3 });

  // Small stats row (left-bottom)
  const stats = (data.hero.stats ?? []).slice(0, 3);
  add({ type: "text", x: 80, y: y0 + H - 68, width: 480, height: 48,
    html: `<div style="display:flex;gap:28px;align-items:center">
      ${stats.map((s, i) => `${i > 0 ? '<span style="color:#E2E8F0;font-size:20px">|</span>' : ''}<div><span style="font-size:22px;font-weight:900;color:${tk.primary}">${s.value}</span> <span style="font-size:12px;color:#94A3B8">${s.label}</span></div>`).join("")}
    </div>`, style: {}, zIndex: 3 });

  // ── RIGHT: stacked feature cards ─────────────────────────────
  const features = (data.features?.items ?? []).slice(0, 3);
  const FEAT_COLORS = [tk.primary, tk.accent, "#7C3AED"];
  const rx = 700, ry = y0 + 54;
  features.forEach((item, i) => {
    const cy = ry + i * 192;
    add({ type: "text", x: rx, y: cy, width: 460, height: 178,
      html: `<div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.06);overflow:hidden;box-sizing:border-box;height:178px">
        <div style="height:4px;background:${FEAT_COLORS[i]}"></div>
        <div style="padding:20px 24px">
          <div style="display:flex;align-items:flex-start;gap:14px">
            <div style="min-width:42px;height:42px;border-radius:10px;background:${FEAT_COLORS[i]}15;border:1.5px solid ${FEAT_COLORS[i]}40;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;color:${FEAT_COLORS[i]};flex-shrink:0">0${i+1}</div>
            <div>
              <div style="font-size:16px;font-weight:700;color:#111827;line-height:1.3;margin-bottom:8px">${item.title}</div>
              <div style="font-size:13px;color:#6B7280;line-height:1.75">${item.desc.slice(0, 60)}${item.desc.length > 60 ? "…" : ""}</div>
            </div>
          </div>
        </div>
      </div>`,
      style: {}, zIndex: 2 });
  });

  return H;
}

// ── SectionData → SectionBlock[] (SitePreview用) ─────────────
function buildSectionsFromData(data: SectionData): SectionBlock[] {
  const sections: SectionBlock[] = [];
  const defaultIcon: IconValue = { kind: "emoji", value: "✓" };

  // Hero → hero-centered
  sections.push({
    id: uid(),
    type: "hero-centered",
    eyebrow: data.hero.eyebrow ?? "",
    tagline: data.hero.heading ?? "",
    body: data.hero.body ?? "",
    buttonText: data.hero.ctaText ?? "お問い合わせ",
    buttonUrl: data.hero.ctaHref ?? "/contact",
    buttonText2: "",
    buttonUrl2: "",
    imageUrl: data.hero.imageUrl ?? "",
  });

  // Problem
  if (data.problem?.items?.length) {
    sections.push({
      id: uid(),
      type: "problem",
      eyebrow: "よくある悩み",
      heading: data.problem.heading ?? "",
      subheading: "",
      items: data.problem.items.map((item) => ({
        icon: { kind: "emoji" as const, value: "" },
        title: item.title,
        desc: item.desc,
      })),
    });
  }

  // Solution
  if (data.solution) {
    sections.push({
      id: uid(),
      type: "solution",
      eyebrow: "解決策",
      heading: data.solution.heading ?? "",
      body: data.solution.body ?? "",
      items: (data.solution.points ?? []).map((p) => ({ text: p })),
      imageUrl: "",
      buttonText: "詳しくみる",
      buttonUrl: "/contact",
    });
  }

  // Features
  if (data.features?.items?.length) {
    const raw: FeatureItem[] = data.features.items.map((item) => ({
      icon: defaultIcon,
      title: item.title,
      desc: item.desc,
    }));
    while (raw.length < 6) raw.push({ icon: defaultIcon, title: "", desc: "" });
    sections.push({
      id: uid(),
      type: "features",
      heading: data.features.heading ?? "",
      subheading: "",
      items: raw.slice(0, 6) as [FeatureItem, FeatureItem, FeatureItem, FeatureItem, FeatureItem, FeatureItem],
    });
  }

  // Steps
  if (data.steps?.items?.length) {
    sections.push({
      id: uid(),
      type: "steps",
      heading: data.steps.heading ?? "",
      subheading: "",
      items: data.steps.items.map((item) => ({
        number: item.number,
        title: item.title,
        desc: item.desc,
      })),
    });
  }

  // Testimonials
  if (data.testimonials?.items?.length) {
    sections.push({
      id: uid(),
      type: "testimonials",
      heading: data.testimonials.heading ?? "",
      items: data.testimonials.items,
    });
  }

  // FAQ
  if (data.faq?.items?.length) {
    sections.push({
      id: uid(),
      type: "faq",
      heading: data.faq.heading ?? "",
      items: data.faq.items.map((item) => ({
        question: item.q,
        answer: item.a,
      })),
    });
  }

  // CTA
  if (data.cta) {
    sections.push({
      id: uid(),
      type: "cta",
      heading: data.cta.heading ?? "",
      body: data.cta.body ?? "",
      buttonText: data.cta.buttonText ?? "お問い合わせ",
      buttonUrl: data.cta.buttonHref ?? "/contact",
      buttonText2: "",
      buttonUrl2: "",
    });
  }

  // Footer
  if (data.footer) {
    sections.push({
      id: uid(),
      type: "footer",
      companyName: data.footer.companyName ?? "",
      address: data.footer.address ?? "",
    });
  }

  return sections;
}

function buildCanvasFromSections(data: SectionData, dna?: GlobalStyle): CanvasElement[] {
  const els: CanvasElement[] = [];
  const tk = resolveTokens(data, dna);

  // セクションごとにblockIdを切り替える
  let currentBlockId = uid();
  function add(el: Omit<CanvasElement, "id">): void {
    // 全幅の背景rectはzIndex:0に正規化してクリック干渉を防ぐ
    const normalized = (el.type === "rect" && el.x === 0 && el.width >= 1100)
      ? { ...el, zIndex: 0 }
      : el;
    els.push({ id: uid(), blockId: currentBlockId, ...normalized });
  }
  function nextSection() { currentBlockId = uid(); }

  const CW = 1200;
  let y = 0;

  // ── HERO template selection ──────────────────────────────────
  // Priority: heroLayout from URL analysis → designStyle → fallback
  // Color safety: dark-text templates (split/centered/typographic) need dark heroBg.
  //   If heroBg is light AND no dark alternative exists, fall back to heroLight.
  const heroBgWillBeDark = !isLight(tk.heroBgDark); // heroBgDark is always dark by design
  const tpl: HeroTpl = (() => {
    const style  = dna?.designStyle?.toLowerCase() ?? "";
    const notes  = (dna?.designNotes ?? "").toLowerCase();
    const layout = dna?.heroLayout ?? "";

    // URL解析のheroLayoutが有効なら従う（ただし色安全を優先）
    if (layout && ["split","centered","typographic","light"].includes(layout)) {
      const hl = layout as HeroTpl;
      // heroBgが明るすぎ + darkにできない場合はlightテンプレートへ
      if (hl !== "light" && !heroBgWillBeDark) return "light";
      return hl;
    }

    // designStyleから推定
    if (style === "minimal" || style === "corporate") return "light";
    if (style === "elegant" || notes.includes("上品") || notes.includes("高級")) return "typographic";
    if (style === "bold" || style === "playful" || notes.includes("ポップ") || notes.includes("かわいい")) return "centered";

    // 参考URLなしの場合: designNotesのキーワードで分岐、なければsplit
    if (notes.includes("シンプル") || notes.includes("清潔")) return "light";
    if (notes.includes("モダン") || notes.includes("スタイリッシュ")) return "typographic";
    return "split"; // safe default (always has dark bg via heroBgDark)
  })();

  if      (tpl === "centered")    y += heroCentered(data, tk, dna, y, CW, add);
  else if (tpl === "typographic") y += heroTypographic(data, tk, dna, y, CW, add);
  else if (tpl === "light")       y += heroLight(data, tk, dna, y, CW, add);
  else                            y += heroSplit(data, tk, dna, y, CW, add);

  nextSection(); // ── PROBLEM ─────────────────────────────────
  const H_PROB = 560;
  add({ type: "rect", x: 0, y, width: CW, height: H_PROB, style: { backgroundColor: data.problem.bgColor || "#F8FAFC" }, zIndex: 1 });
  add({ type: "text", x: 400, y: y + 56, width: 400, height: 32,
    html: `<div style="text-align:center"><span style="display:inline-block;background:#FEF2F2;color:#EF4444;padding:5px 18px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.22em;border:1px solid #FECACA">PROBLEM</span></div>`,
    style: {}, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 100, width: 1040, height: 64,
    html: data.problem.heading,
    style: { fontSize: 34, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  const probXs = [60, 430, 800];
  (data.problem.items ?? []).slice(0, 3).forEach((item, i) => {
    const cx = probXs[i];
    add({ type: "text", x: cx, y: y + 186, width: 340, height: 320,
      html: `<div style="height:320px;background:#fff;border-radius:${tk.cardR}px;border:1px solid #FEE2E2;box-shadow:0 4px 24px rgba(239,68,68,0.08);overflow:hidden;box-sizing:border-box">
        <div style="height:5px;background:linear-gradient(90deg,#EF4444,#F97316)"></div>
        <div style="padding:24px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
            <div style="min-width:40px;height:40px;border-radius:50%;background:#FEF2F2;border:1.5px solid #FCA5A5;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:#EF4444;flex-shrink:0">0${i+1}</div>
            <div style="font-size:15px;font-weight:700;color:#111827;line-height:1.35">${item.title}</div>
          </div>
          <div style="font-size:13px;color:#6B7280;line-height:1.8;margin-bottom:16px">${item.desc}</div>
          <div style="font-size:11px;font-weight:700;color:#EF4444;border-top:1px solid #FEE2E2;padding-top:12px">→ このお悩み、解決できます</div>
        </div>
      </div>`,
      style: {}, zIndex: 2 });
  });
  y += H_PROB;

  nextSection(); // ── SOLUTION ──────────────────────────────────────────────
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

  nextSection(); // ── FEATURES ──────────────────────────────────────────────
  const H_FEAT = 620;
  add({ type: "rect", x: 0, y, width: CW, height: H_FEAT, style: { backgroundColor: data.features.bgColor || tk.pageBg }, zIndex: 1 });
  add({ type: "text", x: 400, y: y + 56, width: 400, height: 32,
    html: `<div style="text-align:center"><span style="display:inline-block;background:${tk.labelColor}18;color:${tk.labelColor};padding:5px 18px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.22em;border:1px solid ${tk.labelColor}30">FEATURES</span></div>`,
    style: {}, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 100, width: 1040, height: 60,
    html: data.features.heading,
    style: { fontSize: 34, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  add({ type: "rect", x: 560, y: y + 170, width: 80, height: 4,
    style: { backgroundColor: tk.accent, borderRadius: 2 }, zIndex: 2 });
  const featXs = [60, 420, 780];
  const featRows = [y + 188, y + 406];
  const FEAT_COLORS = [tk.primary, tk.accent, "#7C3AED", "#059669", "#2563EB", "#DC2626"];
  (data.features.items ?? []).slice(0, 6).forEach((item, i) => {
    const row = Math.floor(i / 3);
    const col = i % 3;
    const cx = featXs[col];
    const cy = featRows[row];
    const color = FEAT_COLORS[i];
    const num = `0${i + 1}`;
    add({ type: "text", x: cx, y: cy, width: 320, height: 200,
      html: `<div style="height:200px;background:#fff;border-radius:${tk.cardR}px;border:1px solid #E5E7EB;box-shadow:0 4px 20px rgba(0,0,0,0.07);overflow:hidden;box-sizing:border-box">
        <div style="height:4px;background:linear-gradient(90deg,${color},${color}88)"></div>
        <div style="padding:18px 20px">
          <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
            <div style="min-width:36px;height:36px;border-radius:50%;background:${color}15;border:1.5px solid ${color}50;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;color:${color};flex-shrink:0">${num}</div>
            <div style="font-size:14px;font-weight:700;color:#111827;line-height:1.4;padding-top:3px">${item.title}</div>
          </div>
          <div style="font-size:12.5px;color:#6B7280;line-height:1.75;padding-left:48px">${item.desc}</div>
        </div>
      </div>`,
      style: {}, zIndex: 2 });
  });
  y += H_FEAT;

  nextSection(); // ── STEPS ─────────────────────────────────────────────────
  const H_STEPS = 500;
  add({ type: "rect", x: 0, y, width: CW, height: H_STEPS, style: { backgroundColor: data.steps.bgColor || tk.cardBg }, zIndex: 1 });
  add({ type: "text", x: 400, y: y + 56, width: 400, height: 32,
    html: `<div style="text-align:center"><span style="display:inline-block;background:${tk.labelColor}18;color:${tk.labelColor};padding:5px 18px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.22em;border:1px solid ${tk.labelColor}30">FLOW</span></div>`,
    style: {}, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 100, width: 1040, height: 60,
    html: data.steps.heading,
    style: { fontSize: 34, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  const stepXs = [60, 340, 620, 900];
  (data.steps.items ?? []).slice(0, 4).forEach((step, i) => {
    const sx = stepXs[i];
    if (i < 3) add({ type: "text", x: sx + 252, y: y + 200, width: 90, height: 40,
      html: `<div style="display:flex;align-items:center;justify-content:center;height:40px;font-size:22px;color:#CBD5E1;font-weight:300">→</div>`,
      style: {}, zIndex: 2 });
    add({ type: "text", x: sx, y: y + 168, width: 240, height: 280,
      html: `<div style="background:#fff;border-radius:${tk.cardR}px;border:1px solid #E5E7EB;box-shadow:0 2px 12px rgba(0,0,0,0.05);padding:24px 20px;box-sizing:border-box;text-align:center;height:280px">
        <div style="font-size:44px;font-weight:900;color:${tk.accent};line-height:1;margin-bottom:10px">${step.number}</div>
        <div style="width:36px;height:3px;background:${tk.accent};margin:0 auto 14px;border-radius:2px"></div>
        <div style="font-size:14px;font-weight:700;color:#111827;line-height:1.4;margin-bottom:10px">${step.title}</div>
        <div style="font-size:12.5px;color:#6B7280;line-height:1.7">${step.desc}</div>
      </div>`,
      style: {}, zIndex: 2 });
  });
  y += H_STEPS;

  nextSection(); // ── TESTIMONIALS ──────────────────────────────────────────
  const H_TESTI = 520;
  add({ type: "rect", x: 0, y, width: CW, height: H_TESTI, style: { backgroundColor: data.testimonials.bgColor || "#F8FAFC" }, zIndex: 1 });
  add({ type: "text", x: 400, y: y + 56, width: 400, height: 32,
    html: `<div style="text-align:center"><span style="display:inline-block;background:${tk.labelColor}18;color:${tk.labelColor};padding:5px 18px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.22em;border:1px solid ${tk.labelColor}30">VOICE</span></div>`,
    style: {}, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 100, width: 1040, height: 60,
    html: data.testimonials.heading,
    style: { fontSize: 34, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  const testiXs = [60, 430, 800];
  (data.testimonials.items ?? []).slice(0, 3).forEach((item, i) => {
    const tx = testiXs[i];
    const initials = item.name.slice(0, 1);
    const avatarBg = [tk.primary, tk.accent, "#7C3AED"][i];
    add({ type: "text", x: tx, y: y + 184, width: 320, height: 290,
      html: `<div style="height:290px;background:#fff;border-radius:${tk.cardR}px;border:1px solid #E5E7EB;box-shadow:0 4px 20px rgba(0,0,0,0.06);padding:24px 20px;box-sizing:border-box;display:flex;flex-direction:column">
        <div style="font-size:42px;font-weight:900;color:${tk.primary}25;line-height:1;margin-bottom:6px;font-family:Georgia,serif">"</div>
        <div style="font-size:13px;color:#374151;line-height:1.85;flex:1">${item.quote}</div>
        <div style="margin-top:14px;display:flex;align-items:center;gap:10px;border-top:1px solid #F3F4F6;padding-top:12px">
          <div style="width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,${avatarBg},${avatarBg}99);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;color:#fff;flex-shrink:0">${initials}</div>
          <div style="flex:1">
            <div style="font-size:12px;font-weight:700;color:#374151">${item.name}</div>
            <div style="font-size:10px;color:#9CA3AF;margin-top:1px">${item.role}</div>
          </div>
          <div style="font-size:11px;color:#F59E0B;letter-spacing:1px">★★★★★</div>
        </div>
      </div>`,
      style: {}, zIndex: 2 });
  });
  y += H_TESTI;

  nextSection(); // ── FAQ ───────────────────────────────────────────────────
  const H_FAQ = 580;
  add({ type: "rect", x: 0, y, width: CW, height: H_FAQ, style: { backgroundColor: data.faq.bgColor || tk.pageBg }, zIndex: 1 });
  add({ type: "text", x: 400, y: y + 56, width: 400, height: 32,
    html: `<div style="text-align:center"><span style="display:inline-block;background:${tk.labelColor}18;color:${tk.labelColor};padding:5px 18px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.22em;border:1px solid ${tk.labelColor}30">FAQ</span></div>`,
    style: {}, zIndex: 2 });
  add({ type: "text", x: 80, y: y + 100, width: 1040, height: 60,
    html: data.faq.heading,
    style: { fontSize: 34, fontWeight: dna?.headingWeight ?? 900, color: tk.textMain, textAlign: "center",
      ...(dna?.headingFont ? { fontFamily: `'${dna.headingFont}'` } : {}) }, zIndex: 2 });
  (data.faq.items ?? []).slice(0, 5).forEach((item, i) => {
    const fy = y + 180 + i * 82;
    add({ type: "text", x: 160, y: fy, width: 880, height: 76,
      html: `<div style="background:${i % 2 === 0 ? tk.cardBg : "#fff"};border-radius:${Math.min(tk.cardR,10)}px;border:1px solid #E5E7EB;padding:14px 20px;box-sizing:border-box;height:76px">
        <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:4px">
          <span style="min-width:24px;height:24px;border-radius:6px;background:${tk.primary};color:#fff;font-size:11px;font-weight:900;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px">Q</span>
          <div style="font-size:13.5px;font-weight:700;color:#111827;line-height:1.4">${item.q}</div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:12px;margin-left:0;padding-left:36px">
          <div style="font-size:12.5px;color:#6B7280;line-height:1.6">${item.a}</div>
        </div>
      </div>`,
      style: {}, zIndex: 2 });
  });
  y += H_FAQ;

  nextSection(); // ── CTA ───────────────────────────────────────────────────
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

  nextSection(); // ── FOOTER ────────────────────────────────────────────────
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
// タイムアウト設定: 1モデル12秒 × 最大2モデル = 24秒 → 30秒以内に収める
const MODEL_TIMEOUT_MS = 25000;

async function geminiFetch(
  systemPrompt: string,
  userPrompt: string,
  maxTokens = 4096,
  forceJson = false,
): Promise<string> {
  const generationConfig: Record<string, unknown> = { maxOutputTokens: maxTokens };
  if (forceJson) generationConfig.responseMimeType = "application/json";

  for (const model of GEMINI_MODELS) {
    try {
      const res = await fetch(
        `${GEMINI_BASE}/${model}:generateContent?key=${API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig,
          }),
          signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (text) return text;
        continue; // 空ならば次モデルへ
      }

      const errText = await res.text();
      // 過負荷系は即次モデルへ（リトライなし）
      const isRetryable = res.status === 503 || res.status === 429 ||
        errText.includes("UNAVAILABLE") || errText.includes("RESOURCE_EXHAUSTED");
      if (isRetryable) continue;
      // それ以外のエラー（400など）も次モデルへ
      continue;
    } catch {
      // タイムアウト・ネットワークエラー → 次モデルへ
      continue;
    }
  }
  throw new Error("AIサービスが混雑しています。しばらく待ってからやり直してください。");
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
  const { messages, phase, analysisResult, formData, designKey } = body as {
    messages?: Array<{ role: "user" | "assistant"; content: string }>;
    phase: "chat" | "generate" | "form-generate";
    analysisResult?: GlobalStyle;
    designKey?: string;
    formData?: { businessName: string; serviceDesc: string; target?: string; strengths?: string };
  };

  // ── Chat phase（ヒアリング会話）────────────────────────────────
  if (phase === "chat") {
    const history = messages ?? [];
    // 初回は自己紹介トリガー、以降は会話履歴
    const contents = history.length === 0
      ? [{ role: "user", parts: [{ text: "はじめてください" }] }]
      : history.map(m => ({
          role: m.role === "user" ? "user" : "model",
          parts: [{ text: m.content }],
        }));

    for (const model of ["gemini-2.5-flash", "gemini-2.5-pro"]) {
      try {
        const res = await fetch(
          `${GEMINI_BASE}/${model}:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: CHAT_SYSTEM }] },
              contents,
              generationConfig: { maxOutputTokens: 1024 },
            }),
            signal: AbortSignal.timeout(10000),
          }
        );
        if (!res.ok) continue;
        const data = await res.json();
        const reply: string = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        if (!reply) continue;
        const shouldGenerate = reply.includes("[GENERATE]");
        const designMatch = reply.match(/\[DESIGN:(\w+)\]/);
        const designKey = designMatch?.[1] ?? "";
        const cleanReply = reply.replace(/\[GENERATE\]/g, "").replace(/\[DESIGN:\w+\]/g, "").trim();
        return NextResponse.json({ reply: cleanReply, shouldGenerate, designKey });
      } catch { continue; }
    }
    return NextResponse.json({ error: "AIに接続できませんでした。" }, { status: 503 });
  }

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

  // デザイン決定: analysisResult(URL解析結果) > designKey(チャット自動選択) > デフォルト
  let effectiveDesign: GlobalStyle | undefined = analysisResult;
  if (!effectiveDesign && designKey && DESIGN_SYSTEMS[designKey]) {
    const { _desc: _ignored, ...ds } = DESIGN_SYSTEMS[designKey];
    effectiveDesign = ds as GlobalStyle;
  }

  // ── Gemini でサイトコンテンツ生成 ───────────────────────────
  let raw: string;
  try {
    raw = await geminiFetch(
      GENERATE_SYSTEM,
      buildGeneratePrompt(conversationText, effectiveDesign),
      4096,
      true, // forceJson: responseMimeType=application/json
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "生成に失敗しました" },
      { status: 500 }
    );
  }

  // JSON抽出（forceJson時はrawが直接JSON、念のためコードフェンスも試す）
  let jsonStr = raw.trim();
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) jsonStr = fenceMatch[1].trim();
  // それでもJSONオブジェクトが見つからない場合は { } を探す
  if (!jsonStr.startsWith("{")) {
    const objMatch = raw.match(/\{[\s\S]*\}/);
    if (objMatch) jsonStr = objMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonStr) as SectionData;

    if (!parsed.hero.imageUrl && parsed.hero.heroImagePrompt) {
      const prompt = encodeURIComponent(
        parsed.hero.heroImagePrompt + ", photorealistic, 4k, no watermark"
      );
      parsed.hero.imageUrl =
        `https://image.pollinations.ai/prompt/${prompt}?width=1080&height=1350&nologo=true&seed=${Date.now() % 9999}`;
    }

    const elements = buildCanvasFromSections(parsed, effectiveDesign);
    const sections = buildSectionsFromData(parsed);

    const config = {
      title:        parsed.title,
      primaryColor: effectiveDesign?.primaryColor || parsed.primaryColor,
      accentColor:  effectiveDesign?.accentColor  || parsed.accentColor,
      fontFamily:   parsed.fontFamily ?? "sans",
      catchCopy:    parsed.catchCopy ?? "",
      navLinks:     parsed.navLinks  ?? [],
      canvasWidth:  1200,
      elements,
      sections, pages: [], articles: [],
      globalStyle: effectiveDesign ?? undefined,
    };
    return NextResponse.json({ config });
  } catch {
    return NextResponse.json({ error: "AI生成に失敗しました。もう一度お試しください。", raw }, { status: 500 });
  }
}
