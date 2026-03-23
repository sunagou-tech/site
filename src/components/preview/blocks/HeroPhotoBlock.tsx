"use client";

import { HeroPhotoBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";

interface Props {
  block: HeroPhotoBlock;
  config: SiteConfig;
  onChange: (b: HeroPhotoBlock) => void;
}

export default function HeroPhotoBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroPhotoBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className={`relative min-h-[640px] flex overflow-hidden ${fontClass}`}>

      {/* Full-bleed background image */}
      <EditableImage
        url={block.imageUrl}
        onChange={(url) => u({ imageUrl: url })}
        className="absolute inset-0"
        placeholderGradient={`linear-gradient(160deg, ${config.primaryColor}30 0%, ${config.accentColor}20 100%)`}
        primaryColor={config.primaryColor}
        accentColor={config.accentColor}
        alt="hero background"
      />

      {/* Dark gradient overlay from left */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{ background: "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.5) 50%, transparent 100%)" }}
      />

      {/* Left accent vertical line */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 z-20"
        style={{ backgroundColor: config.accentColor }}
      />

      {/* Left content */}
      <div className="relative z-20 flex items-center max-w-xl px-12 lg:px-20 py-20">
        <div className="space-y-6">

          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-px" style={{ backgroundColor: config.accentColor }} />
            <EditableText
              tag="span"
              value={block.eyebrow}
              onChange={(v) => u({ eyebrow: v })}
              className="text-[10px] tracking-[0.4em] uppercase font-semibold text-white/60"
            />
          </div>

          {/* Tagline */}
          <EditableText
            tag="h1"
            value={block.tagline}
            onChange={(v) => u({ tagline: v })}
            multiline
            className="text-[clamp(3rem,6vw,5.5rem)] font-black text-white leading-[1.1] whitespace-pre-line tracking-tight block"
          />

          {/* Body */}
          <EditableText
            tag="p"
            value={block.body}
            onChange={(v) => u({ body: v })}
            multiline
            className="text-sm text-white/70 leading-[2] whitespace-pre-line block"
          />

          {/* CTA button */}
          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-full transition-all hover:scale-105 hover:opacity-90"
            style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
          />
        </div>
      </div>

      {/* Bottom-right caption */}
      <div className="absolute bottom-6 right-6 z-20">
        <EditableText
          tag="span"
          value={block.caption}
          onChange={(v) => u({ caption: v })}
          className="text-[10px] italic text-white/40"
        />
      </div>

      {/* Scroll indicator bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-none select-none">
        <div className="w-1 h-1 rounded-full bg-white/50" />
        <div className="w-px h-8 bg-white/20" />
        <span className="text-[8px] tracking-[0.35em] uppercase text-white/30">SCROLL</span>
      </div>
    </section>
  );
}
