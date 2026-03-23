"use client";

import { GalleryBlock, GalleryImage, SiteConfig, uid } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  block: GalleryBlock;
  config: SiteConfig;
  onChange: (b: GalleryBlock) => void;
}

function updateImage(block: GalleryBlock, id: string, patch: Partial<GalleryImage>): GalleryBlock {
  return { ...block, images: block.images.map((img) => (img.id === id ? { ...img, ...patch } : img)) };
}

const SPAN_CLASSES: Record<GalleryImage["span"], string> = {
  normal: "col-span-1 row-span-1",
  wide:   "col-span-2 row-span-1",
  tall:   "col-span-1 row-span-2",
};

const PALETTES = ["#e2e8f0", "#fef9c3", "#dcfce7", "#ede9fe", "#fee2e2", "#dbeafe"];

export default function GalleryBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<GalleryBlock>) => onChange({ ...block, ...patch });
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  const addImage = () => {
    const newImg: GalleryImage = { id: uid(), url: "", caption: "新しい画像", span: "normal" };
    onChange({ ...block, images: [...block.images, newImg] });
  };

  return (
    <section className="bg-[#fbfbfb] px-12 py-28">
      <div className="text-center mb-14">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="w-1 h-3 rounded-full" style={{ backgroundColor: config.accentColor }} />
          <EditableText tag="span" value={block.subheading} onChange={(v) => u({ subheading: v })}
            className="label-text text-gray-400 uppercase tracking-widest" />
        </div>
        <EditableText tag="h2" value={block.heading} onChange={(v) => u({ heading: v })}
          className={`section-heading font-bold text-gray-900 block text-center ${fontClass}`} />
      </div>

      <div className="grid grid-cols-3 gap-4 auto-rows-[200px]">
        {block.images.map((img, idx) => (
          <div key={img.id} className={`relative group/cell rounded-2xl overflow-hidden ${SPAN_CLASSES[img.span]}`}>
            <EditableImage
              url={img.url}
              onChange={(url) => onChange(updateImage(block, img.id, { url }))}
              className="w-full h-full"
              placeholderGradient={`linear-gradient(135deg, ${PALETTES[idx % PALETTES.length]}, ${PALETTES[(idx + 2) % PALETTES.length]})`}
              primaryColor={config.primaryColor}
              accentColor={config.accentColor}
              alt={img.caption}
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 py-3 opacity-0 group-hover/cell:opacity-100 transition-opacity">
              <EditableText tag="p" value={img.caption} onChange={(v) => onChange(updateImage(block, img.id, { caption: v }))} className="text-xs text-white font-medium" />
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/cell:opacity-100 transition-opacity">
              <select value={img.span} onChange={(e) => onChange(updateImage(block, img.id, { span: e.target.value as GalleryImage["span"] }))}
                className="text-[10px] bg-white/90 border-0 rounded px-1 py-0.5 shadow cursor-pointer">
                <option value="normal">1×1</option>
                <option value="wide">2×1</option>
                <option value="tall">1×2</option>
              </select>
              <button onClick={() => onChange({ ...block, images: block.images.filter((i) => i.id !== img.id) })}
                className="bg-red-500 text-white rounded p-0.5 shadow hover:bg-red-600 transition-colors">
                <Trash2 size={10} />
              </button>
            </div>
          </div>
        ))}
        <button onClick={addImage} className="col-span-1 row-span-1 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 hover:border-gray-400 hover:bg-gray-50 transition-colors">
          <Plus size={20} className="text-gray-400" />
          <span className="text-xs text-gray-400">画像を追加</span>
        </button>
      </div>
    </section>
  );
}
