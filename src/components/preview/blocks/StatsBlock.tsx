"use client";

import { StatsBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";

interface Props {
  block: StatsBlock;
  config: SiteConfig;
  onChange: (b: StatsBlock) => void;
}

function patchItem(block: StatsBlock, idx: number, patch: Partial<StatsBlock["items"][0]>): StatsBlock {
  const next = [...block.items] as StatsBlock["items"];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, items: next };
}

export default function StatsBlockComponent({ block, config, onChange }: Props) {
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section style={{ backgroundColor: config.primaryColor }} className="py-20 px-8">
      {/* Heading */}
      <div className="text-center mb-12">
        <EditableText
          tag="h2"
          value={block.heading}
          onChange={(v) => onChange({ ...block, heading: v })}
          className={`text-sm font-semibold tracking-widest uppercase text-white/50 ${fontClass}`}
        />
      </div>

      {/* Stats Grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {block.items.map((item, idx) => (
          <div key={idx} className="text-center group">
            <div className="flex items-end justify-center gap-1 mb-2">
              <EditableText
                tag="span"
                value={item.value}
                onChange={(v) => onChange(patchItem(block, idx, { value: v }))}
                className={`text-5xl font-black text-white leading-none ${fontClass}`}
              />
              <EditableText
                tag="span"
                value={item.suffix}
                onChange={(v) => onChange(patchItem(block, idx, { suffix: v }))}
                className={`text-xl font-bold mb-1 ${fontClass}`}
                style={{ color: config.accentColor }}
              />
            </div>
            <EditableText
              tag="p"
              value={item.label}
              onChange={(v) => onChange(patchItem(block, idx, { label: v }))}
              className="text-xs text-white/50 tracking-widest uppercase"
            />
            <div className="w-8 h-px mx-auto mt-3 opacity-30" style={{ backgroundColor: config.accentColor }} />
          </div>
        ))}
      </div>
    </section>
  );
}
