"use client";

import { HeroDarkBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";

interface Props {
  block: HeroDarkBlock;
  config: SiteConfig;
  onChange: (b: HeroDarkBlock) => void;
}

export default function HeroDarkBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroDarkBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className={`relative min-h-[640px] overflow-hidden bg-black ${fontClass}`}>

      {/* Background image at low opacity */}
      <div className="absolute inset-0">
        <EditableImage
          url={block.imageUrl}
          onChange={(url) => u({ imageUrl: url })}
          className="absolute inset-0 opacity-30"
          placeholderGradient={`linear-gradient(160deg, ${config.primaryColor}40 0%, ${config.accentColor}20 100%)`}
          primaryColor={config.primaryColor}
          accentColor={config.accentColor}
          alt="hero background"
        />
      </div>

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Content */}
      <div className="relative z-20 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center px-8 py-20">

        {/* Left: text */}
        <div className="space-y-6">
          {/* Eyebrow */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-px" style={{ backgroundColor: config.accentColor }} />
            <EditableText
              tag="span"
              value={block.eyebrow}
              onChange={(v) => u({ eyebrow: v })}
              className="text-[10px] tracking-[0.4em] uppercase font-semibold"
              style={{ color: config.accentColor }}
            />
          </div>

          {/* Tagline */}
          <EditableText
            tag="h1"
            value={block.tagline}
            onChange={(v) => u({ tagline: v })}
            multiline
            className="text-[clamp(2.8rem,5vw,4.8rem)] font-black text-white leading-tight whitespace-pre-line tracking-tight block"
          />

          {/* Accent line */}
          <div className="w-16 h-0.5" style={{ backgroundColor: config.accentColor }} />

          {/* Body */}
          <EditableText
            tag="p"
            value={block.body}
            onChange={(v) => u({ body: v })}
            multiline
            className="text-sm text-white/50 leading-[2] whitespace-pre-line block"
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

        {/* Right: stat cards */}
        <div className="flex flex-col gap-4">
          <div className="border border-white/10 rounded-2xl p-8 bg-white/5 backdrop-blur">
            <EditableText
              tag="div"
              value={block.stat1Value}
              onChange={(v) => u({ stat1Value: v })}
              className="text-6xl font-black text-white leading-none mb-2 block"
            />
            <EditableText
              tag="div"
              value={block.stat1Label}
              onChange={(v) => u({ stat1Label: v })}
              className="text-sm text-white/40 block"
            />
          </div>
          <div className="border border-white/10 rounded-2xl p-8 bg-white/5 backdrop-blur">
            <EditableText
              tag="div"
              value={block.stat2Value}
              onChange={(v) => u({ stat2Value: v })}
              className="text-6xl font-black text-white leading-none mb-2 block"
            />
            <EditableText
              tag="div"
              value={block.stat2Label}
              onChange={(v) => u({ stat2Label: v })}
              className="text-sm text-white/40 block"
            />
          </div>
        </div>
      </div>

      {/* Bottom gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}
      />
    </section>
  );
}
