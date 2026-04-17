"use client";
import { HeroGameBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";
import { useEditing } from "@/contexts/EditingContext";

interface Props {
  block: HeroGameBlock;
  config: SiteConfig;
  onChange: (b: HeroGameBlock) => void;
}

export default function HeroGameBlockComponent({ block, config, onChange }: Props) {
  const isEditing = useEditing();
  const u = (patch: Partial<HeroGameBlock>) => onChange({ ...block, ...patch });
  const accent = config.accentColor ?? "#F5C842";

  return (
    <section
      className="relative overflow-hidden min-h-[580px] bg-[#0a0a0f] flex flex-col"
      style={{ fontFamily: "inherit" }}
    >
      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
          opacity: 1,
        }}
      />

      {/* Decorative dot grid */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 1,
        }}
      />

      {/* Main content grid */}
      <div className="relative z-10 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 px-6 md:px-12 pt-14 pb-8 items-center max-w-6xl mx-auto w-full">
        {/* LEFT: Text content */}
        <div className="flex flex-col gap-5">
          {/* Eyebrow row */}
          <div className="flex items-center gap-3">
            {/* Pulsing dot */}
            <span
              className="inline-block w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0"
              style={{ backgroundColor: accent, boxShadow: `0 0 10px ${accent}` }}
            />
            <EditableText
              tag="span"
              value={block.eyebrow}
              onChange={(v) => u({ eyebrow: v })}
              className="text-[11px] tracking-widest uppercase font-mono font-bold"
              style={{ color: accent }}
            />
          </div>

          {/* Tagline */}
          <EditableText
            tag="h1"
            value={block.tagline}
            onChange={(v) => u({ tagline: v })}
            multiline
            className="text-3xl md:text-5xl font-black text-white leading-tight whitespace-pre-line"
            style={{ textShadow: `0 0 40px ${accent}33` }}
          />

          {/* Body */}
          <EditableText
            tag="p"
            value={block.body}
            onChange={(v) => u({ body: v })}
            multiline
            className="text-sm md:text-base text-gray-400 leading-relaxed"
          />

          {/* HP bar decorative element */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-[9px] font-mono tracking-widest text-gray-500 uppercase">Power</span>
              <span className="text-[9px] font-mono text-gray-500">100 / 100</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-none overflow-hidden" style={{ border: `1px solid ${accent}33` }}>
              <div
                className="h-full transition-all"
                style={{ width: "100%", backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-2">
            <LinkableButton
              label={block.buttonText}
              url={block.buttonUrl ?? ""}
              onLabelChange={(v) => u({ buttonText: v })}
              onUrlChange={(v) => u({ buttonUrl: v })}
              className="inline-block px-8 py-3 text-sm font-bold tracking-widest uppercase transition-all hover:opacity-90"
              style={{
                backgroundColor: accent,
                color: "#0a0a0f",
                borderRadius: "2px",
                boxShadow: `0 0 20px ${accent}40`,
              }}
            />
          </div>
        </div>

        {/* RIGHT: Game screen frame */}
        <div className="relative flex items-center justify-center">
          {/* Corner bracket decoration — top-left */}
          <span
            className="absolute top-0 left-0 w-6 h-6 pointer-events-none z-20"
            style={{
              borderTop: `2px solid ${accent}`,
              borderLeft: `2px solid ${accent}`,
            }}
          />
          {/* Corner bracket decoration — top-right */}
          <span
            className="absolute top-0 right-0 w-6 h-6 pointer-events-none z-20"
            style={{
              borderTop: `2px solid ${accent}`,
              borderRight: `2px solid ${accent}`,
            }}
          />
          {/* Corner bracket decoration — bottom-left */}
          <span
            className="absolute bottom-0 left-0 w-6 h-6 pointer-events-none z-20"
            style={{
              borderBottom: `2px solid ${accent}`,
              borderLeft: `2px solid ${accent}`,
            }}
          />
          {/* Corner bracket decoration — bottom-right */}
          <span
            className="absolute bottom-0 right-0 w-6 h-6 pointer-events-none z-20"
            style={{
              borderBottom: `2px solid ${accent}`,
              borderRight: `2px solid ${accent}`,
            }}
          />

          {/* Neon border frame */}
          <div
            className="w-full overflow-hidden"
            style={{
              border: `1px solid ${accent}66`,
              boxShadow: `0 0 30px ${accent}30, inset 0 0 20px ${accent}10`,
              borderRadius: "2px",
              aspectRatio: "4/3",
            }}
          >
            <EditableImage
              url={block.imageUrl ?? ""}
              onChange={(url) => u({ imageUrl: url })}
              className="w-full h-full object-cover"
              primaryColor={config.primaryColor}
              accentColor={accent}
              alt="game screen"
            />
          </div>
        </div>
      </div>

      {/* BOTTOM: Stat HUD cards */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 pb-10">
        <div
          className="grid grid-cols-3 gap-3"
          style={{ borderTop: `1px solid ${accent}22` }}
        >
          {/* Stat 1 */}
          <div
            className="flex flex-col items-center justify-center py-4 px-3 mt-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${accent}22`,
              borderRadius: "2px",
            }}
          >
            <EditableText
              tag="span"
              value={block.stat1Value}
              onChange={(v) => u({ stat1Value: v })}
              className="text-xl md:text-2xl font-black font-mono"
              style={{ color: accent, textShadow: `0 0 12px ${accent}` }}
            />
            <EditableText
              tag="span"
              value={block.stat1Label}
              onChange={(v) => u({ stat1Label: v })}
              className="text-[10px] text-gray-500 mt-1 tracking-wider uppercase font-mono"
            />
          </div>

          {/* Stat 2 */}
          <div
            className="flex flex-col items-center justify-center py-4 px-3 mt-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${accent}22`,
              borderRadius: "2px",
            }}
          >
            <EditableText
              tag="span"
              value={block.stat2Value}
              onChange={(v) => u({ stat2Value: v })}
              className="text-xl md:text-2xl font-black font-mono"
              style={{ color: accent, textShadow: `0 0 12px ${accent}` }}
            />
            <EditableText
              tag="span"
              value={block.stat2Label}
              onChange={(v) => u({ stat2Label: v })}
              className="text-[10px] text-gray-500 mt-1 tracking-wider uppercase font-mono"
            />
          </div>

          {/* Stat 3 */}
          <div
            className="flex flex-col items-center justify-center py-4 px-3 mt-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${accent}22`,
              borderRadius: "2px",
            }}
          >
            <EditableText
              tag="span"
              value={block.stat3Value}
              onChange={(v) => u({ stat3Value: v })}
              className="text-xl md:text-2xl font-black font-mono"
              style={{ color: accent, textShadow: `0 0 12px ${accent}` }}
            />
            <EditableText
              tag="span"
              value={block.stat3Label}
              onChange={(v) => u({ stat3Label: v })}
              className="text-[10px] text-gray-500 mt-1 tracking-wider uppercase font-mono"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
