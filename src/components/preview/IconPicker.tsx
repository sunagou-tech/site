"use client";

import { useState, useRef, useEffect } from "react";
import { IconValue } from "@/types/site";
import { ICON_REGISTRY, ICON_CATEGORIES } from "./iconRegistry";

type Tab = "emoji" | "lucide" | "image";

const EMOJIS: Record<string, string[]> = {
  ビジネス: ["💼","📊","📈","📉","💡","🎯","🚀","🔑","🏆","⭐","💎","🌟","✅","🛡️","🤝","🔧","⚙️","🏅","🎁","📌","🔔","💬","📧","📞","🌐","💰","🎓","📋"],
  "顔・身体": ["😊","😄","🤩","😎","💪","👍","🙌","👋","🤔","😀","🫱","✌️","🧠","👁️","🙏"],
  "自然・物": ["🌱","🌿","🔥","❄️","☀️","🌊","💻","📱","🖥️","📝","🎨","✏️","🏠","🌺","🌸","🍀","🌙"],
  記号: ["⚡","🔗","♾️","✨","🎉","🗺️","📍","🔍","🎵","✈️","🚗","🏋️","⭕","❌","💯","🔺"],
};

interface Props {
  current: IconValue;
  onChange: (icon: IconValue) => void;
  onClose: () => void;
}

export default function IconPicker({ current, onChange, onClose }: Props) {
  const [tab, setTab] = useState<Tab>(current.kind === "lucide" ? "lucide" : current.kind === "image" ? "image" : "emoji");
  const [search, setSearch] = useState("");
  const [imageUrl, setImageUrl] = useState(current.kind === "image" ? current.value : "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    // Defer so the opening click doesn't immediately close
    const id = setTimeout(() => document.addEventListener("mousedown", handler), 0);
    return () => {
      clearTimeout(id);
      document.removeEventListener("mousedown", handler);
    };
  }, [onClose]);

  const allIconNames = Object.keys(ICON_REGISTRY);
  const filteredIcons = search.trim()
    ? allIconNames.filter((n) => n.toLowerCase().includes(search.toLowerCase()))
    : null;

  const tabs: [Tab, string][] = [["emoji", "絵文字"], ["lucide", "アイコン"], ["image", "画像"]];

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 z-[200] mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
      style={{ maxHeight: 400 }}
    >
      {/* Tab bar */}
      <div className="flex border-b border-gray-100 flex-shrink-0">
        {tabs.map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              tab === t
                ? "text-blue-600 border-b-2 border-blue-500 bg-blue-50/60"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── 絵文字タブ ── */}
      {tab === "emoji" && (
        <div className="overflow-y-auto" style={{ maxHeight: 345 }}>
          {Object.entries(EMOJIS).map(([cat, emojis]) => (
            <div key={cat} className="px-3 pt-3 pb-1">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat}</p>
              <div className="flex flex-wrap gap-0.5">
                {emojis.map((e) => (
                  <button
                    key={e}
                    onClick={() => onChange({ kind: "emoji", value: e, size: current.size ?? 32 })}
                    className={`w-9 h-9 text-xl flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors ${
                      current.kind === "emoji" && current.value === e
                        ? "bg-blue-100 ring-2 ring-blue-400"
                        : ""
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Lucideアイコンタブ ── */}
      {tab === "lucide" && (
        <div className="flex flex-col" style={{ maxHeight: 345 }}>
          <div className="p-2.5 border-b border-gray-100 flex-shrink-0">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="アイコンを検索…"
              autoFocus
              className="w-full px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filteredIcons ? (
              <div className="p-3 grid grid-cols-6 gap-0.5">
                {filteredIcons.map((name) => {
                  const Icon = ICON_REGISTRY[name];
                  return (
                    <button
                      key={name}
                      onClick={() => onChange({ kind: "lucide", value: name, size: current.size ?? 28 })}
                      title={name}
                      className={`aspect-square flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors ${
                        current.kind === "lucide" && current.value === name
                          ? "bg-blue-100 ring-2 ring-blue-400"
                          : ""
                      }`}
                    >
                      <Icon size={18} strokeWidth={1.5} />
                    </button>
                  );
                })}
                {filteredIcons.length === 0 && (
                  <p className="col-span-6 text-xs text-gray-400 text-center py-4">見つかりません</p>
                )}
              </div>
            ) : (
              ICON_CATEGORIES.map((cat) => (
                <div key={cat.label} className="px-3 pt-3 pb-1">
                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{cat.label}</p>
                  <div className="grid grid-cols-6 gap-0.5">
                    {cat.icons.map((name) => {
                      const Icon = ICON_REGISTRY[name];
                      if (!Icon) return null;
                      return (
                        <button
                          key={name}
                          onClick={() => onChange({ kind: "lucide", value: name, size: current.size ?? 28 })}
                          title={name}
                          className={`aspect-square flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors ${
                            current.kind === "lucide" && current.value === name
                              ? "bg-blue-100 ring-2 ring-blue-400"
                              : ""
                          }`}
                        >
                          <Icon size={18} strokeWidth={1.5} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── 画像タブ ── */}
      {tab === "image" && (
        <div className="p-4 space-y-3" style={{ maxHeight: 345, overflowY: "auto" }}>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">画像URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              autoFocus
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {imageUrl && (
            <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
              <img src={imageUrl} alt="preview" className="max-w-full max-h-24 object-contain" />
            </div>
          )}
          <p className="text-[10px] text-gray-400 leading-relaxed">
            ※ セット後、右端のドラッグハンドルで幅を調整できます
          </p>
          <button
            onClick={() => imageUrl && onChange({ kind: "image", value: imageUrl, size: current.size ?? 48 })}
            disabled={!imageUrl}
            className="w-full py-2 text-xs font-bold text-white rounded-xl transition-opacity disabled:opacity-40 hover:opacity-90"
            style={{ backgroundColor: "#2563EB" }}
          >
            この画像を使用
          </button>
        </div>
      )}
    </div>
  );
}
