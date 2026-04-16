"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { SiteConfig, CanvasElement, CanvasElementType, uid } from "@/types/site";

// ── Drag / resize types ──────────────────────────────────────
type ResizeHandle = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
type DragMode = { kind: "move" } | { kind: "resize"; handle: ResizeHandle };
interface DragState {
  mode: DragMode;
  elementId: string;
  startX: number; startY: number;
  origX: number; origY: number;
  origW: number; origH: number;
}

// ── Helpers ──────────────────────────────────────────────────
function styleToCSS(s: CanvasElement["style"], type: CanvasElementType): React.CSSProperties {
  const css: React.CSSProperties = {};
  if (s.fontSize)           css.fontSize          = s.fontSize;
  if (s.fontWeight)         css.fontWeight        = s.fontWeight;
  if (s.color)              css.color             = s.color;
  if (s.textAlign)          css.textAlign         = s.textAlign;
  if (s.lineHeight)         css.lineHeight        = s.lineHeight;
  if (s.letterSpacing)      css.letterSpacing     = s.letterSpacing;
  if (s.fontFamily)         css.fontFamily        = s.fontFamily;
  if (s.backgroundColor)    css.backgroundColor   = s.backgroundColor;
  if (s.backgroundImage) {
    css.backgroundImage    = `url(${s.backgroundImage})`;
    css.backgroundSize     = s.backgroundSize     || "cover";
    css.backgroundPosition = s.backgroundPosition || "center";
    css.backgroundRepeat   = s.backgroundRepeat   || "no-repeat";
  } else {
    if (s.backgroundSize)     css.backgroundSize    = s.backgroundSize;
    if (s.backgroundPosition) css.backgroundPosition = s.backgroundPosition;
  }
  if (s.borderRadius != null) css.borderRadius    = s.borderRadius;
  if (s.paddingX != null)   { css.paddingLeft = s.paddingX; css.paddingRight = s.paddingX; }
  if (s.paddingY != null)   { css.paddingTop  = s.paddingY; css.paddingBottom = s.paddingY; }
  if (s.border)             css.border            = s.border;
  if (s.boxShadow)          css.boxShadow         = s.boxShadow;
  if (s.opacity != null)    css.opacity           = s.opacity;
  if (type === "image" && s.objectFit) css.objectFit = s.objectFit;
  return css;
}

const HANDLE_POSITIONS: Record<ResizeHandle, { top: string; left: string; cursor: string }> = {
  n:  { top: "-5px",  left: "50%",  cursor: "n-resize"  },
  ne: { top: "-5px",  left: "100%", cursor: "ne-resize" },
  e:  { top: "50%",   left: "100%", cursor: "e-resize"  },
  se: { top: "100%",  left: "100%", cursor: "se-resize" },
  s:  { top: "100%",  left: "50%",  cursor: "s-resize"  },
  sw: { top: "100%",  left: "0%",   cursor: "sw-resize" },
  w:  { top: "50%",   left: "0%",   cursor: "w-resize"  },
  nw: { top: "0%",    left: "0%",   cursor: "nw-resize" },
};

// ── Quick element factory ────────────────────────────────────
function mkEl(
  type: CanvasElementType,
  x: number, y: number, w: number, h: number,
  rest: Partial<CanvasElement> = {}
): CanvasElement {
  return { id: uid(), type, x, y, width: w, height: h, style: {}, ...rest };
}

// ══════════════════════════════════════════════════════════════
// STOCK IMAGE LIBRARY
// ══════════════════════════════════════════════════════════════
const UNS = (id: string, w = 800, h = 500) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=80`;

interface StockImage { id: string; url: string; label: string; category: string; }

const STOCK_IMAGES: StockImage[] = [
  // 学習・教育
  { id:"u1",  url: UNS("1503676260728-1c00da094a0b"), label:"教室",       category:"学習・教育" },
  { id:"u2",  url: UNS("1434030216411-0b793f4b4173"), label:"勉強する学生", category:"学習・教育" },
  { id:"u3",  url: UNS("1524178232236-ddb28a1bbfb3"), label:"子どもと勉強", category:"学習・教育" },
  { id:"u4",  url: UNS("1513475382585-d06e58bcb0e0"), label:"本・参考書",   category:"学習・教育" },
  { id:"u5",  url: UNS("1456513080510-7bf3a84b82f8"), label:"図書館",       category:"学習・教育" },
  { id:"u6",  url: UNS("1488190211105-8dff86957e5d"), label:"ノートPC勉強", category:"学習・教育" },
  { id:"u7",  url: UNS("1491841651911-c44f07d27b38"), label:"女性・学習",   category:"学習・教育" },
  { id:"u8",  url: UNS("1509062522246-c50e40e6ad61"), label:"授業・講師",   category:"学習・教育" },
  // ビジネス・オフィス
  { id:"b1",  url: UNS("1497366216548-37526070297c"), label:"モダンオフィス", category:"ビジネス" },
  { id:"b2",  url: UNS("1497366811353-6e2b87ec0b95"), label:"会議室",         category:"ビジネス" },
  { id:"b3",  url: UNS("1522071820081-009f0129c71c"), label:"チームミーティング", category:"ビジネス" },
  { id:"b4",  url: UNS("1556761175-4b46a572b786"),    label:"ビジネス・PC",   category:"ビジネス" },
  { id:"b5",  url: UNS("1560472354-b33ff0ad50a0"),    label:"握手・契約",     category:"ビジネス" },
  { id:"b6",  url: UNS("1517245386807-bb43f82c33c4"), label:"ノートPC作業",   category:"ビジネス" },
  { id:"b7",  url: UNS("1551434678-e076c223a692"),    label:"チーム作業",     category:"ビジネス" },
  { id:"b8",  url: UNS("1504384308090-c894fdcc538d"), label:"コーディング",   category:"ビジネス" },
  // 人物・笑顔
  { id:"p1",  url: UNS("1573496359142-b8d87734a5a2"), label:"ビジネス男性",   category:"人物" },
  { id:"p2",  url: UNS("1507003211169-0a1dd7228f2d"), label:"男性・笑顔",     category:"人物" },
  { id:"p3",  url: UNS("1519085360753-af0119f7cbe7"), label:"女性・笑顔",     category:"人物" },
  { id:"p4",  url: UNS("1529156069898-49953e39b3ac"), label:"チーム・集合",   category:"人物" },
  { id:"p5",  url: UNS("1521737852567-6949f3f9f2b5"), label:"オフィス男性",   category:"人物" },
  { id:"p6",  url: UNS("1438761681033-6461ffad8d80"), label:"女性・プロフ",   category:"人物" },
  { id:"p7",  url: UNS("1507003211169-0a1dd7228f2d"), label:"男性ポートレート", category:"人物" },
  { id:"p8",  url: UNS("1580489944761-15a19d654956"), label:"女性ポートレート", category:"人物" },
  // 医療・健康
  { id:"m1",  url: UNS("1576091160399-112ba8d25d1d"), label:"医師・白衣",     category:"医療・健康" },
  { id:"m2",  url: UNS("1559839734-2b71ea197ec2"),    label:"医療チーム",     category:"医療・健康" },
  { id:"m3",  url: UNS("1576671081954-d9c07b253ca9"), label:"健康診断",       category:"医療・健康" },
  { id:"m4",  url: UNS("1584820927498-cad076eae54a"), label:"医療相談",       category:"医療・健康" },
  // 飲食・カフェ
  { id:"f1",  url: UNS("1414235077428-338989a2e8c0"), label:"レストラン",     category:"飲食・カフェ" },
  { id:"f2",  url: UNS("1493770348161-369560ae357d"), label:"料理・フード",   category:"飲食・カフェ" },
  { id:"f3",  url: UNS("1495214783159-3364efd730f5"), label:"コーヒー・カフェ", category:"飲食・カフェ" },
  { id:"f4",  url: UNS("1504674900247-0877df9cc836"), label:"カラフルフード", category:"飲食・カフェ" },
  // フィットネス・スポーツ
  { id:"s1",  url: UNS("1534438327276-14e5300c3a48"), label:"ジム・トレーニング", category:"フィットネス" },
  { id:"s2",  url: UNS("1517836357463-d25dfeac3438"), label:"フィットネス",   category:"フィットネス" },
  { id:"s3",  url: UNS("1540497077202-7c8a3999166f"), label:"ランニング",     category:"フィットネス" },
  { id:"s4",  url: UNS("1549060279-7e168fcee0c2"),    label:"ヨガ",           category:"フィットネス" },
  // 美容・ウェルネス
  { id:"w1",  url: UNS("1560750588-73207b1ef5b8"),    label:"美容サロン",     category:"美容・ウェルネス" },
  { id:"w2",  url: UNS("1516975080664-ed2fc6a32937"), label:"スパ・リラクゼーション", category:"美容・ウェルネス" },
  { id:"w3",  url: UNS("1487412947147-5cebf100d293"), label:"エステ",         category:"美容・ウェルネス" },
  // 自然・風景
  { id:"n1",  url: UNS("1506905925346-21bda4d32df4"), label:"山・自然",       category:"自然・風景" },
  { id:"n2",  url: UNS("1501854140801-50d01698950b"), label:"森・緑",         category:"自然・風景" },
  { id:"n3",  url: UNS("1464822759023-fed622ff2c3b"), label:"空・青空",       category:"自然・風景" },
  { id:"n4",  url: UNS("1523348837708-15d4a09cfac2"), label:"海・波",         category:"自然・風景" },
  // テクノロジー・IT
  { id:"t1",  url: UNS("1518770660439-4636190af475"), label:"PC・デスク",     category:"テクノロジー" },
  { id:"t2",  url: UNS("1461749280684-dccba630e2f6"), label:"プログラミング", category:"テクノロジー" },
  { id:"t3",  url: UNS("1519389950473-47ba0277781c"), label:"チーム開発",     category:"テクノロジー" },
  { id:"t4",  url: UNS("1563986768609-322da13575f3"), label:"スマートフォン", category:"テクノロジー" },
  // 建物・空間
  { id:"r1",  url: UNS("1560185007-cde9f3bbbecd"),    label:"モダン建築",     category:"建物・空間" },
  { id:"r2",  url: UNS("1558618666-fcd25c85cd64"),    label:"インテリア",     category:"建物・空間" },
  { id:"r3",  url: UNS("1486325212027-8081e485255e"), label:"ビル外観",       category:"建物・空間" },
  { id:"r4",  url: UNS("1493809842364-781f0d5d0b0e"), label:"住宅・不動産",   category:"建物・空間" },
];

const IMG_CATEGORIES = ["すべて", ...Array.from(new Set(STOCK_IMAGES.map(i => i.category)))];

// ══════════════════════════════════════════════════════════════
// BLOCK TEMPLATES
// ══════════════════════════════════════════════════════════════
type BlockCategory = "ヒーロー" | "コンテンツ" | "実績・声" | "CTA・その他" | "パーツ";

interface BlockTemplate {
  id: string;
  name: string;
  desc: string;
  category: BlockCategory;
  emoji: string;
  thumb: {
    bg: string;
    accent: string;
    layout: "center" | "split-left" | "split-right" | "image-bg" | "minimal" | "cards" | "neon" | "badge" | "stats-row";
  };
  create: (baseY: number, CW: number) => CanvasElement[];
}

const BLOCK_TEMPLATES: BlockTemplate[] = [
  // ── Hero: シンプル ──
  {
    id: "hero-simple", name: "ヒーロー（シンプル）", desc: "ダーク背景・中央テキスト", category: "ヒーロー", emoji: "🚀",
    thumb: { bg: "#1E3A5F", accent: "#3B82F6", layout: "center" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 640, { zIndex: 0, style: { backgroundColor: "#1E3A5F" } }),
      mkEl("text", Math.round(CW/2-300), y+100, 600, 44, { html: "キャッチコピーをここに入力", zIndex: 2, style: { fontSize: 13, color: "#93C5FD", textAlign: "center", letterSpacing: "0.15em", fontWeight: "600" } }),
      mkEl("text", Math.round(CW/2-460), y+158, 920, 130, { html: "メインの見出しを<br>ここに入力してください", zIndex: 2, style: { fontSize: 60, color: "#FFFFFF", textAlign: "center", fontWeight: "bold", lineHeight: 1.2 } }),
      mkEl("text", Math.round(CW/2-340), y+310, 680, 80, { html: "サービスの魅力を2〜3行で説明してください。読者の悩みに共感し、解決策を示唆する文章が効果的です。", zIndex: 2, style: { fontSize: 17, color: "#CBD5E1", textAlign: "center", lineHeight: 1.8 } }),
      mkEl("button", Math.round(CW/2-150), y+430, 300, 64, { html: "無料で始める →", href: "#", zIndex: 2, style: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#3B82F6", borderRadius: 8, textAlign: "center" } }),
    ],
  },
  // ── Hero: グラデーション ──
  {
    id: "hero-gradient", name: "ヒーロー（ダーク）", desc: "ダーク・デュアルCTA", category: "ヒーロー", emoji: "✨",
    thumb: { bg: "#0F172A", accent: "#7C3AED", layout: "center" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 680, { zIndex: 0, style: { backgroundColor: "#0F172A" } }),
      mkEl("rect", CW-440, y-80, 520, 520, { zIndex: 1, style: { backgroundColor: "#7C3AED", borderRadius: 999, opacity: 0.18 } }),
      mkEl("rect", -80, y+240, 400, 400, { zIndex: 1, style: { backgroundColor: "#2563EB", borderRadius: 999, opacity: 0.15 } }),
      mkEl("text", Math.round(CW/2-220), y+110, 440, 36, { html: "〇〇業界No.1のサービス", zIndex: 3, style: { fontSize: 12, color: "#A78BFA", textAlign: "center", letterSpacing: "0.22em", fontWeight: "700" } }),
      mkEl("text", Math.round(CW/2-500), y+162, 1000, 150, { html: "課題を解決する<br>革新的なソリューション", zIndex: 3, style: { fontSize: 64, color: "#FFFFFF", textAlign: "center", fontWeight: "bold", lineHeight: 1.2 } }),
      mkEl("text", Math.round(CW/2-340), y+335, 680, 70, { html: "貴社の〇〇を劇的に改善します。導入実績500社以上、顧客満足度98%。", zIndex: 3, style: { fontSize: 17, color: "#94A3B8", textAlign: "center", lineHeight: 1.8 } }),
      mkEl("button", Math.round(CW/2-215), y+445, 200, 60, { html: "資料ダウンロード", href: "#", zIndex: 3, style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#7C3AED", borderRadius: 8, textAlign: "center" } }),
      mkEl("button", Math.round(CW/2+15), y+445, 185, 60, { html: "お問い合わせ", href: "#", zIndex: 3, style: { fontSize: 15, fontWeight: "600", color: "#FFFFFF", backgroundColor: "transparent", borderRadius: 8, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.35)" } }),
    ],
  },
  // ── Hero: 2カラム ──
  {
    id: "hero-split", name: "ヒーロー（2カラム）", desc: "白背景・左テキスト右画像", category: "ヒーロー", emoji: "📐",
    thumb: { bg: "#F8FAFC", accent: "#1E40AF", layout: "split-left" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 600, { zIndex: 0, style: { backgroundColor: "#F8FAFC" } }),
      mkEl("text", 80, y+100, 80, 24, { html: "SOLUTION", zIndex: 2, style: { fontSize: 10, color: "#3B82F6", letterSpacing: "0.22em", fontWeight: "700" } }),
      mkEl("text", 80, y+140, 520, 160, { html: "見出しは<br>2〜3行が<br>最も効果的", zIndex: 2, style: { fontSize: 52, color: "#0F172A", fontWeight: "bold", lineHeight: 1.22 } }),
      mkEl("text", 80, y+325, 500, 80, { html: "サービスの特長と価値をここに記述します。顧客のベネフィットに焦点を当てた文章が効果的です。", zIndex: 2, style: { fontSize: 15, color: "#64748B", lineHeight: 1.85 } }),
      mkEl("button", 80, y+440, 210, 56, { html: "詳しくみる →", href: "#", zIndex: 2, style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#1E40AF", borderRadius: 8, textAlign: "center" } }),
      mkEl("image", Math.round(CW/2)+40, y+40, Math.round(CW/2)-80, 520, { zIndex: 2, style: { borderRadius: 16, objectFit: "cover", backgroundColor: "#E2E8F0" } }),
    ],
  },
  // ── Hero: 背景画像フル ──
  {
    id: "hero-image-full", name: "ヒーロー（背景画像）", desc: "実写画像BG・テキストオーバーレイ", category: "ヒーロー", emoji: "🌄",
    thumb: { bg: "#334155", accent: "#F59E0B", layout: "image-bg" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 660, { zIndex: 0, style: { backgroundColor: "#1a2535", backgroundImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80", backgroundSize: "cover", backgroundPosition: "center" } }),
      mkEl("rect", 0, y, CW, 660, { zIndex: 1, style: { backgroundColor: "rgba(0,0,0,0.55)" } }),
      mkEl("rect", 64, y+100, 160, 3, { zIndex: 3, style: { backgroundColor: "#F59E0B" } }),
      mkEl("text", 64, y+116, 400, 20, { html: "PREMIUM QUALITY", zIndex: 3, style: { fontSize: 11, color: "#F59E0B", letterSpacing: "0.28em", fontWeight: "700" } }),
      mkEl("text", 64, y+152, 560, 160, { html: "最高品質を、<br>あなたの手に。", zIndex: 3, style: { fontSize: 62, color: "#FFFFFF", fontWeight: "900", lineHeight: 1.18 } }),
      mkEl("text", 64, y+328, 500, 80, { html: "業界トップクラスのクオリティで<br>お客様のビジネスを加速させます。", zIndex: 3, style: { fontSize: 15, color: "rgba(255,255,255,0.82)", lineHeight: 1.85 } }),
      mkEl("button", 64, y+430, 220, 58, { html: "サービスを見る", href: "#", zIndex: 3, style: { fontSize: 16, fontWeight: "bold", color: "#1a2535", backgroundColor: "#F59E0B", borderRadius: 8, textAlign: "center" } }),
      mkEl("rect", 740, y+140, 260, 120, { zIndex: 3, style: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.2)" } }),
      mkEl("text", 760, y+158, 220, 80, { html: "<div style='font-size:42px;font-weight:900;color:#FFFFFF;line-height:1'>No.1</div><div style='font-size:12px;color:rgba(255,255,255,0.7);margin-top:8px'>顧客満足度</div>", zIndex: 4, style: {} }),
      mkEl("rect", 740, y+280, 260, 120, { zIndex: 3, style: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.2)" } }),
      mkEl("text", 760, y+298, 220, 80, { html: "<div style='font-size:42px;font-weight:900;color:#FFFFFF;line-height:1'>15年</div><div style='font-size:12px;color:rgba(255,255,255,0.7);margin-top:8px'>業界実績</div>", zIndex: 4, style: {} }),
      mkEl("rect", 740, y+420, 260, 120, { zIndex: 3, style: { backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.2)" } }),
      mkEl("text", 760, y+438, 220, 80, { html: "<div style='font-size:42px;font-weight:900;color:#FFFFFF;line-height:1'>98%</div><div style='font-size:12px;color:rgba(255,255,255,0.7);margin-top:8px'>継続率</div>", zIndex: 4, style: {} }),
    ],
  },
  // ── Hero: 左画像右テキスト ──
  {
    id: "hero-image-split", name: "ヒーロー（左画像）", desc: "左半分画像・右テキスト", category: "ヒーロー", emoji: "🖼️",
    thumb: { bg: "#0F172A", accent: "#06B6D4", layout: "split-right" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 680, { zIndex: 0, style: { backgroundColor: "#0F172A" } }),
      mkEl("rect", 0, y, Math.round(CW*0.48), 680, { zIndex: 1, style: { backgroundColor: "#1E293B", backgroundImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80", backgroundSize: "cover", backgroundPosition: "center" } }),
      mkEl("text", Math.round(CW*0.54), y+100, 440, 24, { html: "NEXT GENERATION", zIndex: 3, style: { fontSize: 11, color: "#06B6D4", letterSpacing: "0.25em", fontWeight: "700" } }),
      mkEl("text", Math.round(CW*0.54), y+140, 490, 180, { html: "未来を切り拓く<br>テクノロジー", zIndex: 3, style: { fontSize: 56, color: "#FFFFFF", fontWeight: "900", lineHeight: 1.22 } }),
      mkEl("text", Math.round(CW*0.54), y+338, 460, 80, { html: "最先端のテクノロジーで、あなたのビジネスを次のステージへ。実績800社以上の信頼と技術力でご支援します。", zIndex: 3, style: { fontSize: 15, color: "rgba(255,255,255,0.72)", lineHeight: 1.88 } }),
      mkEl("button", Math.round(CW*0.54), y+444, 220, 58, { html: "無料相談を予約する", href: "#", zIndex: 3, style: { fontSize: 14, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#06B6D4", borderRadius: 8, textAlign: "center" } }),
      mkEl("button", Math.round(CW*0.54)+234, y+444, 170, 58, { html: "実績を見る", href: "#", zIndex: 3, style: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", backgroundColor: "transparent", borderRadius: 8, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.3)" } }),
      mkEl("text", Math.round(CW*0.54), y+550, 150, 70, { html: `<div style='font-size:26px;font-weight:900;color:#FFFFFF'>800社+</div><div style='font-size:10px;color:rgba(255,255,255,0.55);margin-top:4px'>導入実績</div>`, zIndex: 3, style: {} }),
      mkEl("text", Math.round(CW*0.54)+170, y+550, 150, 70, { html: `<div style='font-size:26px;font-weight:900;color:#FFFFFF'>99%</div><div style='font-size:10px;color:rgba(255,255,255,0.55);margin-top:4px'>稼働率</div>`, zIndex: 3, style: {} }),
      mkEl("text", Math.round(CW*0.54)+340, y+550, 150, 70, { html: `<div style='font-size:26px;font-weight:900;color:#FFFFFF'>24h</div><div style='font-size:10px;color:rgba(255,255,255,0.55);margin-top:4px'>サポート</div>`, zIndex: 3, style: {} }),
    ],
  },
  // ── Hero: グラデーションメッシュ ──
  {
    id: "hero-gradient-mesh", name: "ヒーロー（グラデーション）", desc: "カラフル重なり・実績カード", category: "ヒーロー", emoji: "🎨",
    thumb: { bg: "#0D1B2A", accent: "#FF6B6B", layout: "center" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 700, { zIndex: 0, style: { backgroundColor: "#0D1B2A" } }),
      mkEl("rect", -100, y+50, 500, 500, { zIndex: 1, style: { backgroundColor: "#FF6B6B", borderRadius: 999, opacity: 0.15 } }),
      mkEl("rect", CW-300, y+100, 480, 480, { zIndex: 1, style: { backgroundColor: "#4ECDC4", borderRadius: 999, opacity: 0.12 } }),
      mkEl("rect", Math.round(CW/2)-200, y+300, 400, 400, { zIndex: 1, style: { backgroundColor: "#45B7D1", borderRadius: 999, opacity: 0.1 } }),
      mkEl("text", 80, y+110, CW-160, 30, { html: "INNOVATE · TRANSFORM · GROW", zIndex: 3, style: { fontSize: 11, color: "rgba(255,255,255,0.45)", textAlign: "center", letterSpacing: "0.3em" } }),
      mkEl("text", 80, y+158, CW-160, 180, { html: "ビジネスを変革する<br>最先端のソリューション", zIndex: 3, style: { fontSize: 60, color: "#FFFFFF", fontWeight: "900", textAlign: "center", lineHeight: 1.2 } }),
      mkEl("text", 200, y+360, CW-400, 76, { html: "私たちのソリューションで、あなたのビジネスは新たなステージへ。実績500社以上の信頼と実績でご支援します。", zIndex: 3, style: { fontSize: 16, color: "rgba(255,255,255,0.72)", textAlign: "center", lineHeight: 1.88 } }),
      mkEl("button", Math.round(CW/2)-230, y+464, 210, 60, { html: "無料で始める", href: "#", zIndex: 3, style: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#FF6B6B", borderRadius: 999, textAlign: "center" } }),
      mkEl("button", Math.round(CW/2)+20, y+464, 190, 60, { html: "詳しく見る", href: "#", zIndex: 3, style: { fontSize: 15, fontWeight: "600", color: "#FFFFFF", backgroundColor: "transparent", borderRadius: 999, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.3)" } }),
      mkEl("rect", 60, y+580, 240, 80, { zIndex: 3, style: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" } }),
      mkEl("text", 80, y+594, 200, 60, { html: "<span style='font-size:28px;font-weight:900;color:#4ECDC4'>500社+</span> <span style='font-size:11px;color:rgba(255,255,255,0.55)'>累計導入</span>", zIndex: 4, style: { lineHeight: 1.6 } }),
      mkEl("rect", 320, y+580, 240, 80, { zIndex: 3, style: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" } }),
      mkEl("text", 340, y+594, 200, 60, { html: "<span style='font-size:28px;font-weight:900;color:#FF6B6B'>98%</span> <span style='font-size:11px;color:rgba(255,255,255,0.55)'>顧客満足度</span>", zIndex: 4, style: { lineHeight: 1.6 } }),
      mkEl("rect", 580, y+580, 240, 80, { zIndex: 3, style: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" } }),
      mkEl("text", 600, y+594, 200, 60, { html: "<span style='font-size:28px;font-weight:900;color:#45B7D1'>24h</span> <span style='font-size:11px;color:rgba(255,255,255,0.55)'>サポート対応</span>", zIndex: 4, style: { lineHeight: 1.6 } }),
    ],
  },
  // ── Hero: 全面写真（教育系・sorajuku風）──
  {
    id: "hero-fullbleed-edu", name: "ヒーロー（全面写真・教育）", desc: "写真フル+グラデオーバーレイ", category: "ヒーロー", emoji: "📸",
    thumb: { bg: "#1E3A5F", accent: "#FCD34D", layout: "image-bg" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 680, { zIndex: 0, style: { backgroundColor: "#1a2535", backgroundImage: UNS("1503676260728-1c00da094a0b", 1200, 680), backgroundSize: "cover", backgroundPosition: "center" } }),
      mkEl("rect", 0, y, CW, 680, { zIndex: 1, style: { backgroundColor: "rgba(15,30,60,0.65)" } }),
      mkEl("rect", 0, y+580, CW, 100, { zIndex: 1, style: { backgroundColor: "rgba(15,30,60,0.4)" } }),
      mkEl("text", Math.round(CW/2-240), y+110, 480, 34, { html: `<div style='display:inline-flex;align-items:center;gap:8px;background:rgba(252,211,77,0.18);border:1px solid rgba(252,211,77,0.5);border-radius:999px;padding:6px 18px;font-size:11px;font-weight:700;color:#FCD34D;letter-spacing:0.2em'>★ 業界実績No.1</div>`, zIndex: 3, style: { textAlign: "center" } }),
      mkEl("text", 80, y+160, CW-160, 160, { html: "「わかる」を「できる」へ<br>最高の学びを、あなたに。", zIndex: 3, style: { fontSize: 58, color: "#FFFFFF", fontWeight: "900", textAlign: "center", lineHeight: 1.22 } }),
      mkEl("text", 200, y+340, CW-400, 72, { html: "現役プロ講師による完全個別指導。目標に合わせた学習計画で、確実に成果を出します。", zIndex: 3, style: { fontSize: 16, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 1.85 } }),
      mkEl("button", Math.round(CW/2)-220, y+442, 210, 60, { html: "無料体験を申し込む", href: "#", zIndex: 3, style: { fontSize: 15, fontWeight: "bold", color: "#1a2535", backgroundColor: "#FCD34D", borderRadius: 999, textAlign: "center" } }),
      mkEl("button", Math.round(CW/2)+10, y+442, 190, 60, { html: "詳しく見る", href: "#", zIndex: 3, style: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", backgroundColor: "transparent", borderRadius: 999, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.4)" } }),
      mkEl("text", 60, y+556, 260, 80, { html: `<div style='text-align:center'><div style='font-size:34px;font-weight:900;color:#FCD34D;line-height:1'>10万+</div><div style='font-size:11px;color:rgba(255,255,255,0.65);margin-top:4px'>累計受講者数</div></div>`, zIndex: 3, style: {} }),
      mkEl("text", 370, y+556, 260, 80, { html: `<div style='text-align:center'><div style='font-size:34px;font-weight:900;color:#FCD34D;line-height:1'>89%</div><div style='font-size:11px;color:rgba(255,255,255,0.65);margin-top:4px'>成績向上率</div></div>`, zIndex: 3, style: {} }),
      mkEl("text", 680, y+556, 260, 80, { html: `<div style='text-align:center'><div style='font-size:34px;font-weight:900;color:#FCD34D;line-height:1'>3日</div><div style='font-size:11px;color:rgba(255,255,255,0.65);margin-top:4px'>で効果を実感</div></div>`, zIndex: 3, style: {} }),
      mkEl("text", 960, y+556, 200, 80, { html: `<div style='text-align:center'><div style='font-size:34px;font-weight:900;color:#FCD34D;line-height:1'>24h</div><div style='font-size:11px;color:rgba(255,255,255,0.65);margin-top:4px'>サポート対応</div></div>`, zIndex: 3, style: {} }),
    ],
  },
  // ── Hero: 白背景クリーン（ペライチ風）──
  {
    id: "hero-clean-white", name: "ヒーロー（クリーン白）", desc: "白地+写真+シンプルテキスト", category: "ヒーロー", emoji: "🤍",
    thumb: { bg: "#FFFFFF", accent: "#2563EB", layout: "split-left" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 640, { zIndex: 0, style: { backgroundColor: "#FFFFFF" } }),
      mkEl("rect", 0, y, CW, 640, { zIndex: 0, style: { backgroundColor: "#EFF6FF" } }),
      mkEl("rect", 600, y, 600, 640, { zIndex: 1, style: { backgroundColor: "#DBEAFE", backgroundImage: UNS("1434030216411-0b793f4b4173", 600, 640), backgroundSize: "cover", backgroundPosition: "center top", borderRadius: 0 } }),
      mkEl("rect", 0, y, 80, 640, { zIndex: 2, style: { backgroundColor: "#EFF6FF" } }),
      mkEl("rect", 560, y, 120, 640, { zIndex: 2, style: { backgroundColor: "#EFF6FF", borderRadius: "0 60px 60px 0" } }),
      mkEl("text", 80, y+100, 420, 28, { html: `<span style='background:#DBEAFE;color:#2563EB;padding:5px 16px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.18em'>完全無料体験実施中</span>`, zIndex: 3, style: {} }),
      mkEl("text", 80, y+148, 480, 180, { html: "成績アップを<br>あなたに。", zIndex: 3, style: { fontSize: 58, color: "#0F172A", fontWeight: "900", lineHeight: 1.2 } }),
      mkEl("text", 80, y+346, 460, 80, { html: "一人ひとりに合ったマンツーマン指導で、苦手を克服。全国どこからでもオンラインで受講可能です。", zIndex: 3, style: { fontSize: 15, color: "#475569", lineHeight: 1.88 } }),
      mkEl("button", 80, y+456, 220, 58, { html: "無料体験を申し込む", href: "#", zIndex: 3, style: { fontSize: 14, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#2563EB", borderRadius: 8, textAlign: "center" } }),
      mkEl("button", 312, y+456, 160, 58, { html: "詳しく見る", href: "#", zIndex: 3, style: { fontSize: 14, fontWeight: "600", color: "#2563EB", backgroundColor: "transparent", borderRadius: 8, textAlign: "center", border: "1.5px solid #93C5FD" } }),
      mkEl("text", 80, y+556, 440, 48, { html: `<div style='display:flex;gap:24px'><span><b style='font-size:22px;color:#2563EB'>10万+</b> <span style='font-size:11px;color:#94A3B8'>受講者</span></span><span><b style='font-size:22px;color:#2563EB'>98%</b> <span style='font-size:11px;color:#94A3B8'>満足度</span></span><span><b style='font-size:22px;color:#2563EB'>創業15年</b> <span style='font-size:11px;color:#94A3B8'>の実績</span></span></div>`, zIndex: 3, style: {} }),
    ],
  },
  // ── Hero: 斜め分割（ダイナミック）──
  {
    id: "hero-diagonal", name: "ヒーロー（斜め分割）", desc: "ダイナミック・斜め構図", category: "ヒーロー", emoji: "⚡",
    thumb: { bg: "#1E40AF", accent: "#F59E0B", layout: "split-right" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 680, { zIndex: 0, style: { backgroundColor: "#1E3A8A" } }),
      mkEl("rect", Math.round(CW*0.42), y, Math.round(CW*0.58), 680, { zIndex: 1, style: { backgroundColor: "#DBEAFE", backgroundImage: UNS("1522071820081-009f0129c71c", 700, 680), backgroundSize: "cover", backgroundPosition: "center" } }),
      mkEl("text", 64, y+108, 500, 28, { html: "PROFESSIONAL SERVICE", zIndex: 3, style: { fontSize: 10, color: "#93C5FD", letterSpacing: "0.3em", fontWeight: "700" } }),
      mkEl("text", 64, y+150, 520, 200, { html: "プロが支える<br>あなたの成功。", zIndex: 3, style: { fontSize: 60, color: "#FFFFFF", fontWeight: "900", lineHeight: 1.18 } }),
      mkEl("text", 64, y+368, 460, 80, { html: "業界トップクラスの専門家チームが、あなたのビジネスを最速で成長させます。まずは無料でご相談ください。", zIndex: 3, style: { fontSize: 15, color: "#BFDBFE", lineHeight: 1.88 } }),
      mkEl("button", 64, y+472, 220, 58, { html: "無料相談を予約", href: "#", zIndex: 3, style: { fontSize: 15, fontWeight: "bold", color: "#1E3A8A", backgroundColor: "#F59E0B", borderRadius: 8, textAlign: "center" } }),
      mkEl("button", 296, y+472, 170, 58, { html: "実績を見る", href: "#", zIndex: 3, style: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", backgroundColor: "transparent", borderRadius: 8, textAlign: "center", border: "1.5px solid rgba(255,255,255,0.3)" } }),
      mkEl("text", 64, y+574, 420, 60, { html: `<div style='display:flex;gap:28px'><div><div style='font-size:28px;font-weight:900;color:#F59E0B'>500社+</div><div style='font-size:10px;color:#93C5FD;margin-top:2px'>導入実績</div></div><div><div style='font-size:28px;font-weight:900;color:#F59E0B'>99%</div><div style='font-size:10px;color:#93C5FD;margin-top:2px'>継続率</div></div><div><div style='font-size:28px;font-weight:900;color:#F59E0B'>10年+</div><div style='font-size:10px;color:#93C5FD;margin-top:2px'>業界実績</div></div></div>`, zIndex: 3, style: {} }),
    ],
  },
  // ── Hero: マガジン風（大見出し）──
  {
    id: "hero-magazine", name: "ヒーロー（マガジン風）", desc: "超大文字・オーバーラップ", category: "ヒーロー", emoji: "📰",
    thumb: { bg: "#F8FAFC", accent: "#DC2626", layout: "split-right" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 700, { zIndex: 0, style: { backgroundColor: "#F8FAFC" } }),
      mkEl("rect", Math.round(CW*0.5), y+40, Math.round(CW*0.46), 560, { zIndex: 1, style: { borderRadius: 20, backgroundColor: "#E2E8F0", backgroundImage: UNS("1560472354-b33ff0ad50a0", 560, 560), backgroundSize: "cover", backgroundPosition: "center" } }),
      mkEl("text", 60, y+72, CW*0.52, 240, { html: "あなたの課題を<br>解決する。", zIndex: 3, style: { fontSize: 72, color: "#0F172A", fontWeight: "900", lineHeight: 1.08, letterSpacing: "-0.02em" } }),
      mkEl("rect", 60, y+328, 56, 6, { zIndex: 3, style: { backgroundColor: "#DC2626", borderRadius: 3 } }),
      mkEl("text", 60, y+354, 440, 80, { html: "業界最高水準のサービスで、お客様のビジネスを次のステージへ。まずは気軽にお問い合わせください。", zIndex: 3, style: { fontSize: 15, color: "#475569", lineHeight: 1.88 } }),
      mkEl("button", 60, y+458, 220, 58, { html: "無料相談はこちら", href: "#", zIndex: 3, style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#DC2626", borderRadius: 8, textAlign: "center" } }),
      mkEl("button", 292, y+458, 170, 58, { html: "サービス一覧", href: "#", zIndex: 3, style: { fontSize: 14, fontWeight: "600", color: "#DC2626", backgroundColor: "transparent", borderRadius: 8, textAlign: "center", border: "1.5px solid #FECACA" } }),
      mkEl("text", 60, y+562, 500, 80, { html: `<div style='display:flex;gap:32px;align-items:center'><div style='width:1px;height:44px;background:#E2E8F0'></div><div><div style='font-size:26px;font-weight:900;color:#DC2626'>1,200社+</div><div style='font-size:10px;color:#94A3B8;margin-top:2px'>累計支援実績</div></div><div style='width:1px;height:44px;background:#E2E8F0'></div><div><div style='font-size:26px;font-weight:900;color:#DC2626'>97%</div><div style='font-size:10px;color:#94A3B8;margin-top:2px'>顧客満足度</div></div><div style='width:1px;height:44px;background:#E2E8F0'></div><div><div style='font-size:26px;font-weight:900;color:#DC2626'>20年</div><div style='font-size:10px;color:#94A3B8;margin-top:2px'>の専門実績</div></div></div>`, zIndex: 3, style: {} }),
    ],
  },
  // ── Hero: 明るい（医療・士業・士師系）──
  {
    id: "hero-bright-trust", name: "ヒーロー（信頼・明るい）", desc: "爽やか白+青・士業/医療向け", category: "ヒーロー", emoji: "🏥",
    thumb: { bg: "#EFF6FF", accent: "#0EA5E9", layout: "split-left" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 640, { zIndex: 0, style: { backgroundColor: "#F0F9FF" } }),
      mkEl("rect", 0, y, 540, 640, { zIndex: 1, style: { backgroundImage: UNS("1576091160399-112ba8d25d1d", 540, 640), backgroundSize: "cover", backgroundPosition: "center", borderRadius: "0 40px 40px 0" } }),
      mkEl("rect", 580, y+60, 560, 520, { zIndex: 2, style: { backgroundColor: "#FFFFFF", borderRadius: 20, boxShadow: "0 20px 60px rgba(0,0,0,0.08)" } }),
      mkEl("text", 616, y+100, 500, 28, { html: `<span style='background:#E0F2FE;color:#0284C7;padding:5px 16px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.15em'>初回相談無料</span>`, zIndex: 3, style: {} }),
      mkEl("text", 616, y+150, 500, 160, { html: "安心と信頼の<br>専門家サービス", zIndex: 3, style: { fontSize: 48, color: "#0F172A", fontWeight: "900", lineHeight: 1.22 } }),
      mkEl("text", 616, y+330, 460, 80, { html: "豊富な経験を持つ専門家が、あなたの悩みに真摯に向き合います。お気軽にご相談ください。", zIndex: 3, style: { fontSize: 14, color: "#475569", lineHeight: 1.9 } }),
      mkEl("button", 616, y+434, 220, 56, { html: "無料相談を予約する", href: "#", zIndex: 3, style: { fontSize: 14, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#0EA5E9", borderRadius: 8, textAlign: "center" } }),
      mkEl("text", 616, y+524, 460, 48, { html: `<div style='display:flex;gap:24px'><span><b style='font-size:20px;color:#0EA5E9'>2,000+</b> <span style='font-size:10px;color:#94A3B8'>相談実績</span></span><span><b style='font-size:20px;color:#0EA5E9'>98%</b> <span style='font-size:10px;color:#94A3B8'>満足度</span></span><span><b style='font-size:20px;color:#0EA5E9'>即日</b> <span style='font-size:10px;color:#94A3B8'>対応可能</span></span></div>`, zIndex: 3, style: {} }),
    ],
  },
  // ── Features: 3カラム ──
  {
    id: "features-3col", name: "強み・特徴（3列）", desc: "3列カード", category: "コンテンツ", emoji: "⭐",
    thumb: { bg: "#FFFFFF", accent: "#6366F1", layout: "cards" },
    create: (y, CW) => {
      const cW = Math.floor((CW - 120) / 3);
      const els: CanvasElement[] = [
        mkEl("rect", 0, y, CW, 560, { zIndex: 0, style: { backgroundColor: "#FFFFFF" } }),
        mkEl("text", Math.round(CW/2-120), y+64, 240, 26, { html: "選ばれる理由", zIndex: 2, style: { fontSize: 11, color: "#6366F1", letterSpacing: "0.2em", fontWeight: "700", textAlign: "center" } }),
        mkEl("text", Math.round(CW/2-300), y+104, 600, 58, { html: "3つの強みで貴社の課題を解決", zIndex: 2, style: { fontSize: 36, color: "#111827", fontWeight: "bold", textAlign: "center" } }),
      ];
      [
        { icon: "🏆", title: "実績・信頼性", desc: "業界トップクラスの実績と豊富なノウハウで、お客様のビジネスを確実にサポートします。" },
        { icon: "⚡", title: "スピード対応", desc: "最短即日対応が可能。時間を無駄にせず、迅速に課題解決へと導きます。" },
        { icon: "💡", title: "専門的な知識", desc: "各分野の専門家チームが最適な提案を行い、長期的な成果を創出します。" },
      ].forEach((f, i) => {
        const cx = 60 + i * (cW + 30);
        els.push(mkEl("rect", cx, y+200, cW, 310, { zIndex: 2, style: { backgroundColor: "#F8FAFC", borderRadius: 16, border: "1px solid #E2E8F0" } }));
        els.push(mkEl("text", cx+24, y+228, 56, 52, { html: f.icon, zIndex: 3, style: { fontSize: 36 } }));
        els.push(mkEl("text", cx+24, y+294, cW-48, 38, { html: f.title, zIndex: 3, style: { fontSize: 19, color: "#111827", fontWeight: "bold" } }));
        els.push(mkEl("text", cx+24, y+340, cW-48, 100, { html: f.desc, zIndex: 3, style: { fontSize: 14, color: "#6B7280", lineHeight: 1.75 } }));
      });
      return els;
    },
  },
  // ── Features: 画像+テキスト ──
  {
    id: "features-image", name: "特徴（画像＋テキスト）", desc: "画像＋テキスト", category: "コンテンツ", emoji: "🖼️",
    thumb: { bg: "#F0F4FF", accent: "#4F46E5", layout: "split-right" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 560, { zIndex: 0, style: { backgroundColor: "#F0F4FF" } }),
      mkEl("image", 60, y+60, Math.round(CW*0.46), 440, { zIndex: 2, style: { borderRadius: 16, objectFit: "cover", backgroundColor: "#CBD5E1" } }),
      mkEl("text", Math.round(CW*0.54), y+100, 64, 22, { html: "FEATURE", zIndex: 2, style: { fontSize: 10, color: "#6366F1", letterSpacing: "0.22em", fontWeight: "700" } }),
      mkEl("text", Math.round(CW*0.54), y+138, Math.round(CW*0.42), 110, { html: "サービスの特長を<br>詳しくご説明します", zIndex: 2, style: { fontSize: 38, color: "#111827", fontWeight: "bold", lineHeight: 1.3 } }),
      mkEl("text", Math.round(CW*0.54), y+268, Math.round(CW*0.42), 110, { html: "ここにサービスの詳細な説明文を入力します。お客様にとってのメリットと、具体的な効果について記述します。", zIndex: 2, style: { fontSize: 15, color: "#4B5563", lineHeight: 1.9 } }),
      mkEl("button", Math.round(CW*0.54), y+410, 210, 54, { html: "詳しくみる →", href: "#", zIndex: 2, style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#4F46E5", borderRadius: 8, textAlign: "center" } }),
    ],
  },
  // ── Steps ──
  {
    id: "steps", name: "ご利用の流れ", desc: "4ステップフロー", category: "コンテンツ", emoji: "📋",
    thumb: { bg: "#FFFFFF", accent: "#F59E0B", layout: "cards" },
    create: (y, CW) => {
      const sW = Math.floor((CW - 120) / 4);
      const els: CanvasElement[] = [
        mkEl("rect", 0, y, CW, 520, { zIndex: 0, style: { backgroundColor: "#FFFFFF" } }),
        mkEl("text", Math.round(CW/2-120), y+60, 240, 26, { html: "ご利用の流れ", zIndex: 2, style: { fontSize: 11, color: "#F59E0B", letterSpacing: "0.2em", fontWeight: "700", textAlign: "center" } }),
        mkEl("text", Math.round(CW/2-280), y+100, 560, 56, { html: "簡単4ステップで始められます", zIndex: 2, style: { fontSize: 36, color: "#111827", fontWeight: "bold", textAlign: "center" } }),
      ];
      ["お問い合わせ", "ヒアリング・提案", "ご契約・開始", "運用・サポート"].forEach((s, i) => {
        const cx = 60 + i * (sW + 0);
        els.push(mkEl("rect", cx, y+200, sW-16, 270, { zIndex: 2, style: { backgroundColor: "#EEF2FF", borderRadius: 12 } }));
        els.push(mkEl("text", cx+18, y+220, 52, 52, { html: `0${i+1}`, zIndex: 3, style: { fontSize: 30, color: "#6366F1", fontWeight: "bold" } }));
        els.push(mkEl("text", cx+18, y+284, sW-52, 36, { html: s, zIndex: 3, style: { fontSize: 16, color: "#1E1B4B", fontWeight: "bold" } }));
        els.push(mkEl("text", cx+18, y+328, sW-52, 100, { html: "ここにステップの説明を入力してください。", zIndex: 3, style: { fontSize: 13, color: "#6B7280", lineHeight: 1.65 } }));
        if (i < 3) els.push(mkEl("text", cx+sW-20, y+224, 28, 28, { html: "›", zIndex: 4, style: { fontSize: 24, color: "#9CA3AF", textAlign: "center" } }));
      });
      return els;
    },
  },
  // ── Stats ──
  {
    id: "stats", name: "実績数字", desc: "実績数字4列", category: "実績・声", emoji: "📊",
    thumb: { bg: "#F0F4FF", accent: "#4F46E5", layout: "cards" },
    create: (y, CW) => {
      const sW = Math.floor((CW - 120) / 4);
      const els: CanvasElement[] = [
        mkEl("rect", 0, y, CW, 260, { zIndex: 0, style: { backgroundColor: "#F0F4FF" } }),
      ];
      [
        { num: "500+", label: "導入企業数" },
        { num: "98%", label: "顧客満足度" },
        { num: "3.2倍", label: "平均ROI" },
        { num: "24h", label: "サポート対応" },
      ].forEach((s, i) => {
        const cx = 60 + i * (sW + 0);
        els.push(mkEl("text", cx, y+54, sW-16, 72, { html: s.num, zIndex: 2, style: { fontSize: 54, color: "#3730A3", fontWeight: "bold", textAlign: "center" } }));
        els.push(mkEl("text", cx, y+136, sW-16, 36, { html: s.label, zIndex: 2, style: { fontSize: 14, color: "#6366F1", textAlign: "center", fontWeight: "600" } }));
      });
      return els;
    },
  },
  // ── Testimonials ──
  {
    id: "testimonials", name: "お客様の声", desc: "3列レビューカード", category: "実績・声", emoji: "💬",
    thumb: { bg: "#F9FAFB", accent: "#FBBF24", layout: "cards" },
    create: (y, CW) => {
      const cW = Math.floor((CW - 120) / 3);
      const reviews = [
        { name: "田中 様 / 株式会社〇〇", text: "導入後、業務効率が大幅に向上しました。サポートも丁寧で、スタッフ全員が快適に使えています。" },
        { name: "鈴木 様 / △△事務所", text: "費用対効果が非常に高く、投資額の3倍以上のリターンを得ることができました。非常に満足しています。" },
        { name: "山田 様 / □□クリニック", text: "最初は不安でしたが、丁寧なサポートのおかげで導入からわずか2週間で使いこなせました。" },
      ];
      const els: CanvasElement[] = [
        mkEl("rect", 0, y, CW, 520, { zIndex: 0, style: { backgroundColor: "#F9FAFB" } }),
        mkEl("text", Math.round(CW/2-100), y+64, 200, 26, { html: "お客様の声", zIndex: 2, style: { fontSize: 11, color: "#10B981", letterSpacing: "0.2em", fontWeight: "700", textAlign: "center" } }),
        mkEl("text", Math.round(CW/2-280), y+104, 560, 58, { html: "導入企業様からの喜びの声", zIndex: 2, style: { fontSize: 36, color: "#111827", fontWeight: "bold", textAlign: "center" } }),
      ];
      reviews.forEach((r, i) => {
        const cx = 60 + i * (cW + 30);
        els.push(mkEl("rect", cx, y+196, cW, 272, { zIndex: 2, style: { backgroundColor: "#FFFFFF", borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", border: "1px solid #F0F0F0" } }));
        els.push(mkEl("text", cx+22, y+224, 80, 22, { html: "★★★★★", zIndex: 3, style: { fontSize: 14, color: "#F59E0B" } }));
        els.push(mkEl("text", cx+22, y+258, cW-44, 110, { html: `「${r.text}」`, zIndex: 3, style: { fontSize: 14, color: "#374151", lineHeight: 1.8 } }));
        els.push(mkEl("text", cx+22, y+388, cW-44, 36, { html: `— ${r.name}`, zIndex: 3, style: { fontSize: 12, color: "#9CA3AF", fontWeight: "600" } }));
      });
      return els;
    },
  },
  // ── FAQ ──
  {
    id: "faq", name: "よくある質問", desc: "Q&Aアコーディオン", category: "コンテンツ", emoji: "❓",
    thumb: { bg: "#FFFFFF", accent: "#6366F1", layout: "minimal" },
    create: (y, CW) => {
      const faqs = [
        { q: "Q. 導入にどのくらいの期間がかかりますか？", a: "A. 最短3日〜1週間程度でご利用開始いただけます。お客様の環境によって異なります。" },
        { q: "Q. 無料トライアルはありますか？", a: "A. はい、14日間の無料トライアルをご用意しています。クレジットカード不要でお試しいただけます。" },
        { q: "Q. サポート体制はどうなっていますか？", a: "A. 平日9:00〜18:00のメール・チャットサポートに加え、プランによって電話サポートもご利用いただけます。" },
        { q: "Q. 契約期間の縛りはありますか？", a: "A. 月額プランは毎月更新で、いつでも解約可能です。年額プランはお得な価格でご提供しています。" },
        { q: "Q. データのセキュリティは安全ですか？", a: "A. SSL暗号化通信を採用し、定期的なセキュリティ監査を実施しています。ISO27001取得済みです。" },
      ];
      const els: CanvasElement[] = [
        mkEl("rect", 0, y, CW, 660, { zIndex: 0, style: { backgroundColor: "#FFFFFF" } }),
        mkEl("text", Math.round(CW/2-140), y+60, 280, 26, { html: "よくある質問", zIndex: 2, style: { fontSize: 11, color: "#6366F1", letterSpacing: "0.2em", fontWeight: "700", textAlign: "center" } }),
        mkEl("text", Math.round(CW/2-260), y+100, 520, 56, { html: "お客様からよくいただくご質問", zIndex: 2, style: { fontSize: 34, color: "#111827", fontWeight: "bold", textAlign: "center" } }),
      ];
      faqs.forEach((f, i) => {
        const fy = y + 200 + i * 92;
        els.push(mkEl("rect", 100, fy, CW-200, 80, { zIndex: 2, style: { backgroundColor: "#F8FAFC", borderRadius: 12, border: "1px solid #E5E7EB" } }));
        els.push(mkEl("text", 124, fy+10, CW-248, 28, { html: f.q, zIndex: 3, style: { fontSize: 15, color: "#1E293B", fontWeight: "600" } }));
        els.push(mkEl("text", 124, fy+42, CW-248, 28, { html: f.a, zIndex: 3, style: { fontSize: 14, color: "#6B7280" } }));
      });
      return els;
    },
  },
  // ── CTA Banner ──
  {
    id: "cta-banner", name: "CTAバナー", desc: "フルCTAバナー", category: "CTA・その他", emoji: "📣",
    thumb: { bg: "#1E3A8A", accent: "#EA580C", layout: "center" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 360, { zIndex: 0, style: { backgroundColor: "#1E3A5F" } }),
      mkEl("rect", CW-300, y-80, 420, 420, { zIndex: 1, style: { backgroundColor: "#3B82F6", borderRadius: 999, opacity: 0.12 } }),
      mkEl("text", Math.round(CW/2-360), y+80, 720, 90, { html: "今すぐ始めて、ビジネスを<br>次のステージへ", zIndex: 2, style: { fontSize: 44, color: "#FFFFFF", fontWeight: "bold", textAlign: "center", lineHeight: 1.3 } }),
      mkEl("text", Math.round(CW/2-300), y+190, 600, 48, { html: "14日間の無料トライアル。クレジットカード不要でいつでも解約OK。", zIndex: 2, style: { fontSize: 15, color: "#93C5FD", textAlign: "center" } }),
      mkEl("button", Math.round(CW/2-180), y+268, 360, 64, { html: "無料トライアルを始める →", href: "#", zIndex: 2, style: { fontSize: 17, fontWeight: "bold", color: "#1E3A5F", backgroundColor: "#FCD34D", borderRadius: 8, textAlign: "center" } }),
    ],
  },
  // ── Pricing ──
  {
    id: "pricing", name: "料金プラン", desc: "3段階料金表", category: "CTA・その他", emoji: "💰",
    thumb: { bg: "#F8FAFC", accent: "#8B5CF6", layout: "cards" },
    create: (y, CW) => {
      const cW = Math.floor((CW - 140) / 3);
      const plans = [
        { name: "スタータープラン", price: "¥9,800", period: "/月", desc: "個人・スタートアップ向け", bg: "#F8FAFC", border: "#E2E8F0", btnBg: "#6366F1" },
        { name: "ビジネスプラン",   price: "¥29,800", period: "/月", desc: "成長企業向け（人気No.1）", bg: "#EEF2FF", border: "#C7D2FE", btnBg: "#4338CA" },
        { name: "エンタープライズ", price: "要相談",  period: "",    desc: "大企業・カスタム対応",   bg: "#F8FAFC", border: "#E2E8F0", btnBg: "#6366F1" },
      ];
      const els: CanvasElement[] = [
        mkEl("rect", 0, y, CW, 640, { zIndex: 0, style: { backgroundColor: "#FFFFFF" } }),
        mkEl("text", Math.round(CW/2-120), y+60, 240, 26, { html: "料金プラン", zIndex: 2, style: { fontSize: 11, color: "#6366F1", letterSpacing: "0.2em", fontWeight: "700", textAlign: "center" } }),
        mkEl("text", Math.round(CW/2-280), y+100, 560, 56, { html: "シンプルで分かりやすい料金体系", zIndex: 2, style: { fontSize: 34, color: "#111827", fontWeight: "bold", textAlign: "center" } }),
      ];
      plans.forEach((p, i) => {
        const cx = 60 + i * (cW + 40);
        els.push(mkEl("rect", cx, y+200, cW, 390, { zIndex: 2, style: { backgroundColor: p.bg, borderRadius: 16, border: `2px solid ${p.border}` } }));
        els.push(mkEl("text", cx+22, y+234, cW-44, 30, { html: p.name, zIndex: 3, style: { fontSize: 15, color: "#374151", fontWeight: "600" } }));
        els.push(mkEl("text", cx+22, y+276, cW-44, 58, { html: `<span style="font-size:40px;font-weight:bold;color:#111827">${p.price}</span><span style="font-size:14px;color:#6B7280"> ${p.period}</span>`, zIndex: 3, style: { fontSize: 14, color: "#6B7280" } }));
        els.push(mkEl("text", cx+22, y+342, cW-44, 30, { html: p.desc, zIndex: 3, style: { fontSize: 13, color: "#9CA3AF" } }));
        els.push(mkEl("button", cx+22, y+520, cW-44, 50, { html: "このプランで始める", href: "#", zIndex: 3, style: { fontSize: 14, fontWeight: "bold", color: "#FFFFFF", backgroundColor: p.btnBg, borderRadius: 8, textAlign: "center" } }));
      });
      return els;
    },
  },
  // ── スライドショー ──
  {
    id: "slideshow", name: "スライドショー", desc: "3枚スライド・矢印ナビ付き", category: "コンテンツ", emoji: "🎠",
    thumb: { bg: "#1E293B", accent: "#38BDF8", layout: "center" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 520, { zIndex: 0, style: { backgroundColor: "#1E293B" } }),
      mkEl("text", Math.round(CW/2-200), y+40, 400, 36, { html: "SLIDE 1", zIndex: 2, style: { fontSize: 12, color: "#38BDF8", textAlign: "center", fontWeight: "700", letterSpacing: "0.2em" } }),
      mkEl("text", Math.round(CW/2-360), y+90, 720, 80, { html: "スライド1のキャッチコピー", zIndex: 2, style: { fontSize: 52, color: "#FFFFFF", textAlign: "center", fontWeight: "bold", lineHeight: 1.2 } }),
      mkEl("text", Math.round(CW/2-280), y+190, 560, 60, { html: "ここにサブテキストを入力。スライドごとに違うメッセージを表示できます。", zIndex: 2, style: { fontSize: 16, color: "#CBD5E1", textAlign: "center", lineHeight: 1.8 } }),
      mkEl("button", Math.round(CW/2-120), y+280, 240, 56, { html: "詳しく見る →", href: "#", zIndex: 2, style: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#38BDF8", borderRadius: 8, textAlign: "center" } }),
      // ドット（スライドインジケーター）
      mkEl("rect", Math.round(CW/2-40), y+460, 20, 20, { zIndex: 2, style: { backgroundColor: "#38BDF8", borderRadius: 10 } }),
      mkEl("rect", Math.round(CW/2-10), y+460, 20, 20, { zIndex: 2, style: { backgroundColor: "#475569", borderRadius: 10 } }),
      mkEl("rect", Math.round(CW/2+20), y+460, 20, 20, { zIndex: 2, style: { backgroundColor: "#475569", borderRadius: 10 } }),
      // 矢印ボタン
      mkEl("button", 20, y+220, 56, 56, { html: "‹", zIndex: 2, style: { fontSize: 32, color: "#FFFFFF", backgroundColor: "#334155", borderRadius: 28, textAlign: "center" } }),
      mkEl("button", CW-76, y+220, 56, 56, { html: "›", zIndex: 2, style: { fontSize: 32, color: "#FFFFFF", backgroundColor: "#334155", borderRadius: 28, textAlign: "center" } }),
    ],
  },
  // ── お知らせ ──
  {
    id: "news", name: "お知らせ・新着情報", desc: "日付付きニュースリスト", category: "コンテンツ", emoji: "📰",
    thumb: { bg: "#FFFFFF", accent: "#2563EB", layout: "minimal" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 500, { zIndex: 0, style: { backgroundColor: "#FFFFFF" } }),
      mkEl("text", Math.round(CW/2-200), y+50, 400, 52, { html: "お知らせ", zIndex: 2, style: { fontSize: 36, color: "#111827", textAlign: "center", fontWeight: "bold" } }),
      mkEl("text", Math.round(CW/2-60), y+108, 120, 24, { html: "NEWS", zIndex: 2, style: { fontSize: 12, color: "#2563EB", textAlign: "center", fontWeight: "700", letterSpacing: "0.2em" } }),
      // 仕切り線
      mkEl("rect", Math.round(CW/2-300), y+150, 600, 1, { zIndex: 1, style: { backgroundColor: "#E5E7EB" } }),
      // ニュースアイテム×4
      ...[
        { date: "2024.12.01", tag: "新着", text: "新サービスの提供を開始しました" },
        { date: "2024.11.15", tag: "お知らせ", text: "年末年始の営業時間についてのご案内" },
        { date: "2024.11.01", tag: "イベント", text: "無料セミナーを開催します（定員20名）" },
        { date: "2024.10.20", tag: "プレス", text: "〇〇メディアに取材記事が掲載されました" },
      ].flatMap((item, i) => [
        mkEl("text", Math.round(CW/2-300), y+165+i*64, 100, 32, { html: item.date, zIndex: 2, style: { fontSize: 13, color: "#6B7280" } }),
        mkEl("rect", Math.round(CW/2-188), y+170+i*64, 56, 22, { zIndex: 2, style: { backgroundColor: "#DBEAFE", borderRadius: 4 } }),
        mkEl("text", Math.round(CW/2-188), y+170+i*64, 56, 22, { html: item.tag, zIndex: 3, style: { fontSize: 11, color: "#2563EB", fontWeight: "700", textAlign: "center" } }),
        mkEl("text", Math.round(CW/2-120), y+165+i*64, 420, 32, { html: item.text, zIndex: 2, style: { fontSize: 15, color: "#111827" } }),
        mkEl("rect", Math.round(CW/2-300), y+220+i*64, 600, 1, { zIndex: 1, style: { backgroundColor: "#F3F4F6" } }),
      ]),
      mkEl("button", Math.round(CW/2-80), y+440, 160, 40, { html: "一覧を見る →", href: "#", zIndex: 2, style: { fontSize: 14, color: "#2563EB", backgroundColor: "transparent", borderRadius: 8, textAlign: "center" } }),
    ],
  },
  // ── こんなお悩みありませんか ──
  {
    id: "problem", name: "こんなお悩み", desc: "悩み共感3列カード", category: "コンテンツ", emoji: "😟",
    thumb: { bg: "#F8FAFC", accent: "#EF4444", layout: "cards" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 480, { zIndex: 0, style: { backgroundColor: "#F8FAFC" } }),
      mkEl("text", Math.round(CW/2-300), y+50, 600, 52, { html: "こんなお悩みありませんか？", zIndex: 2, style: { fontSize: 36, color: "#111827", textAlign: "center", fontWeight: "bold" } }),
      ...[
        { emoji: "😰", text: "毎日忙しくて\n時間が全然足りない" },
        { emoji: "💸", text: "コストは下げたいが\n品質は妥協したくない" },
        { emoji: "😕", text: "何から始めれば\nいいか分からない" },
      ].map((item, i) => {
        const cardW = Math.round((CW - 160) / 3);
        const cardX = 80 + i * (cardW + 40);
        return [
          mkEl("rect", cardX, y+130, cardW, 280, { zIndex: 1, style: { backgroundColor: "#FFFFFF", borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" } }),
          mkEl("text", cardX, y+165, cardW, 56, { html: item.emoji, zIndex: 2, style: { fontSize: 44, textAlign: "center" } }),
          mkEl("text", cardX+20, y+235, cardW-40, 80, { html: item.text.replace("\n", "<br>"), zIndex: 2, style: { fontSize: 18, color: "#111827", textAlign: "center", fontWeight: "bold", lineHeight: 1.6 } }),
          mkEl("rect", cardX+cardW/2-16, y+335, 32, 4, { zIndex: 2, style: { backgroundColor: "#EF4444", borderRadius: 2 } }),
        ];
      }).flat(),
    ],
  },
  // ── フッター ──
  {
    id: "footer", name: "フッター", desc: "ダークフッター", category: "CTA・その他", emoji: "📌",
    thumb: { bg: "#0F172A", accent: "#6366F1", layout: "minimal" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 280, { zIndex: 0, style: { backgroundColor: "#0F172A" } }),
      mkEl("text", 80, y+56, 320, 42, { html: "会社名・ブランド名", zIndex: 2, style: { fontSize: 22, color: "#FFFFFF", fontWeight: "bold" } }),
      mkEl("text", 80, y+108, 440, 28, { html: "〒000-0000 東京都〇〇区〇〇 1-2-3", zIndex: 2, style: { fontSize: 13, color: "#94A3B8" } }),
      mkEl("text", 80, y+140, 440, 28, { html: "TEL: 03-0000-0000　mail: info@example.com", zIndex: 2, style: { fontSize: 13, color: "#94A3B8" } }),
      mkEl("text", CW-460, y+56, 100, 26, { html: "サービス", zIndex: 2, style: { fontSize: 12, color: "#FFFFFF", fontWeight: "700" } }),
      mkEl("text", CW-460, y+92, 140, 80, { html: "機能一覧\n料金プラン\n導入事例", zIndex: 2, style: { fontSize: 13, color: "#94A3B8", lineHeight: 2.4 } }),
      mkEl("text", CW-270, y+56, 100, 26, { html: "会社情報", zIndex: 2, style: { fontSize: 12, color: "#FFFFFF", fontWeight: "700" } }),
      mkEl("text", CW-270, y+92, 180, 80, { html: "会社概要\nプライバシーポリシー\nお問い合わせ", zIndex: 2, style: { fontSize: 13, color: "#94A3B8", lineHeight: 2.4 } }),
      mkEl("text", 80, y+224, CW-160, 32, { html: "© 2024 Company Name. All rights reserved.", zIndex: 2, style: { fontSize: 12, color: "#475569", textAlign: "center" } }),
    ],
  },

  // ════════════════════════════════════════════════════════
  // ── 追加ヒーロー ─────────────────────────────────────────
  // ════════════════════════════════════════════════════════

  // ── Hero: ネオン・テック ──
  {
    id: "hero-neon", name: "ヒーロー（ネオン）", desc: "ダーク+グラデーション輝き", category: "ヒーロー", emoji: "💜",
    thumb: { bg: "#070B14", accent: "#7C3AED", layout: "neon" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 700, { zIndex: 0, style: { backgroundColor: "#070B14" } }),
      mkEl("rect", -100, y-80, 480, 480, { zIndex: 1, style: { backgroundColor: "#7C3AED", borderRadius: 999, opacity: 0.15 } }),
      mkEl("rect", CW-180, y+240, 400, 400, { zIndex: 1, style: { backgroundColor: "#0EA5E9", borderRadius: 999, opacity: 0.12 } }),
      mkEl("rect", Math.round(CW/2)-280, y+460, 560, 280, { zIndex: 1, style: { backgroundColor: "#7C3AED", borderRadius: 999, opacity: 0.07 } }),
      mkEl("text", Math.round(CW/2)-240, y+100, 480, 44, {
        html: `<div style='text-align:center'><span style='border:1px solid rgba(124,58,237,0.5);background:rgba(124,58,237,0.18);padding:8px 22px;border-radius:999px;font-size:12px;color:#A78BFA;font-weight:700;letter-spacing:0.1em;display:inline-block'>✦ 最先端AIソリューション</span></div>`,
        zIndex: 3, style: {},
      }),
      mkEl("text", Math.round(CW/2)-440, y+168, 880, 220, {
        html: `<span style='background:linear-gradient(135deg,#E879F9 0%,#7C3AED 45%,#38BDF8 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text'>未来のビジネスは<br>AIから始まる</span>`,
        zIndex: 3, style: { fontSize: 68, color: "#FFFFFF", fontWeight: "900", textAlign: "center", lineHeight: 1.1 },
      }),
      mkEl("text", Math.round(CW/2)-300, y+408, 600, 80, {
        html: "最先端のAI技術で、あなたのビジネスの可能性を無限に広げます。今すぐ無料で体験してください。",
        zIndex: 3, style: { fontSize: 16, color: "#94A3B8", textAlign: "center", lineHeight: 1.9 },
      }),
      mkEl("button", Math.round(CW/2)-230, y+514, 210, 58, {
        html: "無料で始める", href: "#", zIndex: 3,
        style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#7C3AED", borderRadius: 8, textAlign: "center" },
      }),
      mkEl("button", Math.round(CW/2)+0, y+514, 200, 58, {
        html: "デモを見る →", href: "#", zIndex: 3,
        style: { fontSize: 15, fontWeight: "600", color: "#A78BFA", backgroundColor: "transparent", borderRadius: 8, textAlign: "center", border: "1px solid rgba(167,139,250,0.4)" },
      }),
    ],
  },

  // ── Hero: ナチュラル・エコ ──
  {
    id: "hero-natural", name: "ヒーロー（ナチュラル）", desc: "アース系・自然・ウェルネス向け", category: "ヒーロー", emoji: "🌿",
    thumb: { bg: "#FEFCE8", accent: "#65A30D", layout: "split-right" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 660, { zIndex: 0, style: { backgroundColor: "#FEFCE8" } }),
      mkEl("rect", -80, y+380, 280, 280, { zIndex: 1, style: { backgroundColor: "#A3E635", borderRadius: 999, opacity: 0.22 } }),
      mkEl("rect", 60, y+60, Math.round(CW*0.42), 540, { zIndex: 2, style: { backgroundImage: UNS("1518531933037-91b0d8e86de7", 500, 540), backgroundSize: "cover", backgroundPosition: "center", borderRadius: "0 200px 0 0" } }),
      mkEl("text", Math.round(CW*0.52), y+80, 120, 22, { html: "NATURAL", zIndex: 3, style: { fontSize: 10, color: "#65A30D", letterSpacing: "0.35em", fontWeight: "700" } }),
      mkEl("text", Math.round(CW*0.52), y+118, Math.round(CW*0.44), 200, { html: "自然の力で<br>あなたを癒す", zIndex: 3, style: { fontSize: 60, color: "#1A2E05", fontWeight: "900", lineHeight: 1.15 } }),
      mkEl("text", Math.round(CW*0.52), y+340, Math.round(CW*0.44), 90, { html: "自然由来の素材だけを使用した、体に優しいオーガニック製品。毎日の習慣を、もっと豊かに。", zIndex: 3, style: { fontSize: 16, color: "#3F6212", lineHeight: 1.9 } }),
      mkEl("button", Math.round(CW*0.52), y+456, 200, 56, { html: "詳しく見る", href: "#", zIndex: 3, style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#4D7C0F", borderRadius: 999, textAlign: "center" } }),
      mkEl("button", Math.round(CW*0.52)+216, y+456, 160, 56, { html: "商品を見る →", href: "#", zIndex: 3, style: { fontSize: 14, color: "#4D7C0F", backgroundColor: "transparent", borderRadius: 999, border: "2px solid #86EFAC", textAlign: "center" } }),
      mkEl("text", Math.round(CW*0.52), y+556, Math.round(CW*0.44), 64, {
        html: `<div style='display:flex;gap:32px'><div><b style='font-size:26px;color:#4D7C0F'>15年</b><br><span style='font-size:11px;color:#6B7280'>の実績</span></div><div><b style='font-size:26px;color:#4D7C0F'>100%</b><br><span style='font-size:11px;color:#6B7280'>オーガニック</span></div><div><b style='font-size:26px;color:#4D7C0F'>5万+</b><br><span style='font-size:11px;color:#6B7280'>利用者</span></div></div>`,
        zIndex: 3, style: {},
      }),
    ],
  },

  // ── Hero: パステル・かわいい ──
  {
    id: "hero-pastel", name: "ヒーロー（パステル）", desc: "かわいい・やわらか・ファッション系", category: "ヒーロー", emoji: "🎀",
    thumb: { bg: "#FDF2F8", accent: "#EC4899", layout: "center" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 660, { zIndex: 0, style: { backgroundColor: "#FDF2F8" } }),
      mkEl("rect", -60, y-60, 240, 240, { zIndex: 1, style: { backgroundColor: "#FBCFE8", borderRadius: 999, opacity: 0.55 } }),
      mkEl("rect", CW-120, y+300, 280, 280, { zIndex: 1, style: { backgroundColor: "#DDD6FE", borderRadius: 999, opacity: 0.45 } }),
      mkEl("rect", 100, y+460, 160, 160, { zIndex: 1, style: { backgroundColor: "#FDE68A", borderRadius: 999, opacity: 0.45 } }),
      mkEl("text", Math.round(CW/2)-200, y+100, 400, 44, {
        html: `<div style='text-align:center'><span style='background:#FCE7F3;color:#BE185D;padding:7px 20px;border-radius:999px;font-size:12px;font-weight:700;display:inline-block'>✨ 期間限定キャンペーン実施中</span></div>`,
        zIndex: 3, style: {},
      }),
      mkEl("rect", Math.round(CW*0.60), y+76, 210, 210, { zIndex: 2, style: { backgroundImage: UNS("1516914028945-4a66bf45b9d1", 210, 210), backgroundSize: "cover", backgroundPosition: "center", borderRadius: 20 } }),
      mkEl("rect", Math.round(CW*0.60)+230, y+76, 170, 170, { zIndex: 2, style: { backgroundImage: UNS("1492462543947-040389b4a10e", 170, 170), backgroundSize: "cover", backgroundPosition: "center", borderRadius: 16 } }),
      mkEl("rect", Math.round(CW*0.60)+80, y+310, 190, 190, { zIndex: 2, style: { backgroundImage: UNS("1556760544-1191a0aa4a54", 190, 190), backgroundSize: "cover", backgroundPosition: "center", borderRadius: 95 } }),
      mkEl("text", 80, y+158, Math.round(CW*0.52), 220, { html: "あなたの毎日を<br>もっとかわいく♡", zIndex: 3, style: { fontSize: 58, color: "#831843", fontWeight: "900", lineHeight: 1.2 } }),
      mkEl("text", 80, y+390, Math.round(CW*0.48), 80, { html: "トレンドを先取りした最新コレクション。あなたにぴったりのアイテムが必ず見つかります。", zIndex: 3, style: { fontSize: 16, color: "#9D174D", lineHeight: 1.9 } }),
      mkEl("button", 80, y+492, 220, 58, { html: "新作を見る →", href: "#", zIndex: 3, style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#EC4899", borderRadius: 999, textAlign: "center" } }),
      mkEl("button", 316, y+492, 160, 58, { html: "セール中", href: "#", zIndex: 3, style: { fontSize: 15, fontWeight: "600", color: "#EC4899", backgroundColor: "#FCE7F3", borderRadius: 999, textAlign: "center" } }),
    ],
  },

  // ── Hero: ラグジュアリー ──
  {
    id: "hero-luxury", name: "ヒーロー（ラグジュアリー）", desc: "高級感・上品・ダーク+ゴールド", category: "ヒーロー", emoji: "👑",
    thumb: { bg: "#0B0D11", accent: "#C9A84C", layout: "image-bg" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 700, { zIndex: 0, style: { backgroundColor: "#0B0D11" } }),
      mkEl("rect", Math.round(CW/2), y, Math.round(CW/2), 700, { zIndex: 1, style: { backgroundImage: UNS("1540555700478-4be290a3b2e5", 600, 700), backgroundSize: "cover", backgroundPosition: "center", opacity: 0.72 } }),
      mkEl("rect", Math.round(CW/2)-100, y, 260, 700, { zIndex: 2, style: { backgroundColor: "#0B0D11", opacity: 0.88 } }),
      mkEl("rect", 80, y+120, 3, 200, { zIndex: 3, style: { backgroundColor: "#C9A84C" } }),
      mkEl("text", 104, y+80, 260, 22, { html: "LUXURY · PREMIUM", zIndex: 3, style: { fontSize: 10, color: "#C9A84C", letterSpacing: "0.4em", fontWeight: "600" } }),
      mkEl("text", 104, y+120, Math.round(CW*0.42), 260, { html: "至高の<br>体験を<br>あなたに", zIndex: 3, style: { fontSize: 78, color: "#F5EDD3", fontWeight: "900", lineHeight: 1.05 } }),
      mkEl("text", 104, y+400, Math.round(CW*0.42), 90, { html: "一流の素材と職人の技が融合した、特別な空間。非日常的なひとときをお愉しみください。", zIndex: 3, style: { fontSize: 15, color: "#A89060", lineHeight: 2.0 } }),
      mkEl("button", 104, y+518, 220, 58, { html: "ご予約はこちら", href: "#", zIndex: 3, style: { fontSize: 14, fontWeight: "bold", color: "#0B0D11", backgroundColor: "#C9A84C", borderRadius: 0, textAlign: "center" } }),
      mkEl("text", 104, y+614, 400, 40, { html: `<span style='font-size:12px;color:#6B5B3E;letter-spacing:0.2em'>— Established 2003 —</span>`, zIndex: 3, style: {} }),
    ],
  },

  // ── Hero: 数字インパクト型 ──
  {
    id: "hero-big-number", name: "ヒーロー（数字インパクト）", desc: "大きな実績数字でインパクト", category: "ヒーロー", emoji: "📈",
    thumb: { bg: "#F8FAFC", accent: "#6366F1", layout: "minimal" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 660, { zIndex: 0, style: { backgroundColor: "#F8FAFC" } }),
      mkEl("rect", 0, y, 6, 660, { zIndex: 1, style: { backgroundColor: "#6366F1" } }),
      mkEl("text", 80, y+80, 640, 36, { html: "COMPANY · サービス名", zIndex: 2, style: { fontSize: 11, color: "#94A3B8", letterSpacing: "0.3em", fontWeight: "700" } }),
      mkEl("text", 80, y+134, 700, 180, { html: `<span style='font-size:130px;font-weight:900;color:#0F172A;line-height:1;letter-spacing:-0.03em'>98<span style='font-size:72px'>%</span></span>`, zIndex: 2, style: {} }),
      mkEl("text", 80, y+332, 620, 56, { html: "業界最高水準の顧客満足度を達成。2万社以上が選んだ実績があります。", zIndex: 2, style: { fontSize: 22, color: "#475569", fontWeight: "600", lineHeight: 1.5 } }),
      mkEl("text", 80, y+408, 620, 60, { html: "あなたのビジネスにも、同じ結果を。まずは無料でお試しください。", zIndex: 2, style: { fontSize: 16, color: "#94A3B8", lineHeight: 1.8 } }),
      mkEl("button", 80, y+502, 240, 60, { html: "無料で始める →", href: "#", zIndex: 2, style: { fontSize: 15, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#0F172A", borderRadius: 4, textAlign: "center" } }),
      mkEl("text", Math.round(CW*0.62), y+60, Math.round(CW*0.32), 560, {
        html: `<div style='display:flex;flex-direction:column;gap:16px;height:100%'>
          <div style='background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:20px 24px'>
            <div style='font-size:11px;color:#94A3B8;font-weight:600;letter-spacing:0.1em'>導入企業数</div>
            <div style='font-size:42px;font-weight:900;color:#0F172A;line-height:1.2'>20,000+</div>
          </div>
          <div style='background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:20px 24px'>
            <div style='font-size:11px;color:#94A3B8;font-weight:600;letter-spacing:0.1em'>平均削減コスト</div>
            <div style='font-size:42px;font-weight:900;color:#6366F1;line-height:1.2'>¥2.8M</div>
          </div>
          <div style='background:#6366F1;border-radius:12px;padding:20px 24px'>
            <div style='font-size:11px;color:#A5B4FC;font-weight:600;letter-spacing:0.1em'>業界平均との比較</div>
            <div style='font-size:42px;font-weight:900;color:#FFFFFF;line-height:1.2'>3.2x</div>
          </div>
        </div>`,
        zIndex: 2, style: {},
      }),
    ],
  },

  // ════════════════════════════════════════════════════════
  // ── パーツ（装飾・追加素材）──────────────────────────────
  // ════════════════════════════════════════════════════════

  // ── パーツ: 星評価バッジ ──
  {
    id: "part-rating", name: "評価バッジ ★5", desc: "満足度・口コミ件数付き", category: "パーツ", emoji: "⭐",
    thumb: { bg: "#FFFBEB", accent: "#F59E0B", layout: "badge" },
    create: (y, CW) => [
      mkEl("rect", Math.round(CW/2)-260, y, 520, 88, { zIndex: 5, style: { backgroundColor: "#FFFBEB", borderRadius: 16, boxShadow: "0 6px 24px rgba(245,158,11,0.18)", border: "1px solid #FDE68A" } }),
      mkEl("text", Math.round(CW/2)-238, y+20, 476, 50, {
        html: `<div style='display:flex;align-items:center;gap:14px'>
          <span style='font-size:28px;color:#F59E0B;letter-spacing:3px;line-height:1'>★★★★★</span>
          <span style='font-size:32px;font-weight:900;color:#92400E;line-height:1'>4.9</span>
          <span style='font-size:14px;color:#92400E;opacity:0.65'>/ 5.0（2,847件の口コミ）</span>
        </div>`,
        zIndex: 6, style: {},
      }),
    ],
  },

  // ── パーツ: 実績数字バー ──
  {
    id: "part-stats", name: "実績数字バー", desc: "横3列の実績数値", category: "パーツ", emoji: "📊",
    thumb: { bg: "#EEF2FF", accent: "#4F46E5", layout: "stats-row" },
    create: (y, CW) => [
      mkEl("rect", Math.round(CW/2)-460, y, 920, 112, { zIndex: 5, style: { backgroundColor: "#EEF2FF", borderRadius: 20, border: "1px solid #C7D2FE" } }),
      mkEl("text", Math.round(CW/2)-440, y+14, 880, 84, {
        html: `<div style='display:flex;align-items:center;justify-content:space-around'>
          <div style='text-align:center'>
            <div style='font-size:36px;font-weight:900;color:#3730A3;line-height:1.1'>10,000+</div>
            <div style='font-size:13px;color:#6366F1;font-weight:600;margin-top:4px'>利用者数</div>
          </div>
          <div style='width:1px;height:52px;background:#C7D2FE'></div>
          <div style='text-align:center'>
            <div style='font-size:36px;font-weight:900;color:#3730A3;line-height:1.1'>98%</div>
            <div style='font-size:13px;color:#6366F1;font-weight:600;margin-top:4px'>顧客満足度</div>
          </div>
          <div style='width:1px;height:52px;background:#C7D2FE'></div>
          <div style='text-align:center'>
            <div style='font-size:36px;font-weight:900;color:#3730A3;line-height:1.1'>創業20年</div>
            <div style='font-size:13px;color:#6366F1;font-weight:600;margin-top:4px'>の実績</div>
          </div>
        </div>`,
        zIndex: 6, style: {},
      }),
    ],
  },

  // ── パーツ: 利用者カウンター ──
  {
    id: "part-social-proof", name: "利用者カウンター", desc: "アバター+○○人が利用中", category: "パーツ", emoji: "👥",
    thumb: { bg: "#F0FDF4", accent: "#16A34A", layout: "badge" },
    create: (y, CW) => [
      mkEl("rect", Math.round(CW/2)-240, y, 480, 76, { zIndex: 5, style: { backgroundColor: "#FFFFFF", borderRadius: 999, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", border: "1px solid #E2E8F0" } }),
      mkEl("text", Math.round(CW/2)-218, y+14, 436, 48, {
        html: `<div style='display:flex;align-items:center;gap:12px'>
          <div style='display:flex'>
            ${["1503590672324-3eaf5bcc6f1c","1438761681033-6461ffad8d80","1494790108377-be9c29b29330"].map(id =>
              `<img src='https://images.unsplash.com/photo-${id}?w=44&h=44&fit=crop&auto=format&q=80' style='width:36px;height:36px;border-radius:50%;border:2px solid #fff;margin-left:-10px;object-fit:cover;display:inline-block'>`
            ).join("")}
          </div>
          <span style='font-size:16px;font-weight:700;color:#111827'>12,480人が利用中</span>
          <span style='background:#D1FAE5;color:#059669;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap'>✓ 今月500人増</span>
        </div>`,
        zIndex: 6, style: {},
      }),
    ],
  },

  // ── パーツ: 口コミミニカード ──
  {
    id: "part-testimonial", name: "口コミミニカード", desc: "一言口コミ+アバター+星", category: "パーツ", emoji: "💬",
    thumb: { bg: "#FFFFFF", accent: "#F59E0B", layout: "badge" },
    create: (y, CW) => [
      mkEl("rect", Math.round(CW/2)-320, y, 640, 130, { zIndex: 5, style: { backgroundColor: "#FFFFFF", borderRadius: 20, boxShadow: "0 8px 40px rgba(0,0,0,0.12)", border: "1px solid #F0F0F0" } }),
      mkEl("text", Math.round(CW/2)-292, y+20, 584, 96, {
        html: `<div style='display:flex;align-items:flex-start;gap:16px'>
          <img src='https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&auto=format&q=80' style='width:52px;height:52px;border-radius:50%;flex-shrink:0;object-fit:cover'>
          <div>
            <div style='font-size:14px;color:#111827;line-height:1.7'>「導入後3ヶ月で売上が1.8倍に！<br>サポートも丁寧で大満足です。」</div>
            <div style='display:flex;align-items:center;gap:10px;margin-top:8px'>
              <span style='font-size:14px;color:#F59E0B'>★★★★★</span>
              <span style='font-size:12px;color:#9CA3AF'>田中さん / 株式会社〇〇</span>
            </div>
          </div>
        </div>`,
        zIndex: 6, style: {},
      }),
    ],
  },

  // ── パーツ: 告知バー ──
  {
    id: "part-announce", name: "告知バー", desc: "期間限定・キャンペーン告知", category: "パーツ", emoji: "📣",
    thumb: { bg: "#7C3AED", accent: "#FCD34D", layout: "badge" },
    create: (y, CW) => [
      mkEl("rect", 0, y, CW, 64, { zIndex: 5, style: { backgroundColor: "#7C3AED" } }),
      mkEl("text", 0, y, CW, 64, {
        html: `<div style='display:flex;align-items:center;justify-content:center;gap:14px;height:64px'>
          <span style='background:#FCD34D;color:#78350F;padding:3px 12px;border-radius:4px;font-size:12px;font-weight:800'>🎉 期間限定</span>
          <span style='font-size:15px;color:#FFFFFF;font-weight:600'>今なら30日間無料！通常プランが初月50%OFF</span>
          <span style='background:rgba(255,255,255,0.2);color:#FFFFFF;padding:5px 16px;border-radius:4px;font-size:13px;font-weight:700;cursor:pointer;border:1px solid rgba(255,255,255,0.3)'>今すぐ →</span>
        </div>`,
        zIndex: 6, style: {},
      }),
    ],
  },

  // ── パーツ: 信頼バッジ群 ──
  {
    id: "part-trust", name: "信頼バッジ群", desc: "認定・受賞・メディア掲載ロゴ", category: "パーツ", emoji: "🏅",
    thumb: { bg: "#F8FAFC", accent: "#64748B", layout: "stats-row" },
    create: (y, CW) => [
      mkEl("rect", Math.round(CW/2)-460, y, 920, 100, { zIndex: 5, style: { backgroundColor: "#F8FAFC", borderRadius: 14, border: "1px solid #E2E8F0" } }),
      mkEl("text", Math.round(CW/2)-440, y+12, 880, 76, {
        html: `<div style='display:flex;align-items:center;justify-content:center;gap:28px;opacity:0.55'>
          <div style='text-align:center'><div style='font-size:22px;font-weight:800;color:#334155'>日経BP</div><div style='font-size:10px;color:#64748B'>掲載</div></div>
          <div style='width:1px;height:36px;background:#CBD5E1'></div>
          <div style='text-align:center'><div style='font-size:22px;font-weight:800;color:#334155'>Forbes</div><div style='font-size:10px;color:#64748B'>掲載</div></div>
          <div style='width:1px;height:36px;background:#CBD5E1'></div>
          <div style='text-align:center'><div style='font-size:22px;font-weight:800;color:#334155'>ISO27001</div><div style='font-size:10px;color:#64748B'>認定取得</div></div>
          <div style='width:1px;height:36px;background:#CBD5E1'></div>
          <div style='text-align:center'><div style='font-size:22px;font-weight:800;color:#334155'>G-Mark</div><div style='font-size:10px;color:#64748B'>グッドデザイン賞</div></div>
          <div style='width:1px;height:36px;background:#CBD5E1'></div>
          <div style='text-align:center'><div style='font-size:22px;font-weight:800;color:#334155'>TechAward</div><div style='font-size:10px;color:#64748B'>受賞</div></div>
        </div>`,
        zIndex: 6, style: {},
      }),
    ],
  },

  // ── パーツ: 緊急性バッジ ──
  {
    id: "part-urgency", name: "緊急性バッジ", desc: "残りX席・期間限定", category: "パーツ", emoji: "⏰",
    thumb: { bg: "#FEF2F2", accent: "#EF4444", layout: "badge" },
    create: (y, CW) => [
      mkEl("rect", Math.round(CW/2)-280, y, 560, 88, { zIndex: 5, style: { backgroundColor: "#FEF2F2", borderRadius: 14, border: "2px solid #FECACA" } }),
      mkEl("text", Math.round(CW/2)-258, y+16, 516, 58, {
        html: `<div style='display:flex;align-items:center;gap:14px'>
          <span style='font-size:26px'>⏰</span>
          <div>
            <div style='font-size:16px;font-weight:800;color:#B91C1C'>残り3名様のみ受付中！</div>
            <div style='font-size:13px;color:#EF4444;font-weight:500'>無料体験の募集は今月末まで</div>
          </div>
          <span style='margin-left:auto;background:#EF4444;color:#fff;padding:8px 18px;border-radius:8px;font-size:13px;font-weight:700;white-space:nowrap'>今すぐ申込</span>
        </div>`,
        zIndex: 6, style: {},
      }),
    ],
  },
];

const BLOCK_CATEGORIES: BlockCategory[] = ["ヒーロー", "コンテンツ", "実績・声", "CTA・その他", "パーツ"];

// ══════════════════════════════════════════════════════════════
// THUMBNAIL PREVIEW  (fully proportional to W/H)
// ══════════════════════════════════════════════════════════════
function ThumbnailPreview({ thumb, size = { w: 96, h: 58 } }: {
  thumb: BlockTemplate["thumb"];
  size?: { w: number; h: number };
}) {
  const { bg, accent, layout } = thumb;
  const W = size.w;
  const H = size.h;
  const s: React.CSSProperties = { width: W, height: H, position: "relative", overflow: "hidden", borderRadius: 6, backgroundColor: bg, flexShrink: 0 };
  const LIGHT_BACKGROUNDS = ["#FFFFFF","#F8FAFC","#FEFCE8","#FDF2F8","#F9FAFB","#F0F9FF","#FFFBEB","#F0FDF4","#FEF2F2","#EFF6FF","#F0F4FF"];
  const isDarkBg = !LIGHT_BACKGROUNDS.includes(bg);
  const tc = isDarkBg ? "#FFFFFF" : "#1E293B";

  if (layout === "neon") return (
    <div style={s}>
      <div style={{ position:"absolute", top:0, left:0, right:0, bottom:0, background:`radial-gradient(ellipse at 30% 50%, ${accent}30, transparent 60%)` }} />
      <div style={{ position:"absolute", bottom:0, right:0, width:W*0.5, height:H*0.9, background:"#0EA5E920", borderRadius:"50% 0 0 50%" }} />
      <div style={{ position:"absolute", left:"50%", top:H*0.16, transform:"translateX(-50%)", width:W*0.65, height:H*0.16, background:`linear-gradient(90deg,#E879F9,#7C3AED,#38BDF8)`, borderRadius:2 }} />
      <div style={{ position:"absolute", left:"50%", top:H*0.38, transform:"translateX(-50%)", width:W*0.8, height:H*0.14, backgroundColor:"rgba(255,255,255,0.22)", borderRadius:2 }} />
      <div style={{ position:"absolute", left:"50%", top:H*0.58, transform:"translateX(-50%)", width:W*0.6, height:H*0.12, backgroundColor:"rgba(255,255,255,0.14)", borderRadius:2 }} />
      <div style={{ position:"absolute", left:"50%", top:H*0.78, transform:"translateX(-50%)", width:W*0.42, height:H*0.17, backgroundColor:accent, borderRadius:4, opacity:0.85 }} />
    </div>
  );

  if (layout === "badge") return (
    <div style={{ ...s, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ position:"absolute", inset:0, backgroundColor:accent, opacity:0.08 }} />
      <div style={{ position:"relative", display:"flex", alignItems:"center", gap:W*0.04 }}>
        <div style={{ width:W*0.08, height:W*0.08, borderRadius:999, backgroundColor:accent }} />
        <div style={{ width:W*0.42, height:H*0.17, backgroundColor:accent, borderRadius:2, opacity:0.85 }} />
        <div style={{ width:W*0.26, height:H*0.13, backgroundColor:"#94A3B8", borderRadius:2, opacity:0.5 }} />
      </div>
    </div>
  );

  if (layout === "stats-row") return (
    <div style={{ ...s, display:"flex", alignItems:"center", justifyContent:"space-around", padding:`0 ${W*0.05}px` }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ textAlign:"center" }}>
          <div style={{ width:W*0.2, height:H*0.3, backgroundColor:accent, borderRadius:2, margin:"0 auto", opacity:0.75+i*0.08 }} />
          <div style={{ width:W*0.15, height:H*0.13, backgroundColor:"#94A3B8", borderRadius:2, margin:`${H*0.06}px auto 0`, opacity:0.5 }} />
        </div>
      ))}
    </div>
  );

  if (layout === "image-bg") return (
    <div style={s}>
      <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg, ${bg}ee 0%, ${bg}66 100%)` }} />
      <div style={{ position:"absolute", left:W*0.1, top:H*0.16, width:W*0.5, height:H*0.15, backgroundColor:"#fff", borderRadius:2, opacity:0.9 }} />
      <div style={{ position:"absolute", left:W*0.1, top:H*0.36, width:W*0.65, height:H*0.12, backgroundColor:"#fff", borderRadius:2, opacity:0.7 }} />
      <div style={{ position:"absolute", left:W*0.1, top:H*0.54, width:W*0.55, height:H*0.11, backgroundColor:"#fff", borderRadius:2, opacity:0.6 }} />
      <div style={{ position:"absolute", left:W*0.1, top:H*0.72, width:W*0.38, height:H*0.18, backgroundColor:accent, borderRadius:3, opacity:0.9 }} />
      <div style={{ position:"absolute", right:W*0.05, top:H*0.1, width:W*0.22, height:H*0.78, backgroundColor:"rgba(255,255,255,0.12)", borderRadius:5, border:"1px solid rgba(255,255,255,0.22)" }} />
    </div>
  );

  if (layout === "split-left") {
    const panelBg = isDarkBg ? "#0F172A" : "#CBD5E1";
    return (
      <div style={s}>
        <div style={{ position:"absolute", left:0, top:0, width:"46%", height:"100%", backgroundColor:panelBg }} />
        <div style={{ position:"absolute", right:W*0.06, top:H*0.17, width:W*0.43, height:H*0.15, backgroundColor:accent, borderRadius:2, opacity:0.9 }} />
        <div style={{ position:"absolute", right:W*0.06, top:H*0.37, width:W*0.38, height:H*0.12, backgroundColor:tc, borderRadius:2, opacity:0.65 }} />
        <div style={{ position:"absolute", right:W*0.06, top:H*0.54, width:W*0.3, height:H*0.11, backgroundColor:tc, borderRadius:2, opacity:0.5 }} />
        <div style={{ position:"absolute", right:W*0.06, top:H*0.73, width:W*0.28, height:H*0.18, backgroundColor:accent, borderRadius:3 }} />
      </div>
    );
  }

  if (layout === "split-right") {
    const bg2 = isDarkBg ? bg : "#F1F5F9";
    const tc2 = isDarkBg ? "#fff" : "#334155";
    return (
      <div style={{ ...s, backgroundColor:bg2 }}>
        <div style={{ position:"absolute", left:W*0.07, top:H*0.17, width:W*0.42, height:H*0.15, backgroundColor:tc2, borderRadius:2, opacity:0.85 }} />
        <div style={{ position:"absolute", left:W*0.07, top:H*0.37, width:W*0.34, height:H*0.12, backgroundColor:tc2, borderRadius:2, opacity:0.6 }} />
        <div style={{ position:"absolute", left:W*0.07, top:H*0.54, width:W*0.27, height:H*0.11, backgroundColor:tc2, borderRadius:2, opacity:0.5 }} />
        <div style={{ position:"absolute", left:W*0.07, top:H*0.73, width:W*0.27, height:H*0.18, backgroundColor:accent, borderRadius:3 }} />
        <div style={{ position:"absolute", right:0, top:0, width:"40%", height:"100%", backgroundColor:accent, opacity:0.2, borderRadius:"0 6px 6px 0" }} />
        <div style={{ position:"absolute", right:W*0.05, top:H*0.1, width:"34%", height:"80%", backgroundColor:accent, opacity:0.45, borderRadius:5 }} />
      </div>
    );
  }

  if (layout === "cards") {
    const cardBg = isDarkBg ? "rgba(255,255,255,0.12)" : "#E2E8F0";
    return (
      <div style={s}>
        <div style={{ position:"absolute", left:"50%", top:H*0.12, transform:"translateX(-50%)", width:W*0.5, height:H*0.14, backgroundColor:accent, borderRadius:2, opacity:0.8 }} />
        <div style={{ position:"absolute", left:W*0.05, top:H*0.34, right:W*0.05, bottom:H*0.08, display:"flex", gap:W*0.03 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ flex:1, backgroundColor:cardBg, borderRadius:4, overflow:"hidden" }}>
              <div style={{ height:3, backgroundColor:accent, opacity:0.65+i*0.12 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (layout === "minimal") {
    return (
      <div style={s}>
        <div style={{ position:"absolute", left:W*0.12, top:H*0.18, width:W*0.55, height:H*0.15, backgroundColor:tc, borderRadius:2, opacity:0.85 }} />
        <div style={{ position:"absolute", left:W*0.12, top:H*0.38, width:W*0.44, height:H*0.12, backgroundColor:tc, borderRadius:2, opacity:0.55 }} />
        <div style={{ position:"absolute", left:W*0.12, top:H*0.55, width:W*0.65, height:H*0.11, backgroundColor:tc, borderRadius:2, opacity:0.45 }} />
        <div style={{ position:"absolute", left:W*0.12, top:H*0.72, width:W*0.5, height:H*0.11, backgroundColor:tc, borderRadius:2, opacity:0.4 }} />
        <div style={{ position:"absolute", left:W*0.12, bottom:H*0.08, width:W*0.28, height:2, backgroundColor:accent, borderRadius:1 }} />
      </div>
    );
  }

  // "center" (default)
  return (
    <div style={s}>
      <div style={{ position:"absolute", right:-W*0.1, top:-H*0.2, width:W*0.46, height:W*0.46, backgroundColor:accent, borderRadius:999, opacity:0.18 }} />
      <div style={{ position:"absolute", left:-W*0.08, bottom:-H*0.2, width:W*0.38, height:W*0.38, backgroundColor:accent, borderRadius:999, opacity:0.12 }} />
      <div style={{ position:"absolute", left:"50%", top:H*0.16, transform:"translateX(-50%)", width:W*0.48, height:H*0.14, backgroundColor:accent, borderRadius:2, opacity:0.82 }} />
      <div style={{ position:"absolute", left:"50%", top:H*0.36, transform:"translateX(-50%)", width:W*0.72, height:H*0.16, backgroundColor:tc, borderRadius:2, opacity:0.82 }} />
      <div style={{ position:"absolute", left:"50%", top:H*0.57, transform:"translateX(-50%)", width:W*0.6, height:H*0.14, backgroundColor:tc, borderRadius:2, opacity:0.65 }} />
      <div style={{ position:"absolute", left:"50%", top:H*0.77, transform:"translateX(-50%)", width:W*0.42, height:H*0.19, backgroundColor:accent, borderRadius:4 }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════
interface Props { config: SiteConfig; onChange: (c: SiteConfig) => void; }

export default function CanvasEditor({ config, onChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId,  setEditingId]  = useState<string | null>(null);
  const [drag,       setDrag]       = useState<DragState | null>(null);
  const [sidePanel,     setSidePanel]     = useState<"settings" | "blocks" | "images" | "elements" | "seo" | "ai-image">("blocks");
  const [imgCategory,   setImgCategory]   = useState<string>("すべて");
  const [blockCategory, setBlockCategory] = useState<string>("すべて");
  const [aiImgPrompt,   setAiImgPrompt]   = useState<string>("");
  const [aiImgRatio,    setAiImgRatio]    = useState<"1:1" | "4:3" | "16:9" | "3:4">("1:1");
  const [aiImgLoading,  setAiImgLoading]  = useState(false);
  const [aiImgError,    setAiImgError]    = useState("");
  const [aiGenImages,   setAiGenImages]   = useState<string[]>([]);
  const [blockModal,    setBlockModal]    = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const CW       = config.canvasWidth ?? 1200;
  const elements = config.elements ?? [];
  const canvasHeight = Math.max(800, ...(elements.length > 0 ? elements.map(el => el.y + el.height + 80) : [800]));
  const selectedEl = elements.find(e => e.id === selectedId) ?? null;

  // ── Helpers ──────────────────────────────────────────────
  const updateEl = useCallback((id: string, patch: Partial<CanvasElement>) => {
    onChange({ ...config, elements: (config.elements ?? []).map(el => el.id === id ? { ...el, ...patch } : el) });
  }, [config, onChange]);

  const updateStyle = useCallback((id: string, patch: Partial<CanvasElement["style"]>) => {
    onChange({
      ...config,
      elements: (config.elements ?? []).map(e => e.id === id ? { ...e, style: { ...e.style, ...patch } } : e),
    });
  }, [config, onChange]);

  const deleteEl = useCallback((id: string) => {
    onChange({ ...config, elements: (config.elements ?? []).filter(e => e.id !== id) });
    setSelectedId(null); setEditingId(null);
  }, [config, onChange]);

  // ── Add single element ───────────────────────────────────
  function addElement(type: CanvasElementType) {
    const maxY = elements.length > 0 ? Math.max(...elements.map(e => e.y + e.height)) : 0;
    const defaults: Record<CanvasElementType, Partial<CanvasElement>> = {
      text:   { width: 600, height: 80,  html: "テキストを入力", style: { fontSize: 18, color: "#111827" } },
      image:  { width: 600, height: 400, style: { objectFit: "cover", backgroundColor: "#E5E7EB" } },
      button: { width: 240, height: 56,  html: "ボタン", href: "#", style: { fontSize: 17, fontWeight: "bold", color: "#FFFFFF", backgroundColor: "#1E40AF", borderRadius: 8, textAlign: "center" } },
      rect:   { width: 1200, height: 300, style: { backgroundColor: "#F3F4F6" } },
    };
    const d = defaults[type];
    const el: CanvasElement = {
      id: uid(), type,
      x: type === "rect" ? 0 : Math.max(0, Math.round((CW - (d.width ?? 600)) / 2)),
      y: maxY + 20,
      width: d.width ?? 600, height: d.height ?? 80,
      ...(d.html ? { html: d.html } : {}),
      ...(d.href ? { href: d.href } : {}),
      style: d.style ?? {},
    };
    onChange({ ...config, elements: [...elements, el] });
    setSelectedId(el.id);
  }

  // ── AI image generation ──────────────────────────────────
  async function generateAiImage() {
    if (!aiImgPrompt.trim()) return;
    setAiImgLoading(true);
    setAiImgError("");
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiImgPrompt, aspectRatio: aiImgRatio }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "生成失敗");
      const urls = (data.images as { dataUrl: string }[]).map(i => i.dataUrl);
      setAiGenImages(prev => [...urls, ...prev]);
    } catch (e) {
      setAiImgError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setAiImgLoading(false);
    }
  }

  function addAiImageToCanvas(dataUrl: string) {
    const RATIO_MAP: Record<string, { w: number; h: number }> = {
      "1:1":  { w: 400, h: 400 },
      "4:3":  { w: 400, h: 300 },
      "16:9": { w: 480, h: 270 },
      "3:4":  { w: 300, h: 400 },
    };
    const { w, h } = RATIO_MAP[aiImgRatio] ?? { w: 400, h: 400 };
    const maxY = elements.length > 0 ? Math.max(...elements.map(e => e.y + e.height)) : 0;
    const el: CanvasElement = {
      id: uid(), type: "image",
      x: Math.max(0, Math.round((CW - w) / 2)), y: maxY + 20,
      width: w, height: h,
      src: dataUrl, alt: "AI生成画像",
      style: { objectFit: "cover", borderRadius: 12 },
      zIndex: 5,
    };
    onChange({ ...config, elements: [...elements, el] });
    setSelectedId(el.id);
  }

  // ── Add block template ───────────────────────────────────
  function addBlock(tpl: BlockTemplate) {
    const maxY = elements.length > 0 ? Math.max(...elements.map(e => e.y + e.height)) : 0;
    const blockId = uid();
    const newEls = tpl.create(maxY + 20, CW).map(el => ({ ...el, blockId }));
    onChange({ ...config, elements: [...elements, ...newEls] });
    if (newEls.length > 0) setSelectedId(newEls[0].id);
  }

  // ── Delete entire block ───────────────────────────────────
  const deleteBlock = useCallback((blockId: string) => {
    onChange({ ...config, elements: (config.elements ?? []).filter(e => e.blockId !== blockId) });
    setSelectedId(null); setEditingId(null);
  }, [config, onChange]);

  // ── Compact: ブロック間の空白を詰める ─────────────────────
  const compactBlocks = useCallback(() => {
    const els = config.elements ?? [];
    if (els.length === 0) return;
    // blockIdごとにグループ化して上から詰める
    const groups = new Map<string, CanvasElement[]>();
    const noBlock: CanvasElement[] = [];
    for (const el of els) {
      if (el.blockId) {
        if (!groups.has(el.blockId)) groups.set(el.blockId, []);
        groups.get(el.blockId)!.push(el);
      } else {
        noBlock.push(el);
      }
    }
    // 各グループのminYでソート
    const sorted = [...groups.entries()].sort((a, b) => {
      const minA = Math.min(...a[1].map(e => e.y));
      const minB = Math.min(...b[1].map(e => e.y));
      return minA - minB;
    });
    let currentY = 0;
    const moved: CanvasElement[] = [];
    for (const [, groupEls] of sorted) {
      const minY = Math.min(...groupEls.map(e => e.y));
      const shift = currentY - minY;
      const maxY = Math.max(...groupEls.map(e => e.y + e.height));
      moved.push(...groupEls.map(e => ({ ...e, y: e.y + shift })));
      currentY = maxY + shift;
    }
    // blockIdなし要素はそのまま
    onChange({ ...config, elements: [...moved, ...noBlock] });
  }, [config, onChange]);

  // ── Google Fonts loader ──────────────────────────────────
  const siteFont = config.siteFont ?? "Noto Sans JP";
  useEffect(() => {
    const encoded = siteFont.replace(/ /g, "+");
    const href = `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;700;900&display=swap`;
    const existing = document.querySelector(`link[data-site-font]`);
    if (existing) existing.remove();
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = href;
    link.setAttribute("data-site-font", "1");
    document.head.appendChild(link);
  }, [siteFont]);

  // ── Keyboard ─────────────────────────────────────────────
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (editingId) { if (e.key === "Escape") setEditingId(null); return; }
      if (!selectedId) return;
      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteEl(selectedId); return; }
      if (e.key === "Escape") { setSelectedId(null); return; }
      const el = elements.find(el => el.id === selectedId);
      if (!el) return;
      const n = e.shiftKey ? 10 : 1;
      if (e.key === "ArrowLeft")  { e.preventDefault(); updateEl(selectedId, { x: Math.max(0, el.x - n) }); }
      if (e.key === "ArrowRight") { e.preventDefault(); updateEl(selectedId, { x: el.x + n }); }
      if (e.key === "ArrowUp")    { e.preventDefault(); updateEl(selectedId, { y: Math.max(0, el.y - n) }); }
      if (e.key === "ArrowDown")  { e.preventDefault(); updateEl(selectedId, { y: el.y + n }); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, editingId, elements, deleteEl, updateEl]);

  // ── Pointer capture drag ─────────────────────────────────
  function startDrag(e: React.PointerEvent, elId: string, mode: DragMode) {
    e.stopPropagation();
    if (editingId) return;
    const el = elements.find(el => el.id === elId)!;
    setSelectedId(elId);
    setDrag({ mode, elementId: elId, startX: e.clientX, startY: e.clientY, origX: el.x, origY: el.y, origW: el.width, origH: el.height });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onCanvasPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const MIN = 20;
    if (drag.mode.kind === "move") {
      updateEl(drag.elementId, { x: Math.max(0, drag.origX + dx), y: Math.max(0, drag.origY + dy) });
    } else {
      const h = drag.mode.handle;
      let nx = drag.origX, ny = drag.origY, nw = drag.origW, nh = drag.origH;
      if (h.includes("e")) nw = Math.max(MIN, drag.origW + dx);
      if (h.includes("w")) { nx = drag.origX + dx; nw = Math.max(MIN, drag.origW - dx); }
      if (h.includes("s")) nh = Math.max(MIN, drag.origH + dy);
      if (h.includes("n")) { ny = drag.origY + dy; nh = Math.max(MIN, drag.origH - dy); }
      updateEl(drag.elementId, { x: nx, y: ny, width: nw, height: nh });
    }
  }

  // ── Drag & drop image onto canvas ───────────────────────
  function onCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("application/canvas-image");
    if (!raw) return;
    const { src, alt } = JSON.parse(raw) as { src: string; alt: string };
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.round(e.clientX - rect.left) - 200);
    const y = Math.max(0, Math.round(e.clientY - rect.top)  - 200);
    const el: CanvasElement = {
      id: uid(), type: "image", x, y, width: 400, height: 400,
      src, alt, style: { objectFit: "cover", borderRadius: 8 }, zIndex: 5,
    };
    onChange({ ...config, elements: [...elements, el] });
    setSelectedId(el.id);
  }

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0, background: "#F1F5F9" }}>

      {/* ═══ Left Sidebar (icon rail + panel) ════════════════ */}
      <div style={{ display: "flex", flexShrink: 0, height: "100%" }}>

        {/* Icon rail */}
        <div style={{ width: 56, background: "#0F172A", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, gap: 2, flexShrink: 0 }}>
          {([
            { id: "settings" as const, label: "設定",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
            { id: "blocks" as const, label: "ブロック",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
            { id: "images" as const, label: "素材",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
            { id: "elements" as const, label: "要素",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
            { id: "seo" as const, label: "SEO",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
            { id: "ai-image" as const, label: "AI画像",
              icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9"/><path d="M16 3h5v5"/><path d="M21 3l-9 9"/></svg> },
          ]).map(item => (
            <button key={item.id} onClick={() => setSidePanel(item.id)}
              style={{
                width: 46, padding: "8px 0 6px", border: "none", borderRadius: 8,
                background: sidePanel === item.id ? "rgba(99,102,241,0.18)" : "transparent",
                color: sidePanel === item.id ? "#818CF8" : "#475569",
                cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (sidePanel !== item.id) (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
              onMouseLeave={e => { if (sidePanel !== item.id) (e.currentTarget as HTMLElement).style.color = "#475569"; }}>
              {item.icon}
              <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.02em" }}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Panel content */}
        <div style={{ width: 240, background: "#FFFFFF", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#0F172A", margin: 0 }}>
              {sidePanel === "settings" ? "サイト全体設定"
                : sidePanel === "blocks" ? "ブロック編集"
                : sidePanel === "images" ? "フリー素材"
                : sidePanel === "elements" ? "要素"
                : sidePanel === "seo" ? "SEO / 集客設定"
                : "AI画像生成"}
            </p>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>

            {/* ── 設定 ── */}
            {sidePanel === "settings" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>サイト名</span>
                  <input value={config.title} onChange={e => onChange({ ...config, title: e.target.value })}
                    style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111" }} />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>ディスクリプション</span>
                  <textarea value={config.description ?? ""} onChange={e => onChange({ ...config, description: e.target.value })}
                    rows={3} style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", resize: "none", color: "#111", lineHeight: 1.6 }}
                    placeholder="検索結果に表示される説明文 (120文字以内)" />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>ファビコン URL</span>
                  <input value={config.favicon ?? ""} onChange={e => onChange({ ...config, favicon: e.target.value })}
                    style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111" }}
                    placeholder="https://..." />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>OGP 画像 URL</span>
                  <input value={config.ogImage ?? ""} onChange={e => onChange({ ...config, ogImage: e.target.value })}
                    style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111" }}
                    placeholder="https://..." />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>メインカラー</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0", borderRadius: 7, padding: "4px 8px" }}>
                      <input type="color" value={config.primaryColor} onChange={e => onChange({ ...config, primaryColor: e.target.value })}
                        style={{ width: 24, height: 24, border: "none", padding: 0, borderRadius: 4, cursor: "pointer" }} />
                      <span style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>{config.primaryColor}</span>
                    </div>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>アクセント</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0", borderRadius: 7, padding: "4px 8px" }}>
                      <input type="color" value={config.accentColor} onChange={e => onChange({ ...config, accentColor: e.target.value })}
                        style={{ width: 24, height: 24, border: "none", padding: 0, borderRadius: 4, cursor: "pointer" }} />
                      <span style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>{config.accentColor}</span>
                    </div>
                  </label>
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>フォント</span>
                  <select value={siteFont} onChange={e => onChange({ ...config, siteFont: e.target.value })}
                    style={{ fontSize: 11, padding: "7px 8px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111", background: "#fff", cursor: "pointer" }}>
                    <option value="Noto Sans JP">Noto Sans JP（源ノ角ゴシック）</option>
                    <option value="Noto Serif JP">Noto Serif JP（源ノ明朝）</option>
                    <option value="M PLUS Rounded 1c">M PLUS Rounded 1c（まるもじ）</option>
                    <option value="Zen Kaku Gothic New">Zen Kaku Gothic New（新ゴシック）</option>
                    <option value="Shippori Mincho">Shippori Mincho（しっぽり明朝）</option>
                  </select>
                </label>
              </div>
            )}

            {/* ── ブロック ── */}
            {sidePanel === "blocks" && (
              <div>
                <button onClick={() => setBlockModal(true)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 0", borderRadius: 8, border: "1.5px dashed #C7D2FE", background: "#EEF2FF", cursor: "pointer", color: "#4F46E5", fontWeight: 700, fontSize: 12, marginBottom: 12, transition: "background 0.12s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E0E7FF"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EEF2FF"; }}>
                  <span style={{ fontSize: 15 }}>+</span> すべてのブロックを見る
                </button>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                  {["すべて", ...BLOCK_CATEGORIES].map(cat => (
                    <button key={cat} onClick={() => setBlockCategory(cat)}
                      style={{ fontSize: 9, padding: "3px 8px", borderRadius: 999, border: "1px solid #E2E8F0",
                        background: blockCategory === cat ? "#4F46E5" : "#F9FAFB",
                        color: blockCategory === cat ? "#fff" : "#6B7280",
                        cursor: "pointer", fontWeight: blockCategory === cat ? 700 : 400, whiteSpace: "nowrap" }}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {BLOCK_TEMPLATES.filter(t => blockCategory === "すべて" || t.category === blockCategory).map(tpl => (
                    <button key={tpl.id} onClick={() => addBlock(tpl)}
                      style={{ padding: 0, border: "1.5px solid #E2E8F0", borderRadius: 8, background: "#fff", cursor: "pointer", textAlign: "left", overflow: "hidden", transition: "all 0.14s", display: "flex", flexDirection: "column" }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#818CF8"; el.style.boxShadow = "0 4px 16px rgba(79,70,229,0.15)"; el.style.transform = "translateY(-1px)"; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#E2E8F0"; el.style.boxShadow = "none"; el.style.transform = "translateY(0)"; }}
                      title={tpl.desc}>
                      <div style={{ overflow: "hidden", borderRadius: "6px 6px 0 0", flexShrink: 0 }}>
                        <ThumbnailPreview thumb={tpl.thumb} size={{ w: 96, h: 58 }} />
                      </div>
                      <div style={{ padding: "5px 6px 6px" }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#374151", margin: 0, lineHeight: 1.3 }}>{tpl.name.replace(/ヒーロー\（/, "").replace(/\）$/, "")}</p>
                        <p style={{ fontSize: 9, color: "#94A3B8", margin: "2px 0 0", lineHeight: 1.3 }}>{tpl.category === "パーツ" ? "パーツ" : tpl.desc.slice(0, 14)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── 素材 ── */}
            {sidePanel === "images" && (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                  {IMG_CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setImgCategory(cat)}
                      style={{ fontSize: 9, padding: "3px 8px", borderRadius: 999, border: "1px solid #E2E8F0",
                        background: imgCategory === cat ? "#4F46E5" : "#F9FAFB",
                        color: imgCategory === cat ? "#fff" : "#6B7280",
                        cursor: "pointer", fontWeight: imgCategory === cat ? 700 : 400 }}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
                  {STOCK_IMAGES.filter(img => imgCategory === "すべて" || img.category === imgCategory).map(img => (
                    <button key={img.id}
                      onClick={() => {
                        const maxY = elements.length > 0 ? Math.max(...elements.map(e => e.y + e.height)) : 0;
                        const el: CanvasElement = {
                          id: uid(), type: "image",
                          x: Math.max(0, Math.round((CW - 400) / 2)), y: maxY + 20,
                          width: 400, height: 400,
                          src: img.url, alt: img.label,
                          style: { borderRadius: 8, objectFit: "cover" }, zIndex: 5,
                        };
                        onChange({ ...config, elements: [...(config.elements ?? []), el] });
                        setSelectedId(el.id);
                      }}
                      draggable
                    onDragStart={e => e.dataTransfer.setData("application/canvas-image", JSON.stringify({ src: img.url, alt: img.label }))}
                    style={{ padding: 0, border: "2px solid transparent", borderRadius: 7, overflow: "hidden", cursor: "grab", background: "none", transition: "border-color 0.15s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#4F46E5"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}
                      title={img.label}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.label} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} loading="lazy" draggable={false} />
                      <div style={{ fontSize: 9, color: "#6B7280", padding: "2px 4px", background: "#F9FAFB" }}>{img.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── 要素 ── */}
            {sidePanel === "elements" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontSize: 10, color: "#94A3B8", marginBottom: 6 }}>クリックでキャンバスに追加</p>
                {([
                  { type: "text"   as const, label: "テキスト",  desc: "見出し・本文",      color: "#4F46E5", bg: "#EEF2FF" },
                  { type: "image"  as const, label: "画像",      desc: "URLで差し替え可",   color: "#059669", bg: "#ECFDF5" },
                  { type: "button" as const, label: "ボタン",    desc: "CTAや行動喚起に",   color: "#EA580C", bg: "#FFF7ED" },
                  { type: "rect"   as const, label: "図形・背景", desc: "区切りや装飾に",    color: "#9333EA", bg: "#FAF5FF" },
                ]).map(({ type, label, desc, color, bg }) => (
                  <button key={type} onClick={() => addElement(type)}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = color; el.style.background = bg; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "#E2E8F0"; el.style.background = "#fff"; }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color }}>{type === "text" ? "T" : type === "image" ? "IMG" : type === "button" ? "BTN" : "□"}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#1E293B", margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 10, color: "#94A3B8", margin: 0 }}>{desc}</p>
                    </div>
                  </button>
                ))}
                <p style={{ fontSize: 10, color: "#CBD5E1", marginTop: 8, textAlign: "center" }}>ダブルクリックでテキスト編集</p>
              </div>
            )}

            {/* ── SEO ── */}
            {sidePanel === "seo" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {/* Google Analytics */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #F1F5F9" }}>Google Analytics</p>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, color: "#64748B" }}>測定 ID (G-XXXXXXXXXX)</span>
                    <input value={config.gaId ?? ""} onChange={e => onChange({ ...config, gaId: e.target.value })}
                      style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", fontFamily: "monospace" }}
                      placeholder="G-XXXXXXXXXX" />
                  </label>
                </div>
                {/* Search Console */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #F1F5F9" }}>Search Console</p>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 10, color: "#64748B" }}>確認コード（metaタグのcontent値）</span>
                    <input value={config.gscCode ?? ""} onChange={e => onChange({ ...config, gscCode: e.target.value })}
                      style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", fontFamily: "monospace" }}
                      placeholder="xxxxxxxxxxxxxxxxxxx" />
                  </label>
                </div>
                {/* MEO */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #F1F5F9" }}>MEO（マップSEO）</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {([
                      { key: "meoName" as const, label: "ビジネス名", placeholder: "株式会社〇〇" },
                      { key: "meoAddress" as const, label: "住所", placeholder: "東京都渋谷区..." },
                      { key: "meoPhone" as const, label: "電話番号", placeholder: "03-XXXX-XXXX" },
                      { key: "meoCategory" as const, label: "カテゴリ", placeholder: "学習塾 / 飲食店..." },
                    ]).map(({ key, label, placeholder }) => (
                      <label key={key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span style={{ fontSize: 10, color: "#64748B" }}>{label}</span>
                        <input value={(config[key] as string) ?? ""} onChange={e => onChange({ ...config, [key]: e.target.value })}
                          style={{ fontSize: 11, padding: "6px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none" }}
                          placeholder={placeholder} />
                      </label>
                    ))}
                  </div>
                </div>
                {/* LLMO */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: "#0F172A", marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #F1F5F9" }}>LLMO対策（AI検索最適化）</p>
                  <p style={{ fontSize: 9, color: "#94A3B8", marginBottom: 8, lineHeight: 1.5 }}>FAQを設定するとAIが回答時に引用しやすい構造データになります</p>
                  {(config.llmoFaq ?? []).map((faq, i) => (
                    <div key={i} style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px", marginBottom: 6 }}>
                      <input value={faq.q} onChange={e => {
                          const faq2 = [...(config.llmoFaq ?? [])];
                          faq2[i] = { ...faq2[i], q: e.target.value };
                          onChange({ ...config, llmoFaq: faq2 });
                        }}
                        placeholder="質問" style={{ width: "100%", fontSize: 11, border: "none", background: "transparent", outline: "none", fontWeight: 600, marginBottom: 4 }} />
                      <textarea value={faq.a} onChange={e => {
                          const faq2 = [...(config.llmoFaq ?? [])];
                          faq2[i] = { ...faq2[i], a: e.target.value };
                          onChange({ ...config, llmoFaq: faq2 });
                        }}
                        placeholder="回答" rows={2} style={{ width: "100%", fontSize: 11, border: "none", background: "transparent", outline: "none", resize: "none", lineHeight: 1.5 }} />
                      <button onClick={() => onChange({ ...config, llmoFaq: (config.llmoFaq ?? []).filter((_, j) => j !== i) })}
                        style={{ fontSize: 9, color: "#EF4444", background: "none", border: "none", cursor: "pointer", marginTop: 2 }}>削除</button>
                    </div>
                  ))}
                  <button onClick={() => onChange({ ...config, llmoFaq: [...(config.llmoFaq ?? []), { q: "", a: "" }] })}
                    style={{ width: "100%", padding: "8px 0", border: "1.5px dashed #E2E8F0", borderRadius: 8, background: "#F9FAFB", color: "#64748B", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
                    + FAQ を追加
                  </button>
                </div>
              </div>
            )}

            {/* ── AI画像 ── */}
            {sidePanel === "ai-image" && (
              <div>
                <textarea value={aiImgPrompt} onChange={e => setAiImgPrompt(e.target.value)}
                  placeholder="例: 笑顔の子どもと先生、明るい教室" rows={3}
                  style={{ width: "100%", fontSize: 11, padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: 8, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.6, marginBottom: 8 }}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generateAiImage(); }} />
                <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                  {(["1:1", "4:3", "16:9", "3:4"] as const).map(r => (
                    <button key={r} onClick={() => setAiImgRatio(r)}
                      style={{ flex: 1, fontSize: 10, padding: "5px 0", borderRadius: 6, border: "1px solid #E2E8F0",
                        background: aiImgRatio === r ? "#4F46E5" : "#F9FAFB",
                        color: aiImgRatio === r ? "#fff" : "#64748B",
                        cursor: "pointer", fontWeight: aiImgRatio === r ? 700 : 400 }}>
                      {r}
                    </button>
                  ))}
                </div>
                <button onClick={generateAiImage} disabled={aiImgLoading || !aiImgPrompt.trim()}
                  style={{ width: "100%", padding: "10px 0", background: aiImgLoading || !aiImgPrompt.trim() ? "#C7D2FE" : "#4F46E5", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: aiImgLoading || !aiImgPrompt.trim() ? "not-allowed" : "pointer", transition: "background 0.2s" }}>
                  {aiImgLoading ? "生成中..." : "画像を生成する"}
                </button>
                {aiImgError && <p style={{ fontSize: 10, color: "#EF4444", marginTop: 6 }}>{aiImgError}</p>}
                {aiGenImages.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ fontSize: 9, color: "#94A3B8", fontWeight: 700, marginBottom: 8 }}>クリックでキャンバスに追加</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                      {aiGenImages.map((url, i) => (
                        <button key={i} onClick={() => addAiImageToCanvas(url)}
                          draggable
                          onDragStart={e => e.dataTransfer.setData("application/canvas-image", JSON.stringify({ src: url, alt: "AI生成画像" }))}
                          style={{ padding: 0, border: "2px solid transparent", borderRadius: 6, overflow: "hidden", cursor: "grab", background: "none", transition: "border-color 0.15s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#4F46E5"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "transparent"; }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`AI ${i + 1}`} style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} draggable={false} />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ═══ Canvas area ══════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
        {/* Hint bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 16px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#94A3B8" }}>
            クリック選択 &nbsp;·&nbsp; ドラッグ移動 &nbsp;·&nbsp; ハンドルでリサイズ &nbsp;·&nbsp; ダブルクリックで編集 &nbsp;·&nbsp; Del で削除
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={compactBlocks}
              style={{ fontSize: 11, color: "#6366F1", background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontWeight: 600 }}
              title="ブロック間の余白を詰める">
              空白を詰める
            </button>
            <span style={{ fontSize: 11, color: "#CBD5E1", fontFamily: "monospace" }}>{CW}px</span>
          </div>
        </div>

        {/* Canvas scroll */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px 24px", minHeight: 0 }}
          onClick={() => { setSelectedId(null); setEditingId(null); }}>
          <div
            ref={canvasRef}
            style={{ position: "relative", width: CW, minHeight: canvasHeight, background: "#FFFFFF", margin: "0 auto", boxShadow: "0 4px 40px rgba(0,0,0,0.12)", fontFamily: `"${siteFont}", sans-serif` }}
            onPointerMove={onCanvasPointerMove}
            onPointerUp={() => setDrag(null)}
            onClick={e => e.stopPropagation()}
            onDragOver={e => e.preventDefault()}
            onDrop={onCanvasDrop}
          >
            {elements.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "#94A3B8" }}>
                <div style={{ fontSize: 48 }}>🎨</div>
                <p style={{ fontSize: 16, fontWeight: 600 }}>左パネルからブロックを追加してください</p>
                <p style={{ fontSize: 13 }}>ヒーロー、特徴、FAQ など豊富なテンプレートを用意しています</p>
              </div>
            )}
            {[...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)).map(el => (
              <CanvasElementView
                key={el.id} element={el}
                isSelected={selectedId === el.id}
                isEditing={editingId === el.id}
                onSelect={() => { setSelectedId(el.id); setEditingId(null); }}
                onDoubleClick={() => { if (el.type === "text" || el.type === "button") { setSelectedId(el.id); setEditingId(el.id); } }}
                onStartDrag={(e, mode) => startDrag(e, el.id, mode)}
                onUpdate={patch => updateEl(el.id, patch)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Right Panel (Property Inspector) ════════════════ */}
      <div style={{ width: 256, background: "#FFFFFF", borderLeft: "1px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
        {selectedEl ? (
          <RightPanel
            element={selectedEl}
            onUpdateStyle={patch => updateStyle(selectedEl.id, patch)}
            onUpdateEl={patch => updateEl(selectedEl.id, patch)}
            onDelete={() => deleteEl(selectedEl.id)}
            onDeleteBlock={selectedEl.blockId ? () => deleteBlock(selectedEl.blockId!) : undefined}
            onBringForward={() => updateEl(selectedEl.id, { zIndex: (selectedEl.zIndex ?? 0) + 1 })}
            onSendBack={() => updateEl(selectedEl.id, { zIndex: Math.max(0, (selectedEl.zIndex ?? 0) - 1) })}
          />
        ) : (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 24, color: "#CBD5E1" }}>
            <div style={{ fontSize: 36 }}>⟵</div>
            <p style={{ fontSize: 12, textAlign: "center", lineHeight: 1.6 }}>要素をクリックして<br />プロパティを編集</p>
          </div>
        )}
      </div>

      {/* ═══ Block Picker Modal ════════════════════════════════ */}
      {blockModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setBlockModal(false)}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: "#FFFFFF", borderRadius: 20, width: "min(900px, 95vw)", maxHeight: "85vh", overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}
            onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>ブロックを追加</h2>
                <p style={{ fontSize: 12, color: "#94A3B8", margin: "4px 0 0" }}>挿入するテンプレートを選んでください</p>
              </div>
              <button onClick={() => setBlockModal(false)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 16, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            </div>
            {/* Modal body */}
            <div style={{ overflowY: "auto", padding: "16px 24px 24px" }}>
              {BLOCK_CATEGORIES.map(cat => {
                const tpls = BLOCK_TEMPLATES.filter(t => t.category === cat);
                return (
                  <div key={cat} style={{ marginBottom: 28 }}>
                    <p style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, letterSpacing: "0.1em", marginBottom: 12 }}>{cat.toUpperCase()} &nbsp; {tpls.length}パターン</p>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      {tpls.map(tpl => (
                        <button key={tpl.id}
                          onClick={() => { addBlock(tpl); setBlockModal(false); }}
                          style={{ background: "none", border: "1.5px solid #E2E8F0", borderRadius: 12, padding: 0, cursor: "pointer", textAlign: "left", overflow: "hidden", transition: "all 0.14s" }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#818CF8"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E2E8F0"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
                          {/* Thumbnail */}
                          <div style={{ overflow: "hidden", borderRadius: "10px 10px 0 0" }}>
                            <ThumbnailPreview thumb={tpl.thumb} size={{ w: 280, h: 140 }} />
                          </div>
                          {/* Label */}
                          <div style={{ padding: "10px 14px 12px" }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", margin: 0, lineHeight: 1.3 }}>{tpl.name}</p>
                            <p style={{ fontSize: 11, color: "#94A3B8", margin: "3px 0 0" }}>{tpl.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// RIGHT PANEL — Property Inspector
// ══════════════════════════════════════════════════════════════
interface RightPanelProps {
  element: CanvasElement;
  onUpdateStyle: (patch: Partial<CanvasElement["style"]>) => void;
  onUpdateEl: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
  onDeleteBlock?: () => void;
  onBringForward: () => void;
  onSendBack: () => void;
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, marginBottom: 5, letterSpacing: "0.06em" }}>{label.toUpperCase()}</p>
      {children}
    </div>
  );
}

function NumberInput({ value, onChange, min, max, unit }: { value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input type="number" value={Math.round(value)} min={min} max={max}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1, fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 6px", outline: "none", background: "#F8FAFC", color: "#111827", width: 0 }} />
      {unit && <span style={{ fontSize: 10, color: "#94A3B8", flexShrink: 0 }}>{unit}</span>}
    </div>
  );
}

function RightPanel({ element: el, onUpdateStyle, onUpdateEl, onDelete, onDeleteBlock, onBringForward, onSendBack }: RightPanelProps) {
  const s = el.style;
  const TYPE_LABEL: Record<CanvasElementType, string> = { text: "テキスト", image: "画像", button: "ボタン", rect: "図形/背景" };
  const TYPE_COLOR: Record<CanvasElementType, string> = { text: "#EEF2FF", image: "#F0FDF4", button: "#FFF7ED", rect: "#FAF5FF" };
  const TYPE_TEXT: Record<CanvasElementType, string>  = { text: "#4F46E5", image: "#16A34A", button: "#EA580C", rect: "#9333EA" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: TYPE_COLOR[el.type], color: TYPE_TEXT[el.type] }}>
          {TYPE_LABEL[el.type]}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          {onDeleteBlock && (
            <button onClick={onDeleteBlock}
              style={{ fontSize: 11, color: "#DC2626", background: "#FEE2E2", border: "1px solid #FCA5A5", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 700 }}>
              ブロック削除
            </button>
          )}
          <button onClick={onDelete}
            style={{ fontSize: 11, color: "#EF4444", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontWeight: 600 }}>
            要素削除
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px" }}>

        {/* Position & Size */}
        <PropRow label="位置 / サイズ">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 6 }}>
            <NumberInput value={el.x} onChange={v => onUpdateEl({ x: v })} unit="X" />
            <NumberInput value={el.y} onChange={v => onUpdateEl({ y: v })} unit="Y" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <NumberInput value={el.width}  onChange={v => onUpdateEl({ width: Math.max(10, v) })}  min={10} unit="W" />
            <NumberInput value={el.height} onChange={v => onUpdateEl({ height: Math.max(10, v) })} min={10} unit="H" />
          </div>
        </PropRow>

        <hr style={{ border: "none", borderTop: "1px solid #F1F5F9", margin: "14px 0" }} />

        {/* Text / Button styles */}
        {(el.type === "text" || el.type === "button") && (
          <>
            <PropRow label="フォント">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 10, color: "#CBD5E1", marginBottom: 3 }}>サイズ</p>
                  <NumberInput value={s.fontSize ?? 16} onChange={v => onUpdateStyle({ fontSize: v })} min={6} max={200} unit="px" />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: "#CBD5E1", marginBottom: 3 }}>太さ</p>
                  <select value={s.fontWeight ?? "normal"}
                    onChange={e => onUpdateStyle({ fontWeight: e.target.value })}
                    style={{ width: "100%", fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 4px", outline: "none", background: "#F8FAFC", color: "#111827" }}>
                    <option value="normal">Regular</option>
                    <option value="500">Medium</option>
                    <option value="600">Semibold</option>
                    <option value="bold">Bold</option>
                    <option value="900">Black</option>
                  </select>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
                <div>
                  <p style={{ fontSize: 10, color: "#CBD5E1", marginBottom: 3 }}>行間</p>
                  <input type="number" step="0.1" value={s.lineHeight ?? 1.5} min={0.8} max={4}
                    onChange={e => onUpdateStyle({ lineHeight: parseFloat(e.target.value) })}
                    style={{ width: "100%", fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 6px", outline: "none", background: "#F8FAFC", color: "#111827" }} />
                </div>
                <div>
                  <p style={{ fontSize: 10, color: "#CBD5E1", marginBottom: 3 }}>文字間</p>
                  <select value={s.letterSpacing ?? "normal"}
                    onChange={e => onUpdateStyle({ letterSpacing: e.target.value })}
                    style={{ width: "100%", fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 4px", outline: "none", background: "#F8FAFC", color: "#111827" }}>
                    <option value="normal">通常</option>
                    <option value="0.05em">広め</option>
                    <option value="0.1em">広い</option>
                    <option value="0.15em">とても広い</option>
                    <option value="0.2em">最大</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, color: "#CBD5E1", marginBottom: 3 }}>テキストカラー</p>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input type="color" value={s.color ?? "#111827"} onChange={e => onUpdateStyle({ color: e.target.value })}
                    style={{ width: 36, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", cursor: "pointer", padding: 2 }} />
                  <input type="text" value={s.color ?? "#111827"} onChange={e => onUpdateStyle({ color: e.target.value })}
                    style={{ flex: 1, fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 6px", outline: "none", background: "#F8FAFC", color: "#111827", fontFamily: "monospace" }} />
                </div>
              </div>
            </PropRow>

            <PropRow label="揃え">
              <div style={{ display: "flex", gap: 4 }}>
                {(["left", "center", "right"] as const).map(a => (
                  <button key={a} onClick={() => onUpdateStyle({ textAlign: a })}
                    style={{
                      flex: 1, padding: "5px 0", borderRadius: 6, fontSize: 13, cursor: "pointer",
                      border: `1px solid ${s.textAlign === a ? "#6366F1" : "#E2E8F0"}`,
                      background: s.textAlign === a ? "#EEF2FF" : "#F8FAFC",
                      color: s.textAlign === a ? "#4F46E5" : "#94A3B8", fontWeight: s.textAlign === a ? 700 : 400,
                    }}>
                    {a === "left" ? "⬅" : a === "center" ? "↔" : "➡"}
                  </button>
                ))}
              </div>
            </PropRow>

            <PropRow label="リンクURL">
              <input type="url" defaultValue={el.href ?? ""}
                onBlur={e => onUpdateEl({ href: e.target.value || undefined })}
                placeholder="https://..."
                style={{ width: "100%", fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 7px", outline: "none", background: "#F8FAFC", color: "#111827", boxSizing: "border-box" }} />
            </PropRow>
          </>
        )}

        {/* Image styles */}
        {el.type === "image" && (
          <>
            <PropRow label="画像URL">
              <input type="url" defaultValue={el.src ?? ""}
                onBlur={e => onUpdateEl({ src: e.target.value || undefined })}
                placeholder="https://..."
                style={{ width: "100%", fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 7px", outline: "none", background: "#F8FAFC", color: "#111827", boxSizing: "border-box", marginBottom: 6 }} />
            </PropRow>
            <PropRow label="フィット">
              <select value={s.objectFit ?? "cover"} onChange={e => onUpdateStyle({ objectFit: e.target.value as "cover" | "contain" | "fill" })}
                style={{ width: "100%", fontSize: 12, border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 7px", outline: "none", background: "#F8FAFC", color: "#111827" }}>
                <option value="cover">Cover（クロップ）</option>
                <option value="contain">Contain（全体表示）</option>
                <option value="fill">Fill（引き伸ばし）</option>
              </select>
            </PropRow>
          </>
        )}

        {/* Rect styles */}
        {el.type === "rect" && (
          <>
            <PropRow label="背景色">
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <input type="color" value={s.backgroundColor ?? "#F3F4F6"} onChange={e => onUpdateStyle({ backgroundColor: e.target.value })}
                  style={{ width: 36, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", cursor: "pointer", padding: 2 }} />
                <input type="text" value={s.backgroundColor ?? "#F3F4F6"} onChange={e => onUpdateStyle({ backgroundColor: e.target.value })}
                  style={{ flex: 1, fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 6px", outline: "none", background: "#F8FAFC", color: "#111827", fontFamily: "monospace" }} />
              </div>
            </PropRow>
            <PropRow label="背景画像URL">
              <input type="url" defaultValue={s.backgroundImage ?? ""}
                onBlur={e => onUpdateStyle({ backgroundImage: e.target.value || undefined, backgroundSize: e.target.value ? "cover" : undefined, backgroundPosition: e.target.value ? "center" : undefined })}
                placeholder="https://..."
                style={{ width: "100%", fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "5px 7px", outline: "none", background: "#F8FAFC", color: "#111827", boxSizing: "border-box" }} />
            </PropRow>
          </>
        )}

        {/* Button background */}
        {el.type === "button" && (
          <PropRow label="ボタン背景色">
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="color" value={s.backgroundColor ?? "#1E40AF"} onChange={e => onUpdateStyle({ backgroundColor: e.target.value })}
                style={{ width: 36, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", cursor: "pointer", padding: 2 }} />
              <input type="text" value={s.backgroundColor ?? "#1E40AF"} onChange={e => onUpdateStyle({ backgroundColor: e.target.value })}
                style={{ flex: 1, fontSize: 11, border: "1px solid #E2E8F0", borderRadius: 6, padding: "4px 6px", outline: "none", background: "#F8FAFC", color: "#111827", fontFamily: "monospace" }} />
            </div>
          </PropRow>
        )}

        {/* Border radius (rect + button) */}
        {(el.type === "rect" || el.type === "button") && (
          <PropRow label="角丸">
            <NumberInput value={typeof s.borderRadius === "number" ? s.borderRadius : parseInt(String(s.borderRadius ?? 0)) || 0} onChange={v => onUpdateStyle({ borderRadius: v })} min={0} max={999} unit="px" />
          </PropRow>
        )}

        <hr style={{ border: "none", borderTop: "1px solid #F1F5F9", margin: "14px 0" }} />

        {/* Opacity */}
        <PropRow label="透明度">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="range" min={0} max={1} step={0.01} value={s.opacity ?? 1}
              onChange={e => onUpdateStyle({ opacity: parseFloat(e.target.value) })}
              style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: "#94A3B8", minWidth: 34, textAlign: "right" }}>{Math.round((s.opacity ?? 1) * 100)}%</span>
          </div>
        </PropRow>

        {/* Z-index */}
        <PropRow label="レイヤー順">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <button onClick={onBringForward}
              style={{ padding: "6px 0", fontSize: 11, fontWeight: 600, borderRadius: 6, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#374151", cursor: "pointer" }}>
              ↑ 前面へ
            </button>
            <button onClick={onSendBack}
              style={{ padding: "6px 0", fontSize: 11, fontWeight: 600, borderRadius: 6, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#374151", cursor: "pointer" }}>
              ↓ 背面へ
            </button>
          </div>
          <p style={{ fontSize: 10, color: "#CBD5E1", marginTop: 4, textAlign: "center" }}>Z: {el.zIndex ?? 0}</p>
        </PropRow>

        {/* Position display */}
        <div style={{ marginTop: 16, padding: "8px 10px", background: "#F8FAFC", borderRadius: 8, fontFamily: "monospace", fontSize: 10, color: "#94A3B8", lineHeight: 1.8 }}>
          x: {Math.round(el.x)}  y: {Math.round(el.y)}<br />
          w: {Math.round(el.width)}  h: {Math.round(el.height)}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CANVAS ELEMENT VIEW
// ══════════════════════════════════════════════════════════════
interface ElemProps {
  element: CanvasElement;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onStartDrag: (e: React.PointerEvent, mode: DragMode) => void;
  onUpdate: (patch: Partial<CanvasElement>) => void;
}

function CanvasElementView({ element: el, isSelected, isEditing, onSelect, onDoubleClick, onStartDrag, onUpdate }: ElemProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(contentRef.current);
      range.collapse(false);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  }, [isEditing]);

  const css = styleToCSS(el.style, el.type);

  return (
    <div
      style={{
        position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height,
        zIndex: el.zIndex ?? 1,
        cursor: isEditing ? "text" : "move",
        outline: isSelected ? "2px solid #6366F1" : "none",
        outlineOffset: 1,
        userSelect: isEditing ? "text" : "none",
        overflow: el.type === "image" ? "hidden" : "visible",
      }}
      onPointerDown={e => { if (isEditing) return; e.stopPropagation(); onSelect(); onStartDrag(e, { kind: "move" }); }}
      onClick={e => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={e => { e.stopPropagation(); onDoubleClick(); }}
      data-canvas-elem="1"
    >
      {el.type === "image" ? (
        el.src
          ? <img src={el.src} alt={el.alt ?? ""} style={{ width: "100%", height: "100%", objectFit: (el.style.objectFit as "cover"|"contain"|"fill") ?? "cover" }} draggable={false} />
          // eslint-disable-next-line @next/next/no-img-element
          : <div style={{ width: "100%", height: "100%", ...css, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 13, border: "2px dashed #D1D5DB" }}>画像URLを右パネルで設定</div>
      ) : el.type === "rect" ? (
        <div style={{ width: "100%", height: "100%", ...css }} />
      ) : (
        <div
          ref={contentRef}
          contentEditable={isEditing}
          suppressContentEditableWarning
          onBlur={e => { if (isEditing) onUpdate({ html: e.currentTarget.innerHTML }); }}
          dangerouslySetInnerHTML={isEditing ? undefined : { __html: el.html ?? "" }}
          style={{ width: "100%", height: "100%", outline: "none", ...css, display: "flex", alignItems: "center",
            ...(el.type === "button" ? { justifyContent: "center", cursor: isEditing ? "text" : "pointer" } : {}) }}
        />
      )}

      {/* Resize handles */}
      {isSelected && !isEditing && Object.entries(HANDLE_POSITIONS).map(([handle, pos]) => (
        <div key={handle}
          style={{
            position: "absolute", top: pos.top, left: pos.left,
            transform: "translate(-50%, -50%)",
            width: 9, height: 9,
            backgroundColor: "#6366F1", border: "2px solid white",
            borderRadius: 2, cursor: pos.cursor, zIndex: 100,
          }}
          onPointerDown={e => { e.stopPropagation(); onStartDrag(e, { kind: "resize", handle: handle as ResizeHandle }); }}
        />
      ))}
    </div>
  );
}
