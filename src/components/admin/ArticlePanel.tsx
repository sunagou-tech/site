"use client";

import { Article, SiteConfig } from "@/types/site";
import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Eye, EyeOff, Bold, List, Save, FileText } from "lucide-react";
import EditableImage from "@/components/preview/EditableImage";

interface Props {
  config: SiteConfig;
  onConfigChange: (config: SiteConfig) => void;
}

function uid() { return Math.random().toString(36).slice(2, 9); }

function newArticle(): Article {
  return {
    id: uid(), slug: `article-${Date.now()}`,
    title: "新しい記事タイトル",
    date: new Date().toISOString().slice(0, 10),
    category: "コラム", author: "編集部",
    excerpt: "記事の概要をここに入力してください。",
    body: "<p>記事の本文をここから書き始めてください。</p>",
    imageUrl: "", published: false,
  };
}

export default function ArticlePanel({ config, onConfigChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    config.articles.length > 0 ? config.articles[0].id : null
  );
  const bodyRef = useRef<HTMLDivElement>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const selected = config.articles.find((a) => a.id === selectedId) ?? null;
  const categories = Array.from(new Set(config.articles.map((a) => a.category)));

  function updateArticle(patch: Partial<Article>) {
    if (!selected) return;
    onConfigChange({
      ...config,
      articles: config.articles.map((a) => (a.id === selected.id ? { ...a, ...patch } : a)),
    });
  }

  function addArticle() {
    const a = newArticle();
    onConfigChange({ ...config, articles: [a, ...config.articles] });
    setSelectedId(a.id);
  }

  function deleteArticle(id: string) {
    const next = config.articles.filter((a) => a.id !== id);
    onConfigChange({ ...config, articles: next });
    setSelectedId(next.length > 0 ? next[0].id : null);
  }

  // Sync contentEditable body
  useEffect(() => {
    if (bodyRef.current && selected) {
      if (bodyRef.current.innerHTML !== selected.body) {
        bodyRef.current.innerHTML = selected.body || "";
      }
    }
  }, [selected?.id]);

  function execCmd(cmd: string, value?: string) {
    document.execCommand(cmd, false, value);
    if (bodyRef.current) updateArticle({ body: bodyRef.current.innerHTML });
  }

  const filteredArticles = config.articles.filter(
    (a) => filterCategory === "all" || a.category === filterCategory
  );

  return (
    <div className="flex-1 flex overflow-hidden bg-gray-50">
      {/* ─── 記事一覧 ───────────────────────── */}
      <div className="w-64 border-r border-gray-200 bg-white flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">記事一覧</span>
            <span className="text-xs text-gray-400">({config.articles.length})</span>
          </div>
          <button
            onClick={addArticle}
            className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors"
            title="新規記事"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Category filter */}
        {categories.length > 0 && (
          <div className="px-3 py-2 border-b border-gray-100 flex gap-1 flex-wrap">
            <button onClick={() => setFilterCategory("all")}
              className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${filterCategory === "all" ? "bg-indigo-100 text-indigo-700" : "text-gray-400 hover:text-gray-600"}`}>
              すべて
            </button>
            {categories.map((c) => (
              <button key={c} onClick={() => setFilterCategory(c)}
                className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${filterCategory === c ? "bg-indigo-100 text-indigo-700" : "text-gray-400 hover:text-gray-600"}`}>
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Article list */}
        <div className="flex-1 overflow-y-auto">
          {filteredArticles.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              <FileText size={24} className="mx-auto mb-2 opacity-30" />
              <p>記事がありません</p>
              <button onClick={addArticle} className="mt-2 text-indigo-500 hover:underline">
                + 新規作成
              </button>
            </div>
          ) : (
            filteredArticles.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedId(article.id)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors group
                  ${selectedId === article.id ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""}`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${selectedId === article.id ? "text-indigo-700" : "text-gray-800"}`}>
                      {article.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] text-gray-400">{article.date}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-gray-100 text-gray-400">{article.category}</span>
                    </div>
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${article.published ? "bg-green-400" : "bg-gray-300"}`} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ─── 記事エディタ ─────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              <input
                type="date"
                value={selected.date}
                onChange={(e) => updateArticle({ date: e.target.value })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                value={selected.category}
                onChange={(e) => updateArticle({ category: e.target.value })}
                placeholder="カテゴリ"
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                value={selected.author}
                onChange={(e) => updateArticle({ author: e.target.value })}
                placeholder="著者名"
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-24 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                value={selected.slug}
                onChange={(e) => updateArticle({ slug: e.target.value })}
                placeholder="slug (URL)"
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 w-32 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateArticle({ published: !selected.published })}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                  selected.published ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {selected.published ? <><Eye size={11} /> 公開中</> : <><EyeOff size={11} /> 下書き</>}
              </button>
              <button
                onClick={() => deleteArticle(selected.id)}
                className="text-xs text-red-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 transition-colors"
                title="記事を削除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Editor body */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto py-10 px-6">
              {/* Featured image */}
              <div className="h-52 rounded-2xl overflow-hidden relative mb-8 bg-gray-100">
                <EditableImage
                  url={selected.imageUrl}
                  onChange={(url) => updateArticle({ imageUrl: url })}
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                  placeholderGradient={`linear-gradient(135deg, ${config.primaryColor}20, ${config.accentColor}15)`}
                  primaryColor={config.primaryColor}
                  accentColor={config.accentColor}
                  alt={selected.title}
                />
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 mb-5">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ backgroundColor: `${config.accentColor}20`, color: config.primaryColor }}
                >
                  {selected.category}
                </span>
                <span className="text-xs text-gray-400">{selected.date}</span>
                <span className="text-xs text-gray-400">by {selected.author}</span>
              </div>

              {/* Title */}
              <textarea
                value={selected.title}
                onChange={(e) => updateArticle({ title: e.target.value })}
                className="w-full text-3xl font-bold text-gray-900 resize-none border-none outline-none leading-snug mb-3 bg-transparent"
                rows={2}
                placeholder="記事タイトルを入力"
              />

              {/* Excerpt */}
              <textarea
                value={selected.excerpt}
                onChange={(e) => updateArticle({ excerpt: e.target.value })}
                className="w-full text-sm text-gray-500 resize-none border-none outline-none leading-relaxed mb-8 bg-transparent border-b border-dashed border-gray-200 pb-6"
                rows={2}
                placeholder="概要文（一覧ページに表示されます）"
              />

              {/* Body toolbar */}
              <div className="flex items-center gap-1 mb-3 p-2 bg-gray-100 rounded-lg sticky top-0 z-10">
                <button onClick={() => execCmd("bold")} className="p-1.5 rounded hover:bg-white transition-colors font-bold text-xs text-gray-700" title="太字 (Ctrl+B)">
                  B
                </button>
                <button onClick={() => execCmd("italic")} className="p-1.5 rounded hover:bg-white transition-colors italic text-xs text-gray-700" title="斜体 (Ctrl+I)">
                  I
                </button>
                <div className="w-px h-4 bg-gray-300 mx-0.5" />
                <button onClick={() => execCmd("formatBlock", "h2")} className="p-1.5 rounded hover:bg-white transition-colors text-xs font-bold text-gray-700" title="見出し2">
                  H2
                </button>
                <button onClick={() => execCmd("formatBlock", "h3")} className="p-1.5 rounded hover:bg-white transition-colors text-xs font-bold text-gray-700" title="見出し3">
                  H3
                </button>
                <button onClick={() => execCmd("formatBlock", "p")} className="p-1.5 rounded hover:bg-white transition-colors text-xs text-gray-700" title="段落">
                  ¶
                </button>
                <div className="w-px h-4 bg-gray-300 mx-0.5" />
                <button onClick={() => execCmd("insertUnorderedList")} className="p-1.5 rounded hover:bg-white transition-colors" title="箇条書き">
                  <List size={13} className="text-gray-700" />
                </button>
                <button onClick={() => execCmd("insertOrderedList")} className="p-1.5 rounded hover:bg-white transition-colors text-xs text-gray-700" title="番号リスト">
                  1.
                </button>
                <div className="w-px h-4 bg-gray-300 mx-0.5" />
                <button onClick={() => execCmd("removeFormat")} className="p-1.5 rounded hover:bg-white transition-colors text-xs text-gray-400" title="書式を削除">
                  T✕
                </button>
              </div>

              {/* Body editor */}
              <div
                ref={bodyRef}
                contentEditable
                suppressContentEditableWarning
                onInput={() => bodyRef.current && updateArticle({ body: bodyRef.current.innerHTML })}
                className="min-h-80 text-sm text-gray-700 leading-7 outline-none
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:border-b [&_h2]:border-gray-100 [&_h2]:pb-2
                  [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-800 [&_h3]:mt-6 [&_h3]:mb-2
                  [&_strong]:font-bold [&_em]:italic
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ul]:my-3
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_ol]:my-3
                  [&_p]:mb-4 [&_p:empty]:min-h-[1.5rem]"
                data-placeholder="本文を入力してください..."
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <FileText size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm mb-1">記事を選択してください</p>
            <p className="text-xs text-gray-300 mb-4">または新しい記事を作成します</p>
            <button
              onClick={addArticle}
              className="inline-flex items-center gap-2 text-sm text-indigo-500 border border-indigo-200 px-4 py-2 rounded-full hover:border-indigo-400 transition-colors"
            >
              <Plus size={14} /> 新しい記事を作成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
