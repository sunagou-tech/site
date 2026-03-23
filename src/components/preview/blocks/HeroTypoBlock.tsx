"use client";

import { HeroTypoBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import LinkableButton from "../LinkableButton";

interface Props {
  block: HeroTypoBlock;
  config: SiteConfig;
  onChange: (b: HeroTypoBlock) => void;
}

export default function HeroTypoBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroTypoBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="relative bg-white min-h-[600px] overflow-hidden flex items-center">

      {/* ── 背景：装飾大文字 ─────────────────────────────── */}
      <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden select-none">
        <EditableText
          tag="span"
          value={block.kanjiDecor}
          onChange={(v) => u({ kanjiDecor: v })}
          className={`text-[22vw] font-black leading-none tracking-tighter block pr-4 ${fontClass}`}
          style={{ color: `${config.primaryColor}08` }}
        />
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

      {/* ── メインコンテンツ ─────────────────────────────── */}
      <div className="relative z-10 px-16 lg:px-24 py-24 max-w-3xl">

        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-10">
          <span className="w-10 h-px block" style={{ backgroundColor: config.accentColor }} />
          <EditableText tag="span" value={block.eyebrow} onChange={(v) => u({ eyebrow: v })}
            className="text-[10px] tracking-[0.3em] uppercase text-gray-400 font-medium" />
        </div>

        {/* Headline */}
        <EditableText
          tag="h1"
          value={block.tagline}
          onChange={(v) => u({ tagline: v })}
          multiline
          className={`text-[clamp(2.8rem,5.5vw,5rem)] font-black text-gray-900 leading-[1.1] whitespace-pre-line mb-2 block tracking-tight ${fontClass}`}
        />

        {/* アクセントライン under headline */}
        <div className="flex items-center gap-3 mt-6 mb-8">
          <div className="h-0.5 w-16" style={{ backgroundColor: config.accentColor }} />
          <EditableText tag="span" value={block.taglineSub} onChange={(v) => u({ taglineSub: v })}
            className="text-xs tracking-[0.25em] uppercase font-medium"
            style={{ color: config.accentColor }} />
        </div>

        {/* Body */}
        <EditableText
          tag="p"
          value={block.body}
          onChange={(v) => u({ body: v })}
          multiline
          className="text-base text-gray-500 leading-[2] whitespace-pre-line mb-12 block max-w-lg"
        />

        {/* CTA */}
        <div className="flex items-center gap-6">
          <LinkableButton
            label={block.buttonText} url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })} onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-3 text-sm font-bold px-10 py-4 transition-all hover:opacity-80"
            style={{ backgroundColor: config.primaryColor, color: "#fff" }}
          />
          <span className="text-xs text-gray-300 tracking-widest uppercase">
            ↓ Scroll
          </span>
        </div>
      </div>

      {/* ── 底部装飾バー ─────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, ${config.accentColor}, ${config.primaryColor}40, transparent)` }} />
    </section>
  );
}
