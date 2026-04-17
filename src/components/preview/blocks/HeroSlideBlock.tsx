"use client";
import { useState, useEffect } from "react";
import { HeroSlideBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";
import { useEditing } from "@/contexts/EditingContext";

interface Props {
  block: HeroSlideBlock;
  config: SiteConfig;
  onChange: (b: HeroSlideBlock) => void;
}

export default function HeroSlideBlockComponent({ block, config, onChange }: Props) {
  const isEditing = useEditing();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides = block.slides ?? [];
  const total = slides.length;
  const current = slides[activeSlide] ?? slides[0];

  const accent = config.accentColor ?? "#F5C842";

  const patchSlide = (idx: number, patch: Partial<HeroSlideBlock["slides"][0]>) => {
    const next = [...slides];
    next[idx] = { ...next[idx], ...patch };
    onChange({ ...block, slides: next });
  };

  // Auto-advance every 5 seconds (pause in editing mode)
  useEffect(() => {
    if (isEditing || total <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(timer);
  }, [isEditing, total]);

  const goPrev = () => setActiveSlide((prev) => (prev - 1 + total) % total);
  const goNext = () => setActiveSlide((prev) => (prev + 1) % total);

  if (!current) return null;

  return (
    <>
      {/* ── Main hero ── */}
      <section className="relative min-h-[600px] overflow-hidden">
        {/* Background image for current slide */}
        <EditableImage
          url={current.imageUrl ?? ""}
          onChange={(url) => patchSlide(activeSlide, { imageUrl: url })}
          className="absolute inset-0"
          primaryColor={config.primaryColor}
          accentColor={accent}
          alt={`slide ${activeSlide + 1}`}
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/50 pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[600px] px-6 py-16 gap-4">
          <EditableText
            tag="p"
            value={current.eyebrow}
            onChange={(v) => patchSlide(activeSlide, { eyebrow: v })}
            className="text-[11px] tracking-[0.25em] uppercase font-medium"
            style={{ color: accent }}
          />
          <EditableText
            tag="h1"
            value={current.tagline}
            onChange={(v) => patchSlide(activeSlide, { tagline: v })}
            multiline
            className="text-3xl md:text-5xl font-black text-white leading-tight whitespace-pre-line max-w-2xl"
          />
          <div className="mt-4">
            <LinkableButton
              label={current.buttonText}
              url={current.buttonUrl ?? ""}
              onLabelChange={(v) => patchSlide(activeSlide, { buttonText: v })}
              onUrlChange={(v) => patchSlide(activeSlide, { buttonUrl: v })}
              className="px-8 py-3.5 rounded-full text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: accent, color: config.primaryColor }}
            />
          </div>
        </div>

        {/* Left arrow */}
        {total > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="前のスライド"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Right arrow */}
        {total > 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            aria-label="次のスライド"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}

        {/* Dot indicators */}
        {total > 1 && (
          <div className="absolute bottom-6 left-0 right-0 z-20 flex justify-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveSlide(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeSlide ? "w-6 bg-white" : "w-2 bg-white/40"
                }`}
                aria-label={`スライド ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Editing-only: slide editor panels ── */}
      {isEditing && (
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-6">
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-widest mb-4">
            スライドを編集
          </p>
          <div className="flex flex-col gap-4">
            {slides.map((slide, idx) => (
              <div
                key={idx}
                className={`flex gap-4 items-start p-4 rounded-xl border transition-colors ${
                  idx === activeSlide
                    ? "border-blue-400 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                {/* Slide number + activate */}
                <button
                  onClick={() => setActiveSlide(idx)}
                  className="flex-shrink-0 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: idx === activeSlide ? accent : "#e5e7eb",
                    color: idx === activeSlide ? config.primaryColor : "#6b7280",
                  }}
                  aria-label={`スライド ${idx + 1} を表示`}
                >
                  {idx + 1}
                </button>

                {/* Thumbnail */}
                <div className="flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border border-gray-200 relative">
                  <EditableImage
                    url={slide.imageUrl ?? ""}
                    onChange={(url) => patchSlide(idx, { imageUrl: url })}
                    className="absolute inset-0"
                    primaryColor={config.primaryColor}
                    accentColor={accent}
                    alt={`スライド ${idx + 1} 画像`}
                  />
                </div>

                {/* Text fields */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Eyebrow</p>
                    <EditableText
                      tag="span"
                      value={slide.eyebrow}
                      onChange={(v) => patchSlide(idx, { eyebrow: v })}
                      className="text-xs text-gray-700 block"
                    />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">Tagline</p>
                    <EditableText
                      tag="span"
                      value={slide.tagline}
                      onChange={(v) => patchSlide(idx, { tagline: v })}
                      className="text-xs text-gray-700 block"
                    />
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">ボタン</p>
                    <EditableText
                      tag="span"
                      value={slide.buttonText}
                      onChange={(v) => patchSlide(idx, { buttonText: v })}
                      className="text-xs text-gray-700 block"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
