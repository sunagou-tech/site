"use client";

import { TeamBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";

interface Props {
  block: TeamBlock;
  config: SiteConfig;
  onChange: (b: TeamBlock) => void;
}

function patchMember(block: TeamBlock, idx: number, patch: Partial<TeamBlock["members"][0]>): TeamBlock {
  const next = [...block.members];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, members: next };
}

export default function TeamBlockComponent({ block, config, onChange }: Props) {
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-white py-20 px-8">
      {/* Header */}
      <div className="max-w-5xl mx-auto text-center mb-14">
        <EditableText
          tag="p"
          value={block.subheading}
          onChange={(v) => onChange({ ...block, subheading: v })}
          className="text-xs text-gray-400 tracking-widest uppercase mb-2"
        />
        <EditableText
          tag="h2"
          value={block.heading}
          onChange={(v) => onChange({ ...block, heading: v })}
          className={`text-3xl font-bold text-gray-900 ${fontClass}`}
        />
        <div className="w-12 h-1 rounded-full mx-auto mt-4" style={{ backgroundColor: config.accentColor }} />
      </div>

      {/* Members Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
        {block.members.map((member, idx) => (
          <div key={idx} className="text-center group">
            {/* Avatar */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              {member.imageUrl ? (
                <EditableImage
                  url={member.imageUrl}
                  onChange={(url) => onChange(patchMember(block, idx, { imageUrl: url }))}
                  className="absolute inset-0 rounded-full overflow-hidden"
                  primaryColor={config.primaryColor}
                  accentColor={config.accentColor}
                  alt={member.name}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-md relative group/avatar cursor-pointer"
                  style={{ backgroundColor: config.primaryColor }}
                  onClick={() => onChange(patchMember(block, idx, { imageUrl: " " }))}
                >
                  {member.name.charAt(0)}
                  <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover/avatar:opacity-100 text-[9px] text-white transition-opacity">+ 画像</span>
                  </div>
                </div>
              )}
              {member.imageUrl && member.imageUrl.trim() && (
                <button
                  onClick={() => onChange(patchMember(block, idx, { imageUrl: "" }))}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Info */}
            <EditableText
              tag="p"
              value={member.role}
              onChange={(v) => onChange(patchMember(block, idx, { role: v }))}
              className="text-[10px] tracking-widest uppercase mb-1 font-medium"
              style={{ color: config.accentColor }}
            />
            <EditableText
              tag="h3"
              value={member.name}
              onChange={(v) => onChange(patchMember(block, idx, { name: v }))}
              className={`text-sm font-bold text-gray-900 mb-2 block ${fontClass}`}
            />
            <EditableText
              tag="p"
              value={member.bio}
              onChange={(v) => onChange(patchMember(block, idx, { bio: v }))}
              multiline
              className="text-[11px] text-gray-400 leading-relaxed block"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
