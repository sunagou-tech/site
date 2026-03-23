"use client";
import { VideoBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import { Play } from "lucide-react";

interface Props { block: VideoBlock; config: SiteConfig; onChange: (b: VideoBlock) => void; }

export default function VideoBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<VideoBlock>) => onChange({ ...block, ...patch });
  const fontClass = config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="py-20 px-8" style={{ backgroundColor: `${config.primaryColor}05` }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <EditableText tag="h2" value={block.heading} onChange={(v) => u({ heading: v })}
            className={`text-3xl font-bold text-gray-900 mb-4 block ${fontClass}`} />
          <EditableText tag="p" value={block.body} onChange={(v) => u({ body: v })}
            multiline className="text-sm text-gray-500 leading-relaxed max-w-xl mx-auto block" />
        </div>

        {/* Video player */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-video group cursor-pointer">
          {/* Thumbnail */}
          <EditableImage url={block.thumbnailUrl} onChange={(url) => u({ thumbnailUrl: url })}
            className="absolute inset-0"
            placeholderGradient={`linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}80 100%)`}
            primaryColor={config.primaryColor} accentColor={config.accentColor} alt="video thumbnail" />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

          {/* Play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110 duration-300"
              style={{ backgroundColor: config.accentColor }}>
              <Play size={28} fill={config.primaryColor} style={{ color: config.primaryColor, marginLeft: 4 }} />
            </div>
          </div>

          {/* Video URL input hint */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
            <input
              type="text"
              value={block.videoUrl}
              onChange={(e) => u({ videoUrl: e.target.value })}
              placeholder="YouTube / Vimeo URL を入力…"
              className="flex-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-3 py-1.5 rounded-full border border-white/20 focus:outline-none focus:border-white/50 placeholder:text-white/40"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
