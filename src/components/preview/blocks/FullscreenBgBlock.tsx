"use client";

import { FullscreenBgBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";

interface Props {
  block: FullscreenBgBlock;
  config: SiteConfig;
  onChange: (b: FullscreenBgBlock) => void;
}

export default function FullscreenBgBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<FullscreenBgBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="relative min-h-[400px] flex items-center overflow-hidden">
      {/* 背景画像 */}
      <EditableImage
        url={block.imageUrl}
        onChange={(url) => u({ imageUrl: url })}
        className="absolute inset-0 z-0"
        placeholderGradient={`linear-gradient(135deg, ${config.primaryColor} 0%, ${config.accentColor}80 100%)`}
        primaryColor={config.primaryColor}
        accentColor={config.accentColor}
        alt="background"
      />

      {/* 暗いオーバーレイ（画像がある場合のみ） */}
      {block.imageUrl && (
        <div className="absolute inset-0 z-10 bg-black/50" />
      )}

      {/* カードオーバーレイ */}
      <div className="relative z-20 mx-auto px-10 py-16 w-full max-w-2xl">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-3 rounded-full" style={{ backgroundColor: config.accentColor }} />
            <EditableText
              tag="span"
              value={block.subheading}
              onChange={(v) => u({ subheading: v })}
              className="text-xs text-gray-400 tracking-widest uppercase"
            />
          </div>

          <EditableText
            tag="h2"
            value={block.heading}
            onChange={(v) => u({ heading: v })}
            multiline
            className={`text-3xl font-bold text-gray-900 leading-snug whitespace-pre-line mb-4 block ${fontClass}`}
          />
          <EditableText
            tag="p"
            value={block.body}
            onChange={(v) => u({ body: v })}
            multiline
            className="text-sm text-gray-600 leading-7 whitespace-pre-line mb-7 block"
          />

          <LinkableButton
            label={block.buttonText}
            url={block.buttonUrl ?? ""}
            onLabelChange={(v) => u({ buttonText: v })}
            onUrlChange={(v) => u({ buttonUrl: v })}
            className="inline-flex items-center gap-2 text-white text-sm font-semibold px-7 py-3.5 rounded-full shadow-lg hover:opacity-80 transition-opacity"
            style={{ backgroundColor: config.primaryColor }}
          />
        </div>
      </div>
    </section>
  );
}
