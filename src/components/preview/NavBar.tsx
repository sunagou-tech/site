"use client";

import { SiteConfig, NavLink, uid } from "@/types/site";
import EditableText from "./EditableText";
import LinkableButton from "./LinkableButton";
import { Plus, Trash2 } from "lucide-react";

interface Props {
  config: SiteConfig;
  onConfigChange: (c: SiteConfig) => void;
}

export default function NavBar({ config, onConfigChange }: Props) {
  function updateLink(id: string, patch: Partial<NavLink>) {
    onConfigChange({
      ...config,
      navLinks: config.navLinks.map((l) => (l.id === id ? { ...l, ...patch } : l)),
    });
  }

  function addLink() {
    const newLink: NavLink = { id: uid(), label: "新しいリンク", url: "/" };
    onConfigChange({ ...config, navLinks: [...config.navLinks, newLink] });
  }

  function removeLink(id: string) {
    onConfigChange({ ...config, navLinks: config.navLinks.filter((l) => l.id !== id) });
  }

  return (
    <nav className="sticky top-0 z-20 bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        {config.logoUrl ? (
          <img src={config.logoUrl} alt={config.title} className="h-8 w-auto object-contain" />
        ) : (
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold shadow"
            style={{ backgroundColor: config.primaryColor }}
          >
            {config.title?.charAt(0)?.toUpperCase() ?? "S"}
          </div>
        )}
        <EditableText
          tag="span"
          value={config.title}
          onChange={(v) => onConfigChange({ ...config, title: v })}
          className="font-bold text-sm tracking-wide"
        />
      </div>

      <div className="flex items-center gap-4">
        {config.navLinks.map((link) => (
          <span key={link.id} className="relative group/navitem flex items-center gap-1">
            <LinkableButton
              label={link.label}
              url={link.url}
              onLabelChange={(v) => updateLink(link.id, { label: v })}
              onUrlChange={(v) => updateLink(link.id, { url: v })}
              className="text-xs text-gray-600 hover:text-gray-900 bg-transparent border-0 p-0 cursor-pointer"
            />
            <button
              onClick={() => removeLink(link.id)}
              className="opacity-0 group-hover/navitem:opacity-100 transition-opacity w-3.5 h-3.5 rounded-full bg-red-400 text-white flex items-center justify-center text-[8px] flex-shrink-0 ml-0.5"
            >
              ✕
            </button>
          </span>
        ))}

        <button
          onClick={addLink}
          className="text-gray-300 hover:text-gray-500 transition-colors"
          title="ナビリンクを追加"
        >
          <Plus size={12} />
        </button>

        <LinkableButton
          label="お問い合わせ"
          url={config.navLinks.find((l) => l.url === "/contact")?.url ?? "/contact"}
          onLabelChange={() => {}}
          onUrlChange={() => {}}
          className="text-xs text-white px-4 py-2 rounded-full font-medium shadow-sm"
          style={{ backgroundColor: config.primaryColor }}
        />
      </div>
    </nav>
  );
}
