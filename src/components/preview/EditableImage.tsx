"use client";

import { useState } from "react";
import { ImageIcon, Link2, Sparkles, X } from "lucide-react";
import AIImagePanel from "./AIImagePanel";

type Tab = "url" | "ai";

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
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("url");
  const [urlInput, setUrlInput] = useState(url);
  const [altInput, setAltInput] = useState(alt);
  const [imgError, setImgError] = useState(false);

  const showPlaceholder = !url || imgError;

  const applyUrl = (u: string) => {
    onChange(u);
    onAltChange?.(altInput);
    setImgError(false);
    setOpen(false);
  };

  return (
    <>
      <div className={`relative group/img overflow-hidden ${className}`}>
        {showPlaceholder ? (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2 select-none"
            style={{ background: placeholderGradient }}
          >
            <ImageIcon size={28} className="text-slate-400" />
            <span className="text-xs text-slate-400">画像をクリックして設定</span>
          </div>
        ) : (
          <img
            src={url}
            alt={alt}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            onLoad={() => setImgError(false)}
          />
        )}

        {/* ホバーオーバーレイ */}
        <button
          onClick={() => { setUrlInput(url); setOpen(true); }}
          className="
            absolute inset-0 flex items-end justify-center pb-4
            bg-black/0 group-hover/img:bg-black/40
            opacity-0 group-hover/img:opacity-100
            transition-all duration-200
          "
        >
          <span className="flex items-center gap-2 bg-white/95 text-gray-800 text-xs font-medium px-4 py-2 rounded-full shadow-lg">
            <ImageIcon size={12} />
            画像を変更 / AIで生成
          </span>
        </button>
      </div>

      {/* モーダル */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-[420px] overflow-hidden">
            {/* タブヘッダー */}
            <div className="flex border-b border-gray-100">
              {(["url", "ai"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 text-sm font-medium transition-colors ${
                    tab === t
                      ? "text-gray-900 border-b-2 border-gray-900"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {t === "url" ? <><Link2 size={14} /> URLで設定</> : <><Sparkles size={14} /> AIで生成</>}
                </button>
              ))}
              <button onClick={() => setOpen(false)} className="px-4 text-gray-400 hover:text-gray-600">
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyUrl(urlInput);
                    if (e.key === "Escape") setOpen(false);
                  }}
                />

                <label className="block text-xs font-medium text-gray-500 mb-1.5 mt-3">alt テキスト（SEO・アクセシビリティ）<span className="text-red-400 ml-1">*</span></label>
                <input
                  type="text"
                  value={altInput}
                  onChange={(e) => setAltInput(e.target.value)}
                  placeholder="画像の説明を入力（例：会社のオフィス外観）"
                  className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 mb-4"
                />

                {/* プレビュー */}
                {urlInput && (
                  <div className="mb-4 rounded-xl overflow-hidden h-32 bg-gray-100">
                    <img
                      src={urlInput}
                      alt="preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => applyUrl(urlInput)}
                    className="flex-1 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: primaryColor }}
                  >
                    適用
                  </button>
                  {url && (
                    <button
                      onClick={() => applyUrl("")}
                      className="px-4 py-2.5 text-sm text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* AI タブ */}
            {tab === "ai" && (
              <AIImagePanel
                onUse={applyUrl}
                onClose={() => setOpen(false)}
                primaryColor={primaryColor}
                accentColor={accentColor}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
