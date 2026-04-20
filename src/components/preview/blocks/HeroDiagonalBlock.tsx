"use client";

import { HeroDiagonalBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";
import { useEditing } from "@/contexts/EditingContext";

interface Props {
  block: HeroDiagonalBlock;
  config: SiteConfig;
  onChange: (b: HeroDiagonalBlock) => void;
}

export default function HeroDiagonalBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroDiagonalBlock>) => onChange({ ...block, ...patch });
  const isEditing = useEditing();
  const hasBtn2 = !!block.buttonText2?.trim();
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className={`relative min-h-[600px] overflow-hidden ${fontClass}`}>

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

      {/* Dark overlay on entire image */}
      <div className="absolute inset-0 bg-black/60 z-10 pointer-events-none" />

      {/* Diagonal left panel */}
      <div
        className="absolute left-0 top-0 bottom-0 z-20 flex flex-col justify-center pl-10 lg:pl-16 pr-20 py-16"
        style={{
          width: "55%",
          clipPath: "polygon(0 0, 100% 0, 75% 100%, 0 100%)",
          backgroundColor: config.primaryColor,
          opacity: 0.92,
        }}
      >
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
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
          className="text-[clamp(2.4rem,4.5vw,4.5rem)] font-black text-white leading-[1.1] whitespace-pre-line tracking-tight mb-6 block"
        />

        {/* Body */}
        <EditableText
          tag="p"
          value={block.body}
          onChange={(v) => u({ body: v })}
          multiline
          className="text-sm text-white/60 leading-[2] whitespace-pre-line block"
        />
      </div>

      {/* Bottom-right buttons */}
      <div className="absolute bottom-10 right-10 z-30 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <LinkableButton
          label={block.buttonText}
          url={block.buttonUrl ?? ""}
          onLabelChange={(v) => u({ buttonText: v })}
          onUrlChange={(v) => u({ buttonUrl: v })}
          className="inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-full transition-all hover:scale-105 hover:opacity-90"
          style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
        />
        {hasBtn2 ? (
          <LinkableButton
            label={block.buttonText2}
            url={block.buttonUrl2 ?? ""}
            onLabelChange={(v) => u({ buttonText2: v })}
            onUrlChange={(v) => u({ buttonUrl2: v })}
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-full border border-white/40 text-white transition-all hover:scale-105 hover:bg-white/10"
            onDelete={isEditing ? () => u({ buttonText2: "", buttonUrl2: "" }) : undefined}
          />
        ) : (
          isEditing && (
            <button onClick={() => u({ buttonText2: "詳しく見る", buttonUrl2: "#features" })}
              className="px-5 py-3 rounded-full text-xs border border-dashed border-white/30 text-white/40 hover:border-white/60 hover:text-white/60 transition-colors">
              + ボタンを追加
            </button>
          )
        )}
      </div>

      {/* Bottom accent bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 z-30"
        style={{ backgroundColor: config.accentColor }}
      />

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1.5 pointer-events-none select-none">
        <div className="w-1 h-1 rounded-full bg-white/50" />
        <div className="w-px h-6 bg-white/20" />
      </div>
    </section>
  );
}
