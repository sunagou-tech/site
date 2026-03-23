"use client";

import { use, useState, useEffect } from "react";
import { defaultConfig, SiteConfig } from "@/types/site";

export default function ArticleDetailPage({ params }: { params: Promise<{ articleSlug: string }> }) {
  const { articleSlug } = use(params);
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

  const article = config.articles.find((a) => a.slug === articleSlug);

  const fontClass =
    config.fontFamily === "serif"
      ? "font-serif"
      : config.fontFamily === "mono"
      ? "font-mono"
      : "font-sans";

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

      {!article ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-700 mb-2">記事が見つかりません</p>
            <p className="text-sm text-gray-400 mb-6">お探しの記事は存在しないか、削除された可能性があります。</p>
            <a
              href="/column"
              className="text-sm font-medium px-6 py-2.5 rounded-full text-white transition-opacity hover:opacity-80"
              style={{ backgroundColor: config.primaryColor }}
            >
              ← コラムに戻る
            </a>
          </div>
        </div>
      ) : (
        <main className="max-w-3xl mx-auto px-6 py-16">
          {/* Back link */}
          <a
            href="/column"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-10"
          >
            ← コラムに戻る
          </a>

          {/* Featured image */}
          {article.imageUrl && (
            <div className="w-full h-72 rounded-2xl overflow-hidden mb-8">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${config.accentColor}25`, color: config.primaryColor }}
            >
              {article.category}
            </span>
            <span className="text-sm text-gray-400">{article.date}</span>
            {article.author && (
              <span className="text-sm text-gray-400">by {article.author}</span>
            )}
          </div>

          {/* Title */}
          <h1 className={`text-3xl font-bold text-gray-900 leading-snug mb-8 ${fontClass}`}>
            {article.title}
          </h1>

          {/* Body */}
          <div
            className="prose prose-gray max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          {/* Footer back link */}
          <div className="mt-16 pt-8 border-t border-gray-100">
            <a
              href="/column"
              className="inline-flex items-center gap-1.5 text-sm font-medium transition-opacity hover:opacity-80"
              style={{ color: config.primaryColor }}
            >
              ← コラムに戻る
            </a>
          </div>
        </main>
      )}
    </div>
  );
}
