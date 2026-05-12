"use client";

import { HeroSplitBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";

interface Props {
  block: HeroSplitBlock;
  config: SiteConfig;
  onChange: (b: HeroSplitBlock) => void;
}

export default function HeroSplitBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroSplitBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section
      className={`grid grid-cols-1 md:grid-cols-[40%_60%] overflow-hidden ${fontClass}`}
      style={{ minHeight: "clamp(650px, 90vh, 720px)" }}
    >
      {/* 左：テキストエリア (40%) */}
      <div
        className="flex flex-col justify-center px-8 md:px-12 lg:px-16 py-14"
        style={{ backgroundColor: config.primaryColor }}
      >
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-px" style={{ backgroundColor: config.accentColor }} />
          <EditableText
            tag="span"
            value={block.taglineSub}
            onChange={(v) => u({ taglineSub: v })}
            className="text-[10px] tracking-[0.35em] uppercase font-semibold text-white/50"
          />
        </div>

        <EditableText
          tag="h1"
          value={block.tagline}
          onChange={(v) => u({ tagline: v })}
          multiline
          className={`text-[clamp(1.6rem,4vw,3.8rem)] font-black leading-[1.1] tracking-tight text-white whitespace-pre-line block break-keep max-w-[12em] ${fontClass}`}
        />

        <EditableText
          tag="p"
          value={block.body}
          onChange={(v) => u({ body: v })}
          multiline
          className="mt-6 text-sm text-white/70 leading-[1.9] tracking-[0.02em] whitespace-pre-line block max-w-xs"
        />

        <div className="mt-10">
          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 text-sm font-semibold px-8 py-4 rounded-full shadow-xl hover:opacity-90 transition-opacity"
            style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
          />
        </div>
      </div>

      {/* 右：画像エリア (60%) — edge-to-edge cover */}
      <div className="relative overflow-hidden min-h-[400px] md:min-h-0">
        <EditableImage
          url={block.imageUrl}
          onChange={(url) => u({ imageUrl: url })}
          className="absolute inset-0 w-full h-full"
          placeholderGradient={`linear-gradient(135deg, ${config.primaryColor}40 0%, ${config.accentColor}30 100%)`}
          primaryColor={config.primaryColor}
          accentColor={config.accentColor}
          alt="hero split image"
        />
        {/* アクセントライン（右端） */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1.5 z-10"
          style={{ backgroundColor: config.accentColor }}
        />
      </div>
    </section>
  );
}
