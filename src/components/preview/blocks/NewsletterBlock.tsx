"use client";
import { NewsletterBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";

interface Props { block: NewsletterBlock; config: SiteConfig; onChange: (b: NewsletterBlock) => void; }

export default function NewsletterBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<NewsletterBlock>) => onChange({ ...block, ...patch });
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="py-20 px-8" style={{ backgroundColor: `${config.primaryColor}06` }}>
      <div className="max-w-2xl mx-auto text-center">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-md"
          style={{ backgroundColor: config.primaryColor }}>
          <span className="text-xl">✉</span>
        </div>
        <EditableText tag="h2" value={block.heading} onChange={(v) => u({ heading: v })}
          className={`text-2xl font-bold text-gray-900 mb-3 block ${fontClass}`} />
        <EditableText tag="p" value={block.body} onChange={(v) => u({ body: v })}
          multiline className="text-sm text-gray-500 leading-relaxed mb-8 block" />
        <div className="flex gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder={block.placeholder}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ "--tw-ring-color": config.accentColor } as React.CSSProperties}
            readOnly
          />
          <button className="px-6 py-3 rounded-xl text-sm font-bold text-white flex-shrink-0 hover:opacity-90 transition-opacity shadow-md"
            style={{ backgroundColor: config.primaryColor }}>
            <EditableText tag="span" value={block.buttonText} onChange={(v) => u({ buttonText: v })} />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-3">スパムメールは送りません。いつでも解除できます。</p>
      </div>
    </section>
  );
}
