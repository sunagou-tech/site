"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Plus, X, Type, ImageIcon, Code2, BarChart3,
  AlignLeft, AlignCenter, AlignRight, Minus,
} from "lucide-react";
import {
  FreeBlock, FreeElement, FreeTextElement, FreeImageElement,
  FreeHtmlElement, FreeChartElement, FreeSpacerElement, SiteConfig,
} from "@/types/site";
import { useEditing } from "@/contexts/EditingContext";
import { uid } from "@/types/site";
import EditableText from "../EditableText";
import FloatingFormatBar, { FormatStyle } from "../FloatingFormatBar";

const FreeBlockChart = dynamic(() => import("./FreeBlockChart"), { ssr: false });

interface Props {
  block: FreeBlock;
  config: SiteConfig;
  onChange: (b: FreeBlock) => void;
}

// ─── Element defaults ─────────────────────────────────────────────
function newTextElement(): FreeTextElement {
  return { id: uid(), kind: "text", tag: "p", content: "テキストを入力してください。", align: "left", fontSize: "text-base", fontWeight: "normal", color: "" };
}
function newImageElement(): FreeImageElement {
  return { id: uid(), kind: "image", url: "", alt: "", widthPct: 100, align: "center", rounded: true, shadow: true };
}
function newHtmlElement(): FreeHtmlElement {
  return { id: uid(), kind: "html", code: "<p>HTMLコードをここに貼り付けてください</p>" };
}
function newChartElement(): FreeChartElement {
  return {
    id: uid(), kind: "chart", chartType: "bar", title: "グラフタイトル", height: 300,
    data: [
      { name: "A", 値: 40 }, { name: "B", 値: 70 }, { name: "C", 値: 55 },
      { name: "D", 値: 90 }, { name: "E", 値: 65 },
    ],
    dataKeys: [{ key: "値", color: "#6366f1", label: "値" }],
  };
}
function newSpacerElement(): FreeSpacerElement {
  return { id: uid(), kind: "spacer", height: 48 };
}

// ─── Tag size map ─────────────────────────────────────────────────
const TAG_SIZE: Record<string, string> = {
  h2: "text-3xl", h3: "text-2xl", h4: "text-xl", lead: "text-lg", p: "text-base",
};
const FONT_WEIGHT_CLASS: Record<string, string> = {
  normal: "font-normal", medium: "font-medium", semibold: "font-semibold",
  bold: "font-bold", black: "font-black",
};

// ─── Single sortable element wrapper ─────────────────────────────
function SortableElement({
  element, onUpdate, onDelete, config, isEditing,
}: {
  element: FreeElement;
  onUpdate: (e: FreeElement) => void;
  onDelete: () => void;
  config: SiteConfig;
  isEditing: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: element.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative",
  };

  return (
    <div ref={setNodeRef} style={style} className="group/el">
      <div className="relative">
        {/* Drag handle */}
        {isEditing && (
          <div
            {...listeners}
            {...attributes}
            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/el:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-100 z-10"
            title="ドラッグで並び替え"
          >
            <GripVertical size={16} className="text-gray-400" />
          </div>
        )}

        {/* Delete button */}
        {isEditing && (
          <button
            onClick={onDelete}
            className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/el:opacity-100 transition-opacity hover:bg-red-600 shadow"
            title="削除"
          >
            <X size={10} />
          </button>
        )}

        {/* Element content */}
        <ElementRenderer element={element} onUpdate={onUpdate} config={config} isEditing={isEditing} />
      </div>
    </div>
  );
}

// ─── Element renderer ─────────────────────────────────────────────
function ElementRenderer({
  element, onUpdate, config, isEditing,
}: {
  element: FreeElement;
  onUpdate: (e: FreeElement) => void;
  config: SiteConfig;
  isEditing: boolean;
}) {
  if (element.kind === "text") return <TextElementRenderer el={element} onUpdate={(e) => onUpdate(e)} isEditing={isEditing} />;
  if (element.kind === "image") return <ImageElementRenderer el={element} onUpdate={(e) => onUpdate(e)} isEditing={isEditing} />;
  if (element.kind === "html") return <HtmlElementRenderer el={element} onUpdate={(e) => onUpdate(e)} isEditing={isEditing} />;
  if (element.kind === "chart") return (
    <FreeBlockChart
      element={element}
      isEditing={isEditing}
      onChange={(e) => onUpdate(e)}
    />
  );
  if (element.kind === "spacer") return <SpacerElementRenderer el={element} onUpdate={(e) => onUpdate(e)} isEditing={isEditing} />;
  return null;
}

// ─── Text element ─────────────────────────────────────────────────
function TextElementRenderer({ el, onUpdate, isEditing }: { el: FreeTextElement; onUpdate: (e: FreeTextElement) => void; isEditing: boolean }) {
  const u = useCallback((patch: Partial<FreeTextElement>) => onUpdate({ ...el, ...patch }), [el, onUpdate]);
  const [textFocused, setTextFocused] = useState(false);

  const alignClass = el.align === "center" ? "text-center" : el.align === "right" ? "text-right" : "text-left";
  const sizeClass = el.fontSizePx ? "" : (el.fontSize || TAG_SIZE[el.tag] || "text-base");
  const weightClass = FONT_WEIGHT_CLASS[el.fontWeight] || "font-normal";
  const colorStyle: React.CSSProperties = {
    ...(el.color ? { color: el.color } : {}),
    ...(el.fontSizePx ? { fontSize: el.fontSizePx + "px" } : {}),
  };
  const Tag = el.tag === "lead" ? "p" : el.tag;

  const formatStyle: FormatStyle = {
    fontSizePx: el.fontSizePx ?? 16,
    color: el.color || "#111827",
    bold: el.fontWeight === "bold" || el.fontWeight === "black",
  };

  function handleFormatChange(patch: Partial<FormatStyle>) {
    const next: Partial<FreeTextElement> = {};
    if (patch.fontSizePx !== undefined) next.fontSizePx = patch.fontSizePx;
    if (patch.color !== undefined) next.color = patch.color;
    if (patch.bold !== undefined) next.fontWeight = patch.bold ? "bold" : "normal";
    u(next);
  }

  return (
    <div className="space-y-2">
      {isEditing && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
          {/* Tag */}
          <select value={el.tag} onChange={(e) => u({ tag: e.target.value as FreeTextElement["tag"] })}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400">
            <option value="h2">見出し2</option>
            <option value="h3">見出し3</option>
            <option value="h4">見出し4</option>
            <option value="lead">リード</option>
            <option value="p">本文</option>
          </select>
          {/* Font size */}
          <select value={el.fontSize} onChange={(e) => u({ fontSize: e.target.value, fontSizePx: undefined })}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400">
            {["text-xs","text-sm","text-base","text-lg","text-xl","text-2xl","text-3xl","text-4xl","text-5xl"].map((s) => (
              <option key={s} value={s}>{s.replace("text-","")}</option>
            ))}
          </select>
          {/* Weight */}
          <select value={el.fontWeight} onChange={(e) => u({ fontWeight: e.target.value as FreeTextElement["fontWeight"] })}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400">
            <option value="normal">標準</option>
            <option value="medium">medium</option>
            <option value="semibold">semibold</option>
            <option value="bold">bold</option>
            <option value="black">black</option>
          </select>
          {/* Align */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {([["left", <AlignLeft key="l" size={12} />], ["center", <AlignCenter key="c" size={12} />], ["right", <AlignRight key="r" size={12} />]] as [string, React.ReactNode][]).map(([a, icon]) => (
              <button key={a} onClick={() => u({ align: a as FreeTextElement["align"] })}
                className={`px-2 py-1 transition-colors ${el.align === a ? "bg-indigo-100 text-indigo-600" : "hover:bg-gray-100 text-gray-500"}`}>
                {icon}
              </button>
            ))}
          </div>
          {/* Color */}
          <div className="flex items-center gap-1">
            <input type="color" value={el.color || "#111827"} onChange={(e) => u({ color: e.target.value })}
              className="w-7 h-7 rounded cursor-pointer border-0 p-0.5" title="文字色" />
            {el.color && (
              <button onClick={() => u({ color: "" })} className="text-[10px] text-gray-400 hover:text-gray-700">reset</button>
            )}
          </div>
        </div>
      )}
      {/* Floating format bar — テキスト編集中に表示 */}
      <div className="relative">
        {isEditing && textFocused && (
          <FloatingFormatBar style={formatStyle} onChange={handleFormatChange} />
        )}
        <EditableText
          tag={Tag as "h2" | "h3" | "h4" | "p"}
          value={el.content}
          onChange={(v) => u({ content: v })}
          multiline
          onFocusChange={setTextFocused}
          className={`block whitespace-pre-wrap leading-relaxed ${alignClass} ${sizeClass} ${weightClass}`}
          style={colorStyle}
        />
      </div>
    </div>
  );
}

// ─── Image element ────────────────────────────────────────────────
function ImageElementRenderer({ el, onUpdate, isEditing }: { el: FreeImageElement; onUpdate: (e: FreeImageElement) => void; isEditing: boolean }) {
  const u = (patch: Partial<FreeImageElement>) => onUpdate({ ...el, ...patch });
  const [urlInput, setUrlInput] = useState(el.url);
  const [showUrlInput, setShowUrlInput] = useState(!el.url);

  const alignClass = el.align === "center" ? "mx-auto" : el.align === "right" ? "ml-auto" : "mr-auto";
  const roundedClass = el.rounded ? "rounded-2xl" : "";
  const shadowClass = el.shadow ? "shadow-xl" : "";

  return (
    <div className="space-y-2">
      {isEditing && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 rounded-xl border border-gray-100">
          <select value={el.widthPct} onChange={(e) => u({ widthPct: Number(e.target.value) })}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400">
            {[25,33,50,67,75,100].map((w) => <option key={w} value={w}>{w}%</option>)}
          </select>
          {(["left","center","right"] as const).map((a) => (
            <button key={a} onClick={() => u({ align: a })}
              className={`text-xs px-2 py-1 rounded-lg border transition-colors ${el.align===a?"bg-indigo-100 border-indigo-300 text-indigo-600":"border-gray-200 text-gray-500 hover:bg-gray-100"}`}>
              {a === "left" ? "左" : a === "center" ? "中央" : "右"}
            </button>
          ))}
          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={el.rounded} onChange={(e) => u({ rounded: e.target.checked })} className="rounded" />
            角丸
          </label>
          <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer">
            <input type="checkbox" checked={el.shadow} onChange={(e) => u({ shadow: e.target.checked })} className="rounded" />
            影
          </label>
          <button onClick={() => setShowUrlInput((p) => !p)}
            className="text-xs px-2 py-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50">
            URL変更
          </button>
        </div>
      )}
      {isEditing && showUrlInput && (
        <div className="flex gap-2">
          <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          <button onClick={() => { u({ url: urlInput }); setShowUrlInput(false); }}
            className="text-xs px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700">
            セット
          </button>
        </div>
      )}
      {isEditing && (
        <div className="flex gap-1.5 items-center">
          <input type="text" value={el.alt} onChange={(e) => u({ alt: e.target.value })}
            placeholder="alt テキスト（SEO）"
            className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400" />
        </div>
      )}
      {el.url ? (
        <div className={`block ${alignClass}`} style={{ width: `${el.widthPct}%` }}>
          <img src={el.url} alt={el.alt}
            className={`w-full h-auto object-cover ${roundedClass} ${shadowClass}`} />
        </div>
      ) : (
        <div className={`block ${alignClass} flex items-center justify-center bg-gray-100 rounded-2xl border-2 border-dashed border-gray-300 text-gray-400 text-sm`}
          style={{ width: `${el.widthPct}%`, height: 160 }}>
          <div className="text-center">
            <ImageIcon size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs">URLを入力して画像を追加</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HTML element ─────────────────────────────────────────────────
function HtmlElementRenderer({ el, onUpdate, isEditing }: { el: FreeHtmlElement; onUpdate: (e: FreeHtmlElement) => void; isEditing: boolean }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-2">
      {isEditing && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
          <Code2 size={14} className="text-gray-400" />
          <span className="text-xs text-gray-500 flex-1">HTMLコード / 埋め込み</span>
          <button onClick={() => setEditing((p) => !p)}
            className="text-xs px-3 py-1 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50">
            {editing ? "プレビュー" : "編集"}
          </button>
        </div>
      )}
      {isEditing && editing ? (
        <textarea
          value={el.code}
          onChange={(e) => onUpdate({ ...el, code: e.target.value })}
          rows={8}
          className="w-full text-xs font-mono border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-900 text-green-400 resize-y"
          placeholder="<div>HTMLコードを入力...</div>"
          spellCheck={false}
        />
      ) : (
        <div
          className="free-html-content"
          dangerouslySetInnerHTML={{ __html: el.code }}
        />
      )}
    </div>
  );
}

// ─── Spacer element ───────────────────────────────────────────────
function SpacerElementRenderer({ el, onUpdate, isEditing }: { el: FreeSpacerElement; onUpdate: (e: FreeSpacerElement) => void; isEditing: boolean }) {
  return (
    <div className="relative" style={{ height: el.height }}>
      {isEditing && (
        <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl">
          <div className="flex items-center gap-2">
            <button onClick={() => onUpdate({ ...el, height: Math.max(8, el.height - 16) })}
              className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
              <Minus size={10} />
            </button>
            <span className="text-xs text-gray-400 font-mono select-none">{el.height}px</span>
            <button onClick={() => onUpdate({ ...el, height: Math.min(256, el.height + 16) })}
              className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center">
              <Plus size={10} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add element panel ────────────────────────────────────────────
function AddElementPanel({ onAdd }: { onAdd: (e: FreeElement) => void }) {
  const options: [string, string, React.ReactNode, () => FreeElement][] = [
    ["テキスト", "見出し・本文", <Type key="t" size={16} />, newTextElement],
    ["画像", "URLで追加", <ImageIcon key="i" size={16} />, newImageElement],
    ["HTML", "埋め込み", <Code2 key="c" size={16} />, newHtmlElement],
    ["グラフ", "Recharts", <BarChart3 key="b" size={16} />, newChartElement],
    ["余白", "スペーサー", <AlignCenter key="s" size={16} />, newSpacerElement],
  ];
  return (
    <div className="flex flex-wrap gap-2 justify-center py-4 border-t-2 border-dashed border-gray-200 mt-4">
      {options.map(([label, sub, icon, factory]) => (
        <button key={label} onClick={() => onAdd(factory())}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-xs font-medium">
          {icon}
          <span>{label}</span>
          <span className="text-gray-400 font-normal">{sub}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Main FreeBlock component ─────────────────────────────────────
export default function FreeBlockComponent({ block, config, onChange }: Props) {
  const isEditing = useEditing();
  const [showToolbar, setShowToolbar] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function updateElement(idx: number, updated: FreeElement) {
    const next = block.elements.map((el, i) => i === idx ? updated : el);
    onChange({ ...block, elements: next });
  }

  function deleteElement(idx: number) {
    onChange({ ...block, elements: block.elements.filter((_, i) => i !== idx) });
  }

  function addElement(el: FreeElement) {
    onChange({ ...block, elements: [...block.elements, el] });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = block.elements.findIndex((e) => e.id === active.id);
    const to = block.elements.findIndex((e) => e.id === over.id);
    if (from !== -1 && to !== -1) {
      onChange({ ...block, elements: arrayMove(block.elements, from, to) });
    }
  }

  const bgStyle: React.CSSProperties = block.background
    ? { backgroundColor: block.background }
    : { backgroundColor: "#ffffff" };

  return (
    <section className={`${block.paddingY} px-8`} style={bgStyle}>
      {/* Block toolbar (edit mode) */}
      {isEditing && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowToolbar((p) => !p)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors"
          >
            <span className="text-[10px]">⚙</span>
            <span className="max-w-[120px] truncate">{block.label}</span>
          </button>
          {showToolbar && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-white rounded-2xl border border-gray-200 shadow-lg">
              <input
                type="text" value={block.label}
                onChange={(e) => onChange({ ...block, label: e.target.value })}
                placeholder="ブロック名"
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-32 focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>背景:</span>
                <input type="color" value={block.background || "#ffffff"} onChange={(e) => onChange({ ...block, background: e.target.value })}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0.5" />
                {block.background && (
                  <button onClick={() => onChange({ ...block, background: "" })} className="text-[10px] text-gray-400 hover:text-gray-700">reset</button>
                )}
              </div>
              <select value={block.paddingY} onChange={(e) => onChange({ ...block, paddingY: e.target.value })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="py-8">余白 S（py-8）</option>
                <option value="py-16">余白 M（py-16）</option>
                <option value="py-24">余白 L（py-24）</option>
                <option value="py-28">余白 XL（py-28）</option>
                <option value="py-36">余白 2XL（py-36）</option>
              </select>
              <select value={block.maxWidth} onChange={(e) => onChange({ ...block, maxWidth: e.target.value })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                <option value="max-w-3xl">狭い（720px）</option>
                <option value="max-w-4xl">やや狭（896px）</option>
                <option value="max-w-5xl">標準（1024px）</option>
                <option value="max-w-6xl">広い（1152px）</option>
                <option value="max-w-full">全幅</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Elements */}
      <div className={`${block.maxWidth} mx-auto`}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={block.elements.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6 pl-8">
              {block.elements.map((element, idx) => (
                <SortableElement
                  key={element.id}
                  element={element}
                  onUpdate={(updated) => updateElement(idx, updated)}
                  onDelete={() => deleteElement(idx)}
                  config={config}
                  isEditing={isEditing}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add element button */}
        {isEditing && (
          <AddElementPanel onAdd={addElement} />
        )}
      </div>
    </section>
  );
}
