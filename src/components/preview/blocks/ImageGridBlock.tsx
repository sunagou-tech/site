"use client";
import { ImageGridBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";

interface Props { block: ImageGridBlock; config: SiteConfig; onChange: (b: ImageGridBlock) => void; }

function patchItem(block: ImageGridBlock, idx: number, patch: Partial<ImageGridBlock["items"][0]>): ImageGridBlock {
  const next = [...block.items];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, items: next };
}

export default function ImageGridBlockComponent({ block, config, onChange }: Props) {
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-white py-20 px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <EditableText tag="p" value={block.subheading} onChange={(v) => onChange({ ...block, subheading: v })}
            className="text-xs text-gray-400 tracking-widest uppercase mb-2" />
          <EditableText tag="h2" value={block.heading} onChange={(v) => onChange({ ...block, heading: v })}
            className={`text-3xl font-bold text-gray-900 ${fontClass}`} />
          <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: config.accentColor }} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {block.items.map((item, idx) => (
            <div key={idx} className="group relative rounded-2xl overflow-hidden aspect-[4/3] cursor-pointer">
              <EditableImage url={item.imageUrl} onChange={(url) => onChange(patchItem(block, idx, { imageUrl: url }))}
                className="absolute inset-0"
                placeholderGradient={`linear-gradient(135deg, ${config.primaryColor}${20 + idx * 10}, ${config.accentColor}30)`}
                primaryColor={config.primaryColor} accentColor={config.accentColor} alt={item.title} />
              {/* Hover overlay — pointer-events-none で EditableImage クリックを通す */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex flex-col justify-end p-4 pointer-events-none">
                <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium mb-1"
                    style={{ backgroundColor: config.accentColor, color: config.primaryColor }}>
                    <EditableText tag="span" value={item.tag} onChange={(v) => onChange(patchItem(block, idx, { tag: v }))} />
                  </span>
                  <EditableText tag="p" value={item.title} onChange={(v) => onChange(patchItem(block, idx, { title: v }))}
                    className={`text-sm font-bold text-white block leading-snug ${fontClass}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
