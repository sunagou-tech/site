"use client";

import { SiteConfig, FontFamily, SectionBlock, BLOCK_META } from "@/types/site";
import {
  Type, Palette, LayoutTemplate, ChevronUp, ChevronDown, Trash2, GripVertical,
} from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  config: SiteConfig;
  onChange: (config: SiteConfig) => void;
  onInsertRequest: (position: number) => void;
}

const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
  { value: "sans",  label: "ゴシック体 (Sans-serif)" },
  { value: "serif", label: "明朝体 (Serif)" },
  { value: "mono",  label: "等幅 (Monospace)" },
];

const PRIMARY_COLORS = [
  { label: "ネイビー",    value: "#1a1a2e" },
  { label: "インディゴ", value: "#4f46e5" },
  { label: "スレート",   value: "#334155" },
  { label: "グリーン",   value: "#15803d" },
  { label: "レッド",     value: "#dc2626" },
  { label: "ブラック",   value: "#111111" },
];

const ACCENT_COLORS = ["#F5C842", "#fb923c", "#34d399", "#60a5fa", "#f472b6", "#a78bfa"];

// ─── サイドバー用ソータブルアイテム ──────────────────────────
function SortableItem({
  block, idx, total, label,
  onMove, onDelete,
}: {
  block: SectionBlock; idx: number; total: number; label: string;
  onMove: (dir: -1 | 1) => void; onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-2 group/row hover:bg-gray-100 transition-colors"
    >
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 flex-shrink-0"
      >
        <GripVertical size={14} />
      </button>
      <span className="flex-1 text-xs text-gray-700 truncate">{label}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
        <button onClick={() => onMove(-1)} disabled={idx === 0}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronUp size={12} /></button>
        <button onClick={() => onMove(1)} disabled={idx === total - 1}
          className="p-1 rounded hover:bg-gray-200 disabled:opacity-30"><ChevronDown size={12} /></button>
        <button onClick={onDelete}
          className="p-1 rounded hover:bg-red-100 text-red-400"><Trash2 size={12} /></button>
      </div>
    </li>
  );
}

// ─────────────────────────────────────────────────────────────
export default function Sidebar({ config, onChange, onInsertRequest }: Props) {
  const u = (patch: Partial<SiteConfig>) => onChange({ ...config, ...patch });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = config.sections.findIndex((b) => b.id === active.id);
    const newIdx = config.sections.findIndex((b) => b.id === over.id);
    u({ sections: arrayMove(config.sections, oldIdx, newIdx) });
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    const next = [...config.sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    u({ sections: next });
  }

  function deleteBlock(id: string) {
    u({ sections: config.sections.filter((b) => b.id !== id) });
  }

  function getBlockLabel(block: SectionBlock) {
    return BLOCK_META.find((m) => m.type === block.type)?.label ?? block.type;
  }

  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto shrink-0">
      <div className="px-5 py-4 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-700 tracking-widest uppercase">外観・構成設定</h2>
      </div>

      <div className="flex-1 px-5 py-5 space-y-7">

        {/* サイト情報 */}
        <section>
          <SectionLabel icon={<Type size={14} />} label="サイト情報" />
          <div className="mt-3 space-y-3">
            <Field label="サイトタイトル">
              <input type="text" value={config.title} onChange={(e) => u({ title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="マーキーテキスト">
              <input type="text" value={config.catchCopy} onChange={(e) => u({ catchCopy: e.target.value })} className={inputCls} />
            </Field>
          </div>
        </section>

        {/* メインカラー */}
        <section>
          <SectionLabel icon={<Palette size={14} />} label="メインカラー" />
          <div className="mt-3 flex flex-wrap gap-2 mb-3">
            {PRIMARY_COLORS.map(({ value, label }) => (
              <button key={value} onClick={() => u({ primaryColor: value })} title={label}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: value, outline: config.primaryColor === value ? "2px solid #6366f1" : "none", outlineOffset: 2 }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={config.primaryColor} onChange={(e) => u({ primaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
            <span className="text-xs text-gray-400 font-mono">{config.primaryColor}</span>
          </div>
        </section>

        {/* アクセントカラー */}
        <section>
          <SectionLabel icon={<Palette size={14} />} label="アクセントカラー" />
          <div className="mt-3 flex flex-wrap gap-2 mb-3">
            {ACCENT_COLORS.map((color) => (
              <button key={color} onClick={() => u({ accentColor: color })}
                className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: color, outline: config.accentColor === color ? "2px solid #6366f1" : "none", outlineOffset: 2 }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={config.accentColor} onChange={(e) => u({ accentColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
            <span className="text-xs text-gray-400 font-mono">{config.accentColor}</span>
          </div>
        </section>

        {/* フォント */}
        <section>
          <SectionLabel icon={<Type size={14} />} label="フォント" />
          <div className="mt-3 space-y-2">
            {FONT_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="font" value={opt.value} checked={config.fontFamily === opt.value}
                  onChange={() => u({ fontFamily: opt.value })} className="accent-indigo-500" />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </section>

        {/* ページ構成（ブロックリスト） */}
        <section>
          <SectionLabel icon={<LayoutTemplate size={14} />} label="ページ構成" />
          <p className="text-[10px] text-gray-400 mt-1 mb-3">ドラッグまたは↑↓で並び替え。プレビューの「＋」からブロック追加。</p>

          {config.sections.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
              ブロックがありません
            </p>
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={config.sections.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-1.5">
                {config.sections.map((block, idx) => (
                  <SortableItem
                    key={block.id}
                    block={block}
                    idx={idx}
                    total={config.sections.length}
                    label={getBlockLabel(block)}
                    onMove={(dir) => moveBlock(idx, dir)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        </section>

      </div>
    </aside>
  );
}

// ─── ヘルパーコンポーネント ────────────────────────────────────

const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}
