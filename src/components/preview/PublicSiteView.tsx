"use client";

import { useState, useEffect } from "react";
import { defaultConfig, SiteConfig } from "@/types/site";
import BlockRenderer from "@/components/preview/blocks/BlockRenderer";

interface Props {
  slug?: string;
}

export default function PublicSiteView({ slug }: Props) {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("site-config");
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch {
        setConfig(defaultConfig);
      }
    } else {
      setConfig(defaultConfig);
    }
  }, []);

  if (!config) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">読み込み中...</div>
      </div>
    );
  }

  const fontClass =
    config.fontFamily === "serif"
      ? "font-serif"
      : config.fontFamily === "mono"
      ? "font-mono"
      : "font-sans";

  // Determine sections to render
  let sections = config.sections;
  let pageNotFound = false;

  if (slug) {
    const page = config.pages.find((p) => p.slug === slug);
    if (!page) {
      pageNotFound = true;
    } else {
      sections = page.sections;
    }
  }

  return (
    <div className={fontClass}>
      {/* Read-only public NavBar */}
      <nav className="sticky top-0 z-20 bg-white border-b border-gray-100 px-8 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold shadow"
            style={{ backgroundColor: config.primaryColor }}
          >
            {config.title ? config.title.charAt(0).toUpperCase() : "S"}
          </div>
          <a href="/" className="font-bold text-sm tracking-wide hover:opacity-80 transition-opacity">
            {config.title}
          </a>
        </div>

        <div className="flex items-center gap-4">
          {config.navLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href={config.navLinks.find((l) => l.url === "/contact")?.url ?? "/contact"}
            className="text-xs text-white px-4 py-2 rounded-full font-medium shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: config.primaryColor }}
          >
            お問い合わせ
          </a>
        </div>
      </nav>

      {/* Page content */}
      {pageNotFound ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-700 mb-2">ページが見つかりません</p>
            <p className="text-sm text-gray-400 mb-6">お探しのページは存在しないか、移動した可能性があります。</p>
            <a
              href="/"
              className="text-sm font-medium px-6 py-2.5 rounded-full text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: config.primaryColor }}
            >
              ホームに戻る
            </a>
          </div>
        </div>
      ) : sections.length === 0 ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-gray-400 text-sm">コンテンツがありません</p>
        </div>
      ) : (
        sections.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            config={config}
            onChange={() => {}}
          />
        ))
      )}
    </div>
  );
}
