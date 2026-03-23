"use client";

import { SiteConfig, SectionBlock, BLOCK_META } from "@/types/site";
import NavBar from "./NavBar";
import BlockRenderer from "./blocks/BlockRenderer";
import ScrollReveal from "./ScrollReveal";
import { Plus, MousePointerClick, GripVertical, Trash2, ChevronUp, ChevronDown } from "lucide-react";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface Props {
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
  onInsertRequest: (position: number) => void;
}

// ─── ブロックラベルを取得 ──────────────────────────────────────
function blockLabel(block: SectionBlock) {
  return BLOCK_META.find((m) => m.type === block.type)?.label ?? block.type;
}

// ─── ＋挿入ボタン ────────────────────────────────────────────
function InsertButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="relative flex items-center justify-center h-8 group/ins">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-indigo-300 opacity-0 group-hover/ins:opacity-100 transition-opacity" />
      <button
        onClick={onClick}
        className="
          relative z-10 flex items-center gap-1.5 text-[11px] font-medium
          bg-white border border-dashed border-gray-300 text-gray-400
          px-3 py-1 rounded-full shadow-sm
          hover:border-indigo-400 hover:text-indigo-500 hover:shadow
          opacity-0 group-hover/ins:opacity-100
          transition-all duration-150
        "
      >
        <Plus size={10} /> ブロックを追加
      </button>
    </div>
  );
}

// ─── ドラッグ可能なブロックラッパー ──────────────────────────
function SortableBlock({
  block,
  index,
  total,
  config,
  onChangeBlock,
  onDelete,
  onMove,
}: {
  block: SectionBlock;
  index: number;
  total: number;
  config: SiteConfig;
  onChangeBlock: (b: SectionBlock) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
        zIndex: isDragging ? 50 : "auto",
      }}
      className="relative group/block"
    >
      {/* ホバーツールバー */}
      <div
        className="
          absolute top-0 inset-x-0 z-30
          flex items-center justify-between
          px-3 py-1.5 gap-2
          bg-indigo-600 text-white text-xs
          opacity-0 group-hover/block:opacity-100
          transition-opacity duration-150
          pointer-events-none group-hover/block:pointer-events-auto
        "
      >
        {/* 左：ドラッグハンドル + ラベル */}
        <div className="flex items-center gap-2">
          <button
            ref={setActivatorNodeRef}
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing text-white/70 hover:text-white p-0.5 rounded"
            title="ドラッグして並び替え"
          >
            <GripVertical size={14} />
          </button>
          <span className="font-medium text-white/80 text-[11px]">{blockLabel(block)}</span>
        </div>

        {/* 右：並び替えボタン + 削除 */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1 rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
            title="上に移動"
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-1 rounded hover:bg-white/20 disabled:opacity-30 transition-colors"
            title="下に移動"
          >
            <ChevronDown size={12} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded hover:bg-red-500 transition-colors ml-1"
            title="削除"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* ブロック本体 */}
      <ScrollReveal>
        <BlockRenderer block={block} config={config} onChange={onChangeBlock} />
      </ScrollReveal>
    </div>
  );
}

// ─── メイン ──────────────────────────────────────────────────
export default function SitePreview({ config, onConfigChange, onInsertRequest }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  function updateBlock(id: string, newBlock: SectionBlock) {
    onConfigChange({
      ...config,
      sections: config.sections.map((b) => (b.id === id ? newBlock : b)),
    });
  }

  function deleteBlock(id: string) {
    onConfigChange({ ...config, sections: config.sections.filter((b) => b.id !== id) });
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    const next = [...config.sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onConfigChange({ ...config, sections: next });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = config.sections.findIndex((b) => b.id === active.id);
    const newIdx = config.sections.findIndex((b) => b.id === over.id);
    onConfigChange({ ...config, sections: arrayMove(config.sections, oldIdx, newIdx) });
  }

  const activeBlock = activeId ? config.sections.find((b) => b.id === activeId) : null;

  return (
    <div className="flex-1 bg-gray-200 overflow-y-auto">
      {/* ブラウザChrome */}
      <div className="sticky top-0 z-30 bg-gray-300 border-b border-gray-400 px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-3 bg-white rounded px-3 py-1 text-xs text-gray-400 font-mono">
          https://my-site.example.com
        </div>
        <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-white/60 px-2 py-1 rounded">
          <MousePointerClick size={10} />
          ホバーでブロックツールバー · テキストをクリックして編集
        </div>
      </div>

      {/* サイト本体 */}
      <div className="mx-4 my-4 bg-white shadow-xl rounded-b-lg overflow-hidden">
        {config.sections.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
            <p className="text-sm">ブロックがありません</p>
            <button
              onClick={() => onInsertRequest(0)}
              className="flex items-center gap-1.5 text-xs border border-dashed border-indigo-300 text-indigo-400 px-4 py-2 rounded-full hover:border-indigo-400"
            >
              <Plus size={12} /> 最初のブロックを追加
            </button>
          </div>
        )}

        <NavBar config={config} onConfigChange={onConfigChange} />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={config.sections.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {config.sections.length > 0 && (
              <InsertButton onClick={() => onInsertRequest(0)} />
            )}

            {config.sections.map((block, idx) => (
              <div key={block.id}>
                <SortableBlock
                  block={block}
                  index={idx}
                  total={config.sections.length}
                  config={config}
                  onChangeBlock={(nb) => updateBlock(block.id, nb)}
                  onDelete={() => deleteBlock(block.id)}
                  onMove={(dir) => moveBlock(idx, dir)}
                />
                <InsertButton onClick={() => onInsertRequest(idx + 1)} />
              </div>
            ))}
          </SortableContext>

          {/* ドラッグ中のゴースト */}
          <DragOverlay>
            {activeBlock && (
              <div className="opacity-90 shadow-2xl ring-2 ring-indigo-500 rounded pointer-events-none bg-white">
                <div className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium flex items-center gap-2">
                  <GripVertical size={12} />
                  {blockLabel(activeBlock)}
                </div>
                <div className="h-20 bg-gray-50 flex items-center justify-center text-xs text-gray-400">
                  移動中…
                </div>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}
