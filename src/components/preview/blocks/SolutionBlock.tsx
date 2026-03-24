"use client";
import { SolutionBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";

interface Props { block: SolutionBlock; config: SiteConfig; onChange: (b: SolutionBlock) => void; }

export default function SolutionBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<SolutionBlock>) => onChange({ ...block, ...patch });
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  function updateItem(idx: number, val: string) {
    const next = block.items.map((it, i) => i === idx ? { text: val } : it);
    u({ items: next });
  }

  return (
    <section className="py-24 px-8 bg-[#F9FAFB]">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        {/* Left: text */}
        <div>
          <span className="inline-block text-xs tracking-[0.3em] uppercase font-semibold px-3 py-1 rounded-full mb-6"
            style={{ backgroundColor: `${config.accentColor}20`, color: config.primaryColor }}>
            <EditableText tag="span" value={block.eyebrow} onChange={(v) => u({ eyebrow: v })} />
          </span>
          <EditableText tag="h2" value={block.heading} onChange={(v) => u({ heading: v })} multiline
            className={`text-3xl lg:text-4xl font-black text-gray-900 leading-snug whitespace-pre-line mb-6 block ${fontClass}`} />
          <EditableText tag="p" value={block.body} onChange={(v) => u({ body: v })} multiline
            className="text-sm text-gray-500 leading-[2] whitespace-pre-line mb-8 block" />

          {/* Checklist */}
          <ul className="space-y-4 mb-10">
            {block.items.map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold"
                  style={{ backgroundColor: config.accentColor, color: config.primaryColor }}>✓</span>
                <EditableText tag="span" value={item.text} onChange={(v) => updateItem(i, v)}
                  className="text-sm text-gray-700 font-medium block" />
              </li>
            ))}
          </ul>

          <LinkableButton label={block.buttonText} url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })} onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-full text-white shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: config.primaryColor }} />
        </div>

        {/* Right: image */}
        <div className="relative">
          <div className="rounded-3xl overflow-hidden shadow-2xl h-96 lg:h-[480px]">
            <EditableImage url={block.imageUrl} onChange={(url) => u({ imageUrl: url })}
              className="absolute inset-0 rounded-3xl" primaryColor={config.primaryColor} accentColor={config.accentColor}
              alt="solution image"
              placeholderGradient={`linear-gradient(135deg, ${config.primaryColor}20, ${config.accentColor}20)`} />
          </div>
          {/* Decorative accent */}
          <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full -z-10"
            style={{ backgroundColor: `${config.accentColor}30` }} />
          <div className="absolute -top-4 -left-4 w-16 h-16 rounded-full -z-10"
            style={{ backgroundColor: `${config.primaryColor}15` }} />
        </div>
      </div>
    </section>
  );
}
