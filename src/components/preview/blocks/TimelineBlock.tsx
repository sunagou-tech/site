"use client";
import { TimelineBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";

interface Props { block: TimelineBlock; config: SiteConfig; onChange: (b: TimelineBlock) => void; }

function patchItem(block: TimelineBlock, idx: number, patch: Partial<TimelineBlock["items"][0]>): TimelineBlock {
  const next = [...block.items];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, items: next };
}

export default function TimelineBlockComponent({ block, config, onChange }: Props) {
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-white py-20 px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-px" style={{ backgroundColor: config.accentColor }} />
            <span className="text-xs text-gray-400 tracking-widest uppercase">History</span>
          </div>
          <EditableText tag="h2" value={block.heading} onChange={(v) => onChange({ ...block, heading: v })}
            className={`text-3xl font-bold text-gray-900 ${fontClass}`} />
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[52px] top-0 bottom-0 w-px" style={{ backgroundColor: `${config.primaryColor}15` }} />

          <div className="space-y-10">
            {block.items.map((item, idx) => (
              <div key={idx} className="flex gap-6 group">
                {/* Year bubble */}
                <div className="flex-shrink-0 w-24 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 bg-white transition-colors group-hover:border-transparent"
                    style={{ borderColor: config.primaryColor, backgroundColor: idx === 0 ? config.primaryColor : "white" }}>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: idx === 0 ? config.accentColor : config.primaryColor }} />
                  </div>
                  <EditableText tag="span" value={item.year} onChange={(v) => onChange(patchItem(block, idx, { year: v }))}
                    className="text-xs font-bold mt-1 text-gray-400" />
                </div>
                {/* Content */}
                <div className="pb-2 flex-1">
                  <EditableText tag="h3" value={item.title} onChange={(v) => onChange(patchItem(block, idx, { title: v }))}
                    className={`text-base font-bold text-gray-900 mb-1 block ${fontClass}`} />
                  <EditableText tag="p" value={item.desc} onChange={(v) => onChange(patchItem(block, idx, { desc: v }))}
                    multiline className="text-sm text-gray-500 leading-relaxed block" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
