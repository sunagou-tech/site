"use client";

import { FeaturesBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";

interface Props {
  block: FeaturesBlock;
  config: SiteConfig;
  onChange: (b: FeaturesBlock) => void;
}

function patchItem(block: FeaturesBlock, idx: number, patch: Partial<FeaturesBlock["items"][0]>): FeaturesBlock {
  const next = [...block.items] as FeaturesBlock["items"];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, items: next };
}

export default function FeaturesBlockComponent({ block, config, onChange }: Props) {
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-white py-20 px-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto text-center mb-14">
        <EditableText
          tag="p"
          value={block.subheading}
          onChange={(v) => onChange({ ...block, subheading: v })}
          className="text-xs text-gray-400 tracking-widest uppercase mb-2"
        />
        <EditableText
          tag="h2"
          value={block.heading}
          onChange={(v) => onChange({ ...block, heading: v })}
          className={`text-3xl font-bold text-gray-900 ${fontClass}`}
        />
        <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: config.accentColor }} />
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {block.items.map((item, idx) => (
          <div
            key={idx}
            className="group rounded-2xl p-6 border border-gray-100 hover:border-transparent hover:shadow-lg transition-all duration-300"
            style={{ backgroundColor: idx % 2 === 0 ? `${config.accentColor}08` : "white" }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-sm"
              style={{ backgroundColor: `${config.accentColor}20` }}
            >
              <EditableText
                tag="span"
                value={item.emoji}
                onChange={(v) => onChange(patchItem(block, idx, { emoji: v }))}
                className="text-2xl"
              />
            </div>
            <EditableText
              tag="h3"
              value={item.title}
              onChange={(v) => onChange(patchItem(block, idx, { title: v }))}
              className={`text-base font-bold text-gray-900 mb-2 block ${fontClass}`}
            />
            <EditableText
              tag="p"
              value={item.desc}
              onChange={(v) => onChange(patchItem(block, idx, { desc: v }))}
              multiline
              className="text-xs text-gray-500 leading-relaxed block"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
