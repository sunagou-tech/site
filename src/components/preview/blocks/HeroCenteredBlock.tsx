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
  const hasBtn2 = !!block.buttonText2?.trim();
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="relative flex items-center justify-center overflow-hidden text-center min-h-[600px] md:min-h-[680px]">
      {/* Background — absolute inset-0 so image fills the whole section */}
      <div className="absolute inset-0">
        {block.imageUrl ? (
          <EditableImage url={block.imageUrl} onChange={(url) => u({ imageUrl: url })}
            className="absolute inset-0" primaryColor={config.primaryColor} accentColor={config.accentColor} alt="hero bg" />
        ) : (
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}cc 40%, ${config.accentColor}33 100%)` }} />
        )}
        {/* Dark overlay — pointer-events-none で EditableImage のクリックを通す */}
        <div className="absolute inset-0 bg-black/55 pointer-events-none" />
      </div>

      {/* Editing-only buttons */}
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
      <div className="relative z-10 px-6 md:px-8 py-10 max-w-2xl mx-auto w-full">
        <EditableText tag="p" value={block.eyebrow} onChange={(v) => u({ eyebrow: v })}
          className="text-[11px] tracking-[0.25em] uppercase font-medium mb-4 block"
          style={{ color: config.accentColor }} />
        <EditableText tag="h1" value={block.tagline} onChange={(v) => u({ tagline: v })}
          multiline className={`text-3xl md:text-5xl font-black text-white leading-tight whitespace-pre-line mb-5 block ${fontClass}`} />
        <EditableText tag="p" value={block.body} onChange={(v) => u({ body: v })}
          multiline className="text-sm md:text-base text-white/75 leading-relaxed mb-8 mx-auto block" />
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="px-7 py-3.5 rounded-full text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
            style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
            onDelete={isEditing ? () => u({ buttonText: "" }) : undefined}
          />
          {/* 2nd button: hidden when empty (non-editing), add button when editing */}
          {hasBtn2 ? (
            <LinkableButton
              label={block.buttonText2}
              url={block.buttonUrl2 ?? ""}
              onLabelChange={(v) => u({ buttonText2: v })}
              onUrlChange={(v) => u({ buttonUrl2: v })}
              className="px-7 py-3.5 rounded-full text-sm font-medium border border-white/40 text-white hover:bg-white/10 transition-colors"
              onDelete={isEditing ? () => u({ buttonText2: "", buttonUrl2: "" }) : undefined}
            />
          ) : (
            isEditing && (
              <button
                onClick={() => u({ buttonText2: "詳しく見る", buttonUrl2: "#features" })}
                className="px-5 py-3 rounded-full text-xs font-medium border border-dashed border-white/30 text-white/40 hover:border-white/60 hover:text-white/70 transition-colors"
              >
                + ボタンを追加
              </button>
            )
          )}
        </div>
      </div>
    </section>
  );
}
