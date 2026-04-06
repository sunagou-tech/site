"use client";

import { TestimonialsBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";

interface Props {
  block: TestimonialsBlock;
  config: SiteConfig;
  onChange: (b: TestimonialsBlock) => void;
}

function patchItem(block: TestimonialsBlock, idx: number, patch: Partial<TestimonialsBlock["items"][0]>): TestimonialsBlock {
  const next = [...block.items];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, items: next };
}

export default function TestimonialsBlockComponent({ block, config, onChange }: Props) {
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="py-28 px-8" style={{ backgroundColor: `${config.primaryColor}06` }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4"
            style={{ backgroundColor: `${config.accentColor}20`, color: config.primaryColor }}
          >
            ★ お客様の声
          </div>
          <EditableText
            tag="h2"
            value={block.heading}
            onChange={(v) => onChange({ ...block, heading: v })}
            className={`text-3xl font-bold text-gray-900 ${fontClass}`}
          />
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {block.items.map((item, idx) => (
            <div
              key={idx}
              className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
            >
              {/* Quote mark */}
              <div
                className="text-5xl font-black leading-none mb-3 select-none"
                style={{ color: `${config.accentColor}40` }}
              >
                "
              </div>
              <EditableText
                tag="p"
                value={item.quote}
                onChange={(v) => onChange(patchItem(block, idx, { quote: v }))}
                multiline
                className="text-sm text-gray-600 leading-relaxed mb-5 block"
              />
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: config.primaryColor }}
                >
                  {idx + 1}
                </div>
                <div>
                  <EditableText
                    tag="p"
                    value={item.name}
                    onChange={(v) => onChange(patchItem(block, idx, { name: v }))}
                    className="text-xs font-bold text-gray-800 block"
                  />
                  <EditableText
                    tag="p"
                    value={item.role}
                    onChange={(v) => onChange(patchItem(block, idx, { role: v }))}
                    className="text-[10px] text-gray-400 block"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
