"use client";
import { ProblemBlock, SiteConfig, IconValue } from "@/types/site";
import EditableText from "../EditableText";
import IconDisplay from "../IconDisplay";
import { useEditing } from "@/contexts/EditingContext";

interface Props { block: ProblemBlock; config: SiteConfig; onChange: (b: ProblemBlock) => void; }

/** Backward compat: old data had `icon: string` (emoji char) */
function resolveIcon(raw: IconValue | string | undefined): IconValue {
  if (!raw) return { kind: "emoji", value: "", size: 36 };
  if (typeof raw === "string") return { kind: "emoji", value: raw, size: 36 };
  return raw;
}

export default function ProblemBlockComponent({ block, config, onChange }: Props) {
  const isEditing = useEditing();
  const u = (patch: Partial<ProblemBlock>) => onChange({ ...block, ...patch });
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  function updateItem(idx: number, field: keyof typeof block.items[0], val: unknown) {
    const next = block.items.map((it, i) => i === idx ? { ...it, [field]: val } : it);
    u({ items: next });
  }

  return (
    <section className="py-24 px-8 relative overflow-hidden" style={{ backgroundColor: config.primaryColor }}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-block text-xs tracking-[0.3em] uppercase font-semibold px-4 py-1.5 rounded-full mb-4"
            style={{ backgroundColor: `${config.accentColor}25`, color: config.accentColor }}>
            <EditableText tag="span" value={block.eyebrow} onChange={(v) => u({ eyebrow: v })} />
          </span>
          <EditableText tag="h2" value={block.heading} onChange={(v) => u({ heading: v })} multiline
            className={`text-3xl lg:text-4xl font-black text-white leading-snug whitespace-pre-line mb-4 block ${fontClass}`} />
          <EditableText tag="p" value={block.subheading} onChange={(v) => u({ subheading: v })}
            className="text-sm text-white/50 block" />
        </div>

        {/* Pain point cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {block.items.map((item, i) => {
            const iconValue = resolveIcon(item.icon as IconValue | string | undefined);
            const hasIcon = iconValue.value !== "";

            return (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col gap-4">
                {/* ─── アイコンエリア ─── */}
                {hasIcon ? (
                  <div className="group/icon relative inline-flex self-start">
                    <IconDisplay
                      icon={iconValue}
                      onChange={(v) => updateItem(i, "icon", v)}
                      iconColor={config.primaryColor}
                    />
                    {/* 削除ボタン */}
                    {isEditing && (
                      <button
                        type="button"
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover/icon:opacity-100 transition-opacity flex items-center justify-center shadow z-10 text-[10px] leading-none"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          updateItem(i, "icon", { ...iconValue, value: "" });
                        }}
                        title="アイコンを削除"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ) : (
                  isEditing && (
                    <button
                      type="button"
                      className="w-10 h-10 rounded-xl flex items-center justify-center border border-dashed border-gray-200 text-gray-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors text-sm self-start"
                      onClick={() => updateItem(i, "icon", { kind: "emoji", value: "❗", size: 36 })}
                      title="アイコンを追加"
                    >
                      +
                    </button>
                  )
                )}

                <EditableText tag="h3" value={item.title} onChange={(v) => updateItem(i, "title", v)}
                  className={`text-base font-bold text-gray-900 block ${fontClass}`} />
                <EditableText tag="p" value={item.desc} onChange={(v) => updateItem(i, "desc", v)}
                  multiline className="text-sm text-gray-500 leading-relaxed block" />
              </div>
            );
          })}
        </div>

        {/* Arrow */}
        <div className="text-center mt-12">
          <div className="inline-flex flex-col items-center gap-1">
            <span className="text-xs text-white/40 tracking-widest uppercase">解決策があります</span>
            <span className="text-2xl" style={{ color: config.accentColor }}>↓</span>
          </div>
        </div>
      </div>
    </section>
  );
}
