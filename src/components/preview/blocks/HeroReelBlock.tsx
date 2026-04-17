"use client";
import { HeroReelBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import LinkableButton from "../LinkableButton";
import { useEditing } from "@/contexts/EditingContext";

interface Props {
  block: HeroReelBlock;
  config: SiteConfig;
  onChange: (b: HeroReelBlock) => void;
}

function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

export default function HeroReelBlockComponent({ block, config, onChange }: Props) {
  const isEditing = useEditing();
  const u = (patch: Partial<HeroReelBlock>) => onChange({ ...block, ...patch });
  const accent = config.accentColor ?? "#F5C842";
  const primary = config.primaryColor ?? "#1a1a2e";

  const youtubeId = block.videoUrl ? getYouTubeId(block.videoUrl) : null;

  return (
    <section
      className="relative overflow-hidden min-h-[580px]"
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, #0d0d14 60%, #0a0a0f 100%)`,
      }}
    >
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 px-6 md:px-12 py-16 items-center max-w-6xl mx-auto min-h-[580px]">
        {/* LEFT: Text content */}
        <div className="flex flex-col gap-5 text-white">
          {/* Eyebrow */}
          <EditableText
            tag="p"
            value={block.eyebrow}
            onChange={(v) => u({ eyebrow: v })}
            className="text-[11px] tracking-[0.25em] uppercase font-medium"
            style={{ color: accent }}
          />

          {/* Tagline */}
          <EditableText
            tag="h1"
            value={block.tagline}
            onChange={(v) => u({ tagline: v })}
            multiline
            className="text-3xl md:text-5xl font-black text-white leading-tight whitespace-pre-line"
          />

          {/* Body */}
          <EditableText
            tag="p"
            value={block.body}
            onChange={(v) => u({ body: v })}
            multiline
            className="text-sm md:text-base text-white/70 leading-relaxed"
          />

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-3 mt-2">
            <LinkableButton
              label={block.buttonText}
              url={block.buttonUrl ?? ""}
              onLabelChange={(v) => u({ buttonText: v })}
              onUrlChange={(v) => u({ buttonUrl: v })}
              className="px-7 py-3.5 rounded-full text-sm font-bold shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: accent, color: primary }}
            />
            <LinkableButton
              label={block.buttonText2}
              url={block.buttonUrl2 ?? ""}
              onLabelChange={(v) => u({ buttonText2: v })}
              onUrlChange={(v) => u({ buttonUrl2: v })}
              className="px-7 py-3.5 rounded-full text-sm font-medium border border-white/40 text-white hover:bg-white/10 transition-colors"
            />
          </div>
        </div>

        {/* RIGHT: Video player */}
        <div className="relative flex items-center justify-center">
          {/* Decorative glow ring behind the frame */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none z-0"
            style={{
              boxShadow: `0 0 60px ${accent}40, 0 0 120px ${accent}20`,
              transform: "scale(1.04)",
            }}
          />

          {/* Video frame */}
          <div
            className="relative z-10 w-full rounded-2xl overflow-hidden shadow-2xl"
            style={{
              aspectRatio: "16/9",
              border: `1px solid rgba(255,255,255,0.15)`,
              background: "#000",
            }}
          >
            {youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                title="Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            ) : (
              <div className="relative w-full h-full">
                <EditableImage
                  url={block.videoUrl ?? ""}
                  onChange={(url) => u({ videoUrl: url })}
                  className="absolute inset-0 w-full h-full object-cover"
                  primaryColor={config.primaryColor}
                  accentColor={accent}
                  alt="video thumbnail"
                />
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `${accent}cc`,
                      boxShadow: `0 0 30px ${accent}60`,
                    }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <polygon points="8,5 19,12 8,19" fill="#0a0a0f" />
                    </svg>
                  </div>
                </div>
                {/* Video URL input hint in editing mode */}
                {isEditing && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                    <span className="text-[10px] text-white/60 bg-black/60 px-3 py-1 rounded-full">
                      YouTube URL または画像を設定してください
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video URL editing hint */}
          {isEditing && (
            <div className="absolute -bottom-8 left-0 right-0 flex justify-center z-20">
              <div className="flex items-center gap-2 text-[10px] text-white/40">
                <span>videoUrl:</span>
                <EditableText
                  tag="span"
                  value={block.videoUrl ?? ""}
                  onChange={(v) => u({ videoUrl: v })}
                  className="text-[10px] text-white/60 underline underline-offset-2 min-w-[120px]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
