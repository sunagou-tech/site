"use client";

import { SplitBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";

interface Props {
  block: SplitBlock;
  config: SiteConfig;
  onChange: (b: SplitBlock) => void;
}

export default function SplitBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<SplitBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  const imagePane = (
    <div className="w-full h-full min-h-[320px] relative">
      <EditableImage
        url={block.imageUrl}
        onChange={(url) => u({ imageUrl: url })}
        className="absolute inset-0 rounded-2xl overflow-hidden"
        placeholderGradient={`linear-gradient(135deg, ${config.accentColor}40, ${config.primaryColor}30)`}
        primaryColor={config.primaryColor}
        accentColor={config.accentColor}
        alt="split image"
      />
    </div>
  );

  const textPane = (
    <div className="flex flex-col justify-center py-10 px-8">
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
        className={`text-2xl font-bold text-gray-900 leading-snug whitespace-pre-line mb-4 block ${fontClass}`}
      />
      <EditableText
        tag="p"
        value={block.body}
        onChange={(v) => u({ body: v })}
        multiline
        className="text-sm text-gray-600 leading-7 whitespace-pre-line mb-6 block"
      />

      <div>
        <LinkableButton
          label={block.buttonText}
          url={block.buttonUrl ?? ""}
          onLabelChange={(v) => u({ buttonText: v })}
          onUrlChange={(v) => u({ buttonUrl: v })}
          className="inline-flex items-center gap-2 text-white text-sm font-medium px-6 py-3 rounded-full shadow-md hover:opacity-80 transition-opacity"
          style={{ backgroundColor: config.primaryColor }}
        />
      </div>

      {/* 反転トグル */}
      <button
        onClick={() => u({ imagePosition: block.imagePosition === "left" ? "right" : "left" })}
        className="mt-4 self-start text-[10px] text-gray-400 border border-gray-200 px-2 py-1 rounded hover:border-gray-400 transition-colors"
        title="画像位置を切り替え"
      >
        ⇄ 画像位置を反転
      </button>
    </div>
  );

  return (
    <section className="bg-white overflow-hidden">
      <div className={`grid grid-cols-2 ${block.imagePosition === "right" ? "" : ""}`}>
        {block.imagePosition === "left" ? (
          <>{imagePane}{textPane}</>
        ) : (
          <>{textPane}{imagePane}</>
        )}
      </div>
    </section>
  );
}
