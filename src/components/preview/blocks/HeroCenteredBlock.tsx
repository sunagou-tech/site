"use client";
import { HeroCenteredBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";
import { useEditing } from "@/contexts/EditingContext";

interface Props { block: HeroCenteredBlock; config: SiteConfig; onChange: (b: HeroCenteredBlock) => void; }

export default function HeroCenteredBlockComponent({ block, config, onChange }: Props) {
  const isEditing = useEditing();
  const u = (patch: Partial<HeroCenteredBlock>) => onChange({ ...block, ...patch });
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="relative min-h-[560px] flex items-center justify-center overflow-hidden text-center">
      {/* Background */}
      <div className="absolute inset-0">
        {block.imageUrl ? (
          <EditableImage url={block.imageUrl} onChange={(url) => u({ imageUrl: url })}
            className="absolute inset-0" primaryColor={config.primaryColor} accentColor={config.accentColor} alt="hero bg" />
        ) : (
          <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}cc 40%, ${config.accentColor}33 100%)` }} />
        )}
        <div className="absolute inset-0 bg-black/50" />
      </div>
      {isEditing && !block.imageUrl && (
        <button onClick={() => u({ imageUrl: " " })}
          className="absolute bottom-4 right-4 z-20 text-[10px] text-white/60 border border-white/20 px-3 py-1.5 rounded-full hover:border-white/60 transition-colors">
          + 背景画像を追加
        </button>
      )}
      {isEditing && block.imageUrl && block.imageUrl.trim() && (
        <button onClick={() => u({ imageUrl: "" })}
          className="absolute bottom-4 right-4 z-20 text-[10px] text-red-300 border border-red-300/30 px-3 py-1.5 rounded-full hover:border-red-300 transition-colors">
          背景画像を削除
        </button>
      )}
      {/* Content */}
      <div className="relative z-10 px-8 max-w-3xl mx-auto">
        <EditableText tag="p" value={block.eyebrow} onChange={(v) => u({ eyebrow: v })}
          className="text-xs tracking-[0.3em] uppercase font-medium mb-4 block"
          style={{ color: config.accentColor }} />
        <EditableText tag="h1" value={block.tagline} onChange={(v) => u({ tagline: v })}
          multiline className={`text-3xl md:text-5xl font-black text-white leading-tight whitespace-pre-line mb-6 block ${fontClass}`} />
        <EditableText tag="p" value={block.body} onChange={(v) => u({ body: v })}
          multiline className="text-base text-white/70 leading-relaxed mb-10 max-w-xl mx-auto block" />
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="px-8 py-4 rounded-full text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
          />
          <LinkableButton
            label={block.buttonText2}
            url={block.buttonUrl2 ?? ""}
            onLabelChange={(v) => u({ buttonText2: v })}
            onUrlChange={(v) => u({ buttonUrl2: v })}
            className="px-8 py-4 rounded-full text-sm font-medium border border-white/40 text-white hover:bg-white/10 transition-colors"
          />
        </div>
      </div>
    </section>
  );
}
