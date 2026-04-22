"use client";

import { SiteConfig, SectionBlock, BLOCK_META, BlockStyle, FooterBlock } from "@/types/site";
import NavBar from "./NavBar";
import BlockRenderer from "./blocks/BlockRenderer";
import StickyContactBar from "./StickyContactBar";
import FooterNavRenderer from "./FooterNavRenderer";
import {
  Plus, GripVertical, Trash2,
  ChevronUp, ChevronDown, Palette, X, ImageIcon,
} from "lucide-react";

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
import { useState, useCallback, memo, useRef, useMemo } from "react";
import GlobalFormatBar from "./GlobalFormatBar";
import GlobalStyleInjector from "./GlobalStyleInjector";

interface Props {
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
  onInsertRequest: (position: number) => void;
  lockedBlockIds?: string[];  // 後方互換のために残す（未使用）
  headerHtml?: string;        // ホームのHTMLヘッダー（指定時はNavBarの代わりに表示）
  footerHtml?: string;        // 後方互換のために残す（未使用）
  globalFooter?: FooterBlock; // グローバルフッター（全ページ共通）
  onGlobalFooterChange?: (footer: FooterBlock) => void;
}

function blockLabel(block: SectionBlock) {
  return BLOCK_META.find((m) => m.type === block.type)?.label ?? block.type;
}

// ─── ＋挿入ボタン ─────────────────────────────────────────────
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

// ─── 背景パネル ────────────────────────────────────────────────
function BgPanel({
  style,
  onChange,
  onClose,
}: {
  style: BlockStyle;
  onChange: (s: BlockStyle) => void;
  onClose: () => void;
}) {
  const [imgInput, setImgInput] = useState(style.bgImage ?? "");

  return (
    <div
      className="absolute top-full left-0 mt-1 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-72"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-700">セクション背景</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
          <X size={14} />
        </button>
      </div>

      {/* 背景色 */}
      <div className="mb-4">
        <label className="block text-[11px] text-gray-500 mb-1.5">背景色</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={style.bgColor || "#ffffff"}
            onChange={(e) => onChange({ ...style, bgColor: e.target.value })}
            className="w-9 h-9 rounded-lg cursor-pointer border border-gray-200 p-0.5"
          />
          <div className="flex flex-wrap gap-1">
            {["#ffffff", "#f8f9fa", "#f1f5f9", "#1a1a2e", "#111827", "#0f172a", "#fefce8", "#f0fdf4"].map((c) => (
              <button
                key={c}
                onClick={() => onChange({ ...style, bgColor: c })}
                className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform ${style.bgColor === c ? "border-indigo-500" : "border-gray-200"}`}
                style={{ backgroundColor: c, boxShadow: c === "#ffffff" ? "inset 0 0 0 1px #d1d5db" : undefined }}
                title={c}
              />
            ))}
          </div>
          {style.bgColor && (
            <button
              onClick={() => onChange({ ...style, bgColor: undefined })}
              className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
            >
              reset
            </button>
          )}
        </div>
      </div>

      {/* 背景画像 */}
      <div className="mb-3">
        <label className="block text-[11px] text-gray-500 mb-1.5">背景画像 URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={imgInput}
            onChange={(e) => setImgInput(e.target.value)}
            placeholder="https://..."
            className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button
            onClick={() => onChange({ ...style, bgImage: imgInput || undefined })}
            className="text-xs px-3 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700"
          >
            セット
          </button>
        </div>
        {style.bgImage && (
          <div className="mt-2 flex items-center gap-2">
            <img src={style.bgImage} alt="" className="w-16 h-10 object-cover rounded-lg border border-gray-200" />
            <button
              onClick={() => { onChange({ ...style, bgImage: undefined }); setImgInput(""); }}
              className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-0.5"
            >
              <X size={10} /> 削除
            </button>
          </div>
        )}
      </div>

      {/* 表示サイズ */}
      {style.bgImage && (
        <div>
          <label className="block text-[11px] text-gray-500 mb-1.5">表示サイズ</label>
          <div className="flex gap-1.5">
            {(["cover", "contain", "auto"] as const).map((s) => (
              <button
                key={s}
                onClick={() => onChange({ ...style, bgSize: s })}
                className={`text-xs px-3 py-1 rounded-lg border transition-colors ${(style.bgSize ?? "cover") === s ? "bg-indigo-100 border-indigo-400 text-indigo-700" : "border-gray-200 text-gray-500 hover:bg-gray-50"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ドラッグ可能なブロックラッパー ──────────────────────────
const SortableBlock = memo(function SortableBlock({
  block,
  index,
  total,
  config,
  onChangeBlock,
  onDelete,
  onMove,
  onBgChange,
}: {
  block: SectionBlock;
  index: number;
  total: number;
  config: SiteConfig;
  onChangeBlock: (b: SectionBlock) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onBgChange: (style: BlockStyle | null) => void;
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

  const [showBgPanel, setShowBgPanel] = useState(false);
  const blockStyle = config.blockStyles?.[block.id] ?? {};

  // inline styleで背景を直接ラッパーに適用（CSS変数より確実）
  const hasBg = !!(blockStyle.bgColor || blockStyle.bgImage);
  const bgInlineStyle: React.CSSProperties = hasBg ? {
    backgroundColor: blockStyle.bgColor ?? "transparent",
    ...(blockStyle.bgImage ? {
      backgroundImage: `url(${blockStyle.bgImage})`,
      backgroundSize: blockStyle.bgSize ?? "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    } : {}),
  } : {};

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
      {/* 常時表示: ブロック左端のインジケーター */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-300 opacity-0 group-hover/block:opacity-100 transition-opacity z-20" />

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

        {/* 右：背景 + 並び替え + 削除 */}
        <div className="relative flex items-center gap-1">
          {/* 背景ボタン */}
          <button
            onClick={() => setShowBgPanel((p) => !p)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors ${showBgPanel || hasBg ? "bg-white/20 text-white" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
            title="背景色・背景画像"
          >
            {hasBg ? <ImageIcon size={11} /> : <Palette size={11} />}
            <span>背景</span>
            {hasBg && <span className="w-2 h-2 rounded-full border border-white/40" style={{ backgroundColor: blockStyle.bgColor }} />}
          </button>

          <div className="w-px h-4 bg-white/20" />

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

          {/* 背景パネル */}
          {showBgPanel && (
            <BgPanel
              style={blockStyle}
              onChange={(s) => {
                onBgChange(s.bgColor || s.bgImage ? s : null);
              }}
              onClose={() => setShowBgPanel(false)}
            />
          )}
        </div>
      </div>

      {/* ブロック本体 + 背景オーバーライドラッパー */}
      <div
        className="blk-bg-ov"
        data-bg={hasBg ? "1" : undefined}
        style={bgInlineStyle}
      >
        <BlockRenderer block={block} config={config} onChange={onChangeBlock} />
      </div>
    </div>
  );
});

// ─── メイン ──────────────────────────────────────────────────
export default function SitePreview({ config, onConfigChange, onInsertRequest, lockedBlockIds, headerHtml, footerHtml, globalFooter, onGlobalFooterChange }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // 編集可能ブロック（footerタイプは除外）
  const lockedSet = useMemo(() => new Set(lockedBlockIds ?? []), [lockedBlockIds]);
  const editableSections = useMemo(() => config.sections.filter(b => !lockedSet.has(b.id) && b.type !== "footer"), [config.sections, lockedSet]);
  const lockedSections = useMemo(() => config.sections.filter(b => lockedSet.has(b.id)), [config.sections, lockedSet]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const updateBlock = useCallback((id: string, newBlock: SectionBlock) => {
    onConfigChange({
      ...config,
      sections: config.sections.map((b) => (b.id === id ? newBlock : b)),
    });
  }, [config, onConfigChange]);

  const deleteBlock = useCallback((id: string) => {
    onConfigChange({ ...config, sections: config.sections.filter((b) => b.id !== id) });
  }, [config, onConfigChange]);

  const moveBlock = useCallback((idx: number, dir: -1 | 1) => {
    const next = [...editableSections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onConfigChange({ ...config, sections: [...next, ...lockedSections] });
  }, [config, editableSections, lockedSections, onConfigChange]);

  const updateBlockStyle = useCallback((id: string, style: BlockStyle | null) => {
    const next = { ...(config.blockStyles ?? {}) };
    if (style) {
      next[id] = style;
    } else {
      delete next[id];
    }
    onConfigChange({ ...config, blockStyles: next });
  }, [config, onConfigChange]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIdx = editableSections.findIndex((b) => b.id === active.id);
    const newIdx = editableSections.findIndex((b) => b.id === over.id);
    onConfigChange({ ...config, sections: [...arrayMove(editableSections, oldIdx, newIdx), ...lockedSections] });
  }

  const activeBlock = activeId ? editableSections.find((b) => b.id === activeId) : null;

  return (
    <div className="flex-1 bg-white overflow-y-auto" style={{ scrollbarGutter: "stable" }}>
      <GlobalFormatBar />

      {/* 編集ガイドバー — HTML mode と同一インラインスタイルで高さを揃える */}
      <div style={{ position: "sticky", top: 0, zIndex: 40, background: "#4F46E5", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, overflow: "hidden" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        <span style={{ color: "white", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>編集モード</span>
        <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", minWidth: 0 }}>テキストをクリックして編集　テキストを選択してフォーマット（太字・色・サイズ）　ブロックをホバーして移動・削除・背景変更</span>
      </div>

      {/* サイト本体 — transform: translateZ(0) で position:fixed 要素をこのコンテナに封じ込める */}
      <div className="gs-root bg-white overflow-hidden" style={{ transform: "translateZ(0)" }}>
        <GlobalStyleInjector style={config.globalStyle} />
        {editableSections.length === 0 && !globalFooter && (
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

        {headerHtml
          ? <div dangerouslySetInnerHTML={{ __html: headerHtml }} />
          : <NavBar config={config} onConfigChange={onConfigChange} />
        }

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={editableSections.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {editableSections.length > 0 && (
              <InsertButton onClick={() => onInsertRequest(0)} />
            )}

            {editableSections.map((block, idx) => (
              <div key={block.id}>
                <SortableBlock
                  block={block}
                  index={idx}
                  total={editableSections.length}
                  config={config}
                  onChangeBlock={(nb) => updateBlock(block.id, nb)}
                  onDelete={() => deleteBlock(block.id)}
                  onMove={(dir) => moveBlock(idx, dir)}
                  onBgChange={(s) => updateBlockStyle(block.id, s)}
                />
                <InsertButton onClick={() => onInsertRequest(idx + 1)} />
              </div>
            ))}

            {editableSections.length === 0 && globalFooter && (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
                <p className="text-xs">ブロックがありません</p>
                <button
                  onClick={() => onInsertRequest(0)}
                  className="flex items-center gap-1.5 text-xs border border-dashed border-indigo-300 text-indigo-400 px-4 py-2 rounded-full hover:border-indigo-400"
                >
                  <Plus size={12} /> ブロックを追加
                </button>
              </div>
            )}
          </SortableContext>

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

        {/* 共通フッター: footerNavConfig優先 > footerHtml > globalFooter */}
        {config.footerNavConfig ? (
          <FooterNavRenderer config={config.footerNavConfig} />
        ) : footerHtml === "" ? null
         : footerHtml ? (
          <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
        ) : globalFooter ? (
          <BlockRenderer block={globalFooter} config={config} onChange={(nb) => onGlobalFooterChange?.(nb as FooterBlock)} />
        ) : null}

        <StickyContactBar primaryColor={config.primaryColor} />
      </div>
    </div>
  );
}
