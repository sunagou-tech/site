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
    <section className={`grid grid-cols-1 md:grid-cols-[40%_60%] overflow-hidden ${fontClass}`} style={{ minHeight: "clamp(650px, 90vh, 720px)" }}>

      {/* Left: solid primary color content area (40%) */}
      <div
        className="relative flex flex-col justify-center px-8 md:px-12 py-16"
        style={{ backgroundColor: config.primaryColor }}
      >
        {/* Left accent strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ backgroundColor: config.accentColor }}
        />

        <div className="pl-4 space-y-6">
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
            className="text-[clamp(1.6rem,4.5vw,4.5rem)] font-black text-white leading-[1.1] whitespace-pre-line tracking-tight block break-keep max-w-[12em]"
          />

          {/* Body */}
          <EditableText
            tag="p"
            value={block.body}
            onChange={(v) => u({ body: v })}
            multiline
            className="text-sm text-white/70 leading-[2] whitespace-pre-line block"
          />

          {/* CTA */}
          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-full transition-all hover:scale-105 hover:opacity-90"
            style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
          />
        </div>

        {/* Caption bottom-right */}
        <div className="absolute bottom-4 right-4">
          <EditableText
            tag="span"
            value={block.caption}
            onChange={(v) => u({ caption: v })}
            className="text-[10px] italic text-white/30"
          />
        </div>
      </div>

      {/* Right: photo (60%) — edge-to-edge cover */}
      <div className="relative overflow-hidden min-h-[400px] md:min-h-0">
        <EditableImage
          url={block.imageUrl}
          onChange={(url) => u({ imageUrl: url })}
          className="absolute inset-0 w-full h-full"
          placeholderGradient={`linear-gradient(160deg, ${config.primaryColor}30 0%, ${config.accentColor}20 100%)`}
          primaryColor={config.primaryColor}
          accentColor={config.accentColor}
          alt="hero background"
        />
      </div>
    </section>
  );
}
