"use client";

import { FeaturesBlock, SiteConfig, IconValue } from "@/types/site";
import EditableText from "../EditableText";
import IconDisplay from "../IconDisplay";
import { useEditing } from "@/contexts/EditingContext";

interface Props {
  block: FeaturesBlock;
  config: SiteConfig;
  onChange: (b: FeaturesBlock) => void;
}

function patchItem(block: FeaturesBlock, idx: number, patch: Partial<FeaturesBlock["items"][0]>): FeaturesBlock {
  const next = [...block.items] as FeaturesBlock["items"];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, items: next };
}

/** Backward compat: old data had `emoji: string`, new data has `icon: IconValue` */
function resolveIcon(item: FeaturesBlock["items"][0]): IconValue {
  if (item.icon) return item.icon;
  const legacy = (item as unknown as { emoji?: string }).emoji;
  return { kind: "emoji", value: legacy ?? "", size: 28 };
}

export default function FeaturesBlockComponent({ block, config, onChange }: Props) {
  const isEditing = useEditing();
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-white py-28 px-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto text-center mb-14">
        <EditableText
          tag="p"
          value={block.subheading}
          onChange={(v) => onChange({ ...block, subheading: v })}
          className="text-xs text-gray-400 tracking-widest uppercase mb-2"
        />
        <EditableText
          tag="h2"
          value={block.heading}
          onChange={(v) => onChange({ ...block, heading: v })}
          className={`text-3xl font-bold text-gray-900 ${fontClass}`}
        />
        <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: config.accentColor }} />
      </div>

      {/* Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {block.items.map((item, idx) => {
          const iconValue = resolveIcon(item);
          const hasIcon = iconValue.value !== "";

          return (
            <div
              key={idx}
              className="group/card rounded-2xl p-6 border border-gray-100 hover:border-transparent hover:shadow-lg transition-all duration-300"
              style={{ backgroundColor: idx % 2 === 0 ? `${config.accentColor}08` : "white" }}
            >
              {/* ─── アイコンエリア ─── */}
              {hasIcon ? (
                <div className="group/icon relative inline-flex mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: `${config.accentColor}20` }}
                  >
                    <IconDisplay
                      icon={iconValue}
                      onChange={(v) => onChange(patchItem(block, idx, { icon: v }))}
                      iconColor={config.accentColor}
                    />
                  </div>
                  {/* 削除ボタン */}
                  {isEditing && (
                    <button
                      type="button"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white opacity-0 group-hover/icon:opacity-100 transition-opacity flex items-center justify-center shadow z-10 text-[10px] leading-none"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onChange(patchItem(block, idx, { icon: { ...iconValue, value: "" } }));
                      }}
                      title="アイコンを削除"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                /* アイコンなし時: 編集中のみ「＋」ボタン表示 */
                isEditing && (
                  <button
                    type="button"
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-dashed border-gray-200 text-gray-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors text-sm"
                    onClick={() => onChange(patchItem(block, idx, { icon: { kind: "emoji", value: "✨", size: 28 } }))}
                    title="アイコンを追加"
                  >
                    +
                  </button>
                )
              )}

              <EditableText
                tag="h3"
                value={item.title}
                onChange={(v) => onChange(patchItem(block, idx, { title: v }))}
                className={`text-base font-bold text-gray-900 mb-2 block ${fontClass}`}
              />
              <EditableText
                tag="p"
                value={item.desc}
                onChange={(v) => onChange(patchItem(block, idx, { desc: v }))}
                multiline
                className="text-xs text-gray-500 leading-relaxed block"
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
