"use client";

import { useState } from "react";
import EditableText from "./EditableText";
import { Link2 } from "lucide-react";
import { useEditing } from "@/contexts/EditingContext";

interface Props {
  label: string;
  url: string;
  onLabelChange: (v: string) => void;
  onUrlChange: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

const QUICK_LINKS = [
  { label: "ホーム", url: "/" },
  { label: "会社案内", url: "/about" },
  { label: "サービス", url: "/services" },
  { label: "コラム", url: "/column" },
  { label: "お問い合わせ", url: "/contact" },
];

export default function LinkableButton({ label, url, onLabelChange, onUrlChange, className = "", style }: Props) {
  const [editing, setEditing] = useState(false);
  const isEditing = useEditing();

  function handlePublicClick() {
    if (url && (url.startsWith("/") || url.startsWith("http"))) {
      window.location.href = url;
    }
  }

  if (!isEditing) {
    return (
      <button className={className} style={style} onClick={handlePublicClick}>
        <span>{label}</span>
      </button>
    );
  }

  return (
    <span className="relative inline-flex group/lbtn">
      <button className={className} style={style} onClick={(e) => { if (url) e.preventDefault(); }}>
        <EditableText tag="span" value={label} onChange={onLabelChange} />
      </button>

      {/* Link edit trigger */}
      <button
        onClick={(e) => { e.stopPropagation(); setEditing((v) => !v); }}
        className={`absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full flex items-center justify-center z-20 shadow-md transition-all
          opacity-0 group-hover/lbtn:opacity-100
          ${url ? "bg-indigo-600" : "bg-gray-400"}`}
        title="リンク先を設定"
      >
        <Link2 size={9} className="text-white" />
      </button>

      {/* URL editor popover */}
      {editing && (
        <div
          className="absolute top-full left-0 mt-2 z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-72"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">リンク先 URL</p>
          <div className="flex gap-1.5 mb-2">
            <input
              value={url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://... または /about"
              className="flex-1 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              autoFocus
            />
            <button
              onClick={() => setEditing(false)}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700 flex-shrink-0"
            >
              ✓
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_LINKS.map((link) => (
              <button
                key={link.url}
                onClick={() => { onUrlChange(link.url); setEditing(false); }}
                className={`text-[10px] px-2 py-0.5 border rounded-full transition-colors
                  ${url === link.url
                    ? "border-indigo-400 text-indigo-600 bg-indigo-50"
                    : "border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-500"}`}
              >
                {link.label}
              </button>
            ))}
          </div>
          {url && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[9px] text-gray-400 truncate">現在: <span className="font-mono text-indigo-500">{url}</span></p>
              <button onClick={() => { onUrlChange(""); setEditing(false); }}
                className="text-[9px] text-red-400 hover:text-red-600 flex-shrink-0 ml-2">削除</button>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
