"use client";
import { ComparisonBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import { Check, X } from "lucide-react";

interface Props { block: ComparisonBlock; config: SiteConfig; onChange: (b: ComparisonBlock) => void; }

function patchRow(block: ComparisonBlock, idx: number, patch: Partial<ComparisonBlock["rows"][0]>): ComparisonBlock {
  const next = [...block.rows];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, rows: next };
}

export default function ComparisonBlockComponent({ block, config, onChange }: Props) {
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-white py-20 px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <EditableText tag="h2" value={block.heading} onChange={(v) => onChange({ ...block, heading: v })}
            className={`text-3xl font-bold text-gray-900 ${fontClass}`} />
          <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: config.accentColor }} />
        </div>

        <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
          {/* Header row */}
          <div className="grid grid-cols-3 text-center">
            <div className="bg-gray-50 py-4 border-b border-r border-gray-200">
              <span className="text-xs font-semibold text-gray-400 tracking-widest uppercase">比較項目</span>
            </div>
            <div className="py-4 border-b border-r border-gray-200" style={{ backgroundColor: config.primaryColor }}>
              <EditableText tag="span" value={block.ourLabel} onChange={(v) => onChange({ ...block, ourLabel: v })}
                className="text-xs font-bold text-white tracking-wider" />
            </div>
            <div className="bg-gray-100 py-4 border-b border-gray-200">
              <EditableText tag="span" value={block.competitorLabel} onChange={(v) => onChange({ ...block, competitorLabel: v })}
                className="text-xs font-semibold text-gray-400 tracking-wider" />
            </div>
          </div>

          {/* Data rows */}
          {block.rows.map((row, idx) => (
            <div key={idx} className={`grid grid-cols-3 text-center border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
              <div className="py-4 px-4 border-r border-gray-100 flex items-center justify-center">
                <EditableText tag="span" value={row.feature} onChange={(v) => onChange(patchRow(block, idx, { feature: v }))}
                  className="text-xs font-medium text-gray-700" />
              </div>
              <div className="py-4 px-4 border-r border-gray-100 flex items-center justify-center" style={{ backgroundColor: `${config.primaryColor}05` }}>
                <EditableText tag="span" value={row.us} onChange={(v) => onChange(patchRow(block, idx, { us: v }))}
                  className="text-xs font-semibold" style={{ color: config.primaryColor }} />
              </div>
              <div className="py-4 px-4 flex items-center justify-center">
                <EditableText tag="span" value={row.them} onChange={(v) => onChange(patchRow(block, idx, { them: v }))}
                  className="text-xs text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
