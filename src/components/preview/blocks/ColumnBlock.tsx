"use client";

import { ColumnBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import LinkableButton from "../LinkableButton";
import { LayoutGrid, List } from "lucide-react";
import { useEditing } from "@/contexts/EditingContext";

interface Props {
  block: ColumnBlock;
  config: SiteConfig;
  onChange: (b: ColumnBlock) => void;
}

export default function ColumnBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<ColumnBlock>) => onChange({ ...block, ...patch });
  const isEditing = useEditing();
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  const published = config.articles.filter((a) => a.published);
  const displayed = published.length > 0 ? published : config.articles;
  const items = displayed.slice(0, block.maxItems);

  const gridCardInner = (article: (typeof items)[0]) => (
    <>
      {/* Thumbnail */}
      <div className="h-44 overflow-hidden relative"
        style={{ background: article.imageUrl ? undefined : `linear-gradient(135deg, ${config.primaryColor}15, ${config.accentColor}15)` }}>
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-3xl opacity-20">📝</span>
          </div>
        )}
        <span
          className="absolute top-3 left-3 text-[10px] font-semibold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: config.accentColor, color: config.primaryColor }}
        >
          {article.category}
        </span>
      </div>
      {/* Body */}
      <div className="p-5">
        <p className="text-[11px] text-gray-400 mb-2">{article.date}</p>
        <h3 className={`text-sm font-bold text-gray-900 leading-snug mb-2 line-clamp-2 ${fontClass}`}>
          {article.title}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{article.excerpt}</p>
        <div className="mt-4 flex items-center gap-1 text-xs font-medium" style={{ color: config.primaryColor }}>
          <span>続きを読む</span>
          <span>→</span>
        </div>
      </div>
    </>
  );

  const listCardInner = (article: (typeof items)[0]) => (
    <>
      {/* Thumbnail */}
      <div className="w-28 h-20 rounded-xl overflow-hidden flex-shrink-0 relative"
        style={{ background: article.imageUrl ? undefined : `linear-gradient(135deg, ${config.primaryColor}15, ${config.accentColor}15)` }}>
        {article.imageUrl ? (
          <img src={article.imageUrl} alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl opacity-20">📝</span>
          </div>
        )}
      </div>
      {/* Body */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${config.accentColor}25`, color: config.primaryColor }}
          >
            {article.category}
          </span>
          <span className="text-[11px] text-gray-400">{article.date}</span>
        </div>
        <h3 className={`text-sm font-bold text-gray-900 leading-snug mb-1 truncate ${fontClass}`}>
          {article.title}
        </h3>
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-1">{article.excerpt}</p>
      </div>
      <div className="flex items-center flex-shrink-0">
        <span className="text-xs font-medium" style={{ color: config.primaryColor }}>→</span>
      </div>
    </>
  );

  return (
    <section className="py-20 px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 rounded-full" style={{ backgroundColor: config.accentColor }} />
              <EditableText
                tag="span"
                value={block.subheading}
                onChange={(v) => u({ subheading: v })}
                className="text-xs text-gray-400 uppercase tracking-widest"
              />
            </div>
            <EditableText
              tag="h2"
              value={block.heading}
              onChange={(v) => u({ heading: v })}
              className={`text-3xl font-bold text-gray-900 block ${fontClass}`}
            />
          </div>
          {isEditing && (
            <div className="flex items-center gap-3">
              {/* Layout toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => u({ layout: "grid" })}
                  className={`p-1.5 rounded-md transition-colors ${block.layout === "grid" ? "bg-white shadow text-gray-700" : "text-gray-400"}`}
                  title="グリッド表示"
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  onClick={() => u({ layout: "list" })}
                  className={`p-1.5 rounded-md transition-colors ${block.layout === "list" ? "bg-white shadow text-gray-700" : "text-gray-400"}`}
                  title="リスト表示"
                >
                  <List size={13} />
                </button>
              </div>
              {/* Max items */}
              <select
                value={block.maxItems}
                onChange={(e) => u({ maxItems: Number(e.target.value) })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-600"
              >
                {[3, 4, 6, 8, 9, 12].map((n) => (
                  <option key={n} value={n}>{n}件表示</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Empty state */}
        {items.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-200 rounded-2xl">
            <p className="text-gray-400 text-sm mb-1">記事がありません</p>
            <p className="text-xs text-gray-300">「記事管理」タブから記事を追加してください</p>
          </div>
        ) : block.layout === "grid" ? (
          /* Grid layout */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((article) =>
              isEditing ? (
                <div
                  key={article.id}
                  className="group rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow bg-white"
                >
                  {gridCardInner(article)}
                </div>
              ) : (
                <a
                  key={article.id}
                  href={`/column/${article.slug}`}
                  className="group rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow bg-white block no-underline"
                >
                  {gridCardInner(article)}
                </a>
              )
            )}
          </div>
        ) : (
          /* List layout */
          <div className="space-y-4">
            {items.map((article) =>
              isEditing ? (
                <div
                  key={article.id}
                  className="group flex gap-5 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow bg-white"
                >
                  {listCardInner(article)}
                </div>
              ) : (
                <a
                  key={article.id}
                  href={`/column/${article.slug}`}
                  className="group flex gap-5 p-4 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow bg-white no-underline"
                >
                  {listCardInner(article)}
                </a>
              )
            )}
          </div>
        )}

        {/* View all button */}
        {displayed.length > block.maxItems && (
          <div className="mt-10 text-center">
            <LinkableButton
              label={block.viewAllText}
              url={block.viewAllUrl}
              onLabelChange={(v) => u({ viewAllText: v })}
              onUrlChange={(v) => u({ viewAllUrl: v })}
              className="inline-flex items-center gap-2 text-sm font-semibold px-8 py-3.5 rounded-full border-2 transition-colors hover:opacity-80"
              style={{ borderColor: config.primaryColor, color: config.primaryColor }}
            />
          </div>
        )}

        {/* No published articles hint */}
        {published.length === 0 && config.articles.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-4">
            ※ 公開中の記事がないため下書きを表示しています。「記事管理」から公開設定を変更できます。
          </p>
        )}
      </div>
    </section>
  );
}
