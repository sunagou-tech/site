"use client";

import { HeroTypoBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import LinkableButton from "../LinkableButton";
import { useEditing } from "@/contexts/EditingContext";

interface Props {
  block: HeroTypoBlock;
  config: SiteConfig;
  onChange: (b: HeroTypoBlock) => void;
}

export default function HeroTypoBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroTypoBlock>) => onChange({ ...block, ...patch });
  const isEditing = useEditing();
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="relative bg-white min-h-[600px] overflow-hidden flex items-center">

      {/* ── 背景：装飾大文字（pointer-events-none、z-0） ── */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden select-none pointer-events-none">
        <span
          className={`text-[22vw] font-black leading-none tracking-tighter block ${fontClass}`}
          style={{ color: `${config.primaryColor}08` }}
        >
          {block.kanjiDecor || "革新"}
        </span>
      </div>

      {/* ── アクセントライン（左端） ─────────────────────── */}
      <div className="absolute left-0 top-0 bottom-0 w-1"
        style={{ backgroundColor: config.accentColor }} />

      {/* ── 右上の英字装飾 ───────────────────────────────── */}
      <div className="absolute top-8 right-8 hidden lg:block pointer-events-none select-none">
        <p className="text-[10px] tracking-[0.4em] uppercase text-gray-200 font-medium"
          style={{ writingMode: "vertical-rl" }}>
          {block.taglineSub || "NEW PERSPECTIVE"}
        </p>
      </div>

      {/* ── メインコンテンツ（中央揃え） ─────────────────── */}
      <div className="relative z-10 w-full px-8 md:px-16 py-16 md:py-24 flex flex-col items-center text-center">

        {/* Eyebrow */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className="w-10 h-px block" style={{ backgroundColor: config.accentColor }} />
          <EditableText tag="span" value={block.eyebrow} onChange={(v) => u({ eyebrow: v })}
            className="text-[10px] tracking-[0.3em] uppercase text-gray-400 font-medium" />
          <span className="w-10 h-px block" style={{ backgroundColor: config.accentColor }} />
        </div>

        {/* Headline */}
        <EditableText
          tag="h1"
          value={block.tagline}
          onChange={(v) => u({ tagline: v })}
          multiline
          className={`text-[clamp(1.6rem,5.5vw,5rem)] font-black text-gray-900 leading-[1.1] whitespace-pre-line mb-2 block tracking-tight break-keep max-w-[14em] text-center ${fontClass}`}
        />

        {/* アクセントライン under headline */}
        <div className="flex items-center justify-center gap-3 mt-6 mb-8">
          <div className="h-0.5 w-12" style={{ backgroundColor: config.accentColor }} />
          <EditableText tag="span" value={block.taglineSub} onChange={(v) => u({ taglineSub: v })}
            className="text-xs tracking-[0.25em] uppercase font-medium"
            style={{ color: config.accentColor }} />
          <div className="h-0.5 w-12" style={{ backgroundColor: config.accentColor }} />
        </div>

        {/* Body */}
        <EditableText
          tag="p"
          value={block.body}
          onChange={(v) => u({ body: v })}
          multiline
          className="text-base text-gray-500 leading-[2] whitespace-pre-line mb-12 block max-w-lg text-center"
        />

        {/* CTA */}
        <LinkableButton
          label={block.buttonText} url={block.buttonUrl ?? ""}
          onLabelChange={(v) => u({ buttonText: v })} onUrlChange={(v) => u({ buttonUrl: v })}
          className="inline-flex items-center justify-center gap-3 text-sm font-bold px-10 py-4 transition-all hover:opacity-80"
          style={{ backgroundColor: config.primaryColor, color: "#fff" }}
        />
      </div>

      {/* ── 背景テキスト編集ラベル（編集モードのみ表示） ── */}
      {isEditing && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="text-[9px] text-white/50 font-medium whitespace-nowrap">背景文字:</span>
          <EditableText
            tag="span"
            value={block.kanjiDecor}
            onChange={(v) => u({ kanjiDecor: v })}
            className="text-[11px] text-white font-bold"
          />
        </div>
      )}

      {/* ── 底部アクセントライン ──────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ backgroundColor: config.accentColor, opacity: 0.3 }} />
    </section>
  );
}
