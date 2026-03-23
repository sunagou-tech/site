"use client";
import { PricingBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import { Check } from "lucide-react";

interface Props { block: PricingBlock; config: SiteConfig; onChange: (b: PricingBlock) => void; }

export default function PricingBlockComponent({ block, config, onChange }: Props) {
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  function patchPlan(idx: number, patch: Partial<PricingBlock["plans"][0]>) {
    const next = [...block.plans] as PricingBlock["plans"];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...block, plans: next });
  }

  return (
    <section className="py-20 px-8" style={{ backgroundColor: `${config.primaryColor}05` }}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <EditableText tag="p" value={block.subheading} onChange={(v) => onChange({ ...block, subheading: v })}
            className="text-xs text-gray-400 tracking-widest uppercase mb-2" />
          <EditableText tag="h2" value={block.heading} onChange={(v) => onChange({ ...block, heading: v })}
            className={`text-3xl font-bold text-gray-900 ${fontClass}`} />
          <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: config.accentColor }} />
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {block.plans.map((plan, idx) => (
            <div key={idx} className={`relative rounded-2xl p-8 flex flex-col ${plan.highlighted ? "shadow-2xl scale-105 z-10" : "border border-gray-200 bg-white shadow-sm"}`}
              style={plan.highlighted ? { backgroundColor: config.primaryColor } : {}}>
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: config.accentColor, color: config.primaryColor }}>
                  人気No.1
                </div>
              )}

              <div className="mb-6">
                <EditableText tag="p" value={plan.name} onChange={(v) => patchPlan(idx, { name: v })}
                  className={`text-xs font-semibold tracking-widest uppercase mb-3 ${plan.highlighted ? "text-white/60" : "text-gray-400"}`} />
                <div className="flex items-baseline gap-1 mb-2">
                  <EditableText tag="span" value={plan.price} onChange={(v) => patchPlan(idx, { price: v })}
                    className={`text-3xl font-black ${plan.highlighted ? "text-white" : "text-gray-900"}`} />
                  <EditableText tag="span" value={plan.period} onChange={(v) => patchPlan(idx, { period: v })}
                    className={`text-sm ${plan.highlighted ? "text-white/50" : "text-gray-400"}`} />
                </div>
                <EditableText tag="p" value={plan.desc} onChange={(v) => patchPlan(idx, { desc: v })}
                  className={`text-xs leading-relaxed ${plan.highlighted ? "text-white/60" : "text-gray-400"}`} />
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feat, fi) => (
                  <li key={fi} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: config.accentColor }} />
                    <span className={`text-xs ${plan.highlighted ? "text-white/80" : "text-gray-600"}`}>{feat}</span>
                  </li>
                ))}
              </ul>

              <button className={`w-full py-3 rounded-xl text-sm font-bold transition-opacity hover:opacity-80 ${plan.highlighted ? "" : "border border-gray-200"}`}
                style={plan.highlighted ? { backgroundColor: config.accentColor, color: config.primaryColor } : { color: config.primaryColor }}>
                <EditableText tag="span" value={plan.buttonText} onChange={(v) => patchPlan(idx, { buttonText: v })} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
