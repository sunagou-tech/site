"use client";

import { HeroBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import LinkableButton from "../LinkableButton";

interface Props {
  block: HeroBlock;
  config: SiteConfig;
  onChange: (b: HeroBlock) => void;
}

export default function HeroBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="relative bg-[#f8f5f0] overflow-hidden px-12 pt-20 pb-28">
      {/* Geometric shapes */}
      <div className="absolute top-8 right-24 flex flex-wrap gap-4 w-52 pointer-events-none select-none">
        <div className="w-14 h-14 rounded-full bg-yellow-300 shadow-lg" />
        <div className="w-12 h-12 bg-blue-400 shadow-lg rotate-6" />
        <svg width="46" height="46" viewBox="0 0 46 46"><polygon points="23,3 44,43 2,43" fill="#f87171" /></svg>
        <svg width="46" height="46" viewBox="0 0 46 46"><polygon points="23,2 42,14 36,38 10,38 4,14" fill="#4ade80" /></svg>
        <div className="w-9 h-9 rounded-full bg-orange-300 shadow" />
        <svg width="34" height="34" viewBox="0 0 34 34"><polygon points="17,1 33,17 17,33 1,17" fill="#a78bfa" /></svg>
      </div>

      <div className="absolute top-10 right-10 pointer-events-none">
        <p className="text-[10px] text-gray-400 leading-6" style={{ writingMode: "vertical-rl" }}>
          We are experts in our respective fields.
        </p>
      </div>

      <div className="mt-20 max-w-xl">
        <p className="label-text text-gray-400 mb-4 uppercase">We are experts in our respective fields.</p>

        <EditableText
          tag="h1"
          value={block.tagline}
          onChange={(v) => u({ tagline: v })}
          multiline
          className={`display-heading font-black text-gray-900 whitespace-pre-line block ${fontClass}`}
        />
        <EditableText
          tag="p"
          value={block.taglineSub}
          onChange={(v) => u({ taglineSub: v })}
          className="mt-5 text-sm text-gray-500 body-text block"
        />

        <div className="mt-10">
          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 text-white text-sm font-semibold px-8 py-4 rounded-full shadow-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: config.primaryColor }}
          />
        </div>
      </div>
    </section>
  );
}
