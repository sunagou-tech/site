"use client";

import { HeroAsymBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";

interface Props {
  block: HeroAsymBlock;
  config: SiteConfig;
  onChange: (b: HeroAsymBlock) => void;
}

export default function HeroAsymBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroAsymBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  // Split tagline to highlight accentWord
  function renderTagline() {
    if (!block.accentWord || !block.tagline.includes(block.accentWord)) {
      return (
        <EditableText tag="h1" value={block.tagline} onChange={(v) => u({ tagline: v })}
          multiline
          className={`text-[clamp(2.4rem,4.5vw,4.2rem)] font-black text-white leading-[1.1] whitespace-pre-line block tracking-tight ${fontClass}`} />
      );
    }
    const parts = block.tagline.split(block.accentWord);
    return (
      <h1 className={`text-[clamp(2.4rem,4.5vw,4.2rem)] font-black text-white leading-[1.1] whitespace-pre-line tracking-tight ${fontClass}`}>
        {parts[0]}
        <span style={{ color: config.accentColor }}>{block.accentWord}</span>
        {parts[1]}
      </h1>
    );
  }

  return (
    <section className="min-h-[600px] flex overflow-hidden">

      {/* ── 左カラム：プライマリカラー帯（35%） ───────────── */}
      <div className="relative flex-shrink-0 flex flex-col justify-between py-12 px-8 lg:px-12 overflow-hidden"
        style={{ width: "35%", backgroundColor: config.primaryColor }}>

        {/* 背景装飾：大きなサークル */}
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 border-2"
          style={{ borderColor: config.accentColor }} />
        <div className="absolute top-12 -right-10 w-32 h-32 rounded-full opacity-15"
          style={{ backgroundColor: config.accentColor }} />

        {/* Eyebrow */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-px" style={{ backgroundColor: config.accentColor }} />
            <EditableText tag="span" value={block.eyebrow} onChange={(v) => u({ eyebrow: v })}
              className="text-[9px] tracking-[0.35em] uppercase font-semibold text-white/50" />
          </div>

          {/* Tagline */}
          <div className="relative z-10">
            {renderTagline()}
          </div>
        </div>

        {/* 縦書き装飾テキスト */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:block pointer-events-none select-none">
          <p className="text-[9px] tracking-[0.4em] uppercase font-medium"
            style={{ color: `${config.accentColor}50`, writingMode: "vertical-rl" }}>
            {block.eyebrow}
          </p>
        </div>

        {/* Body + CTA */}
        <div className="relative z-10">
          <EditableText tag="p" value={block.body} onChange={(v) => u({ body: v })}
            multiline
            className="text-xs text-white/60 leading-[2] whitespace-pre-line mb-8 block" />

          <LinkableButton
            label={block.buttonText} url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })} onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 text-xs font-bold px-6 py-3 rounded-full transition-all hover:scale-105"
            style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
          />
        </div>
      </div>

      {/* ── 右カラム：画像（65%） ────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <EditableImage
          url={block.imageUrl}
          onChange={(url) => u({ imageUrl: url })}
          className="absolute inset-0"
          placeholderGradient={`linear-gradient(160deg, ${config.primaryColor}20 0%, ${config.accentColor}15 60%, ${config.primaryColor}10 100%)`}
          primaryColor={config.primaryColor}
          accentColor={config.accentColor}
          alt="hero image"
        />

        {/* 左端にオーバーラップするアクセント帯 */}
        <div className="absolute left-0 top-0 bottom-0 w-4 z-10"
          style={{ background: `linear-gradient(90deg, ${config.primaryColor}, transparent)` }} />

        {/* 右下コーナー装飾 */}
        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
          <span className="text-[9px] tracking-widest uppercase text-white/50 font-medium">
            Scroll Down
          </span>
          <div className="w-12 h-px bg-white/30" />
        </div>

        {/* アクセントカラーのコーナー */}
        <div className="absolute top-0 right-0 w-16 h-16 z-10"
          style={{
            background: `linear-gradient(225deg, ${config.accentColor}60, transparent)`,
          }} />
      </div>
    </section>
  );
}
