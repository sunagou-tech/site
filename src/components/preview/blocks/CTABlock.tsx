"use client";

import { CTABlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import LinkableButton from "../LinkableButton";

interface Props {
  block: CTABlock;
  config: SiteConfig;
  onChange: (b: CTABlock) => void;
}

export default function CTABlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<CTABlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="relative py-24 px-8 overflow-hidden" style={{ backgroundColor: config.primaryColor }}>
      <div
        className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
        style={{ backgroundColor: config.accentColor }}
      />
      <div
        className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-10"
        style={{ backgroundColor: config.accentColor }}
      />

      <div className="relative max-w-3xl mx-auto text-center">
        <EditableText
          tag="h2"
          value={block.heading}
          onChange={(v) => u({ heading: v })}
          multiline
          className={`text-4xl font-black text-white leading-snug whitespace-pre-line mb-6 block ${fontClass}`}
        />
        <EditableText
          tag="p"
          value={block.body}
          onChange={(v) => u({ body: v })}
          multiline
          className="text-sm text-white/60 leading-relaxed mb-10 block"
        />

        <div className="flex flex-wrap items-center justify-center gap-4">
          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-full shadow-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
          />
          <LinkableButton
            label={block.buttonText2}
            url={block.buttonUrl2 ?? ""}
            onLabelChange={(v) => u({ buttonText2: v })}
            onUrlChange={(v) => u({ buttonUrl2: v })}
            className="inline-flex items-center gap-2 text-sm font-medium px-8 py-4 rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
          />
        </div>
      </div>
    </section>
  );
}
