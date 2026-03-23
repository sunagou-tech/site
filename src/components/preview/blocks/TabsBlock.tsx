"use client";
import { TabsBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import { useState } from "react";

interface Props { block: TabsBlock; config: SiteConfig; onChange: (b: TabsBlock) => void; }

function patchItem(block: TabsBlock, idx: number, patch: Partial<TabsBlock["items"][0]>): TabsBlock {
  const next = [...block.items];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, items: next };
}

export default function TabsBlockComponent({ block, config, onChange }: Props) {
  const [active, setActive] = useState(0);
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";
  const current = block.items[active];

  return (
    <section className="bg-white py-20 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10">
          <EditableText tag="h2" value={block.heading} onChange={(v) => onChange({ ...block, heading: v })}
            className={`text-3xl font-bold text-gray-900 ${fontClass}`} />
          <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: config.accentColor }} />
        </div>

        {/* Tab buttons */}
        <div className="flex gap-2 justify-center mb-10 flex-wrap">
          {block.items.map((item, idx) => (
            <button key={idx} onClick={() => setActive(idx)}
              className="px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
              style={active === idx
                ? { backgroundColor: config.primaryColor, color: "white" }
                : { backgroundColor: `${config.primaryColor}08`, color: config.primaryColor }}>
              <EditableText tag="span" value={item.label}
                onChange={(v) => onChange(patchItem(block, idx, { label: v }))} />
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div>
            <EditableText tag="h3" value={current.heading}
              onChange={(v) => onChange(patchItem(block, active, { heading: v }))}
              className={`text-2xl font-bold text-gray-900 mb-4 block ${fontClass}`} />
            <EditableText tag="p" value={current.body}
              onChange={(v) => onChange(patchItem(block, active, { body: v }))}
              multiline className="text-sm text-gray-500 leading-relaxed block" />
            <div className="mt-6">
              <button className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: config.primaryColor }}>
                詳しく見る →
              </button>
            </div>
          </div>
          {/* Image */}
          <div className="h-64 rounded-2xl overflow-hidden relative">
            <EditableImage url={current.imageUrl}
              onChange={(url) => onChange(patchItem(block, active, { imageUrl: url }))}
              className="absolute inset-0 rounded-2xl overflow-hidden"
              placeholderGradient={`linear-gradient(135deg, ${config.accentColor}30, ${config.primaryColor}20)`}
              primaryColor={config.primaryColor} accentColor={config.accentColor} alt={current.heading} />
          </div>
        </div>
      </div>
    </section>
  );
}
