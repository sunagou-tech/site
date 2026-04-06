"use client";

import { useState, useRef, useEffect } from "react";
import { IconValue } from "@/types/site";
import { useEditing } from "@/contexts/EditingContext";
import IconPicker from "./IconPicker";
import { ICON_REGISTRY } from "./iconRegistry";

interface Props {
  icon: IconValue;
  onChange: (icon: IconValue) => void;
  /** Extra className on the wrapper */
  className?: string;
  style?: React.CSSProperties;
  /** Stroke color for Lucide icons */
  iconColor?: string;
}

export default function IconDisplay({ icon, onChange, className = "", style, iconColor }: Props) {
  const isEditing = useEditing();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startSize: 48 });

  // Global mouse handlers for image resize drag
  useEffect(() => {
    if (!dragging) return;
    function onMove(e: MouseEvent) {
      const delta = e.clientX - dragRef.current.startX;
      const newSize = Math.max(20, Math.min(240, dragRef.current.startSize + delta));
      onChange({ ...icon, size: Math.round(newSize) });
    }
    function onUp() {
      setDragging(false);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, icon, onChange]);

  const size = icon.size ?? 32;

  function renderContent() {
    if (icon.kind === "emoji") {
      return <span style={{ fontSize: size, lineHeight: 1 }}>{icon.value}</span>;
    }

    if (icon.kind === "lucide") {
      const IconComp = ICON_REGISTRY[icon.value];
      if (!IconComp) {
        return <span className="text-gray-400 text-xs">{icon.value}</span>;
      }
      return <IconComp size={size} strokeWidth={1.5} color={iconColor} />;
    }

    if (icon.kind === "image") {
      return (
        <div className="relative inline-flex" style={{ width: size, flexShrink: 0 }}>
          <img
            src={icon.value}
            alt=""
            style={{ width: size, height: size, objectFit: "contain", display: "block" }}
          />
          {isEditing && (
            <div
              className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize rounded-r opacity-0 group-hover/img:opacity-100 hover:opacity-100 transition-opacity"
              style={{ background: "rgba(59,130,246,0.7)" }}
              title="ドラッグして幅を変更"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dragRef.current = { startX: e.clientX, startSize: size };
                setDragging(true);
              }}
            />
          )}
        </div>
      );
    }

    return null;
  }

  // Public view: just render
  if (!isEditing) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`} style={style}>
        {renderContent()}
      </div>
    );
  }

  // Edit view: clickable button + picker
  return (
    <div className={`relative inline-flex items-center justify-center group/img ${className}`} style={style}>
      <button
        type="button"
        onClick={() => !dragging && setPickerOpen((p) => !p)}
        className="relative group outline-none flex items-center justify-center rounded-lg focus:ring-2 focus:ring-blue-400"
        title="クリックしてアイコンを変更"
      >
        {renderContent()}
        {/* Hover overlay */}
        <span className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
        {/* Edit badge */}
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full text-white text-[8px] flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
          ✎
        </span>
      </button>

      {pickerOpen && (
        <IconPicker
          current={icon}
          onChange={(v) => {
            onChange(v);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
