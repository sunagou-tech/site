"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";
import { ArticleBlock, blocksToHtml } from "@/types/site";

function uid() { return Math.random().toString(36).slice(2, 9); }

// ── ブロック型定義 ────────────────────────────────────────────
const BLOCK_MENU = [
  { key: "paragraph",        icon: "¶",  label: "段落",          desc: "通常のテキスト" },
  { key: "heading-2",        icon: "H2", label: "見出し 2",      desc: "大見出し" },
  { key: "heading-3",        icon: "H3", label: "見出し 3",      desc: "中見出し" },
  { key: "image",            icon: "🖼",  label: "画像",          desc: "画像を挿入" },
  { key: "list",             icon: "•",  label: "リスト",        desc: "箇条書き" },
  { key: "list-ordered",     icon: "1.", label: "番号リスト",    desc: "番号付きリスト" },
  { key: "quote",            icon: "❝",  label: "引用",          desc: "引用文" },
  { key: "divider",          icon: "—",  label: "区切り線",      desc: "水平線で区切る" },
  { key: "callout-info",     icon: "💡",  label: "吹き出し（情報）", desc: "注目ボックス" },
  { key: "callout-warn",     icon: "⚠️",  label: "吹き出し（注意）", desc: "警告ボックス" },
  { key: "callout-tip",      icon: "✅",  label: "吹き出し（ヒント）", desc: "ヒントボックス" },
  { key: "balloon-left",     icon: "💬",  label: "ふきだし（左）",  desc: "アバター＋会話バブル" },
  { key: "balloon-right",    icon: "🗨",  label: "ふきだし（右）",  desc: "右向きふきだし" },
  { key: "linkcard",         icon: "🔗",  label: "内部リンクカード", desc: "記事カードを自動生成" },
];

function createBlock(key: string): ArticleBlock {
  const id = uid();
  if (key === "paragraph")    return { id, type: "paragraph", html: "" };
  if (key === "heading-2")    return { id, type: "heading", level: 2, text: "" };
  if (key === "heading-3")    return { id, type: "heading", level: 3, text: "" };
  if (key === "image")        return { id, type: "image", url: "", alt: "", caption: "" };
  if (key === "list")         return { id, type: "list", ordered: false, items: [""] };
  if (key === "list-ordered") return { id, type: "list", ordered: true, items: [""] };
  if (key === "quote")        return { id, type: "quote", text: "", cite: "" };
  if (key === "divider")      return { id, type: "divider" };
  if (key === "callout-info")  return { id, type: "callout", variant: "info", text: "" };
  if (key === "callout-warn")  return { id, type: "callout", variant: "warn", text: "" };
  if (key === "callout-tip")   return { id, type: "callout", variant: "tip", text: "" };
  if (key === "balloon-left")  return { id, type: "balloon", imageUrl: "", name: "", text: "", direction: "left" };
  if (key === "balloon-right") return { id, type: "balloon", imageUrl: "", name: "", text: "", direction: "right" };
  if (key === "linkcard")      return { id, type: "linkcard", slug: "", title: "", imageUrl: "", label: "あわせて読みたい" };
  return { id, type: "paragraph", html: "" };
}

// ── ブロックピッカー ──────────────────────────────────────────
function BlockPicker({ onSelect, onClose, filter }: { onSelect: (key: string) => void; onClose: () => void; filter?: string }) {
  const items = filter
    ? BLOCK_MENU.filter(m => m.label.includes(filter) || m.key.includes(filter))
    : BLOCK_MENU;

  return (
    <div style={{ position: "absolute", zIndex: 100, background: "#fff", borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.15)", border: "1px solid #E5E7EB", padding: 8, width: 260 }}
      onMouseDown={e => e.preventDefault()}>
      <p style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 700, padding: "4px 8px 8px", letterSpacing: "0.06em" }}>ブロックを追加</p>
      {items.map(m => (
        <button key={m.key} onClick={() => onSelect(m.key)}
          style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "7px 10px", borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#F5F3FF")}
          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
          <span style={{ width: 28, height: 28, borderRadius: 6, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{m.icon}</span>
          <span>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#111827" }}>{m.label}</span>
            <span style={{ display: "block", fontSize: 11, color: "#9CA3AF" }}>{m.desc}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// ── テキストブロック（paragraph / heading / quote 共通） ───────
function TextBlock({ value, placeholder, tag, style, focusId, blockId, onUpdate, onEnter, onBackspaceEmpty, onFocus, onSlash }:
  { value: string; placeholder: string; tag: string; style: React.CSSProperties; focusId: string | null; blockId: string;
    onUpdate: (v: string) => void; onEnter: () => void; onBackspaceEmpty: () => void; onFocus: () => void; onSlash?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const focused = focusId === blockId;

  useEffect(() => {
    if (ref.current && !focused) {
      if (tag === "paragraph" || tag === "p") {
        if (ref.current.innerHTML !== value) ref.current.innerHTML = value;
      } else {
        if (ref.current.innerText !== value) ref.current.innerText = value;
      }
    }
  }, [value, focused, tag]);

  useEffect(() => {
    if (focused && ref.current) {
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [focused]);

  const handleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onEnter(); }
    if (e.key === "Backspace") {
      const isEmpty = !ref.current?.innerText.trim() && !ref.current?.innerHTML.trim();
      if (isEmpty) { e.preventDefault(); onBackspaceEmpty(); }
    }
    if (e.key === "/" && !ref.current?.innerText.trim() && onSlash) {
      e.preventDefault();
      onSlash();
    }
  };

  const Tag = tag as "div";
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>}
      contentEditable suppressContentEditableWarning
      data-placeholder={placeholder}
      onFocus={onFocus}
      onBlur={() => {
        const v = (tag === "paragraph" || tag === "p") ? (ref.current?.innerHTML ?? "") : (ref.current?.innerText ?? "");
        onUpdate(v);
      }}
      onInput={() => {
        const v = (tag === "paragraph" || tag === "p") ? (ref.current?.innerHTML ?? "") : (ref.current?.innerText ?? "");
        onUpdate(v);
      }}
      onKeyDown={handleKey}
      style={{ outline: "none", minHeight: "1.5em", ...style }}
    />
  );
}

// ── ブロックラッパー（ホバーコントロール） ──────────────────────
function BlockWrapper({ children, onUp, onDown, onDelete, isFirst, isLast }:
  { children: React.ReactNode; onUp: () => void; onDown: () => void; onDelete: () => void; isFirst: boolean; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div style={{ position: "relative", paddingLeft: 40, marginBottom: 4 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Left controls */}
      <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 2, opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}>
        <button onClick={onUp} disabled={isFirst} title="上へ移動"
          style={{ width: 20, height: 20, borderRadius: 4, border: "none", background: isFirst ? "transparent" : "#F3F4F6", cursor: isFirst ? "default" : "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>↑</button>
        <button onClick={onDelete} title="削除"
          style={{ width: 20, height: 20, borderRadius: 4, border: "none", background: "#FEE2E2", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444" }}>✕</button>
        <button onClick={onDown} disabled={isLast} title="下へ移動"
          style={{ width: 20, height: 20, borderRadius: 4, border: "none", background: isLast ? "transparent" : "#F3F4F6", cursor: isLast ? "default" : "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF" }}>↓</button>
      </div>
      {children}
    </div>
  );
}

// ── 追加ボタン ────────────────────────────────────────────────
function AddButton({ onAdd }: { onAdd: (e: React.MouseEvent) => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "2px 0 2px 40px", opacity: hovered ? 1 : 0.3, transition: "opacity 0.15s" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button onClick={onAdd}
        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#9CA3AF", background: "none", border: "1px dashed #D1D5DB", borderRadius: 6, padding: "3px 10px", cursor: "pointer" }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> ブロックを追加
      </button>
    </div>
  );
}

// ── メイン エクスポート ───────────────────────────────────────
interface Props {
  blocks: ArticleBlock[];
  onChange: (blocks: ArticleBlock[], html: string) => void;
}

export default function ArticleBlockEditor({ blocks, onChange }: Props) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [pickerIdx, setPickerIdx] = useState<number | null>(null); // ブロック追加先index
  const [pickerRef, setPickerRef] = useState<{ el: HTMLElement; idx: number } | null>(null);

  const push = useCallback((next: ArticleBlock[]) => {
    onChange(next, blocksToHtml(next));
  }, [onChange]);

  function insertBlock(key: string, afterIdx: number) {
    const b = createBlock(key);
    const next = [...blocks];
    next.splice(afterIdx + 1, 0, b);
    push(next);
    setPickerIdx(null);
    setTimeout(() => setFocusedId(b.id), 30);
  }

  function updateBlock(id: string, patch: Partial<ArticleBlock>) {
    const next = blocks.map(b => b.id === id ? { ...b, ...patch } : b) as ArticleBlock[];
    push(next);
  }

  function deleteBlock(id: string) {
    const idx = blocks.findIndex(b => b.id === id);
    const next = blocks.filter(b => b.id !== id);
    push(next);
    if (next.length > 0) setFocusedId(next[Math.max(0, idx - 1)].id);
  }

  function moveUp(idx: number) {
    if (idx === 0) return;
    const next = [...blocks];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    push(next);
  }

  function moveDown(idx: number) {
    if (idx >= blocks.length - 1) return;
    const next = [...blocks];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    push(next);
  }

  function handleEnterAfter(idx: number) {
    const b = createBlock("paragraph");
    const next = [...blocks];
    next.splice(idx + 1, 0, b);
    push(next);
    setTimeout(() => setFocusedId(b.id), 30);
  }

  // Close picker on outside click
  useEffect(() => {
    if (pickerIdx === null) return;
    const handler = () => setPickerIdx(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [pickerIdx]);

  if (blocks.length === 0) {
    return (
      <div style={{ minHeight: 200 }}>
        <button onClick={() => { const b = createBlock("paragraph"); push([b]); setTimeout(() => setFocusedId(b.id), 30); }}
          style={{ width: "100%", padding: "32px", background: "transparent", border: "2px dashed #E5E7EB", borderRadius: 12, cursor: "pointer", color: "#CBD5E1", fontSize: 14 }}>
          + クリックして書き始める
        </button>
      </div>
    );
  }

  return (
    <div>
      {blocks.map((block, idx) => (
        <div key={block.id}>
          <BlockWrapper
            onUp={() => moveUp(idx)}
            onDown={() => moveDown(idx)}
            onDelete={() => deleteBlock(block.id)}
            isFirst={idx === 0}
            isLast={idx === blocks.length - 1}>
            <BlockContent
              block={block}
              focusedId={focusedId}
              onFocus={() => setFocusedId(block.id)}
              onUpdate={(patch) => updateBlock(block.id, patch)}
              onEnter={() => handleEnterAfter(idx)}
              onBackspaceEmpty={() => deleteBlock(block.id)}
              onSlash={(e) => { e.stopPropagation(); setPickerIdx(idx); }}
            />
          </BlockWrapper>

          {/* ブロック間の追加ボタン */}
          <div style={{ position: "relative" }}>
            <AddButton onAdd={(e) => { e.stopPropagation(); setPickerIdx(idx); }} />
            {pickerIdx === idx && (
              <div style={{ position: "absolute", left: 40, top: 0, zIndex: 100 }} onClick={e => e.stopPropagation()}>
                <BlockPicker
                  onSelect={(key) => insertBlock(key, idx)}
                  onClose={() => setPickerIdx(null)}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ブロック個別レンダリング ──────────────────────────────────
function BlockContent({ block, focusedId, onFocus, onUpdate, onEnter, onBackspaceEmpty, onSlash }:
  { block: ArticleBlock; focusedId: string | null; onFocus: () => void;
    onUpdate: (patch: Partial<ArticleBlock>) => void;
    onEnter: () => void; onBackspaceEmpty: () => void; onSlash: (e: React.MouseEvent) => void }) {

  switch (block.type) {
    case "paragraph":
      return (
        <TextBlock tag="p" value={block.html} placeholder="テキストを入力… / でブロック追加"
          style={{ fontSize: 15, color: "#374151", lineHeight: 1.85, paddingRight: 8 }}
          focusId={focusedId} blockId={block.id}
          onFocus={onFocus}
          onUpdate={v => onUpdate({ html: v })}
          onEnter={onEnter}
          onBackspaceEmpty={onBackspaceEmpty}
          onSlash={() => {
            const fakeEvent = { stopPropagation: () => {} } as React.MouseEvent;
            onSlash(fakeEvent);
          }}
        />
      );

    case "heading":
      return (
        <TextBlock tag={`h${block.level}` as "h2"}
          value={block.text}
          placeholder={block.level === 2 ? "見出し 2" : "見出し 3"}
          style={block.level === 2
            ? { fontSize: "1.35rem", fontWeight: 700, color: "#111827", paddingBottom: "0.5rem", borderBottom: "2px solid #E5E7EB", margin: "0.5rem 0" }
            : { fontSize: "1.1rem", fontWeight: 700, color: "#1E293B", margin: "0.25rem 0" }}
          focusId={focusedId} blockId={block.id}
          onFocus={onFocus}
          onUpdate={v => onUpdate({ text: v })}
          onEnter={onEnter}
          onBackspaceEmpty={onBackspaceEmpty}
        />
      );

    case "image":
      return (
        <div style={{ padding: "4px 0" }}>
          {block.url ? (
            <div style={{ position: "relative", marginBottom: 8 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={block.url} alt={block.alt} style={{ width: "100%", borderRadius: 8, display: "block", maxHeight: 320, objectFit: "cover" }} />
              <button onClick={() => onUpdate({ url: "" })}
                style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}>
                変更
              </button>
            </div>
          ) : (
            <div style={{ border: "2px dashed #E5E7EB", borderRadius: 8, padding: "24px", textAlign: "center", marginBottom: 8 }}>
              <p style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 10 }}>🖼 画像URLを入力してください</p>
              <input
                type="url" placeholder="https://example.com/image.jpg"
                style={{ width: "100%", padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 13, outline: "none", boxSizing: "border-box" }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); const v = (e.target as HTMLInputElement).value; if (v) onUpdate({ url: v }); } }}
                onBlur={e => { if (e.target.value) onUpdate({ url: e.target.value }); }}
                autoFocus
              />
            </div>
          )}
          <input
            value={block.caption} placeholder="キャプション（任意）"
            onChange={e => onUpdate({ caption: e.target.value })}
            style={{ width: "100%", fontSize: 12, color: "#6B7280", textAlign: "center", border: "none", borderBottom: "1px solid transparent", outline: "none", background: "transparent", boxSizing: "border-box" }}
            onFocus={e => (e.target.style.borderBottomColor = "#E5E7EB")}
            onBlur={e => (e.target.style.borderBottomColor = "transparent")}
          />
        </div>
      );

    case "list":
      return (
        <ListBlock block={block} focusedId={focusedId} onFocus={onFocus} onUpdate={onUpdate} />
      );

    case "quote":
      return (
        <div style={{ borderLeft: "4px solid #E5E7EB", paddingLeft: "1.25rem", margin: "0.5rem 0" }}>
          <TextBlock tag="p" value={block.text} placeholder="引用文を入力…"
            style={{ fontSize: 15, color: "#6B7280", fontStyle: "italic", lineHeight: 1.75 }}
            focusId={focusedId} blockId={block.id}
            onFocus={onFocus}
            onUpdate={v => onUpdate({ text: v })}
            onEnter={onEnter}
            onBackspaceEmpty={onBackspaceEmpty}
          />
          <input
            value={block.cite} placeholder="出典（任意）"
            onChange={e => onUpdate({ cite: e.target.value })}
            style={{ fontSize: 12, color: "#9CA3AF", border: "none", outline: "none", background: "transparent", width: "100%" }}
          />
        </div>
      );

    case "divider":
      return <hr style={{ border: "none", borderTop: "2px solid #E5E7EB", margin: "8px 0" }} />;

    case "callout": {
      const colors = { info: ["#EFF6FF", "#2563EB", "#DBEAFE", "💡"], warn: ["#FFFBEB", "#D97706", "#FEF3C7", "⚠️"], tip: ["#F0FDF4", "#16A34A", "#DCFCE7", "✅"] }[block.variant];
      return (
        <div style={{ background: colors[2], borderLeft: `4px solid ${colors[1]}`, borderRadius: 8, padding: "12px 16px", margin: "4px 0" }}>
          <span style={{ marginRight: 6 }}>{colors[3]}</span>
          <TextBlock tag="p" value={block.text} placeholder="テキストを入力…"
            style={{ display: "inline", fontSize: 14, color: "#374151", lineHeight: 1.75 }}
            focusId={focusedId} blockId={block.id}
            onFocus={onFocus}
            onUpdate={v => onUpdate({ text: v })}
            onEnter={onEnter}
            onBackspaceEmpty={onBackspaceEmpty}
          />
        </div>
      );
    }

    case "balloon":
      return <BalloonBlock block={block} focusedId={focusedId} onFocus={onFocus} onUpdate={onUpdate} onEnter={onEnter} onBackspaceEmpty={onBackspaceEmpty} />;

    case "linkcard":
      return <LinkCardBlock block={block} onUpdate={onUpdate} />;
  }
}

// ── リストブロック ─────────────────────────────────────────────
function ListBlock({ block, focusedId, onFocus, onUpdate }:
  { block: ArticleBlock & { type: "list" }; focusedId: string | null; onFocus: () => void; onUpdate: (p: Partial<ArticleBlock>) => void }) {
  const itemRefs = useRef<(HTMLInputElement | null)[]>([]);

  const updateItem = (i: number, val: string) => {
    const items = [...block.items];
    items[i] = val;
    onUpdate({ items });
  };

  const addItem = (afterIdx: number) => {
    const items = [...block.items];
    items.splice(afterIdx + 1, 0, "");
    onUpdate({ items });
    setTimeout(() => itemRefs.current[afterIdx + 1]?.focus(), 30);
  };

  const removeItem = (i: number) => {
    if (block.items.length <= 1) return;
    const items = block.items.filter((_, idx) => idx !== i);
    onUpdate({ items });
    setTimeout(() => itemRefs.current[Math.max(0, i - 1)]?.focus(), 30);
  };

  const Tag = block.ordered ? "ol" : "ul";
  return (
    <Tag style={{ paddingLeft: "1.5rem", margin: "0.25rem 0" }} onFocus={onFocus}>
      {block.items.map((item, i) => (
        <li key={i} style={{ marginBottom: "0.25rem" }}>
          <input
            ref={el => { itemRefs.current[i] = el; }}
            value={item}
            onChange={e => updateItem(i, e.target.value)}
            placeholder="リスト項目を入力…"
            style={{ width: "100%", border: "none", outline: "none", background: "transparent", fontSize: 15, color: "#374151", lineHeight: 1.6 }}
            onKeyDown={e => {
              if (e.key === "Enter") { e.preventDefault(); addItem(i); }
              if (e.key === "Backspace" && !item) { e.preventDefault(); removeItem(i); }
            }}
          />
        </li>
      ))}
    </Tag>
  );
}

// ── ふきだし（balloon）─────────────────────────────────────────
function BalloonBlock({ block, focusedId, onFocus, onUpdate, onEnter, onBackspaceEmpty }:
  { block: ArticleBlock & { type: "balloon" }; focusedId: string | null; onFocus: () => void;
    onUpdate: (p: Partial<ArticleBlock>) => void; onEnter: () => void; onBackspaceEmpty: () => void }) {
  const isR = block.direction === "right";
  const inp = { fontSize: 12, border: "none", outline: "none", background: "transparent", color: "#6B7280", width: "100%" };

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, margin: "8px 0", flexDirection: isR ? "row-reverse" : "row" }}>
      {/* アバター */}
      <div style={{ flexShrink: 0, textAlign: "center", width: 72 }}>
        {block.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.imageUrl} alt={block.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", border: "2px solid #E5E7EB", display: "block", margin: "0 auto" }} />
        ) : (
          <div style={{ width: 60, height: 60, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto" }}>👤</div>
        )}
        <input value={block.imageUrl} onChange={e => onUpdate({ imageUrl: e.target.value })}
          placeholder="画像URL" style={{ ...inp, fontSize: 10, marginTop: 4, textAlign: "center" }} />
        <input value={block.name} onChange={e => onUpdate({ name: e.target.value })}
          placeholder="名前" style={{ ...inp, fontSize: 11, textAlign: "center", fontWeight: 600 }} />
        {/* 向き切り替え */}
        <button onClick={() => onUpdate({ direction: isR ? "left" : "right" })}
          style={{ fontSize: 10, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", marginTop: 2 }}>
          {isR ? "← 左向き" : "右向き →"}
        </button>
      </div>

      {/* バブル */}
      <div style={{ flex: 1, position: "relative", background: isR ? "#E0F2FE" : "#F9FAFB", border: "1px solid #D1D5DB", borderRadius: 12, padding: "10px 14px" }}>
        {/* 三角矢印 */}
        <div style={{
          position: "absolute", top: 18,
          ...(isR ? { right: -8, borderLeft: "8px solid #D1D5DB", borderTop: "8px solid transparent", borderBottom: "8px solid transparent" }
                   : { left: -8, borderRight: "8px solid #D1D5DB", borderTop: "8px solid transparent", borderBottom: "8px solid transparent" }),
          width: 0, height: 0
        }} />
        <TextBlock tag="p" value={block.text} placeholder="セリフを入力…"
          style={{ fontSize: 14, color: "#374151", lineHeight: 1.75 }}
          focusId={focusedId} blockId={block.id}
          onFocus={onFocus}
          onUpdate={v => onUpdate({ text: v })}
          onEnter={onEnter}
          onBackspaceEmpty={onBackspaceEmpty}
        />
      </div>
    </div>
  );
}

// ── 内部リンクカード（linkcard）────────────────────────────────
function LinkCardBlock({ block, onUpdate }:
  { block: ArticleBlock & { type: "linkcard" }; onUpdate: (p: Partial<ArticleBlock>) => void }) {
  const [slugInput, setSlugInput] = useState(block.slug);
  const [status, setStatus] = useState<"idle" | "found" | "notfound">("idle");

  function lookup(slug: string) {
    if (!slug) return;
    try {
      const saved = localStorage.getItem("site-config");
      if (saved) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cfg = JSON.parse(saved) as { articles?: any[] };
        const art = cfg.articles?.find((a: { slug: string }) => a.slug === slug);
        if (art) {
          onUpdate({ slug: art.slug, title: art.title, imageUrl: art.imageUrl || "" });
          setStatus("found");
          return;
        }
      }
    } catch {}
    setStatus("notfound");
  }

  return (
    <div style={{ border: "2px solid #E5E7EB", borderRadius: 8, overflow: "hidden", margin: "4px 0" }}>
      {/* ラベル */}
      <div style={{ background: "#FFF7ED", padding: "4px 12px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#EA580C" }}>📎</span>
        <input value={block.label} onChange={e => onUpdate({ label: e.target.value })}
          style={{ fontSize: 11, fontWeight: 700, color: "#EA580C", border: "none", outline: "none", background: "transparent", flex: 1 }}
          placeholder="あわせて読みたい" />
      </div>

      {/* スラッグ入力 */}
      <div style={{ padding: "8px 12px", borderBottom: "1px solid #F3F4F6", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#9CA3AF", flexShrink: 0 }}>スラッグ:</span>
        <input value={slugInput}
          onChange={e => setSlugInput(e.target.value)}
          onBlur={() => lookup(slugInput)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); lookup(slugInput); } }}
          placeholder="記事スラッグ（例: my-article）"
          style={{ flex: 1, fontSize: 12, border: "1px solid #E5E7EB", borderRadius: 6, padding: "4px 8px", outline: "none", fontFamily: "monospace" }} />
        <button onClick={() => lookup(slugInput)}
          style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: "none", background: "#4F46E5", color: "#fff", cursor: "pointer" }}>
          取得
        </button>
        {status === "found" && <span style={{ fontSize: 11, color: "#16A34A" }}>✓</span>}
        {status === "notfound" && <span style={{ fontSize: 11, color: "#EF4444" }}>記事が見つかりません</span>}
      </div>

      {/* プレビュー */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 12 }}>
        {block.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={block.imageUrl} alt={block.title} style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
        ) : (
          <div style={{ width: 100, height: 70, background: "#F3F4F6", borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#CBD5E1" }}>🖼</div>
        )}
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1558D6", textDecoration: "underline" }}>
          {block.title || (block.slug ? `/${block.slug}` : "スラッグを入力して取得ボタンを押してください")}
        </span>
      </div>
    </div>
  );
}
