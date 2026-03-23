"use client";

import { useState } from "react";
import { HeroVideoBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import { Video, Link2 } from "lucide-react";

interface Props {
  block: HeroVideoBlock;
  config: SiteConfig;
  onChange: (b: HeroVideoBlock) => void;
}

export default function HeroVideoBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroVideoBlock>) => onChange({ ...block, ...patch });
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(block.videoUrl);
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="relative min-h-[560px] flex items-center overflow-hidden bg-gray-900">
      {/* 動画背景 */}
      {block.videoUrl ? (
        <video
          key={block.videoUrl}
          src={block.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
      ) : (
        /* プレースホルダー */
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 20% 50%, ${config.primaryColor}80 0%, transparent 50%),
              radial-gradient(ellipse at 80% 20%, ${config.accentColor}40 0%, transparent 40%),
              linear-gradient(180deg, #0a0a14 0%, #1a1a2e 100%)
            `,
          }}
        >
          {/* ノイズテクスチャ的なドットグリッド */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      )}

      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/30" />

      {/* コンテンツ */}
      <div className="relative z-10 w-full px-14 py-24">
        <p className="text-white/30 text-xs tracking-[0.4em] uppercase mb-8">Hero — Pattern B</p>

        {/* 超大タイポグラフィ */}
        <EditableText
          tag="h1"
          value={block.tagline}
          onChange={(v) => u({ tagline: v })}
          multiline
          className={`
            text-[clamp(3.5rem,8vw,7rem)] font-black leading-[1.0] tracking-[-0.04em]
            text-white whitespace-pre-line block
            [text-shadow:0_2px_40px_rgba(0,0,0,0.4)]
            ${fontClass}
          `}
        />

        <div className="flex items-end gap-10 mt-10">
          <EditableText
            tag="p"
            value={block.taglineSub}
            onChange={(v) => u({ taglineSub: v })}
            className="text-sm text-white/60 tracking-[0.15em] block max-w-xs leading-[1.9]"
          />

          <button
            className="flex-shrink-0 inline-flex items-center gap-2 border-2 border-white/40 text-white/80 text-sm font-medium px-6 py-3 rounded-full hover:border-white hover:text-white transition-colors backdrop-blur-sm"
          >
            <EditableText tag="span" value={block.buttonText} onChange={(v) => u({ buttonText: v })} />
          </button>
        </div>
      </div>

      {/* 動画URL変更ボタン */}
      <div className="absolute bottom-4 right-4 z-20">
        {!editingUrl ? (
          <button
            onClick={() => { setUrlInput(block.videoUrl); setEditingUrl(true); }}
            className="flex items-center gap-1.5 text-xs bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors"
          >
            <Video size={12} /> 動画URLを変更
          </button>
        ) : (
          <div className="flex gap-2 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-xl min-w-[300px]">
            <input
              autoFocus
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://example.com/video.mp4"
              className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => {
                if (e.key === "Enter") { u({ videoUrl: urlInput }); setEditingUrl(false); }
                if (e.key === "Escape") setEditingUrl(false);
              }}
            />
            <button onClick={() => { u({ videoUrl: urlInput }); setEditingUrl(false); }}
              className="text-xs bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600">適用</button>
            <button onClick={() => setEditingUrl(false)}
              className="text-xs bg-gray-100 text-gray-600 px-2 py-1.5 rounded-lg hover:bg-gray-200">✕</button>
          </div>
        )}
      </div>

      {/* スクロールヒント */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 animate-bounce">
        <div className="w-px h-8 bg-white/30" />
        <p className="text-[10px] text-white/30 tracking-widest">SCROLL</p>
      </div>
    </section>
  );
}
