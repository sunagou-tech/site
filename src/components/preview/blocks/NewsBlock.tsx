"use client";
import { NewsBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";

interface Props { block: NewsBlock; config: SiteConfig; onChange: (b: NewsBlock) => void; }

function patchItem(block: NewsBlock, idx: number, patch: Partial<NewsBlock["items"][0]>): NewsBlock {
  const next = [...block.items];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, items: next };
}

export default function NewsBlockComponent({ block, config, onChange }: Props) {
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-white py-20 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <EditableText tag="p" value={block.subheading} onChange={(v) => onChange({ ...block, subheading: v })}
              className="text-xs text-gray-400 tracking-widest uppercase mb-1" />
            <EditableText tag="h2" value={block.heading} onChange={(v) => onChange({ ...block, heading: v })}
              className={`text-3xl font-bold text-gray-900 ${fontClass}`} />
          </div>
          <button className="text-xs font-medium hover:opacity-70 transition-opacity flex items-center gap-1"
            style={{ color: config.primaryColor }}>
            すべて見る →
          </button>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {block.items.map((item, idx) => (
            <article key={idx} className="group rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="h-44 relative overflow-hidden">
                <EditableImage url={item.imageUrl} onChange={(url) => onChange(patchItem(block, idx, { imageUrl: url }))}
                  className="absolute inset-0"
                  placeholderGradient={`linear-gradient(135deg, ${config.primaryColor}30, ${config.accentColor}20)`}
                  primaryColor={config.primaryColor} accentColor={config.accentColor} alt={item.title} />
              </div>
              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <EditableText tag="span" value={item.date} onChange={(v) => onChange(patchItem(block, idx, { date: v }))}
                    className="text-[10px] text-gray-400" />
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                    style={{ backgroundColor: `${config.accentColor}20`, color: config.primaryColor }}>
                    <EditableText tag="span" value={item.category} onChange={(v) => onChange(patchItem(block, idx, { category: v }))} />
                  </span>
                </div>
                <EditableText tag="h3" value={item.title} onChange={(v) => onChange(patchItem(block, idx, { title: v }))}
                  className={`text-sm font-bold text-gray-900 mb-2 block leading-snug group-hover:text-indigo-600 transition-colors ${fontClass}`} />
                <EditableText tag="p" value={item.excerpt} onChange={(v) => onChange(patchItem(block, idx, { excerpt: v }))}
                  multiline className="text-xs text-gray-400 leading-relaxed block" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
