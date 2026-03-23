"use client";
import { HeroMinimalBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import LinkableButton from "../LinkableButton";

interface Props { block: HeroMinimalBlock; config: SiteConfig; onChange: (b: HeroMinimalBlock) => void; }

export default function HeroMinimalBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroMinimalBlock>) => onChange({ ...block, ...patch });
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-white min-h-[480px] flex items-center px-8 md:px-20">
      <div className="max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-px" style={{ backgroundColor: config.accentColor }} />
          <EditableText tag="span" value={block.eyebrow} onChange={(v) => u({ eyebrow: v })}
            className="text-xs tracking-[0.25em] uppercase text-gray-400" />
        </div>
        <EditableText tag="h1" value={block.tagline} onChange={(v) => u({ tagline: v })}
          multiline
          className={`text-6xl font-black text-gray-900 leading-[1.05] whitespace-pre-line mb-8 block ${fontClass}`}
          style={{ letterSpacing: "-0.04em" }} />
        <EditableText tag="p" value={block.body} onChange={(v) => u({ body: v })}
          multiline className="text-base text-gray-500 leading-relaxed max-w-lg mb-10 block" />
        <LinkableButton
          label={block.buttonText}
          url={block.buttonUrl ?? ""}
          onLabelChange={(v) => u({ buttonText: v })}
          onUrlChange={(v) => u({ buttonUrl: v })}
          className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-sm font-bold text-white shadow-lg hover:opacity-90 transition-opacity"
          style={{ backgroundColor: config.primaryColor }}
        />
      </div>
    </section>
  );
}
