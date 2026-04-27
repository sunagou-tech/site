"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

const COLORS = [
  "#111827","#374151","#6B7280","#9CA3AF",
  "#DC2626","#EA580C","#D97706","#16A34A",
  "#2563EB","#4F46E5","#7C3AED","#DB2777",
  "#ffffff","#FEF9C3","#DCFCE7","#DBEAFE",
];

const FONT_SIZES = [11,12,14,16,18,20,24,28,32,36,42,48,60,72];

interface BarState {
  visible: boolean;
  top: number;
  left: number;
}

export default function GlobalFormatBar() {
  const [bar, setBar] = useState<BarState>({ visible: false, top: 0, left: 0 });
  const [showColor, setShowColor] = useState(false);
  const [showSize, setShowSize] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const update = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) {
        // Delay hiding to allow toolbar button clicks
        hideTimer.current = setTimeout(() => setBar(b => ({ ...b, visible: false })), 200);
        return;
      }
      const node = sel.anchorNode;
      const editable = (node instanceof Element ? node : node?.parentElement)
        ?.closest('[contenteditable="true"]');
      if (!editable) {
        hideTimer.current = setTimeout(() => setBar(b => ({ ...b, visible: false })), 200);
        return;
      }
      if (hideTimer.current) clearTimeout(hideTimer.current);
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      const BAR_WIDTH = 400;
      const left = Math.max(8, Math.min(window.innerWidth - BAR_WIDTH - 8, rect.left + rect.width / 2 - BAR_WIDTH / 2));
      setBar({ visible: true, top: rect.top - 52, left });
    };

    document.addEventListener("selectionchange", update);
    return () => document.removeEventListener("selectionchange", update);
  }, []);

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand("styleWithCSS", false, "true");
    document.execCommand(cmd, false, val);
  }, []);

  const applySize = useCallback((px: number) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    const span = document.createElement("span");
    span.style.fontSize = px + "px";
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      sel.removeAllRanges();
      const r = document.createRange();
      r.selectNodeContents(span);
      sel.addRange(r);
    } catch {
      // surroundContents不可なケースにフォールバック
      document.execCommand("fontSize", false, "7");
      const fontEls = document.querySelectorAll('font[size="7"]');
      fontEls.forEach((el) => {
        const s = document.createElement("span");
        s.style.fontSize = px + "px";
        while (el.firstChild) s.appendChild(el.firstChild);
        el.replaceWith(s);
      });
    }
  }, []);

  if (!mounted) return null;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // フォーカスを奪わない
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  const btn = (label: string, cmd: string, title: string, className = "") => (
    <button
      onMouseDown={(e) => { handleMouseDown(e); exec(cmd); }}
      className={`min-w-[28px] h-7 px-1 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors text-sm ${className}`}
      title={title}
    >
      {label}
    </button>
  );

  if (!bar.visible) return null;

  const portal = (
    <div
      style={{ position: "fixed", top: bar.top, left: bar.left, zIndex: 99999 }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-center gap-0.5 bg-gray-900 text-white rounded-2xl px-2.5 py-1.5 shadow-2xl border border-white/10 select-none">
        {/* テキスト装飾 */}
        {btn("B", "bold", "太字", "font-bold")}
        {btn("I", "italic", "斜体", "italic")}
        {btn("U", "underline", "下線", "underline")}
        {btn("S̶", "strikeThrough", "取り消し線", "line-through")}

        <div className="w-px h-5 bg-white/20 mx-0.5" />

        {/* 見出し */}
        {(["h2","h3","p"] as const).map(tag => (
          <button key={tag}
            onMouseDown={(e) => { handleMouseDown(e); exec("formatBlock", tag); }}
            className="min-w-[28px] h-7 px-1.5 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors text-xs font-bold"
            title={tag === "h2" ? "見出し2" : tag === "h3" ? "見出し3" : "段落に戻す"}
          >
            {tag === "h2" ? "H2" : tag === "h3" ? "H3" : "¶"}
          </button>
        ))}

        <div className="w-px h-5 bg-white/20 mx-0.5" />

        {/* 文字色 */}
        <div className="relative">
          <button
            onMouseDown={(e) => { handleMouseDown(e); setShowColor(p => !p); setShowSize(false); }}
            className="h-7 px-2 rounded-lg hover:bg-white/20 transition-colors text-xs flex items-center gap-1"
            title="文字色"
          >
            <span className="font-semibold">A</span>
            <span className="w-3 h-1 rounded-full bg-yellow-400" />
          </button>
          {showColor && (
            <div
              className="absolute top-full mt-1.5 bg-gray-900 border border-white/10 rounded-2xl p-2.5 shadow-2xl"
              style={{ left: "50%", transform: "translateX(-50%)", width: 180 }}
              onMouseDown={handleMouseDown}
            >
              <p className="text-[10px] text-gray-400 mb-2 text-center">文字色</p>
              <div className="grid grid-cols-8 gap-1 mb-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onMouseDown={(e) => { handleMouseDown(e); exec("foreColor", c); setShowColor(false); }}
                    className="w-5 h-5 rounded-full border border-white/10 hover:scale-125 transition-transform"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <input
                type="color"
                className="w-full h-7 rounded-lg cursor-pointer border-0"
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => exec("foreColor", e.target.value)}
                title="カスタムカラー"
              />
            </div>
          )}
        </div>

        {/* 文字サイズ */}
        <div className="relative">
          <button
            onMouseDown={(e) => { handleMouseDown(e); setShowSize(p => !p); setShowColor(false); }}
            className="h-7 px-2 rounded-lg hover:bg-white/20 transition-colors text-xs flex items-center gap-0.5"
            title="文字サイズ"
          >
            <span>T</span>
            <span className="text-[8px] opacity-60">▲▼</span>
          </button>
          {showSize && (
            <div
              className="absolute top-full mt-1.5 bg-gray-900 border border-white/10 rounded-2xl py-2 shadow-2xl overflow-y-auto"
              style={{ left: "50%", transform: "translateX(-50%)", width: 80, maxHeight: 220 }}
              onMouseDown={handleMouseDown}
            >
              {FONT_SIZES.map((s) => (
                <button
                  key={s}
                  onMouseDown={(e) => { handleMouseDown(e); applySize(s); setShowSize(false); }}
                  className="w-full text-left text-xs px-3 py-1.5 hover:bg-white/15 transition-colors"
                >
                  {s}px
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-white/20 mx-0.5" />

        {/* テキスト配置 */}
        {btn("≡L", "justifyLeft", "左寄せ", "text-[11px]")}
        {btn("≡C", "justifyCenter", "中央", "text-[11px]")}
        {btn("≡R", "justifyRight", "右寄せ", "text-[11px]")}

        <div className="w-px h-5 bg-white/20 mx-0.5" />

        {/* 書式クリア */}
        <button
          onMouseDown={(e) => { handleMouseDown(e); exec("removeFormat"); }}
          className="h-7 px-2 rounded-lg hover:bg-red-500/40 transition-colors text-xs text-gray-400 hover:text-white"
          title="書式をすべてクリア"
        >
          ✕書式
        </button>
      </div>
    </div>
  );

  return createPortal(portal, document.body);
}
