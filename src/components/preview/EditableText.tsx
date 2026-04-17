"use client";

/**
 * EditableText
 * ─────────────────────────────────────────────────────────────
 * contentEditable ラッパー。
 * - ホバー時: 青破線アウトライン + 鉛筆 + × 削除ボタン
 * - フォーカス時: 青実線アウトライン + 薄青背景
 * - value === "" のとき: 「＋ テキストを追加」ボタン → クリックで編集開始
 * - Esc: 変更を破棄してフォーカス解除
 * - Enter (multiline=false): フォーカス解除して保存
 * - blur: innerHTML (HTMLあり) または innerText を onChange に渡す
 */

import { useRef, useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import { useEditing } from "@/contexts/EditingContext";

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

interface Props {
  tag?: Tag;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  readOnly?: boolean;
  onFocusChange?: (focused: boolean) => void;
  plainOnly?: boolean;
  /** false にすると × 削除ボタンを非表示（必須フィールド向け） */
  deletable?: boolean;
}

function hasHtml(s: string): boolean {
  return /<[a-z][\s\S]*>/i.test(s);
}

function sanitize(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

export default function EditableText({
  tag = "span",
  value,
  onChange,
  className = "",
  style,
  multiline = false,
  readOnly = false,
  onFocusChange,
  plainOnly = false,
  deletable = true,
}: Props) {
  const Tag = tag;
  const editingMode = useEditing();
  const ref = useRef<HTMLElement>(null);
  const isEditing = useRef(false);
  const savedValue = useRef(value);
  // 空 → 追加モード。true のとき contentEditable を表示して即フォーカス
  const [adding, setAdding] = useState(false);

  // 外部 config 変化 / マウント時に DOM を同期
  useEffect(() => {
    if (ref.current && !isEditing.current) {
      if (!plainOnly && hasHtml(value)) {
        ref.current.innerHTML = sanitize(value);
      } else {
        ref.current.innerText = value;
      }
    }
    savedValue.current = value;
    // value が "" 以外になったら adding を解除
    if (value !== "") setAdding(false);
  }, [value, plainOnly]);

  // adding になったら contentEditable にフォーカス
  useEffect(() => {
    if (adding && ref.current) {
      ref.current.innerText = "";
      ref.current.focus();
    }
  }, [adding]);

  // ─── 非編集モード（公開サイト・プレビューiframe）────────────
  if (!editingMode || readOnly) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ReadTag = tag as any;
    if (!plainOnly && hasHtml(value)) {
      return <ReadTag className={className} style={style} dangerouslySetInnerHTML={{ __html: sanitize(value) }} />;
    }
    return <ReadTag className={className} style={style}>{value}</ReadTag>;
  }

  // ─── 空 + 非 adding → プレースホルダーボタン ──────────────
  if (value === "" && !adding && deletable) {
    return (
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[11px] text-gray-300 border border-dashed border-gray-200 rounded-lg px-2.5 py-1 hover:border-indigo-400 hover:text-indigo-400 transition-colors"
        onClick={() => setAdding(true)}
      >
        <span className="text-base leading-none">＋</span> テキストを追加
      </button>
    );
  }

  // ─── 通常 / adding 編集モード ─────────────────────────────
  return (
    <span className="group/et relative inline-block w-full">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Tag
        ref={ref as React.RefObject<any>}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        style={style}
        className={[
          "outline-none cursor-text",
          "rounded-sm",
          "ring-1 ring-transparent",
          "group-hover/et:ring-blue-300 group-hover/et:ring-offset-1",
          "focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:bg-blue-50/40",
          "transition-all duration-100",
          // adding 中は薄いプレースホルダーっぽいスタイル
          adding ? "min-w-[80px] min-h-[1em]" : "",
          className,
        ].join(" ")}
        onFocus={() => {
          isEditing.current = true;
          onFocusChange?.(true);
        }}
        onBlur={(e: React.FocusEvent<HTMLElement>) => {
          isEditing.current = false;
          onFocusChange?.(false);
          const rawHtml = e.currentTarget.innerHTML;
          const rawText = e.currentTarget.innerText.trim();
          const next = (!plainOnly && hasHtml(rawHtml)) ? sanitize(rawHtml) : rawText;
          if (next !== savedValue.current) {
            savedValue.current = next;
            onChange(next);
          }
          // 空のまま blur → プレースホルダーに戻る
          if (next === "") setAdding(false);
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.key === "Escape") {
            if (ref.current) {
              if (!plainOnly && hasHtml(savedValue.current)) {
                ref.current.innerHTML = sanitize(savedValue.current);
              } else {
                ref.current.innerText = savedValue.current;
              }
            }
            e.currentTarget.blur();
          }
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />

      {/* 鉛筆 + × ボタン — ホバー時だけ表示 */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-3 -right-1 opacity-0 group-hover/et:opacity-100 transition-opacity duration-100 flex items-center gap-0.5 z-20"
      >
        <span className="bg-blue-500 text-white rounded-full p-0.5">
          <Pencil size={8} />
        </span>
        {deletable && (
          <button
            type="button"
            aria-label="このテキストを削除"
            className="pointer-events-auto bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (ref.current) ref.current.innerText = "";
              onChange("");
            }}
          >
            <X size={8} />
          </button>
        )}
      </span>
    </span>
  );
}
