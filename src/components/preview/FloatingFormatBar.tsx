"use client";

/**
 * FloatingFormatBar
 * テキスト要素フォーカス時に表示されるフローティングツールバー。
 * onMouseDown で preventDefault → EditableText のフォーカスを奪わない。
 */

import { Bold, Minus, Plus } from "lucide-react";

const COLOR_PRESETS = [
  "#111827", "#374151", "#6B7280", "#DC2626",
  "#EA580C", "#CA8A04", "#16A34A", "#2563EB",
  "#4F46E5", "#7C3AED", "#DB2777", "#ffffff",
];

export interface FormatStyle {
  fontSizePx: number;
  color: string;
  bold: boolean;
}

interface Props {
  style: FormatStyle;
  onChange: (patch: Partial<FormatStyle>) => void;
}

export default function FloatingFormatBar({ style, onChange }: Props) {
  return (
    <div
      className="
        absolute bottom-full left-0 mb-2 z-[9999]
        flex items-center gap-1.5
        bg-gray-900 text-white rounded-xl px-3 py-2 shadow-2xl
        border border-gray-700
        select-none
      "
      onMouseDown={(e) => e.preventDefault()}
    >
      {/* Bold */}
      <button
        onClick={() => onChange({ bold: !style.bold })}
        className={`
          w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm transition-colors
          ${style.bold ? "bg-indigo-500 text-white" : "text-gray-300 hover:bg-gray-700"}
        `}
        title="太字"
      >
        <Bold size={13} />
      </button>

      <div className="w-px h-5 bg-gray-700" />

      {/* Font size */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange({ fontSizePx: Math.max(10, style.fontSizePx - 2) })}
          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <Minus size={10} />
        </button>
        <input
          type="range"
          min={10}
          max={80}
          step={1}
          value={style.fontSizePx}
          onChange={(e) => onChange({ fontSizePx: Number(e.target.value) })}
          className="w-20 accent-indigo-400 cursor-pointer"
          title={`文字サイズ: ${style.fontSizePx}px`}
        />
        <button
          onClick={() => onChange({ fontSizePx: Math.min(80, style.fontSizePx + 2) })}
          className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors"
        >
          <Plus size={10} />
        </button>
        <span className="text-[11px] text-gray-400 font-mono w-8 text-right">{style.fontSizePx}px</span>
      </div>

      <div className="w-px h-5 bg-gray-700" />

      {/* Color presets */}
      <div className="flex items-center gap-1">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => onChange({ color: c })}
            className={`
              w-5 h-5 rounded-full border-2 transition-transform hover:scale-110
              ${style.color === c ? "border-white scale-110" : "border-transparent"}
            `}
            style={{ backgroundColor: c, boxShadow: c === "#ffffff" ? "inset 0 0 0 1px #9CA3AF" : undefined }}
            title={c}
          />
        ))}
        {/* Custom hex input */}
        <input
          type="color"
          value={style.color || "#111827"}
          onChange={(e) => onChange({ color: e.target.value })}
          className="w-5 h-5 rounded-full cursor-pointer border-0 p-0"
          title="カスタムカラー"
        />
      </div>
    </div>
  );
}
