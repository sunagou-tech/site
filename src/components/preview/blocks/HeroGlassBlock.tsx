"use client";

import { HeroGlassBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";

interface Props {
  block: HeroGlassBlock;
  config: SiteConfig;
  onChange: (b: HeroGlassBlock) => void;
}

export default function HeroGlassBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroGlassBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="relative min-h-[640px] overflow-hidden">

      {/* ── Full-bleed background image ────────────────────── */}
      <div className="absolute inset-0">
        {block.imageUrl ? (
          <EditableImage url={block.imageUrl} onChange={(url) => u({ imageUrl: url })}
            className="absolute inset-0" primaryColor={config.primaryColor} accentColor={config.accentColor}
            alt="hero background" />
        ) : (
          /* Placeholder gradient when no image */
          <div className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}80 50%, ${config.accentColor}40 100%)` }}>
            {/* Abstract shapes as placeholder */}
            <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full opacity-20"
              style={{ backgroundColor: config.accentColor }} />
            <div className="absolute bottom-1/4 left-1/3 w-96 h-40 rounded-full opacity-10 rotate-12"
              style={{ backgroundColor: config.accentColor }} />
          </div>
        )}
        {/* Dark overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
      </div>

      {/* ── Add/remove image buttons ──────────────────────── */}
      {!block.imageUrl && (
        <button onClick={() => u({ imageUrl: " " })}
          className="absolute bottom-4 right-4 z-20 text-[10px] text-white/60 border border-white/20 px-3 py-1.5 rounded-full hover:border-white/60 transition-colors">
          + 背景画像を追加
        </button>
      )}
      {block.imageUrl?.trim() && (
        <button onClick={() => u({ imageUrl: "" })}
          className="absolute bottom-4 right-4 z-20 text-[10px] text-red-300 border border-red-300/30 px-3 py-1.5 rounded-full hover:border-red-300 transition-colors">
          背景画像を削除
        </button>
      )}

      {/* ── Vertical scroll label ─────────────────────────── */}
      <div className="absolute right-6 bottom-12 z-20 hidden lg:flex flex-col items-center gap-2">
        <EditableText tag="span" value={block.scrollLabel} onChange={(v) => u({ scrollLabel: v })}
          className="text-[9px] tracking-[0.3em] uppercase text-white/40 block"
          style={{ writingMode: "vertical-rl" }} />
        <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent" />
      </div>

      {/* ── Accent color side strip ───────────────────────── */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 z-20"
        style={{ backgroundColor: config.accentColor }} />

      {/* ── Glass card ────────────────────────────────────── */}
      <div className="relative z-10 min-h-[640px] flex items-center px-12 lg:px-20">
        <div className="max-w-lg backdrop-blur-xl rounded-3xl p-10 border shadow-2xl"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.35)",
            borderColor: "rgba(255,255,255,0.12)",
          }}>

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px" style={{ backgroundColor: config.accentColor }} />
            <EditableText tag="span" value={block.eyebrow} onChange={(v) => u({ eyebrow: v })}
              className="text-[10px] tracking-[0.3em] uppercase font-semibold"
              style={{ color: config.accentColor }} />
          </div>

          {/* Headline */}
          <EditableText tag="h1" value={block.tagline} onChange={(v) => u({ tagline: v })}
            multiline
            className={`text-[clamp(2.8rem,5vw,4.5rem)] font-black text-white leading-[1.05] whitespace-pre-line mb-6 block tracking-tight ${fontClass}`} />

          {/* Separator */}
          <div className="w-12 h-0.5 mb-6 opacity-60" style={{ backgroundColor: config.accentColor }} />

          {/* Body */}
          <EditableText tag="p" value={block.body} onChange={(v) => u({ body: v })}
            multiline
            className="text-sm text-white/70 leading-relaxed whitespace-pre-line mb-8 block" />

          {/* CTA */}
          <LinkableButton
            label={block.buttonText} url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })} onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-3 text-sm font-bold px-8 py-4 rounded-full shadow-xl transition-all hover:scale-105"
            style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
          />
        </div>
      </div>

      {/* ── Corner accent ─────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: `linear-gradient(to top, ${config.primaryColor}40, transparent)` }} />
    </section>
  );
}
