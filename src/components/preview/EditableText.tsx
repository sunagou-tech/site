"use client";

/**
 * EditableText
 * ─────────────────────────────────────────────────────────────
 * contentEditable ラッパー。
 * - ホバー時: 青破線アウトライン + 鉛筆アイコン
 * - フォーカス時: 青実線アウトライン + 薄青背景
 * - Esc: 変更を破棄してフォーカス解除
 * - Enter (multiline=false): フォーカス解除して保存
 * - blur: innerText を onChange に渡す
 *
 * DOM は ref で直接管理し、React の子要素 reconciliation を避ける。
 * isEditing フラグで「外部 config 変更 → DOM 同期」と「ユーザー入力中」を切り分ける。
 */

import { useRef, useEffect } from "react";
import { Pencil } from "lucide-react";

type Tag = "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";

interface Props {
  tag?: Tag;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  /** true のとき Enter キーで改行を許可 */
  multiline?: boolean;
  /** true のとき編集不可（カラーや非インタラクティブ領域など） */
  readOnly?: boolean;
}

export default function EditableText({
  tag = "span",
  value,
  onChange,
  className = "",
  style,
  multiline = false,
  readOnly = false,
}: Props) {
  const Tag = tag;
  const ref = useRef<HTMLElement>(null);
  const isEditing = useRef(false);
  const savedValue = useRef(value);

  // 初期テキストをセット（children を渡さないので useEffect で設定）
  useEffect(() => {
    if (ref.current) ref.current.innerText = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部（サイドバー）から config が変わったとき → 編集中でなければ DOM を更新
  useEffect(() => {
    if (!isEditing.current && ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
    savedValue.current = value;
  }, [value]);

  if (readOnly) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ReadTag = tag as any;
    return <ReadTag className={className}>{value}</ReadTag>;
  }

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
          // ホバー: 破線の青枠
          "ring-1 ring-transparent",
          "group-hover/et:ring-blue-300 group-hover/et:ring-offset-1",
          "group-hover/et:[outline-style:dashed]",
          // フォーカス: 実線の青枠
          "focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 focus:bg-blue-50/40",
          "transition-all duration-100",
          className,
        ].join(" ")}
        onFocus={() => {
          isEditing.current = true;
        }}
        onBlur={(e: React.FocusEvent<HTMLElement>) => {
          isEditing.current = false;
          const next = e.currentTarget.innerText.trim();
          if (next !== savedValue.current) {
            savedValue.current = next;
            onChange(next);
          }
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
          if (e.key === "Escape") {
            // 変更破棄
            if (ref.current) ref.current.innerText = savedValue.current;
            e.currentTarget.blur();
          }
          if (!multiline && e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
        }}
      />

      {/* 鉛筆アイコン — ホバー時だけ表示 */}
      <span
        aria-hidden
        className="
          pointer-events-none absolute -top-3 -right-1
          opacity-0 group-hover/et:opacity-100
          transition-opacity duration-100
          bg-blue-500 text-white rounded-full p-0.5
          z-20
        "
      >
        <Pencil size={8} />
      </span>
    </span>
  );
}
