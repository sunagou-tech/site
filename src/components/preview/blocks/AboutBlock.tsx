"use client";

import { AboutBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import LinkableButton from "../LinkableButton";

interface Props {
  block: AboutBlock;
  config: SiteConfig;
  onChange: (b: AboutBlock) => void;
}

export default function AboutBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<AboutBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-[#fbfbfb] px-12 py-28">
      <div className="flex items-center gap-2 mb-8">
        <span className="w-1 h-4 rounded-full" style={{ backgroundColor: config.accentColor }} />
        <span className="label-text text-gray-400 uppercase tracking-widest">About</span>
      </div>

      <div className="max-w-2xl">
        <EditableText
          tag="h2"
          value={block.heading}
          onChange={(v) => u({ heading: v })}
          multiline
          className={`section-heading font-bold text-gray-900 whitespace-pre-line mb-8 block ${fontClass}`}
        />
        <EditableText
          tag="p"
          value={block.body}
          onChange={(v) => u({ body: v })}
          multiline
          className="text-base text-gray-600 body-text whitespace-pre-line block"
        />
        <div className="mt-10">
          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-full border-2 transition-colors"
            style={{ borderColor: config.primaryColor, color: config.primaryColor }}
          />
        </div>
      </div>
    </section>
  );
}
