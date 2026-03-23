"use client";
import { LogoCloudBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";

interface Props { block: LogoCloudBlock; config: SiteConfig; onChange: (b: LogoCloudBlock) => void; }

export default function LogoCloudBlockComponent({ block, config, onChange }: Props) {
  return (
    <section className="bg-white border-y border-gray-100 py-10 px-8">
      <p className="text-center text-xs text-gray-400 tracking-widest uppercase mb-8">
        <EditableText tag="span" value={block.heading} onChange={(v) => onChange({ ...block, heading: v })} />
      </p>
      <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-8">
        {block.logos.map((logo, idx) => (
          <div key={idx}
            className="px-6 py-3 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors cursor-default"
            style={{ borderColor: `${config.primaryColor}20` }}>
            <EditableText tag="span" value={logo.name}
              onChange={(v) => {
                const next = [...block.logos];
                next[idx] = { name: v };
                onChange({ ...block, logos: next });
              }}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors" />
          </div>
        ))}
      </div>
    </section>
  );
}
