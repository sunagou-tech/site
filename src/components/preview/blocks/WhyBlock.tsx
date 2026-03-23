"use client";

import { WhyBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";

interface Props {
  block: WhyBlock;
  config: SiteConfig;
  onChange: (b: WhyBlock) => void;
}

export default function WhyBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<WhyBlock>) => onChange({ ...block, ...patch });

  return (
    <section className="bg-[#f8f5f0] px-12 py-24 flex gap-16 items-center">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-6">
          <span className="w-1 h-3 rounded-full" style={{ backgroundColor: config.accentColor }} />
          <EditableText
            tag="span"
            value={block.label}
            onChange={(v) => u({ label: v })}
            className="label-text text-gray-400 uppercase tracking-widest"
          />
        </div>
        <EditableText
          tag="p"
          value={block.body1}
          onChange={(v) => u({ body1: v })}
          multiline
          className="text-base text-gray-700 body-text block"
        />
        <EditableText
          tag="p"
          value={block.body2}
          onChange={(v) => u({ body2: v })}
          multiline
          className="text-base text-gray-700 body-text mt-5 block"
        />
      </div>

      <EditableImage
        url={block.imageUrl}
        onChange={(url) => u({ imageUrl: url })}
        className="w-64 h-52 rounded-2xl flex-shrink-0 shadow-lg"
        placeholderGradient={`linear-gradient(135deg, ${config.primaryColor}20, ${config.accentColor}35)`}
        primaryColor={config.primaryColor}
        accentColor={config.accentColor}
        alt="why us"
      />
    </section>
  );
}
