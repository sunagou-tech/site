"use client";

import { HeroJapaneseBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";

interface Props {
  block: HeroJapaneseBlock;
  config: SiteConfig;
  onChange: (b: HeroJapaneseBlock) => void;
}

export default function HeroJapaneseBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroJapaneseBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className={`min-h-[600px] flex overflow-hidden ${fontClass}`} style={{ backgroundColor: "#faf9f7" }}>

      {/* Left: content (45%) */}
      <div
        className="relative flex flex-col justify-center px-12 lg:px-16 py-16 overflow-hidden"
        style={{ width: "45%" }}
      >
        {/* Giant semi-transparent kanji background */}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 text-[20vw] font-black leading-none pointer-events-none select-none"
          style={{ color: `${config.primaryColor}08` }}
          aria-hidden="true"
        >
          <EditableText
            tag="span"
            value={block.kanjiLarge}
            onChange={(v) => u({ kanjiLarge: v })}
            className="block"
          />
        </div>

        {/* Top accent line */}
        <div
          className="w-16 h-px mb-8"
          style={{ backgroundColor: config.accentColor }}
        />

        {/* Eyebrow (small English) */}
        <p className="text-[9px] tracking-[0.3em] uppercase text-gray-300 font-medium mb-4">
          Japanese Minimal
        </p>

        {/* Japanese tagline */}
        <EditableText
          tag="h1"
          value={block.taglineJp}
          onChange={(v) => u({ taglineJp: v })}
          multiline
          className="text-[clamp(2rem,4vw,3.8rem)] font-black text-gray-900 leading-snug whitespace-pre-line tracking-tight mb-4 block relative z-10"
        />

        {/* English tagline */}
        <EditableText
          tag="p"
          value={block.taglineEn}
          onChange={(v) => u({ taglineEn: v })}
          className="text-[10px] tracking-[0.2em] uppercase text-gray-300 mb-6 block"
        />

        {/* Thin divider */}
        <div className="w-full h-px bg-gray-100 mb-6" />

        {/* Body */}
        <EditableText
          tag="p"
          value={block.body}
          onChange={(v) => u({ body: v })}
          multiline
          className="text-sm text-gray-500 leading-[2] whitespace-pre-line mb-8 block relative z-10"
        />

        {/* CTA — rectangular, border style */}
        <div className="relative z-10">
          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-3 border-2 transition-all hover:opacity-80 self-start"
            style={{ borderColor: config.primaryColor, color: config.primaryColor, backgroundColor: "transparent" }}
          />
        </div>
      </div>

      {/* Right: image (55%) */}
      <div className="flex-1 relative">
        <EditableImage
          url={block.imageUrl}
          onChange={(url) => u({ imageUrl: url })}
          className="absolute inset-0"
          placeholderGradient={`linear-gradient(160deg, ${config.primaryColor}15 0%, ${config.accentColor}10 100%)`}
          primaryColor={config.primaryColor}
          accentColor={config.accentColor}
          alt="hero image"
        />

        {/* Right edge accent strip */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1.5 z-10"
          style={{ backgroundColor: config.accentColor }}
        />
      </div>
    </section>
  );
}
