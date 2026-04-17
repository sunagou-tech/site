"use client";

import { BLOCK_META, BLOCK_DEFAULTS, BlockType, SectionBlock } from "@/types/site";
import { X } from "lucide-react";

interface Props {
  onInsert: (block: SectionBlock) => void;
  onClose: () => void;
}

// ─── リッチなCSS-onlyサムネイル ───────────────────────────────
const THUMBNAILS: Record<BlockType, React.ReactNode> = {

  // ヒーロー：幾何学シェイプ + 左寄せ大見出し
  hero: (
    <div className="w-full h-full bg-[#faf7f2] relative flex items-center px-4 overflow-hidden">
      <div className="absolute right-2 top-2 w-10 h-10 rounded-full bg-yellow-300/70" />
      <div className="absolute right-8 top-8 w-6 h-6 bg-indigo-400/50 rotate-12" />
      <div className="absolute right-4 bottom-3 w-4 h-4 rounded-full bg-pink-300/60" />
      <div className="z-10 space-y-1.5">
        <div className="w-20 h-3 bg-gray-800 rounded-sm" />
        <div className="w-14 h-3 bg-gray-800 rounded-sm" />
        <div className="w-10 h-1.5 bg-gray-400 rounded-sm mt-1" />
        <div className="w-10 h-4 rounded-full bg-gray-800 mt-2" />
      </div>
    </div>
  ),

  // About：左にアクセントバー + 大見出し + 本文
  about: (
    <div className="w-full h-full bg-white flex items-center px-4 gap-3 overflow-hidden">
      <div className="w-1 self-stretch bg-yellow-400 rounded-full flex-shrink-0 my-3" />
      <div className="space-y-1.5 flex-1">
        <div className="w-16 h-2.5 bg-gray-800 rounded" />
        <div className="w-12 h-2.5 bg-gray-800 rounded" />
        <div className="w-full h-1 bg-gray-200 rounded mt-2" />
        <div className="w-full h-1 bg-gray-200 rounded" />
        <div className="w-3/4 h-1 bg-gray-200 rounded" />
        <div className="w-10 h-3.5 rounded-full bg-gray-800 mt-2" />
      </div>
    </div>
  ),

  // Why：左テキスト + 右画像
  why: (
    <div className="w-full h-full flex overflow-hidden">
      <div className="flex-1 bg-[#faf7f2] flex flex-col justify-center px-3 gap-1.5">
        <div className="w-8 h-1 bg-yellow-400 rounded" />
        <div className="w-14 h-2 bg-gray-800 rounded" />
        <div className="w-12 h-2 bg-gray-800 rounded" />
        <div className="w-full h-1 bg-gray-300 rounded mt-1" />
        <div className="w-full h-1 bg-gray-300 rounded" />
        <div className="w-3/4 h-1 bg-gray-300 rounded" />
      </div>
      <div className="w-20 bg-indigo-100 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-2 rounded-xl bg-indigo-200/80" />
        <div className="absolute top-3 left-3 w-4 h-4 rounded bg-indigo-300" />
      </div>
    </div>
  ),

  // Services：アクセントバー + 番号付き3カラム
  services: (
    <div className="w-full h-full bg-[#fbfbfb] flex overflow-hidden">
      <div className="w-2 bg-yellow-400 flex-shrink-0" />
      <div className="flex-1 px-2 py-2 space-y-1.5">
        <div className="w-10 h-1.5 bg-gray-700 rounded" />
        <div className="grid grid-cols-3 gap-1 mt-1">
          {[0,1,2].map(i => (
            <div key={i} className="bg-white rounded p-1 space-y-0.5 border border-gray-100">
              <div className="w-3 h-1.5 bg-yellow-400 rounded-sm" />
              <div className="w-full h-0.5 bg-gray-200 rounded" />
              <div className="w-full h-0.5 bg-gray-200 rounded" />
              <div className="w-2/3 h-0.5 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),

  // Contact：マーキーバー + CTA
  contact: (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="h-7 bg-gray-800 flex items-center px-2 overflow-hidden">
        <div className="flex gap-3 animate-none opacity-70">
          <div className="w-20 h-1.5 bg-white/40 rounded flex-shrink-0" />
          <div className="w-16 h-1.5 bg-white/30 rounded flex-shrink-0" />
        </div>
      </div>
      <div className="flex-1 bg-white flex flex-col items-center justify-center gap-1.5">
        <div className="w-20 h-2.5 bg-gray-800 rounded" />
        <div className="w-16 h-1 bg-gray-300 rounded" />
        <div className="w-14 h-1 bg-gray-300 rounded" />
        <div className="w-12 h-4 rounded-full bg-gray-800 mt-1" />
      </div>
    </div>
  ),

  // Footer：ダークグラウンド + 4カラムナビ
  footer: (
    <div className="w-full h-full bg-gray-900 flex flex-col justify-end px-3 py-2 gap-1.5">
      <div className="flex gap-3 items-start">
        <div className="flex flex-col gap-0.5">
          <div className="w-8 h-2 bg-white rounded-sm" />
          <div className="w-12 h-0.5 bg-gray-600 rounded mt-0.5" />
          <div className="w-10 h-0.5 bg-gray-600 rounded" />
        </div>
        {[0,1,2].map(i => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="w-7 h-1 bg-gray-400 rounded" />
            <div className="w-6 h-0.5 bg-gray-600 rounded" />
            <div className="w-5 h-0.5 bg-gray-600 rounded" />
            <div className="w-6 h-0.5 bg-gray-600 rounded" />
          </div>
        ))}
      </div>
      <div className="border-t border-gray-700 pt-1 flex justify-between">
        <div className="w-16 h-0.5 bg-gray-700 rounded" />
        <div className="flex gap-1">
          {[0,1,2].map(i => <div key={i} className="w-2.5 h-2.5 rounded-full bg-gray-700" />)}
        </div>
      </div>
    </div>
  ),

  // Split：左画像 / 右テキスト 50:50
  split: (
    <div className="w-full h-full flex overflow-hidden">
      <div className="w-1/2 bg-gradient-to-br from-indigo-100 to-indigo-200 relative">
        <div className="absolute inset-3 rounded-xl bg-indigo-300/40" />
        <div className="absolute top-5 left-5 w-5 h-5 rounded bg-indigo-300" />
      </div>
      <div className="w-1/2 bg-white flex flex-col justify-center px-3 gap-1.5">
        <div className="w-8 h-1 bg-yellow-400 rounded" />
        <div className="w-14 h-2 bg-gray-800 rounded" />
        <div className="w-12 h-2 bg-gray-800 rounded" />
        <div className="w-full h-1 bg-gray-200 rounded mt-1" />
        <div className="w-full h-1 bg-gray-200 rounded" />
        <div className="w-10 h-4 rounded-full bg-gray-800 mt-2" />
      </div>
    </div>
  ),

  // FullscreenBg：フルグラデーション背景 + 中央カード
  "fullscreen-bg": (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-700 to-indigo-900">
      <div className="absolute top-2 right-3 w-8 h-8 rounded-full bg-white/10" />
      <div className="absolute bottom-3 left-3 w-5 h-5 rounded bg-white/10 rotate-12" />
      <div className="bg-white/95 rounded-xl p-3 w-3/4 shadow-xl">
        <div className="w-12 h-1.5 bg-gray-800 rounded mb-1.5" />
        <div className="w-16 h-1 bg-gray-400 rounded mb-1" />
        <div className="w-full h-1 bg-gray-200 rounded mb-0.5" />
        <div className="w-3/4 h-1 bg-gray-200 rounded mb-2" />
        <div className="w-10 h-3.5 rounded-full bg-gray-800" />
      </div>
    </div>
  ),

  // Gallery：不規則グリッド
  gallery: (
    <div className="w-full h-full p-1.5 grid gap-1" style={{ gridTemplateColumns: "2fr 1fr", gridTemplateRows: "1fr 1fr" }}>
      <div className="row-span-2 rounded-lg bg-gradient-to-br from-violet-200 to-violet-300" />
      <div className="rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200" />
      <div className="rounded-lg bg-gradient-to-br from-green-100 to-green-200" />
    </div>
  ),

  // HeroA：左画像 / 右グラデーション白文字
  "hero-split": (
    <div className="w-full h-full flex overflow-hidden">
      <div className="w-1/2 bg-indigo-100 relative">
        <div className="absolute inset-2 rounded-lg bg-indigo-200/70" />
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-yellow-400" />
      </div>
      <div
        className="w-1/2 flex flex-col justify-center px-3 gap-1.5"
        style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #4f46e5 100%)" }}
      >
        <div className="w-6 h-0.5 bg-yellow-400 rounded" />
        <div className="w-16 h-2.5 bg-white rounded" />
        <div className="w-12 h-2.5 bg-white rounded" />
        <div className="w-14 h-1 bg-white/30 rounded mt-1" />
        <div className="w-10 h-4 rounded-full mt-1" style={{ backgroundColor: "#F5C842" }} />
      </div>
    </div>
  ),

  // HeroB：動画BG + 大タイポグラフィ
  "hero-video": (
    <div
      className="w-full h-full relative flex flex-col justify-end px-3 pb-3 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #050510 0%, #1a1a2e 60%, #2d1b69 100%)" }}
    >
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "10px 10px" }} />
      <div className="absolute top-2 right-3 w-6 h-6 rounded-full bg-yellow-400/40" />
      <div className="absolute top-5 right-9 w-3 h-3 bg-indigo-400/50 rotate-45" />
      <div className="relative z-10 space-y-1">
        <div className="w-6 h-0.5 bg-white/40 rounded" />
        <div className="w-20 h-3 bg-white rounded" />
        <div className="w-16 h-3 bg-white rounded" />
        <div className="w-10 h-1 bg-white/30 rounded mt-1" />
      </div>
    </div>
  ),

  // HeroC：インタラクティブシェイプ
  "hero-interactive": (
    <div className="w-full h-full relative flex items-center px-3 overflow-hidden" style={{ backgroundColor: "#0d0d1a" }}>
      <div className="absolute top-2 right-4 w-9 h-9 rounded-full bg-yellow-400/70" />
      <div className="absolute top-7 right-12 w-6 h-6 bg-indigo-400/60 rotate-12" />
      <div className="absolute bottom-3 right-5 w-4 h-4 rounded-full bg-emerald-400/60" />
      <div className="absolute bottom-1 right-14 w-3 h-3 bg-pink-400/50 rotate-45" />
      <div className="z-10 space-y-1.5">
        <div className="w-16 h-2.5 bg-white rounded" />
        <div className="w-12 h-2.5 bg-white rounded" />
        <div className="w-10 h-1 bg-white/30 rounded mt-1" />
        <div className="w-10 h-4 rounded-full mt-1" style={{ backgroundColor: "#F5C842" }} />
      </div>
    </div>
  ),

  // Stats：ダーク背景 + 大数字4列
  stats: (
    <div className="w-full h-full flex items-center justify-center gap-0 overflow-hidden" style={{ backgroundColor: "#1a1a2e" }}>
      {[
        { v: "800", s: "+", l: "社" },
        { v: "24", s: "h", l: "対応" },
        { v: "98", s: "%", l: "満足" },
        { v: "10", s: "年", l: "実績" },
      ].map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 border-r border-white/10 last:border-0">
          <div className="flex items-end gap-0.5">
            <div className="text-[11px] font-black text-white leading-none">{d.v}</div>
            <div className="text-[7px] font-bold text-yellow-400 mb-0.5">{d.s}</div>
          </div>
          <div className="text-[7px] text-white/40">{d.l}</div>
        </div>
      ))}
    </div>
  ),

  // Features：3×2アイコン+テキストグリッド
  features: (
    <div className="w-full h-full bg-white px-2 py-2">
      <div className="text-center mb-1.5">
        <div className="w-12 h-1.5 bg-gray-800 rounded mx-auto" />
        <div className="w-6 h-0.5 bg-yellow-400 rounded mx-auto mt-1" />
      </div>
      <div className="grid grid-cols-3 gap-1">
        {[0,1,2,3,4,5].map(i => (
          <div key={i} className="rounded-lg p-1.5 bg-yellow-50 border border-yellow-100">
            <div className="w-4 h-4 rounded bg-yellow-200 mb-1 flex items-center justify-center text-[8px]">★</div>
            <div className="w-full h-1 bg-gray-300 rounded" />
            <div className="w-3/4 h-0.5 bg-gray-200 rounded mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  ),

  // FAQ：アコーディオン行
  faq: (
    <div className="w-full h-full bg-[#fafafa] px-2 py-2">
      <div className="w-12 h-1.5 bg-gray-800 rounded mb-2" />
      <div className="bg-white rounded-xl px-2 py-1 space-y-0.5 border border-gray-100">
        {[1, 0.7, 0, 0.7, 0].map((open, i) => (
          <div key={i} className="border-b border-gray-100 last:border-0 py-1.5 flex items-center justify-between">
            <div className="w-20 h-1 bg-gray-700 rounded" style={{ opacity: 0.7 + open * 0.3 }} />
            <div className="w-2 h-2 border-r border-b border-gray-400 rotate-45 flex-shrink-0" style={{ transform: open ? "rotate(225deg)" : "rotate(45deg)" }} />
          </div>
        ))}
      </div>
    </div>
  ),

  // Team：4アバターカード横並び
  team: (
    <div className="w-full h-full bg-white px-2 py-2">
      <div className="text-center mb-2">
        <div className="w-14 h-1.5 bg-gray-800 rounded mx-auto" />
      </div>
      <div className="flex gap-1.5 justify-center">
        {["#1a1a2e","#4f46e5","#15803d","#dc2626"].map((c, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: c }}>
              A
            </div>
            <div className="w-8 h-1 bg-gray-700 rounded" />
            <div className="w-6 h-0.5 bg-yellow-400 rounded" />
            <div className="w-8 h-0.5 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  ),

  // Testimonials：3引用カード
  testimonials: (
    <div className="w-full h-full px-2 py-2" style={{ backgroundColor: "#f7f7fa" }}>
      <div className="w-14 h-1.5 bg-gray-800 rounded mb-2 mx-auto" />
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="flex-1 bg-white rounded-lg p-1.5 border border-gray-100 shadow-sm">
            <div className="text-[10px] text-yellow-400 font-black leading-none mb-1">"</div>
            <div className="space-y-0.5">
              <div className="w-full h-0.5 bg-gray-200 rounded" />
              <div className="w-full h-0.5 bg-gray-200 rounded" />
              <div className="w-3/4 h-0.5 bg-gray-200 rounded" />
            </div>
            <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-gray-100">
              <div className="w-3 h-3 rounded-full bg-gray-800" />
              <div className="w-6 h-0.5 bg-gray-500 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),

  // HeroD：中央揃え + 背景グラデーション
  "hero-centered": (
    <div className="w-full h-full relative flex flex-col items-center justify-center text-center overflow-hidden"
         style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d1b69 100%)" }}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, #F5C842 0%, transparent 50%)" }} />
      <div className="relative z-10 space-y-1.5 px-3">
        <div className="w-8 h-0.5 bg-yellow-400 rounded mx-auto" />
        <div className="w-20 h-2.5 bg-white rounded mx-auto" />
        <div className="w-16 h-2.5 bg-white rounded mx-auto" />
        <div className="w-14 h-1 bg-white/30 rounded mx-auto mt-1" />
        <div className="flex gap-1.5 justify-center mt-2">
          <div className="w-10 h-4 rounded-full" style={{ backgroundColor: "#F5C842" }} />
          <div className="w-10 h-4 rounded-full border border-white/40" />
        </div>
      </div>
    </div>
  ),

  // HeroE：ミニマル白背景 + 極太タイポ
  "hero-minimal": (
    <div className="w-full h-full bg-white flex items-center px-4 overflow-hidden">
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 mb-1">
          <div className="w-4 h-px bg-yellow-400" />
          <div className="w-6 h-0.5 bg-gray-300 rounded" />
        </div>
        <div className="w-24 h-3.5 bg-gray-900 rounded-sm" style={{ letterSpacing: "-0.04em" }} />
        <div className="w-18 h-3.5 bg-gray-900 rounded-sm" />
        <div className="w-16 h-1 bg-gray-300 rounded mt-1" />
        <div className="w-12 h-4 rounded-full bg-gray-900 mt-2" />
      </div>
    </div>
  ),

  // ロゴ一覧：帯状ロゴグリッド
  "logo-cloud": (
    <div className="w-full h-full bg-white border-y border-gray-100 flex flex-col items-center justify-center gap-2 px-3">
      <div className="w-16 h-0.5 bg-gray-200 rounded" />
      <div className="flex gap-2 flex-wrap justify-center">
        {["〇〇社", "△△HD", "◇◇Corp", "□□G", "〇〇Tech"].map((n, i) => (
          <div key={i} className="px-2 py-1 border border-gray-200 rounded-lg">
            <div className="w-8 h-1 bg-gray-400 rounded" />
          </div>
        ))}
      </div>
    </div>
  ),

  // ステップ：番号4列横並び
  steps: (
    <div className="w-full h-full bg-white px-2 py-3">
      <div className="text-center mb-2"><div className="w-12 h-1.5 bg-gray-800 rounded mx-auto" /></div>
      <div className="relative">
        <div className="absolute top-4 left-0 right-0 h-px bg-gray-200" />
        <div className="flex justify-around">
          {["01","02","03","04"].map((n, i) => (
            <div key={i} className="flex flex-col items-center gap-1 relative z-10">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-sm"
                   style={{ backgroundColor: "#1a1a2e" }}>
                {n}
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-yellow-400" />
              </div>
              <div className="w-8 h-1 bg-gray-300 rounded" />
              <div className="w-6 h-0.5 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  ),

  // 料金プラン：3カラム（中央ハイライト）
  pricing: (
    <div className="w-full h-full px-1.5 py-2 flex items-center gap-1.5" style={{ backgroundColor: "#f7f7fa" }}>
      {[false, true, false].map((hi, i) => (
        <div key={i}
             className={`flex-1 rounded-xl p-2 flex flex-col gap-1 ${hi ? "shadow-lg scale-105 z-10" : "border border-gray-200 bg-white"}`}
             style={hi ? { backgroundColor: "#1a1a2e" } : {}}>
          <div className={`w-full h-1 rounded ${hi ? "bg-white/40" : "bg-gray-200"}`} />
          <div className={`w-8 h-2 rounded font-black ${hi ? "bg-white" : "bg-gray-700"}`} />
          <div className={`w-full h-0.5 rounded ${hi ? "bg-white/20" : "bg-gray-100"}`} />
          <div className={`w-full h-0.5 rounded ${hi ? "bg-white/20" : "bg-gray-100"}`} />
          <div className="w-full h-3 rounded-full mt-1" style={{ backgroundColor: hi ? "#F5C842" : "#e5e7eb" }} />
        </div>
      ))}
    </div>
  ),

  // ニュース：3記事カード
  news: (
    <div className="w-full h-full bg-white px-2 py-2">
      <div className="flex items-center justify-between mb-1.5">
        <div className="w-12 h-1.5 bg-gray-800 rounded" />
        <div className="w-8 h-1 bg-gray-300 rounded" />
      </div>
      <div className="flex gap-1.5">
        {[0,1,2].map(i => (
          <div key={i} className="flex-1 rounded-lg overflow-hidden border border-gray-100">
            <div className="h-8 bg-gradient-to-br from-indigo-100 to-purple-100" />
            <div className="p-1.5 space-y-0.5">
              <div className="w-8 h-0.5 bg-yellow-400 rounded" />
              <div className="w-full h-1 bg-gray-700 rounded" />
              <div className="w-3/4 h-0.5 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),

  // タイムライン：縦線 + ドット
  timeline: (
    <div className="w-full h-full bg-white px-3 py-2">
      <div className="w-12 h-1.5 bg-gray-800 rounded mb-2" />
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gray-200" />
        {[0,1,2,3].map(i => (
          <div key={i} className="flex gap-3 mb-2 items-start">
            <div className="relative z-10 w-3 h-3 rounded-full border-2 border-gray-800 bg-white mt-0.5 flex-shrink-0"
                 style={i === 0 ? { backgroundColor: "#1a1a2e" } : {}} />
            <div className="space-y-0.5 flex-1">
              <div className="w-5 h-0.5 bg-yellow-400 rounded" />
              <div className="w-12 h-1 bg-gray-700 rounded" />
              <div className="w-full h-0.5 bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),

  // 2列CTA：ダーク + ライト 2カード
  "two-col-cta": (
    <div className="w-full h-full flex gap-1.5 p-2 bg-white items-stretch">
      <div className="flex-1 rounded-xl p-2 relative overflow-hidden" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full opacity-20" style={{ backgroundColor: "#F5C842" }} />
        <div className="w-5 h-5 rounded-lg mb-1.5" style={{ backgroundColor: "#F5C842" }} />
        <div className="w-12 h-1.5 bg-white rounded mb-1" />
        <div className="w-full h-0.5 bg-white/30 rounded" />
        <div className="w-10 h-3 rounded-full mt-1.5" style={{ backgroundColor: "#F5C842" }} />
      </div>
      <div className="flex-1 rounded-xl p-2 border-2 border-gray-200">
        <div className="w-5 h-5 rounded-lg border-2 border-gray-300 mb-1.5" />
        <div className="w-12 h-1.5 bg-gray-800 rounded mb-1" />
        <div className="w-full h-0.5 bg-gray-200 rounded" />
        <div className="w-10 h-3 rounded-full border-2 border-gray-800 mt-1.5" />
      </div>
    </div>
  ),

  // メルマガ：メール入力 + ボタン
  newsletter: (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 px-3" style={{ backgroundColor: "#f7f7fa" }}>
      <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center text-xs">✉</div>
      <div className="w-16 h-1.5 bg-gray-800 rounded" />
      <div className="w-14 h-1 bg-gray-300 rounded" />
      <div className="flex gap-1 w-full">
        <div className="flex-1 h-5 rounded-lg border border-gray-200 bg-white" />
        <div className="w-10 h-5 rounded-lg bg-gray-800" />
      </div>
    </div>
  ),

  // タブ：タブボタン + コンテンツエリア
  tabs: (
    <div className="w-full h-full bg-white px-2 py-2">
      <div className="w-14 h-1.5 bg-gray-800 rounded mb-2 mx-auto" />
      <div className="flex gap-1 mb-2">
        {[true, false, false].map((a, i) => (
          <div key={i} className="px-2 py-0.5 rounded-full text-[8px]"
               style={{ backgroundColor: a ? "#1a1a2e" : "#f0f0f5" }}>
            <div className={`w-5 h-0.5 rounded ${a ? "bg-white" : "bg-gray-400"}`} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <div className="w-14 h-1.5 bg-gray-700 rounded" />
          <div className="w-full h-0.5 bg-gray-200 rounded" />
          <div className="w-full h-0.5 bg-gray-200 rounded" />
          <div className="w-3/4 h-0.5 bg-gray-200 rounded" />
          <div className="w-10 h-3 rounded-full bg-gray-800 mt-1" />
        </div>
        <div className="rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 h-14" />
      </div>
    </div>
  ),

  // スクロールテキスト：流れる帯
  "marquee-text": (
    <div className="w-full h-full flex flex-col justify-center border-y border-gray-200" style={{ backgroundColor: "#fafafa" }}>
      <div className="flex items-center gap-4 overflow-hidden">
        {["採用支援","アウトソーシング","コンサルティング","DX推進","採用支援"].map((t, i) => (
          <div key={i} className="flex items-center gap-3 flex-shrink-0">
            <span className="text-[8px] font-semibold text-gray-700 whitespace-nowrap">{t}</span>
            <div className="w-1 h-1 rounded-full flex-shrink-0 bg-yellow-400" />
          </div>
        ))}
      </div>
    </div>
  ),

  // 動画：サムネ + 再生ボタン
  video: (
    <div className="w-full h-full px-2 py-2" style={{ backgroundColor: "#f7f7fa" }}>
      <div className="w-12 h-1.5 bg-gray-800 rounded mb-2 mx-auto" />
      <div className="relative rounded-xl overflow-hidden aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center mx-auto" style={{ height: 48 }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#F5C842" }}>
          <div className="w-0 h-0 ml-0.5" style={{ borderTop: "5px solid transparent", borderBottom: "5px solid transparent", borderLeft: "8px solid #1a1a2e" }} />
        </div>
      </div>
    </div>
  ),

  // 比較表：自社 vs 競合
  comparison: (
    <div className="w-full h-full bg-white px-2 py-2">
      <div className="w-14 h-1.5 bg-gray-800 rounded mb-2" />
      <div className="rounded-xl overflow-hidden border border-gray-200">
        <div className="grid grid-cols-3 text-center">
          <div className="bg-gray-50 py-1 border-b border-r border-gray-200">
            <div className="w-6 h-0.5 bg-gray-300 rounded mx-auto" />
          </div>
          <div className="py-1 border-b border-r border-gray-200" style={{ backgroundColor: "#1a1a2e" }}>
            <div className="w-6 h-0.5 bg-white/60 rounded mx-auto" />
          </div>
          <div className="bg-gray-100 py-1 border-b border-gray-200">
            <div className="w-6 h-0.5 bg-gray-400 rounded mx-auto" />
          </div>
        </div>
        {[0,1,2,3].map(i => (
          <div key={i} className="grid grid-cols-3 border-b border-gray-100 last:border-0">
            <div className="py-1 border-r border-gray-100 px-1"><div className="w-8 h-0.5 bg-gray-300 rounded" /></div>
            <div className="py-1 border-r border-gray-100 px-1 flex justify-center" style={{ backgroundColor: "#1a1a2e0a" }}>
              <div className="w-6 h-0.5 rounded" style={{ backgroundColor: "#1a1a2e" }} />
            </div>
            <div className="py-1 px-1 flex justify-center"><div className="w-5 h-0.5 bg-gray-300 rounded" /></div>
          </div>
        ))}
      </div>
    </div>
  ),

  // 事例グリッド：3×2画像グリッド + ホバーオーバーレイ
  "image-grid": (
    <div className="w-full h-full bg-white px-2 py-2">
      <div className="text-center mb-1.5"><div className="w-12 h-1.5 bg-gray-800 rounded mx-auto" /></div>
      <div className="grid grid-cols-3 gap-1">
        {[
          "from-indigo-200 to-indigo-300",
          "from-yellow-100 to-yellow-200",
          "from-green-100 to-green-200",
          "from-pink-100 to-pink-200",
          "from-purple-100 to-purple-200",
          "from-blue-100 to-blue-200",
        ].map((g, i) => (
          <div key={i} className={`aspect-square rounded-lg bg-gradient-to-br ${g} relative overflow-hidden group`}>
            <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-colors flex items-end p-1">
              <div className="w-full h-1 bg-white/0 hover:bg-white/80 rounded transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),

  // CTA：ダーク全幅 + 大見出し + 2ボタン
  cta: (
    <div className="w-full h-full relative flex flex-col items-center justify-center gap-2 overflow-hidden" style={{ backgroundColor: "#1a1a2e" }}>
      <div className="absolute -top-4 -right-4 w-14 h-14 rounded-full opacity-20" style={{ backgroundColor: "#F5C842" }} />
      <div className="absolute -bottom-3 -left-3 w-10 h-10 rounded-full opacity-20" style={{ backgroundColor: "#F5C842" }} />
      <div className="space-y-1 text-center z-10">
        <div className="w-20 h-2 bg-white rounded mx-auto" />
        <div className="w-16 h-2 bg-white rounded mx-auto" />
        <div className="w-14 h-1 bg-white/30 rounded mx-auto mt-1" />
      </div>
      <div className="flex gap-1.5 z-10">
        <div className="w-14 h-4 rounded-full" style={{ backgroundColor: "#F5C842" }} />
        <div className="w-14 h-4 rounded-full border border-white/40" />
      </div>
    </div>
  ),

  // バナー：細帯アナウンス
  banner: (
    <div className="w-full h-full flex flex-col justify-center" style={{ backgroundColor: "#1a1a2e" }}>
      <div className="flex items-center justify-center gap-2 py-2">
        <div className="px-1.5 py-0.5 rounded text-[8px] font-bold" style={{ backgroundColor: "#F5C842", color: "#1a1a2e" }}>NEW</div>
        <div className="w-20 h-0.5 bg-white/60 rounded" />
        <div className="w-8 h-0.5 rounded" style={{ backgroundColor: "#F5C842" }} />
      </div>
    </div>
  ),
  "hero-photo": (
    <div className="w-full h-full relative overflow-hidden" style={{background:"linear-gradient(135deg,#4a5568 0%,#2d3748 100%)"}}>
      <div className="absolute inset-0" style={{background: "linear-gradient(90deg, rgba(0,0,0,0.75) 40%, transparent)"}} />
      <div className="absolute left-2 top-2 bottom-2 flex flex-col justify-center gap-1">
        <div className="flex items-center gap-1"><div className="w-2 h-px bg-yellow-400"/><div className="w-8 h-0.5 bg-white/50 rounded"/></div>
        <div className="w-14 h-2 bg-white rounded"/>
        <div className="w-10 h-2 bg-white rounded"/>
        <div className="w-12 h-1 bg-white/50 rounded mt-0.5"/>
        <div className="w-10 h-2.5 rounded mt-1" style={{backgroundColor:"#F5C842"}}/>
      </div>
    </div>
  ),
  "hero-dark": (
    <div className="w-full h-full relative overflow-hidden bg-black">
      <div className="absolute inset-0 opacity-30" style={{background:"linear-gradient(135deg,#374151,#1f2937)"}} />
      <div className="absolute inset-0" style={{backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize:"12px 12px"}}/>
      <div className="absolute inset-2 flex gap-2">
        <div className="flex-1 flex flex-col justify-center gap-1">
          <div className="w-2 h-px bg-yellow-400"/>
          <div className="w-12 h-2 bg-white rounded"/>
          <div className="w-8 h-2 bg-white rounded"/>
          <div className="w-10 h-0.5 bg-yellow-400/60 rounded mt-0.5"/>
          <div className="w-9 h-2.5 rounded mt-1" style={{backgroundColor:"#F5C842"}}/>
        </div>
        <div className="flex flex-col gap-1.5 justify-center">
          <div className="w-12 p-1.5 rounded-lg border border-white/10 bg-white/5">
            <div className="w-6 h-2 bg-white/80 rounded mb-0.5"/>
            <div className="w-8 h-1 bg-white/30 rounded"/>
          </div>
          <div className="w-12 p-1.5 rounded-lg border border-white/10 bg-white/5">
            <div className="w-5 h-2 bg-white/80 rounded mb-0.5"/>
            <div className="w-8 h-1 bg-white/30 rounded"/>
          </div>
        </div>
      </div>
    </div>
  ),
  "hero-mosaic": (
    <div className="w-full h-full flex overflow-hidden bg-white">
      <div className="w-[42%] flex flex-col justify-center px-2 py-2 gap-1">
        <div className="flex items-center gap-1"><div className="w-2 h-px bg-yellow-400"/><div className="w-7 h-0.5 bg-gray-300 rounded"/></div>
        <div className="w-12 h-2 bg-gray-900 rounded"/>
        <div className="w-9 h-2 bg-gray-900 rounded"/>
        <div className="w-11 h-2 bg-gray-900 rounded"/>
        <div className="w-10 h-1 bg-gray-300 rounded mt-0.5"/>
        <div className="w-9 h-2.5 rounded mt-1 bg-gray-900"/>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-1 p-1">
        <div className="rounded-lg w-full h-full" style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)"}}/>
        <div className="rounded-lg w-full h-full" style={{background:"linear-gradient(135deg,#0ea5e9,#06b6d4)"}}/>
        <div className="rounded-lg w-full h-full" style={{background:"linear-gradient(135deg,#10b981,#34d399)"}}/>
        <div className="rounded-lg w-full h-full" style={{background:"linear-gradient(135deg,#f59e0b,#fbbf24)"}}/>
      </div>
    </div>
  ),
  "hero-japanese": (
    <div className="w-full h-full flex overflow-hidden" style={{backgroundColor:"#faf9f7"}}>
      <div className="w-[45%] relative flex flex-col justify-center px-2 py-2 overflow-hidden">
        <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[48px] font-black leading-none opacity-[0.06] text-gray-900 pointer-events-none">美</span>
        <div className="w-6 h-px bg-red-500 mb-1.5"/>
        <div className="w-10 h-0.5 bg-gray-200 rounded mb-1"/>
        <div className="w-12 h-2 bg-gray-900 rounded mb-0.5"/>
        <div className="w-9 h-2 bg-gray-900 rounded mb-0.5"/>
        <div className="w-11 h-1 bg-gray-200 rounded mb-2"/>
        <div className="w-10 h-2.5 border-2 border-gray-900 rounded"/>
      </div>
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0" style={{background:"linear-gradient(160deg,#e5e7eb,#d1d5db)"}}/>
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-500"/>
      </div>
    </div>
  ),
  "hero-diagonal": (
    <div className="w-full h-full relative overflow-hidden">
      <div className="absolute inset-0" style={{background:"linear-gradient(135deg,#475569,#334155)"}}/>
      <div className="absolute inset-0 bg-black/50"/>
      <div className="absolute left-0 top-0 bottom-0 w-[48%] flex flex-col justify-center pl-2 pr-6 gap-1"
        style={{clipPath:"polygon(0 0, 100% 0, 75% 100%, 0 100%)", backgroundColor:"rgba(26,26,46,0.93)"}}>
        <div className="flex items-center gap-1"><div className="w-2 h-px bg-yellow-400"/><div className="w-7 h-0.5 bg-white/40 rounded"/></div>
        <div className="w-12 h-2 bg-white rounded"/>
        <div className="w-9 h-2 bg-white rounded"/>
        <div className="w-10 h-1 bg-white/40 rounded mt-0.5"/>
        <div className="flex gap-1 mt-1.5">
          <div className="w-8 h-2.5 rounded" style={{backgroundColor:"#F5C842"}}/>
          <div className="w-7 h-2.5 rounded border border-white/30"/>
        </div>
      </div>
    </div>
  ),
  problem: (
    <div className="w-full h-full flex flex-col py-2 px-2" style={{ backgroundColor: "#1a1a2e" }}>
      <div className="text-center mb-1.5">
        <div className="inline-block w-12 h-1.5 bg-yellow-400/60 rounded-full mb-1" />
        <div className="w-20 h-2 bg-white mx-auto rounded mb-0.5" />
        <div className="w-16 h-1 bg-white/30 mx-auto rounded" />
      </div>
      <div className="grid grid-cols-3 gap-1 flex-1">
        {[0,1,2].map(i => (
          <div key={i} className="bg-white rounded-lg p-1.5 flex flex-col gap-1">
            <div className="text-[14px]">{["😰","😤","😓"][i]}</div>
            <div className="w-full h-1.5 bg-gray-800 rounded" />
            <div className="w-3/4 h-1 bg-gray-300 rounded" />
            <div className="w-full h-1 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="text-center mt-1.5">
        <div className="inline-block w-3 h-3 text-yellow-400 text-xs">↓</div>
      </div>
    </div>
  ),
  solution: (
    <div className="w-full h-full flex overflow-hidden" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="flex-1 flex flex-col justify-center px-2 py-2 gap-1">
        <div className="w-8 h-1.5 rounded-full bg-yellow-400/40 mb-0.5" />
        <div className="w-14 h-2 bg-gray-900 rounded" />
        <div className="w-10 h-2 bg-gray-900 rounded" />
        <div className="w-12 h-1 bg-gray-400 rounded mt-0.5" />
        {[0,1,2].map(i => (
          <div key={i} className="flex items-center gap-1 mt-0.5">
            <div className="w-3 h-3 rounded-full bg-yellow-400 flex-shrink-0" />
            <div className="flex-1 h-1 bg-gray-200 rounded" />
          </div>
        ))}
        <div className="w-10 h-2.5 rounded-full bg-gray-900 mt-1" />
      </div>
      <div className="w-16 m-1 rounded-xl overflow-hidden relative flex-shrink-0" style={{background:"linear-gradient(160deg,#c7d2fe,#a5b4fc)"}}/>
    </div>
  ),
  free: (
    <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-1.5 px-3 py-2">
      <div className="w-20 h-2 bg-gray-800 rounded" />
      <div className="w-14 h-1 bg-gray-300 rounded" />
      <div className="w-full h-8 mt-1 rounded-lg bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 flex items-end px-1 gap-0.5 pb-1">
        {[40, 65, 55, 80, 70, 90].map((h, i) => (
          <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: "#6366f160" }} />
        ))}
      </div>
      <div className="flex gap-1 mt-0.5">
        <div className="w-5 h-1 bg-indigo-300 rounded" />
        <div className="w-4 h-1 bg-purple-300 rounded" />
        <div className="w-6 h-1 bg-pink-300 rounded" />
      </div>
    </div>
  ),
  "hero-typo": (
    <div className="w-full h-full relative bg-white overflow-hidden flex items-center">
      {/* giant bg kanji */}
      <span className="absolute right-0 text-[80px] font-black leading-none text-gray-100 pointer-events-none select-none">革</span>
      {/* left accent line */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-yellow-400" />
      <div className="pl-4 z-10">
        <div className="flex items-center gap-1 mb-1.5">
          <div className="w-3 h-px bg-yellow-400" />
          <div className="w-10 h-1 bg-gray-200 rounded" />
        </div>
        <div className="w-16 h-2.5 bg-gray-900 rounded mb-0.5" />
        <div className="w-12 h-2.5 bg-gray-900 rounded mb-0.5" />
        <div className="w-14 h-2.5 bg-gray-900 rounded mb-2" />
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-0.5 bg-yellow-400" />
          <div className="w-8 h-1 bg-yellow-400/60 rounded" />
        </div>
        <div className="w-14 h-1 bg-gray-200 rounded mb-0.5" />
        <div className="w-10 h-1 bg-gray-200 rounded mb-3" />
        <div className="w-12 h-3 bg-gray-900" />
      </div>
    </div>
  ),
  "hero-asym": (
    <div className="w-full h-full flex overflow-hidden">
      {/* Left color band */}
      <div className="w-[38%] h-full flex flex-col justify-between py-2 px-2 relative" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="absolute top-3 right-0 w-6 h-6 rounded-full opacity-20" style={{ backgroundColor: "#F5C842" }} />
        <div>
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-px" style={{ backgroundColor: "#F5C842" }} />
            <div className="w-6 h-0.5 bg-white/30 rounded" />
          </div>
          <div className="w-10 h-2 bg-white rounded mb-0.5" />
          <div className="w-7 h-2 bg-white rounded mb-0.5" />
          <div className="w-9 h-2 rounded" style={{ backgroundColor: "#F5C842" }} />
        </div>
        <div>
          <div className="w-10 h-1 bg-white/30 rounded mb-0.5" />
          <div className="w-7 h-1 bg-white/30 rounded mb-2" />
          <div className="w-8 h-2.5 rounded-full" style={{ backgroundColor: "#F5C842" }} />
        </div>
      </div>
      {/* Right image */}
      <div className="flex-1 bg-gradient-to-br from-gray-200 to-gray-300 relative">
        <div className="absolute left-0 top-0 bottom-0 w-2" style={{ background: "linear-gradient(90deg, #1a1a2e, transparent)" }} />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <div className="w-6 h-px bg-white/40" />
          <div className="w-6 h-0.5 bg-white/30 rounded" />
        </div>
      </div>
    </div>
  ),
  "hero-gradient": (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: "#1a1a2e" }}>
      <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full blur-lg opacity-50" style={{ backgroundColor: "#F5C842" }} />
      <div className="absolute top-2 left-3 right-10">
        <div className="w-5 h-0.5 mb-1 rounded" style={{ backgroundColor: "#F5C842" }} />
        <div className="w-14 h-2 bg-white rounded mb-0.5" />
        <div className="w-10 h-2 bg-white rounded mb-0.5" />
        <div className="w-12 h-2 bg-white rounded mb-2" />
        <div className="flex gap-1">
          <div className="w-10 h-3 rounded-full" style={{ backgroundColor: "#F5C842" }} />
          <div className="w-8 h-3 rounded-full border border-white/30" />
        </div>
      </div>
      <div className="absolute top-2 right-1 flex flex-col gap-1">
        {[0,1,2].map(i => (
          <div key={i} className="w-10 rounded-lg p-1 border border-white/20" style={{ backgroundColor: "rgba(255,255,255,0.08)", transform: `translateX(${i*2}px)` }}>
            <div className="w-6 h-1.5 bg-white/80 rounded mb-0.5" />
            <div className="w-4 h-1 bg-white/30 rounded" />
          </div>
        ))}
      </div>
      <div className="absolute bottom-1 left-0 right-0 h-0.5 opacity-60" style={{ background: "linear-gradient(90deg, transparent, #F5C842, transparent)" }} />
    </div>
  ),
  "hero-glass": (
    <div className="w-full h-full relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d5e 50%, #1a3a2e 100%)" }}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(0,0,0,0.6), rgba(0,0,0,0.2))" }} />
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: "#F5C842" }} />
      <div className="absolute top-2 left-3 w-16 p-2 rounded-xl border border-white/15" style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}>
        <div className="w-4 h-0.5 mb-1.5 rounded" style={{ backgroundColor: "#F5C842" }} />
        <div className="w-10 h-1.5 bg-white rounded mb-0.5" />
        <div className="w-7 h-1.5 bg-white rounded mb-0.5" />
        <div className="w-8 h-1.5 bg-white rounded mb-2" />
        <div className="w-8 h-1 bg-white/30 rounded mb-2" />
        <div className="w-10 h-2.5 rounded-full" style={{ backgroundColor: "#F5C842" }} />
      </div>
      <div className="absolute right-1.5 bottom-3 flex flex-col items-center gap-0.5">
        <div className="w-px h-5 bg-white/20" />
        <div className="w-0.5 h-0.5 rounded-full bg-white/40" />
      </div>
    </div>
  ),
  column: (
    <div className="w-full h-full flex flex-col gap-1.5 p-2 bg-white">
      <div className="flex items-center gap-1 mb-0.5">
        <div className="w-1 h-3 rounded-full bg-yellow-400" />
        <div className="w-12 h-1.5 bg-gray-800 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-1 flex-1">
        {[0,1,2].map(i => (
          <div key={i} className="rounded bg-gray-50 border border-gray-100 flex flex-col gap-1 p-1">
            <div className="h-5 rounded bg-gray-200" />
            <div className="w-8 h-1 bg-yellow-400 rounded" />
            <div className="w-full h-1 bg-gray-200 rounded" />
            <div className="w-3/4 h-1 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <div className="w-16 h-2 rounded-full border border-gray-300" />
      </div>
    </div>
  ),
  "hero-game": (
    <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: "#0a0a0f" }}>
      {/* scanline hint */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.4) 2px,rgba(255,255,255,0.4) 4px)" }} />
      <div className="absolute inset-0 flex gap-1 p-1.5">
        {/* left content */}
        <div className="flex-1 flex flex-col gap-1 pt-0.5">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#F5C842" }} />
            <div className="w-8 h-1 rounded" style={{ backgroundColor: "#F5C842" }} />
          </div>
          <div className="w-12 h-2 bg-white rounded" />
          <div className="w-9 h-2 bg-white rounded" />
          <div className="w-full h-1 bg-gray-600 rounded mt-0.5" />
          <div className="w-full h-1 bg-gray-700 rounded" />
          {/* HP bar */}
          <div className="w-full h-1 bg-gray-800 rounded mt-1" style={{ border: "1px solid rgba(245,200,66,0.2)" }}>
            <div className="h-full w-full rounded" style={{ backgroundColor: "#F5C842" }} />
          </div>
          <div className="w-8 h-2 mt-0.5" style={{ backgroundColor: "#F5C842", borderRadius: "1px" }} />
        </div>
        {/* right image frame */}
        <div className="w-14 self-center" style={{ aspectRatio: "4/3", border: "1px solid rgba(245,200,66,0.5)", background: "#111", borderRadius: "1px" }} />
      </div>
      {/* stat row */}
      <div className="absolute bottom-0 left-0 right-0 grid grid-cols-3 gap-0.5 px-1 pb-1">
        {[0,1,2].map(i => (
          <div key={i} className="flex flex-col items-center py-0.5 rounded" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,200,66,0.1)" }}>
            <div className="w-5 h-1.5 rounded" style={{ backgroundColor: "#F5C842" }} />
            <div className="w-4 h-0.5 bg-gray-600 rounded mt-0.5" />
          </div>
        ))}
      </div>
    </div>
  ),
  "hero-reel": (
    <div className="w-full h-full flex overflow-hidden" style={{ background: "linear-gradient(135deg,#1a1a2e,#0a0a0f)" }}>
      {/* left text */}
      <div className="flex-1 flex flex-col justify-center px-2 gap-1">
        <div className="w-6 h-0.5 rounded" style={{ backgroundColor: "#F5C842" }} />
        <div className="w-12 h-2 bg-white rounded" />
        <div className="w-9 h-2 bg-white rounded" />
        <div className="w-full h-1 bg-white/30 rounded mt-0.5" />
        <div className="w-3/4 h-1 bg-white/30 rounded" />
        <div className="flex gap-1 mt-1">
          <div className="w-8 h-2 rounded-full" style={{ backgroundColor: "#F5C842" }} />
          <div className="w-7 h-2 rounded-full border border-white/30" />
        </div>
      </div>
      {/* right video frame */}
      <div className="w-20 my-2 mr-1.5 rounded-lg overflow-hidden relative flex-shrink-0 flex items-center justify-center"
        style={{ background: "#000", border: "1px solid rgba(255,255,255,0.15)", boxShadow: "0 0 12px rgba(245,200,66,0.3)" }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(245,200,66,0.8)" }}>
          <div className="w-0 h-0" style={{ borderLeft: "6px solid #0a0a0f", borderTop: "4px solid transparent", borderBottom: "4px solid transparent", marginLeft: "1px" }} />
        </div>
      </div>
    </div>
  ),
  "hero-slide": (
    <div className="w-full h-full relative overflow-hidden bg-gray-300 flex items-center justify-center">
      {/* simulated image bg */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg,#64748b,#475569)" }} />
      <div className="absolute inset-0 bg-black/50" />
      {/* center content */}
      <div className="relative z-10 flex flex-col items-center gap-1">
        <div className="w-8 h-0.5 rounded" style={{ backgroundColor: "#F5C842" }} />
        <div className="w-16 h-2 bg-white rounded" />
        <div className="w-12 h-2 bg-white rounded" />
        <div className="w-10 h-2.5 rounded-full mt-1" style={{ backgroundColor: "#F5C842" }} />
      </div>
      {/* dot indicators */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
        <div className="w-3 h-1 rounded-full bg-white" />
        <div className="w-1 h-1 rounded-full bg-white/40" />
        <div className="w-1 h-1 rounded-full bg-white/40" />
      </div>
      {/* left arrow */}
      <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-black/40 flex items-center justify-center">
        <div className="w-0 h-0" style={{ borderRight: "4px solid white", borderTop: "2.5px solid transparent", borderBottom: "2.5px solid transparent" }} />
      </div>
      {/* right arrow */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-black/40 flex items-center justify-center">
        <div className="w-0 h-0" style={{ borderLeft: "4px solid white", borderTop: "2.5px solid transparent", borderBottom: "2.5px solid transparent" }} />
      </div>
    </div>
  ),
};

export default function BlockInsertModal({ onInsert, onClose }: Props) {
  const categories = ["自由", "黄金の型", "コラム", "ヒーロー", "基本", "コンテンツ", "リッチ"];
  const categoryDescs: Record<string, string> = {
    自由: "テキスト・画像・グラフを自由配置",
    "黄金の型": "LP必須2ブロック",
    コラム: "記事連携",
    ヒーロー: "14パターン",
    基本: "6ブロック",
    コンテンツ: "17ブロック",
    リッチ: "7ブロック",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-[760px] max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">ブロックを追加</h3>
            <p className="text-xs text-gray-400 mt-0.5">挿入するテンプレートを選んでください</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-8">
          {categories.map((cat) => {
            const items = BLOCK_META.filter((m) => m.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="flex items-center gap-3 mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{cat}</p>
                  {categoryDescs[cat] && <span className="text-[10px] text-gray-300">{categoryDescs[cat]}</span>}
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {items.map((meta) => (
                    <button
                      key={meta.type}
                      onClick={() => {
                        onInsert(BLOCK_DEFAULTS[meta.type]());
                        onClose();
                      }}
                      className="group text-left border border-gray-200 rounded-xl overflow-hidden hover:border-indigo-400 hover:shadow-lg transition-all duration-200"
                    >
                      {/* Thumbnail */}
                      <div className="h-[88px] bg-gray-50 border-b border-gray-100 overflow-hidden relative">
                        {THUMBNAILS[meta.type]}
                        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors" />
                      </div>
                      {/* Label */}
                      <div className="px-3 py-2.5">
                        <p className="text-xs font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">
                          {meta.label}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{meta.desc}</p>
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
  );
}
