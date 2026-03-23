"use client";

import { HeroMosaicBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";

interface Props {
  block: HeroMosaicBlock;
  config: SiteConfig;
  onChange: (b: HeroMosaicBlock) => void;
}

export default function HeroMosaicBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroMosaicBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className={`bg-white min-h-[580px] flex overflow-hidden ${fontClass}`}>

      {/* Left: text (40%) */}
      <div className="flex flex-col justify-center px-12 lg:px-16 py-16" style={{ width: "40%" }}>

        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-px" style={{ backgroundColor: config.accentColor }} />
          <EditableText
            tag="span"
            value={block.eyebrow}
            onChange={(v) => u({ eyebrow: v })}
            className="text-[10px] tracking-[0.4em] uppercase font-semibold text-gray-400"
          />
        </div>

        {/* Tagline */}
        <EditableText
          tag="h1"
          value={block.tagline}
          onChange={(v) => u({ tagline: v })}
          multiline
          className="text-[clamp(2.4rem,4vw,4rem)] font-black text-gray-900 leading-[1.1] whitespace-pre-line tracking-tight mb-6 block"
        />

        {/* Body */}
        <EditableText
          tag="p"
          value={block.body}
          onChange={(v) => u({ body: v })}
          multiline
          className="text-sm text-gray-500 leading-[2] whitespace-pre-line mb-8 block"
        />

        {/* CTA */}
        <LinkableButton
          label={block.buttonText}
          url={block.buttonUrl ?? ""}
          onLabelChange={(v) => u({ buttonText: v })}
          onUrlChange={(v) => u({ buttonUrl: v })}
          className="inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-full transition-all hover:scale-105 hover:opacity-90 self-start"
          style={{ backgroundColor: config.primaryColor, color: "#fff" }}
        />

        {/* Counter label */}
        <p className="text-[10px] tracking-widest text-gray-300 mt-6 font-medium">01 — 04</p>
      </div>

      {/* Right: mosaic grid (60%) */}
      <div className="flex-1 grid grid-cols-2 gap-2 p-4 relative">
        <div className="h-48 rounded-xl overflow-hidden">
          <EditableImage
            url={block.image1}
            onChange={(url) => u({ image1: url })}
            className="w-full h-full"
            placeholderGradient={`linear-gradient(135deg, ${config.primaryColor}20 0%, ${config.accentColor}15 100%)`}
            primaryColor={config.primaryColor}
            accentColor={config.accentColor}
            alt="mosaic image 1"
          />
        </div>
        <div className="h-48 rounded-xl overflow-hidden relative">
          <EditableImage
            url={block.image2}
            onChange={(url) => u({ image2: url })}
            className="w-full h-full"
            placeholderGradient={`linear-gradient(135deg, ${config.accentColor}15 0%, ${config.primaryColor}20 100%)`}
            primaryColor={config.primaryColor}
            accentColor={config.accentColor}
            alt="mosaic image 2"
          />
          {/* Floating badge */}
          <div
            className="absolute top-3 right-3 z-10 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase"
            style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
          >
            Works
          </div>
        </div>
        <div className="h-48 rounded-xl overflow-hidden">
          <EditableImage
            url={block.image3}
            onChange={(url) => u({ image3: url })}
            className="w-full h-full"
            placeholderGradient={`linear-gradient(135deg, ${config.primaryColor}15 0%, ${config.accentColor}20 100%)`}
            primaryColor={config.primaryColor}
            accentColor={config.accentColor}
            alt="mosaic image 3"
          />
        </div>
        <div className="h-48 rounded-xl overflow-hidden">
          <EditableImage
            url={block.image4}
            onChange={(url) => u({ image4: url })}
            className="w-full h-full"
            placeholderGradient={`linear-gradient(135deg, ${config.accentColor}20 0%, ${config.primaryColor}15 100%)`}
            primaryColor={config.primaryColor}
            accentColor={config.accentColor}
            alt="mosaic image 4"
          />
        </div>
      </div>
    </section>
  );
}
