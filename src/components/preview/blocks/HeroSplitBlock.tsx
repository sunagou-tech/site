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
    <section className="grid grid-cols-2 min-h-[560px]">
      {/* 左：画像 */}
      <div className="relative overflow-hidden">
        <EditableImage
          url={block.imageUrl}
          onChange={(url) => u({ imageUrl: url })}
          className="absolute inset-0"
          placeholderGradient={`linear-gradient(135deg, ${config.primaryColor}40 0%, ${config.accentColor}30 100%)`}
          primaryColor={config.primaryColor}
          accentColor={config.accentColor}
          alt="hero split image"
        />
        {/* 左端に縦書きテキスト */}
        <div
          className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center z-10"
          style={{ backgroundColor: config.accentColor }}
        >
          <p className="text-[10px] font-bold text-white/80 whitespace-nowrap tracking-widest"
             style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            {config.catchCopy}
          </p>
        </div>
      </div>

      {/* 右：グラデーション + 白文字 */}
      <div
        className="flex flex-col justify-center px-14 py-20 relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${config.primaryColor} 0%, ${config.primaryColor}e0 60%, ${config.accentColor}60 100%)`,
        }}
      >
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-10 border-2 border-white" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-5 border border-white" />

        <p className="text-white/50 text-xs tracking-[0.3em] uppercase mb-5">
          Hero — Pattern A
        </p>

        <EditableText
          tag="h1"
          value={block.tagline}
          onChange={(v) => u({ tagline: v })}
          multiline
          className={`text-[clamp(2.4rem,4.5vw,4rem)] font-black leading-[1.05] tracking-[-0.04em] text-white whitespace-pre-line block ${fontClass}`}
        />

        <EditableText
          tag="p"
          value={block.body}
          onChange={(v) => u({ body: v })}
          multiline
          className="mt-6 text-sm text-white/70 leading-[1.9] tracking-[0.02em] whitespace-pre-line block max-w-xs"
        />

        <EditableText
          tag="p"
          value={block.taglineSub}
          onChange={(v) => u({ taglineSub: v })}
          className="mt-3 text-xs text-white/40 tracking-[0.15em] block"
        />

        <div className="mt-10">
          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 bg-white text-sm font-semibold px-8 py-4 rounded-full shadow-xl hover:bg-gray-50 transition-colors"
            style={{ color: config.primaryColor }}
          />
        </div>
      </div>
    </section>
  );
}
