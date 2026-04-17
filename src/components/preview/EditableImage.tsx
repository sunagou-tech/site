"use client";

import React, { useState, useRef, useEffect } from "react";
import { ImageIcon, Link2, Sparkles, X } from "lucide-react";
import AIImagePanel from "./AIImagePanel";
import { useEditing } from "@/contexts/EditingContext";
import { useImagePick } from "@/contexts/ImagePickContext";

type Tab = "url" | "library" | "ai";
interface LibraryImage { id: string; name: string; url: string; }

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
  onAltChange,
  placeholderGradient = "linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)",
  primaryColor = "#1a1a2e",
  accentColor = "#F5C842",
}: Props) {
  const editingMode = useEditing();
  const { pickedUrl, clear: clearPick } = useImagePick();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("url");
  const [urlInput, setUrlInput] = useState(url);
  const [altInput, setAltInput] = useState(alt);
  const [imgError, setImgError] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [libraryImages, setLibraryImages] = useState<LibraryImage[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // onChange を ref で保持して native listener 内でも最新を参照できるようにする
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const showPlaceholder = !url || imgError;

  // ── ネイティブ drag-and-drop（React 合成イベントのバイパス） ──────────
  // button overlay が absolute inset-0 で全面覆う構造では合成イベントが
  // preventDefault() を通せないため、useEffect でネイティブリスナーを付与する
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
      // 子要素に移動した場合は無視（relatedTarget が自分の子なら leave ではない）
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

  const openModal = () => {
    setUrlInput(url);
    try {
      const saved = localStorage.getItem("uploaded-images");
      const imgs = saved ? JSON.parse(saved) : [];
      setLibraryImages(imgs);
      setTab(imgs.length > 0 ? "library" : "url");
    } catch { setLibraryImages([]); setTab("url"); }
    setOpen(true);
  };

  const handleClick = () => {
    // ライブラリから画像選択中 → 即配置してピックを解除
    if (pickedUrl) {
      onChange(pickedUrl);
      setImgError(false);
      clearPick();
      return;
    }
    openModal();
  };

  const applyUrl = (u: string) => {
    onChange(u);
    onAltChange?.(altInput);
    setImgError(false);
    setOpen(false);
  };

  return (
    <>
      {/*
        ラッパー div が click・drop の両方を受け取る。
        内部の視覚オーバーレイは pointer-events-none にして
        ドラッグイベントの進路を塞がない。
      */}
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
            {/* 画像ピック中オーバーレイ */}
            {pickedUrl && (
              <div className="absolute inset-0 bg-indigo-500/30 flex items-center justify-center pointer-events-none">
                <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
                  クリックして配置
                </span>
              </div>
            )}
          </>
        )}

        {/* 通常ホバーオーバーレイ（ピック中は非表示） */}
        {!pickedUrl && (
          <div
            className="
              absolute inset-0 flex items-end justify-center pb-4
              bg-black/0 group-hover/img:bg-black/40
              opacity-0 group-hover/img:opacity-100
              transition-all duration-200
              pointer-events-none
            "
          >
            <span className="flex items-center gap-2 bg-white/95 text-gray-800 text-xs font-medium px-4 py-2 rounded-full shadow-lg">
              <ImageIcon size={12} />
              画像を変更 / AIで生成
            </span>
          </div>
        )}
      </div>

      {/* モーダル */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-[460px] overflow-hidden">
            {/* タブヘッダー */}
            <div className="flex border-b border-gray-100">
              {([
                { id: "url",     label: "URLで設定", icon: <Link2 size={13} /> },
                { id: "library", label: "ライブラリ", icon: <ImageIcon size={13} /> },
                { id: "ai",      label: "AIで生成",   icon: <Sparkles size={13} /> },
              ] as { id: Tab; label: string; icon: React.ReactNode }[]).map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
                    tab === id ? "text-gray-900 border-b-2 border-gray-900" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {icon}{label}
                  {id === "library" && libraryImages.length > 0 && (
                    <span className="ml-0.5 text-[10px] text-indigo-500 font-bold">({libraryImages.length})</span>
                  )}
                </button>
              ))}
              <button onClick={() => setOpen(false)} className="px-3 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            {/* URL タブ */}
            {tab === "url" && (
              <div className="p-5">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">画像URL</label>
                <input
                  autoFocus
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
                  onKeyDown={(e) => { if (e.key === "Enter") applyUrl(urlInput); if (e.key === "Escape") setOpen(false); }}
                />
                <label className="block text-xs font-medium text-gray-500 mb-1.5">alt テキスト</label>
                <input
                  type="text"
                  value={altInput}
                  onChange={(e) => setAltInput(e.target.value)}
                  placeholder="画像の説明（例：会社のオフィス外観）"
                  className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
                />
                {urlInput && (
                  <div className="mb-4 rounded-xl overflow-hidden h-32 bg-gray-100">
                    <img src={urlInput} alt="preview" className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => applyUrl(urlInput)}
                    className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90"
                    style={{ backgroundColor: primaryColor }}>
                    適用
                  </button>
                  {url && (
                    <button onClick={() => applyUrl("")}
                      className="px-4 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50">
                      削除
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ライブラリ タブ */}
            {tab === "library" && (
              <div className="p-4">
                {libraryImages.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-xs">
                    <ImageIcon size={28} className="mx-auto mb-2 text-gray-300" />
                    まだ画像がありません。左メニューの「画像」からアップロードしてください。
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
                    {libraryImages.map((img) => (
                      <button key={img.id} onClick={() => applyUrl(img.url)}
                        className="relative group rounded-lg overflow-hidden aspect-[4/3] border-2 border-transparent hover:border-indigo-500 transition-all"
                        title={img.name}>
                        <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <span className="opacity-0 group-hover:opacity-100 text-white text-[10px] font-semibold bg-black/50 px-2 py-1 rounded-full">
                            適用
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI タブ */}
            {tab === "ai" && (
              <AIImagePanel onUse={applyUrl} onClose={() => setOpen(false)}
                primaryColor={primaryColor} accentColor={accentColor} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
