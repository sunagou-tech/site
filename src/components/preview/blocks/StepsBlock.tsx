"use client";
import { StepsBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";

interface Props { block: StepsBlock; config: SiteConfig; onChange: (b: StepsBlock) => void; }

function patchItem(block: StepsBlock, idx: number, patch: Partial<StepsBlock["items"][0]>): StepsBlock {
  const next = [...block.items];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, items: next };
}

export default function StepsBlockComponent({ block, config, onChange }: Props) {
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-white py-20 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <EditableText tag="p" value={block.subheading} onChange={(v) => onChange({ ...block, subheading: v })}
            className="text-xs text-gray-400 tracking-widest uppercase mb-2" />
          <EditableText tag="h2" value={block.heading} onChange={(v) => onChange({ ...block, heading: v })}
            className={`text-3xl font-bold text-gray-900 ${fontClass}`} />
          <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: config.accentColor }} />
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-0 right-0 h-px" style={{ backgroundColor: `${config.primaryColor}20` }} />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {block.items.map((step, idx) => (
              <div key={idx} className="relative flex flex-col items-center text-center">
                {/* Number circle */}
                <div className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center mb-5 shadow-md font-black text-lg text-white"
                  style={{ backgroundColor: config.primaryColor }}>
                  <EditableText tag="span" value={step.number} onChange={(v) => onChange(patchItem(block, idx, { number: v }))}
                    className="font-black text-sm" />
                  {/* Accent dot */}
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full" style={{ backgroundColor: config.accentColor }} />
                </div>
                <EditableText tag="h3" value={step.title} onChange={(v) => onChange(patchItem(block, idx, { title: v }))}
                  className={`text-sm font-bold text-gray-900 mb-2 block ${fontClass}`} />
                <EditableText tag="p" value={step.desc} onChange={(v) => onChange(patchItem(block, idx, { desc: v }))}
                  multiline className="text-xs text-gray-500 leading-relaxed block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
