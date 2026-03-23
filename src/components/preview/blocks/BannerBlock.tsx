"use client";
import { BannerBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import { X } from "lucide-react";

interface Props { block: BannerBlock; config: SiteConfig; onChange: (b: BannerBlock) => void; }

export default function BannerBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<BannerBlock>) => onChange({ ...block, ...patch });

  return (
    <div className="flex items-center justify-center gap-4 px-6 py-3 text-white relative" style={{ backgroundColor: config.primaryColor }}>
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
        style={{ backgroundColor: config.accentColor, color: config.primaryColor }}>
        <EditableText tag="span" value={block.label} onChange={(v) => u({ label: v })} />
      </span>
      <EditableText tag="span" value={block.text} onChange={(v) => u({ text: v })}
        className="text-xs text-white/90" />
      <EditableText tag="span" value={block.linkText} onChange={(v) => u({ linkText: v })}
        className="text-xs font-semibold underline underline-offset-2 cursor-pointer hover:opacity-80"
        style={{ color: config.accentColor }} />
      <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}
