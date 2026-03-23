"use client";
import { TwoColCtaBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import LinkableButton from "../LinkableButton";

interface Props { block: TwoColCtaBlock; config: SiteConfig; onChange: (b: TwoColCtaBlock) => void; }

export default function TwoColCtaBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<TwoColCtaBlock>) => onChange({ ...block, ...patch });
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="py-16 px-8 bg-white">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left card */}
        <div className="rounded-2xl p-8 relative overflow-hidden"
          style={{ backgroundColor: config.primaryColor }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-8 translate-x-8"
            style={{ backgroundColor: config.accentColor }} />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl mb-5 flex items-center justify-center"
              style={{ backgroundColor: config.accentColor }}>
              <span className="text-lg">🏢</span>
            </div>
            <EditableText tag="h3" value={block.leftHeading} onChange={(v) => u({ leftHeading: v })}
              className={`text-xl font-bold text-white mb-3 block ${fontClass}`} />
            <EditableText tag="p" value={block.leftBody} onChange={(v) => u({ leftBody: v })}
              multiline className="text-sm text-white/60 leading-relaxed mb-6 block" />
            <LinkableButton
              label={block.leftButtonText}
              url={block.leftButtonUrl ?? ""}
              onLabelChange={(v) => u({ leftButtonText: v })}
              onUrlChange={(v) => u({ leftButtonUrl: v })}
              className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
              style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
            />
          </div>
        </div>

        {/* Right card */}
        <div className="rounded-2xl p-8 relative overflow-hidden border-2"
          style={{ borderColor: `${config.primaryColor}20`, backgroundColor: `${config.primaryColor}03` }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5 -translate-y-8 translate-x-8"
            style={{ backgroundColor: config.primaryColor }} />
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-xl mb-5 flex items-center justify-center border-2"
              style={{ borderColor: `${config.primaryColor}30`, backgroundColor: `${config.primaryColor}08` }}>
              <span className="text-lg">👤</span>
            </div>
            <EditableText tag="h3" value={block.rightHeading} onChange={(v) => u({ rightHeading: v })}
              className={`text-xl font-bold text-gray-900 mb-3 block ${fontClass}`} />
            <EditableText tag="p" value={block.rightBody} onChange={(v) => u({ rightBody: v })}
              multiline className="text-sm text-gray-500 leading-relaxed mb-6 block" />
            <LinkableButton
              label={block.rightButtonText}
              url={block.rightButtonUrl ?? ""}
              onLabelChange={(v) => u({ rightButtonText: v })}
              onUrlChange={(v) => u({ rightButtonUrl: v })}
              className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-full border-2 hover:opacity-80 transition-opacity"
              style={{ borderColor: config.primaryColor, color: config.primaryColor }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
