import { NextRequest, NextResponse } from "next/server";
import { GlobalStyle, CanvasElement, uid } from "@/types/site";

export const runtime = "edge";
export const maxDuration = 30;

const API_KEY      = process.env.ANTHROPIC_API_KEY ?? "";
const MODEL_CHAT   = "claude-haiku-4-5-20251001"; // チャット用（軽量・高速）
const MODEL_GEN    = "claude-haiku-4-5-20251001"; // Vercel Hobby 10s制限のためHaikuに統一

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

// ── 10-Expert Panel System Prompt ────────────────────────────
const GENERATE_SYSTEM = `あなたは、日本市場向けウェブサイト制作における10人の世界クラス専門家パネルです。
サイトを生成するたびに、必ず以下の①〜⑩を順番に思考・合議し、最高品質の成果物を納品してください。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
① 戦略コンサルタント（Plan the full website）
  「ウェブ戦略コンサルタントとして振る舞ってください。最適なページ構成、ターゲット分析、
   目標設定をコーディング前のロードマップとして作成してください。」
   → ターゲット像・ペルソナ・ページゴール・転換ポイントを整理する

② 構造設計（Create the homepage structure）
  「ウェブデザイナーとして振る舞ってください。ヒーロー、信頼、サービス、実績、CTAの
   黄金セクションを設計してください。」
   → 8セクション＋フッターの役割・情報量・視線の流れを最適化する

③ コピー執筆（Write homepage copy）
  「プロのコピーライターとして、インパクトのある見出し、3つのベネフィット、
   明確なCTAを執筆してください。」
   → ターゲットの"痛み"と"欲求"に直撃する言葉・数字・感情トリガーを使う
   → 数値は「ヒアリング内容から推測した具体的な値」を必ず使うこと（抽象的な〇〇は禁止）

④ ビジュアル提案（Design the visual style）
  「ブランドデザイナーとして、カラーパレット、フォント、余白の法則を定義してください。
   参考URLのDNAをここに反映させてください。」
   → 提供されたデザインDNAの色・フォント・余白・スタイルを全セクションに強制適用する
   → DNAがない場合は業種から最適な日本市場向けパレットを選定する

⑤ LPコード生成（Generate a landing page in code）
  「フロントエンドエンジニアとして、クリーンなHTML/CSSでレスポンシブなページを実装してください。」
   → 要素配置・サイズ・zIndexを正確に設計し、実装の完成度を上げる

⑥ サービス作成（Build a services page）
  「コンテンツストラテジストとして、各サービスのベネフィットと理想の顧客像を言語化してください。」
   → features・solutionセクションをサービス内容・顧客視点の言葉で具体化する

⑦ About作成（Create an About page）
  「ストーリーテラーとして、人間味のあるブランドストーリーと価値観を執筆してください。」
   → testimonials・cta・footerにブランドの想い・人間味を込める

⑧ SEO対策（Add SEO-friendly content）
  「SEOスペシャリストとして、見出し構造とキーワード配置を最適化してください。」
   → title・heading・eyebrow・body各フィールドに検索意図に合ったキーワードを自然配置する

⑨ UX改善（Improve the website UX）
  「UXデザイナーとして、レイアウトとナビゲーションの明快さをレビューし、自動修正してください。」
   → CTA配置・コントラスト・ナビゲーション・ユーザー導線を最終確認・修正する

⑩ コード修正（Fix and upgrade the code）
  「シニアエンジニアとして、アクセシビリティ向上とレスポンシブ対応の完成度を上げてください。」
   → フォントサイズ・コントラスト比・行間・文字間隔・数値の具体性を最終チェックし納品品質にする
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【絶対ルール】
1. 上記①〜⑩を必ず順番に思考し、各専門家の視点で品質を積み上げてから最終JSONを出力すること
2. 「小手先のテンプレート埋め込み」は禁止。ヒアリング内容からそのビジネス固有のコピー・
   構成・数値を0から生成すること。「〇〇件」「例：」などのプレースホルダー出力は厳禁
3. デザインDNAが提供された場合は④で必ず採用し、primaryColor・accentColor・hero.bgColor・
   各セクションbgColor・buttonBgColor・buttonRadiusをDNA値で上書きすること
4. 絵文字・記号（✅🎯⚡🔒💬🏆⚠️など）はすべてのフィールドで使用禁止
5. 出力形式は \`\`\`json ... \`\`\` のみ。思考メモはJSONブロックの直前に出力してよい`;

// ── Generate prompt builder ──────────────────────────────────
function buildGeneratePrompt(conversation: string, analysis?: GlobalStyle): string {
  const colorDNA = analysis ? `
━━ ④ ビジュアル提案：デザインDNA（参考サイトから抽出・全セクションに強制適用）━━
▼ カラーパレット（JSON出力時に以下の色を優先使用すること）
  primaryColor:    ${analysis.primaryColor    ?? "未取得"}
  accentColor:     ${analysis.accentColor     ?? "未取得"}
  heroBgColor:     ${analysis.heroBgColor     ?? "未取得"}
  bgColor:         ${analysis.bgColor         ?? "未取得"}
  cardBgColor:     ${analysis.cardBgColor     ?? "未取得"}
  textColor:       ${analysis.textColor       ?? "未取得"}
  buttonBgColor:   ${analysis.buttonBgColor   ?? "未取得"}
  buttonRadius:    ${analysis.buttonRadius    ?? "未取得"}

▼ タイポグラフィ
  headingFont:       ${analysis.headingFont       ?? "未取得"}
  bodyFont:          ${analysis.bodyFont          ?? "未取得"}
  h1Size:            ${analysis.h1Size            ?? "未取得"}
  headingWeight:     ${analysis.headingWeight     ?? "未取得"}
  headingLineHeight: ${analysis.headingLineHeight ?? "未取得"}

▼ スペーシング
  sectionPaddingY:  ${analysis.sectionPaddingY  ?? "未取得"}
  cardBorderRadius: ${analysis.cardBorderRadius ?? "未取得"}

▼ スタイル識別
  designStyle: ${analysis.designStyle ?? "未取得"}
  designNotes: ${analysis.designNotes ?? "未取得"}

【④の指示】上記の値をJSONの primaryColor / accentColor / hero.bgColor /
各セクション bgColor / buttonBgColor に反映させ、参考サイトの配色・雰囲気を完全に再現すること。` : `
━━ ④ ビジュアル提案：参考サイトDNA ━━
参考URL未入力。ヒアリングの業種・ターゲットに最適な日本市場向けカラーパレットを選定すること。`;

  return `【ヒアリング内容】
${conversation}
${colorDNA}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
【10人の専門家パネルへの指示】

以下の順序で各専門家の視点を積み上げ、合議の結果として最終JSONを出力してください：

① 戦略コンサルタント → ターゲット像・USP・ページゴール・転換ポイントを特定
② 構造設計 → hero/problem/solution/features/steps/testimonials/faq/cta/footerの役割と情報量を最適化
③ コピー執筆 → 全セクションのコピーをターゲットの痛みと欲求に基づいて執筆（数値・固有名詞を入れる）
④ ビジュアル → 上記デザインDNAをすべての色フィールドに反映（DNAがなければ業種最適パレットを選定）
⑤ LP実装 → 要素の役割・情報密度を実装目線で最終調整
⑥ サービス詳細 → features・solutionをサービス実態から深く具体化
⑦ ブランドストーリー → testimonials・cta・footerに人間味とブランドの想いを加える
⑧ SEO最適化 → title・heading・eyebrowに検索意図に沿ったキーワードを自然配置
⑨ UXレビュー → CTA導線・コントラスト・ナビ設計を最終確認・修正
⑩ 最終仕上げ → プレースホルダー残存チェック・数値具体性・デザインDNA反映の最終確認

合議結果を以下のJSON形式のみで出力すること（\`\`\`json ... \`\`\` に包む）：

\`\`\`json
{
  "title": "実際の社名・ブランド名（ヒアリングから推測・具体的に）",
  "primaryColor": "${analysis?.primaryColor ?? "#1E40AF"}",
  "accentColor":  "${analysis?.accentColor  ?? "#EA580C"}",
  "fontFamily": "sans",
  "catchCopy": "ターゲットの欲求に直撃するメインキャッチコピー（15〜25字）",
  "navLinks": [
    {"id": "nav1", "label": "選ばれる理由",   "url": "#features"},
    {"id": "nav2", "label": "ご利用の流れ",   "url": "#steps"},
    {"id": "nav3", "label": "よくある質問",   "url": "#faq"},
    {"id": "nav4", "label": "お問い合わせ",   "url": "#cta"}
  ],
  "hero": {
    "bgColor": "${analysis?.heroBgColor ?? analysis?.primaryColor ?? "#1E3A8A"}",
    "eyebrow": "権威ラベル（例：累計1,247件・業界歴15年・満足度98.3%）—具体的数値必須",
    "heading": "ターゲットの欲求に直撃するコピー（改行は\\\\n・2行構成）",
    "body": "ターゲットの悩みに共感し解決を示すサブコピー（2〜3文・具体的数値入り）",
    "ctaText": "今すぐ無料相談する",
    "ctaHref": "#cta",
    "heroImagePrompt": "professional japanese business photo related to [業種を英語で・具体的に], modern, clean, high quality, no text",
    "imageUrl": null,
    "stats": [
      {"value": "具体的数値", "label": "実績ラベル"},
      {"value": "具体的数値", "label": "品質ラベル"},
      {"value": "具体的数値", "label": "スピードラベル"}
    ]
  },
  "problem": {
    "bgColor": "${analysis?.bgColor ?? "#FFFFFF"}",
    "heading": "こんなお悩みはありませんか？",
    "items": [
      {"title": "ターゲットが思わず頷く具体的な悩み①", "desc": "悩みの詳細（35〜45字・リアルな状況描写）"},
      {"title": "具体的な悩み②", "desc": "詳細説明"},
      {"title": "具体的な悩み③", "desc": "詳細説明"}
    ]
  },
  "solution": {
    "bgColor": "${analysis?.cardBgColor ?? "#EEF2FF"}",
    "heading": "解決策の見出し（「だから私たちが解決します」型・業種に合わせて）",
    "body": "解決策の説明（2〜3文・具体的な手法・数値・信頼感のある表現）",
    "points": ["解決ポイント①（短く力強く）", "解決ポイント②", "解決ポイント③", "解決ポイント④"]
  },
  "features": {
    "bgColor": "${analysis?.bgColor ?? "#F9FAFB"}",
    "heading": "選ばれる6つの理由",
    "items": [
      {"title": "特徴①タイトル（絵文字なし・キーワード含む）", "desc": "説明（35〜45字・具体的数値入り）"},
      {"title": "特徴②タイトル", "desc": "説明（35〜45字）"},
      {"title": "特徴③タイトル", "desc": "説明（35〜45字）"},
      {"title": "特徴④タイトル", "desc": "説明（35〜45字）"},
      {"title": "特徴⑤タイトル", "desc": "説明（35〜45字）"},
      {"title": "特徴⑥タイトル", "desc": "説明（35〜45字）"}
    ]
  },
  "steps": {
    "bgColor": "${analysis?.bgColor ?? "#FFFFFF"}",
    "heading": "ご利用の流れ",
    "items": [
      {"number": "01", "title": "ステップ①（動詞で始める）", "desc": "説明（20〜30字・ユーザー目線）"},
      {"number": "02", "title": "ステップ②", "desc": "説明"},
      {"number": "03", "title": "ステップ③", "desc": "説明"},
      {"number": "04", "title": "ステップ④（成果・完了を示す）", "desc": "説明"}
    ]
  },
  "testimonials": {
    "bgColor": "${analysis?.cardBgColor ?? "#F9FAFB"}",
    "heading": "お客様の声",
    "items": [
      {"quote": "リアルな感想（50〜80字・具体的な変化・数値を含む）", "name": "○○様", "role": "具体的な職業・状況"},
      {"quote": "別角度からの感想（50〜80字）", "name": "△△様", "role": "具体的な状況"},
      {"quote": "感情的な共感ポイント（50〜80字）", "name": "□□様", "role": "具体的な状況"}
    ]
  },
  "faq": {
    "bgColor": "${analysis?.bgColor ?? "#FFFFFF"}",
    "heading": "よくある質問",
    "items": [
      {"q": "顧客が最も気になる疑問①（このビジネス固有の質問）", "a": "明確で安心感のある回答（40〜60字）"},
      {"q": "料金・費用に関する疑問②", "a": "回答（具体的金額感を含む）"},
      {"q": "期間・スピードに関する疑問③", "a": "回答（具体的期間を含む）"},
      {"q": "実績・信頼性に関する疑問④", "a": "回答（数値・事例を含む）"},
      {"q": "保証・サポートに関する疑問⑤", "a": "回答（安心できる内容）"}
    ]
  },
  "cta": {
    "bgColor": "${analysis?.buttonBgColor ?? analysis?.accentColor ?? "#EA580C"}",
    "heading": "今すぐ始めませんか？（緊急性・限定感を含む力強い見出し）",
    "body": "リスクゼロを強調する一文（初回無料・返金保証・特典など具体的に）",
    "buttonText": "無料相談はこちら →",
    "buttonHref": "/contact"
  },
  "footer": {
    "bgColor": "#0F172A",
    "companyName": "ヒアリングから推測した会社名・屋号（具体的に）",
    "address": "東京都〇〇区（推測・不明な場合は所在地を業種から推測）",
    "tel": "03-〇〇〇〇-〇〇〇〇",
    "email": "info@（会社名から推測）.co.jp",
    "copyright": "© 2025 会社名 All Rights Reserved."
  }
}
\`\`\`

【⑩ 最終確認チェックリスト】
□ すべてのフィールドがヒアリング内容に基づく固有のコピーになっているか？
□「〇〇件」「例：」などのプレースホルダーが一切残っていないか？
□ デザインDNAの色が primaryColor / accentColor / hero.bgColor に正確に反映されているか？
□ hero.stats の数値は推測でも具体的な値（「1,247件」「98.3%」）になっているか？`;
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

  // ── HERO: designStyle で自動テンプレート選択 ──────────────────
  const tpl: HeroTpl = (() => {
    const s = dna?.designStyle?.toLowerCase() ?? "";
    if (s === "minimal" || s === "corporate") return "light";
    if (s === "elegant")                       return "typographic";
    if (s === "bold" || s === "playful")       return "centered";
    return "split"; // modern / default
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

// ── Anthropic fetch with retry + model fallback ───────────────
const FALLBACK_MODELS: Record<string, string> = {
  "claude-sonnet-4-6":         "claude-haiku-4-5-20251001",
  "claude-haiku-4-5-20251001": "claude-haiku-4-5-20251001",
};

async function anthropicFetch(
  payload: Record<string, unknown>,
  retries = 4
): Promise<Response> {
  let currentPayload = { ...payload };

  for (let i = 0; i < retries; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(currentPayload),
    });
    if (res.ok) return res;

    const text = await res.text();
    const isOverloaded = res.status === 529 || text.includes("overloaded_error");

    if (isOverloaded && i < retries - 1) {
      const currentModel = currentPayload.model as string;
      const fallback = FALLBACK_MODELS[currentModel] ?? currentModel;
      // 2回目以降はフォールバックモデルに切り替え
      if (i >= 1 && fallback !== currentModel) {
        currentPayload = { ...currentPayload, model: fallback };
      }
      await new Promise(r => setTimeout(r, 2000 * (i + 1))); // 2s, 4s, 6s
      continue;
    }

    return new Response(text, { status: res.status });
  }
  return new Response(
    JSON.stringify({ error: "APIが混雑しています。数秒待って「やり直す」を押してください。" }),
    { status: 529, headers: { "Content-Type": "application/json" } }
  );
}

// ── Route handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY が設定されていません。.env.local に追加してください。" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { messages, phase, analysisResult } = body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    phase: "chat" | "generate";
    analysisResult?: GlobalStyle;
  };

  if (phase === "chat") {
    const upstream = await anthropicFetch({
      model: MODEL_CHAT, max_tokens: 512,
      system: CHAT_SYSTEM, messages, stream: true,
    });
    if (!upstream.ok) {
      const err = await upstream.text();
      return NextResponse.json({ error: err }, { status: upstream.status });
    }
    return new NextResponse(upstream.body, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
    });
  }

  // ── Generate phase ───────────────────────────────────────
  const conversationText = messages
    .map(m => `${m.role === "user" ? "ユーザー" : "AI"}: ${m.content}`)
    .join("\n\n");

  // ストリーミングで受け取り → 全文集積 → JSON解析
  const upstream = await anthropicFetch({
    model: MODEL_GEN, max_tokens: 4096,
    system: GENERATE_SYSTEM,
    messages: [{ role: "user", content: buildGeneratePrompt(conversationText, analysisResult) }],
    stream: true,
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return NextResponse.json({ error: err }, { status: upstream.status });
  }

  // ストリームを読み切ってテキストを集積
  const reader = upstream.body!.getReader();
  const decoder = new TextDecoder();
  let raw = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const payload = line.slice(6).trim();
      if (payload === "[DONE]") break;
      try {
        const evt = JSON.parse(payload);
        if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
          raw += evt.delta.text;
        }
      } catch { /* ignore */ }
    }
  }

  const match   = raw.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonStr = match ? match[1] : raw;

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
