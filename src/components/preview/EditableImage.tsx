"use client";

import { useState, useRef, useEffect } from "react";
import { ImageIcon } from "lucide-react";
import { useEditing } from "@/contexts/EditingContext";
import { useImagePick } from "@/contexts/ImagePickContext";
import { useImageEdit } from "@/contexts/ImageEditContext";

interface Props {
  url: string;
  onChange: (url: string) => void;
  className?: string;
  alt?: string;
  onAltChange?: (alt: string) => void;
  placeholderGradient?: string;
  primaryColor?: string;
  accentColor?: string;
}

export default function EditableImage({
  url,
  onChange,
  className = "",
  alt = "image",
  placeholderGradient = "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
  primaryColor = "#1a1a2e",
  accentColor = "#F5C842",
}: Props) {
  const editingMode = useEditing();
  const { pickedUrl, clear: clearPick } = useImagePick();
  const imageEdit = useImageEdit();
  const [imgError, setImgError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const showPlaceholder = !url || imgError;

  // ── ネイティブ drag-and-drop ──────────────────────────────────
  useEffect(() => {
    if (!editingMode) return;
    const el = wrapperRef.current;
    if (!el) return;

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      setIsDragOver(true);
    };
    const onDragLeave = (e: DragEvent) => {
      if (!el.contains(e.relatedTarget as Node)) setIsDragOver(false);
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer?.getData("text/plain");
      if (dropped) {
        onChangeRef.current(dropped);
        setImgError(false);
      }
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onDragLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onDragLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [editingMode]);

  // 非編集モード
  if (!editingMode) {
    if (showPlaceholder) {
      return <div className={`overflow-hidden ${className}`} style={{ background: placeholderGradient }} />;
    }
    return (
      <div className={`overflow-hidden ${className}`}>
        <img src={url} alt={alt} className="w-full h-full object-cover object-top"
          onError={() => setImgError(true)} />
      </div>
    );
  }

  const handleClick = () => {
    if (pickedUrl) {
      onChange(pickedUrl);
      setImgError(false);
      clearPick();
      return;
    }
    // 左パネルの画像編集パネルを開く
    imageEdit.open({ url, onChange, primaryColor, accentColor });
  };

  return (
    <div
      ref={wrapperRef}
      className={`relative group/img overflow-hidden cursor-pointer ${className}`}
      onClick={handleClick}
      style={
        pickedUrl
          ? { outline: "3px solid #4F46E5", outlineOffset: -3 }
          : isDragOver
          ? { outline: "3px solid #4F46E5", outlineOffset: -3 }
          : undefined
      }
    >
      {showPlaceholder ? (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-2 select-none pointer-events-none"
          style={{ background: pickedUrl || isDragOver ? "#EEF2FF" : placeholderGradient }}
        >
          <ImageIcon size={28} className={pickedUrl || isDragOver ? "text-indigo-400" : "text-slate-400"} />
          <span className={`text-xs ${pickedUrl || isDragOver ? "text-indigo-500 font-semibold" : "text-slate-400"}`}>
            {pickedUrl ? "クリックして配置" : isDragOver ? "ドロップして設定" : "画像をクリックして設定"}
          </span>
        </div>
      ) : (
        <>
          <img
            src={url}
            alt={alt}
            className="w-full h-full object-cover object-top pointer-events-none"
            onError={() => setImgError(true)}
            onLoad={() => setImgError(false)}
          />
          {pickedUrl && (
            <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center pointer-events-none">
              <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                クリックして配置
              </span>
            </div>
          )}
        </>
      )}

      {/* 編集アイコン */}
      {!pickedUrl && (
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          <span className="flex items-center gap-1 bg-black/50 text-white text-[10px] font-medium px-2 py-1 rounded-full">
            <ImageIcon size={10} />
            編集
          </span>
        </div>
      )}

      {/* ホバーオーバーレイ */}
      {!pickedUrl && (
        <div className="absolute inset-0 flex items-end justify-center pb-4 bg-black/0 group-hover/img:bg-black/40 opacity-0 group-hover/img:opacity-100 transition-all duration-200 pointer-events-none">
          <span className="flex items-center gap-2 bg-white/95 text-gray-800 text-xs font-medium px-4 py-2 rounded-full shadow-lg">
            <ImageIcon size={12} />
            画像を変更 / AIで生成
          </span>
        </div>
      )}
    </div>
  );
}
