"use client";

import { HeroGradientBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import LinkableButton from "../LinkableButton";
import { useEditing } from "@/contexts/EditingContext";

interface Props {
  block: HeroGradientBlock;
  config: SiteConfig;
  onChange: (b: HeroGradientBlock) => void;
}

export default function HeroGradientBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroGradientBlock>) => onChange({ ...block, ...patch });
  const isEditing = useEditing();
  const hasBtn2 = !!block.buttonText2?.trim();
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  function updateStat(idx: number, field: "value" | "label", val: string) {
    const next = block.stats.map((s, i) => i === idx ? { ...s, [field]: val } : s);
    u({ stats: next });
  }

  return (
    <section className="relative min-h-[640px] overflow-hidden flex items-center"
      style={{ backgroundColor: config.primaryColor }}>

      {/* ── Animated gradient blobs ─────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none select-none">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl animate-pulse"
          style={{ backgroundColor: config.accentColor }} />
        <div className="absolute -bottom-40 -right-24 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl"
          style={{ backgroundColor: config.accentColor, animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: config.accentColor }} />
      </div>

      {/* ── Grid overlay ──────────────────────────────────────── */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }} />

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: text */}
          <div>
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="w-6 h-px" style={{ backgroundColor: config.accentColor }} />
              <EditableText tag="span" value={block.eyebrow} onChange={(v) => u({ eyebrow: v })}
                className="text-[11px] tracking-[0.25em] uppercase font-semibold"
                style={{ color: config.accentColor }} />
            </div>

            {/* Headline */}
            <EditableText tag="h1" value={block.tagline} onChange={(v) => u({ tagline: v })}
              multiline
              className={`text-[clamp(3rem,6vw,5rem)] font-black text-white leading-[1.05] whitespace-pre-line mb-6 block tracking-tight ${fontClass}`} />

            {/* Body */}
            <EditableText tag="p" value={block.body} onChange={(v) => u({ body: v })}
              multiline
              className="text-sm text-white/60 leading-relaxed whitespace-pre-line mb-10 max-w-md block" />

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <LinkableButton
                label={block.buttonText} url={block.buttonUrl ?? ""}
                onLabelChange={(v) => u({ buttonText: v })} onUrlChange={(v) => u({ buttonUrl: v })}
                className="inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-full shadow-2xl transition-all hover:scale-105"
                style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
              />
              {hasBtn2 ? (
                <LinkableButton
                  label={block.buttonText2} url={block.buttonUrl2 ?? ""}
                  onLabelChange={(v) => u({ buttonText2: v })} onUrlChange={(v) => u({ buttonUrl2: v })}
                  className="inline-flex items-center gap-2 text-sm font-medium px-8 py-4 rounded-full border border-white/30 text-white transition-all hover:bg-white/10"
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
          </div>

          {/* Right: floating stat cards */}
          <div className="relative h-80 lg:h-auto">
            <div className="flex flex-col gap-4 lg:absolute lg:right-0 lg:top-0 lg:w-60">
              {block.stats.map((stat, i) => (
                <div key={i}
                  className="backdrop-blur-md rounded-2xl p-5 shadow-2xl border"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderColor: "rgba(255,255,255,0.15)",
                    transform: `translateX(${i * 12}px)`,
                  }}>
                  <EditableText tag="p" value={stat.value} onChange={(v) => updateStat(i, "value", v)}
                    className={`text-4xl font-black text-white block ${fontClass}`}
                    style={{ color: i === 0 ? config.accentColor : "white" }} />
                  <EditableText tag="p" value={stat.label} onChange={(v) => updateStat(i, "label", v)}
                    className="text-xs text-white/50 mt-1 block" />
                </div>
              ))}

              {/* Decorative circle */}
              <div className="hidden lg:block absolute -bottom-12 -left-12 w-28 h-28 rounded-full border-2 opacity-20"
                style={{ borderColor: config.accentColor }} />
              <div className="hidden lg:block absolute -bottom-6 -left-6 w-14 h-14 rounded-full opacity-30"
                style={{ backgroundColor: config.accentColor }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom accent bar ─────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-1 opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${config.accentColor}, transparent)` }} />
    </section>
  );
}
