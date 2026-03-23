"use client";

import { ContactBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";

interface Props {
  block: ContactBlock;
  config: SiteConfig;
  onChange: (b: ContactBlock) => void;
}

export default function ContactBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<ContactBlock>) => onChange({ ...block, ...patch });
  const repeated = Array(8).fill("Contact　お問い合わせ　");

  return (
    <section>
      <div className="overflow-hidden py-5" style={{ backgroundColor: config.primaryColor }}>
        <div className="flex whitespace-nowrap" style={{ animation: "marquee 20s linear infinite" }}>
          {[...repeated, ...repeated].map((t, i) => (
            <span key={i} className="text-xl font-bold text-white/60 mr-12 shrink-0 tracking-[0.06em]">{t}</span>
          ))}
        </div>
      </div>

      <div className="bg-[#fbfbfb] px-12 py-28 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="w-1 h-3 rounded-full" style={{ backgroundColor: config.accentColor }} />
          <span className="label-text text-gray-400 uppercase tracking-widest">contact</span>
        </div>

        <EditableText
          tag="h2"
          value={block.heading}
          onChange={(v) => u({ heading: v })}
          className="section-heading font-bold text-gray-900 block text-center"
        />
        <EditableText
          tag="p"
          value={block.desc}
          onChange={(v) => u({ desc: v })}
          multiline
          className="text-base text-gray-500 body-text mt-4 mb-10 block text-center max-w-md mx-auto"
        />

        <button
          className="inline-flex items-center gap-2 text-white text-sm font-semibold px-10 py-4 rounded-full shadow-lg hover:opacity-80 transition-opacity"
          style={{ backgroundColor: config.primaryColor }}
        >
          お問い合わせフォームへ →
        </button>
      </div>
    </section>
  );
}
