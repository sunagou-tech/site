"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Article, ArticleBlock, SiteConfig, defaultConfig, uid } from "@/types/site";
import ArticleBlockEditor from "@/components/admin/ArticleBlockEditor";

// ── helpers ──────────────────────────────────────────────────
function newArticle(): Article {
  return {
    id: uid(),
    slug: `article-${Date.now()}`,
    title: "新しい記事タイトル",
    date: new Date().toISOString().slice(0, 10),
    category: "コラム",
    author: "編集部",
    excerpt: "記事の概要をここに入力してください。検索結果にも表示される重要な文章です。",
    body: "<p>記事の本文をここから書き始めてください。</p>",
    bodyBlocks: [{ id: uid(), type: "paragraph", html: "" }],
    imageUrl: "",
    published: false,
  };
}

function seoScore(desc: string): { score: number; color: string; label: string } {
  const len = desc.length;
  if (len === 0) return { score: 0, color: "#E5E7EB", label: "未設定" };
  if (len < 60)  return { score: 30,  color: "#F59E0B", label: "短すぎ" };
  if (len <= 160) return { score: 100, color: "#10B981", label: "最適" };
  return { score: 60, color: "#EF4444", label: "長すぎ" };
}

// ══════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════
export default function ColumnClient() {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [editorTab, setEditorTab] = useState<"article" | "seo">("article");
  const [saving, setSaving] = useState(false);

  // Load config from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("site-config");
    const cfg: SiteConfig = saved ? (() => { try { return JSON.parse(saved); } catch { return defaultConfig; } })() : defaultConfig;
    if (!cfg.articles) cfg.articles = [];
    setConfig(cfg);
    if (cfg.articles.length > 0) setSelectedId(cfg.articles[0].id);
  }, []);

  // Debounced save
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function saveConfig(cfg: SiteConfig) {
    setConfig(cfg);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem("site-config", JSON.stringify(cfg));
      setSaving(false);
    }, 600);
  }

  const articles = config?.articles ?? [];
  const selected = articles.find(a => a.id === selectedId) ?? null;
  const categories = Array.from(new Set(articles.map(a => a.category)));

  const filtered = articles.filter(a => {
    const matchCat = filterCat === "all" || a.category === filterCat;
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function updateArticle(patch: Partial<Article>) {
    if (!selected || !config) return;
    saveConfig({ ...config, articles: articles.map(a => a.id === selected.id ? { ...a, ...patch } : a) });
  }

  function addArticle() {
    if (!config) return;
    const a = newArticle();
    saveConfig({ ...config, articles: [a, ...articles] });
    setSelectedId(a.id);
    setEditorTab("article");
  }

  function deleteArticle(id: string) {
    if (!config) return;
    const next = articles.filter(a => a.id !== id);
    saveConfig({ ...config, articles: next });
    setSelectedId(next.length > 0 ? next[0].id : null);
  }

  if (!config) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#F9FAFB", color: "#94A3B8", fontSize: 14 }}>
      読み込み中...
    </div>
  );

  const titleSeo = selected?.metaTitle || selected?.title || "";
  const descSeo  = selected?.metaDescription || selected?.excerpt || "";
  const descInfo = seoScore(descSeo);
  const titleInfo = titleSeo.length === 0 ? { color: "#E5E7EB", label: "未設定" }
    : titleSeo.length < 20  ? { color: "#F59E0B", label: "短すぎ" }
    : titleSeo.length <= 60 ? { color: "#10B981", label: "最適" }
    : { color: "#EF4444", label: "長すぎ" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Noto Sans JP', -apple-system, sans-serif", background: "#F9FAFB" }}>

      {/* ─── Top bar ─── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", background: "#111827", color: "#fff", height: 48, flexShrink: 0 }}>
        <a href="/admin" style={{ display: "flex", alignItems: "center", gap: 8, color: "#9CA3AF", textDecoration: "none", fontSize: 13 }}>
          ← エディタへ
        </a>
        <div style={{ width: 1, height: 20, background: "#374151" }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>📝 コラム管理</span>
        <span style={{ fontSize: 12, color: "#4B5563", marginLeft: 4 }}>{articles.length}記事</span>
        <div style={{ flex: 1 }} />
        {saving && <span style={{ fontSize: 11, color: "#6B7280" }}>保存中...</span>}
        {!saving && <span style={{ fontSize: 11, color: "#10B981" }}>✓ 保存済み</span>}
        <button onClick={addArticle}
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, padding: "6px 14px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
          ＋ 新規記事
        </button>
      </div>

      {/* ─── Body ─── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

        {/* ── Article list sidebar ── */}
        <div style={{ width: 260, background: "#FFFFFF", borderRight: "1px solid #E5E7EB", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          {/* Search */}
          <div style={{ padding: "10px 12px", borderBottom: "1px solid #F3F4F6" }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="記事を検索..."
              style={{ width: "100%", fontSize: 12, padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", background: "#F9FAFB", boxSizing: "border-box" }} />
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "8px 12px", borderBottom: "1px solid #F3F4F6" }}>
              {["all", ...categories].map(c => (
                <button key={c} onClick={() => setFilterCat(c)}
                  style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 999, border: "none", cursor: "pointer",
                    background: filterCat === c ? "#EEF2FF" : "transparent",
                    color: filterCat === c ? "#4F46E5" : "#9CA3AF",
                    fontWeight: filterCat === c ? 700 : 400,
                  }}>
                  {c === "all" ? "すべて" : c}
                </button>
              ))}
            </div>
          )}

          {/* List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF", fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
                記事がありません
                <br />
                <button onClick={addArticle} style={{ marginTop: 8, color: "#4F46E5", background: "none", border: "none", fontSize: 12, cursor: "pointer" }}>
                  ＋ 新規作成
                </button>
              </div>
            ) : filtered.map(a => (
              <button key={a.id} onClick={() => { setSelectedId(a.id); setEditorTab("article"); }}
                style={{
                  width: "100%", textAlign: "left", padding: "10px 14px",
                  borderBottom: "1px solid #F9FAFB", background: selectedId === a.id ? "#EEF2FF" : "transparent",
                  borderLeft: selectedId === a.id ? "3px solid #4F46E5" : "3px solid transparent",
                  cursor: "pointer", border: "none", borderBottomWidth: 1, borderBottomStyle: "solid",
                  borderBottomColor: "#F9FAFB",
                  borderLeftWidth: 3, borderLeftStyle: "solid",
                  borderLeftColor: selectedId === a.id ? "#4F46E5" : "transparent",
                }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: selectedId === a.id ? "#4338CA" : "#374151", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {a.title}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 10, color: "#9CA3AF" }}>{a.date}</span>
                      <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 999, background: "#F3F4F6", color: "#6B7280" }}>{a.category}</span>
                    </div>
                  </div>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: a.published ? "#10B981" : "#D1D5DB", flexShrink: 0, marginTop: 4 }} />
                </div>
              </button>
            ))}
          </div>

          {/* Stats footer */}
          <div style={{ padding: "8px 14px", borderTop: "1px solid #F3F4F6", display: "flex", gap: 12 }}>
            <span style={{ fontSize: 10, color: "#10B981" }}>公開: {articles.filter(a => a.published).length}</span>
            <span style={{ fontSize: 10, color: "#9CA3AF" }}>下書き: {articles.filter(a => !a.published).length}</span>
          </div>
        </div>

        {/* ── Editor area ── */}
        {selected ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>

            {/* Editor top bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 20px", background: "#FFFFFF", borderBottom: "1px solid #E5E7EB", flexShrink: 0, gap: 12 }}>
              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
                {(["article", "seo"] as const).map(tab => (
                  <button key={tab} onClick={() => setEditorTab(tab)}
                    style={{
                      padding: "5px 14px", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer",
                      background: editorTab === tab ? "#4F46E5" : "#FFFFFF",
                      color: editorTab === tab ? "#FFFFFF" : "#6B7280",
                    }}>
                    {tab === "article" ? "📝 記事" : "🔍 SEO"}
                  </button>
                ))}
              </div>

              {/* Meta fields */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                <input value={selected.date} onChange={e => updateArticle({ date: e.target.value })} type="date"
                  style={{ fontSize: 11, padding: "4px 8px", border: "1px solid #E5E7EB", borderRadius: 6, outline: "none", background: "#F9FAFB" }} />
                <input value={selected.category} onChange={e => updateArticle({ category: e.target.value })} placeholder="カテゴリ"
                  style={{ fontSize: 11, padding: "4px 8px", border: "1px solid #E5E7EB", borderRadius: 6, outline: "none", width: 80, background: "#F9FAFB" }} />
                <input value={selected.author} onChange={e => updateArticle({ author: e.target.value })} placeholder="著者"
                  style={{ fontSize: 11, padding: "4px 8px", border: "1px solid #E5E7EB", borderRadius: 6, outline: "none", width: 70, background: "#F9FAFB" }} />
                <input value={selected.slug} onChange={e => updateArticle({ slug: e.target.value.replace(/[^a-z0-9-]/g, "") })} placeholder="slug"
                  style={{ fontSize: 11, padding: "4px 8px", border: "1px solid #E5E7EB", borderRadius: 6, outline: "none", width: 120, background: "#F9FAFB", fontFamily: "monospace" }} />
              </div>

              {/* Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <button onClick={() => updateArticle({ published: !selected.published })}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
                    padding: "5px 12px", borderRadius: 999, border: "none", cursor: "pointer",
                    background: selected.published ? "#DCFCE7" : "#F3F4F6",
                    color: selected.published ? "#16A34A" : "#6B7280",
                  }}>
                  {selected.published ? "● 公開中" : "○ 下書き"}
                </button>
                <button onClick={() => deleteArticle(selected.id)}
                  style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#EF4444", cursor: "pointer" }}>
                  削除
                </button>
              </div>
            </div>

            {/* ── ARTICLE TAB ── */}
            {editorTab === "article" && (
              <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 32px 80px" }}>

                  {/* OGP Image */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, display: "block", marginBottom: 6 }}>アイキャッチ画像 URL</label>
                    <input
                      value={selected.imageUrl} onChange={e => updateArticle({ imageUrl: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                      style={{ width: "100%", fontSize: 12, padding: "8px 12px", border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", boxSizing: "border-box", background: "#FAFAFA" }} />
                    {selected.imageUrl && (
                      <div style={{ marginTop: 8, height: 180, borderRadius: 10, overflow: "hidden", background: "#F3F4F6" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={selected.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                    )}
                  </div>

                  {/* Category badge + date */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: "#EEF2FF", color: "#4F46E5", fontWeight: 600 }}>{selected.category}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{selected.date}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>by {selected.author}</span>
                  </div>

                  {/* Title */}
                  <textarea
                    value={selected.title}
                    onChange={e => updateArticle({ title: e.target.value })}
                    rows={2}
                    placeholder="記事タイトルを入力"
                    style={{ width: "100%", fontSize: 28, fontWeight: 700, color: "#111827", border: "none", outline: "none", resize: "none", lineHeight: 1.4, background: "transparent", marginBottom: 12, boxSizing: "border-box" }} />

                  {/* Excerpt */}
                  <textarea
                    value={selected.excerpt}
                    onChange={e => updateArticle({ excerpt: e.target.value })}
                    rows={2}
                    placeholder="概要文（一覧・SNS・検索結果に表示されます）"
                    style={{ width: "100%", fontSize: 14, color: "#6B7280", border: "none", borderBottom: "1px dashed #E5E7EB", outline: "none", resize: "none", lineHeight: 1.7, background: "transparent", marginBottom: 24, paddingBottom: 16, boxSizing: "border-box" }} />

                  {/* Block Editor */}
                  <div style={{ borderTop: "1px dashed #E5E7EB", paddingTop: 20 }}>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 12, letterSpacing: "0.05em" }}>本文ブロック — + で追加 / でコマンド</p>
                    <ArticleBlockEditor
                      blocks={selected.bodyBlocks ?? []}
                      onChange={(blocks, html) => updateArticle({ bodyBlocks: blocks, body: html })}
                    />
                  </div>
                  <style>{`
                    [data-placeholder]:empty:before { content: attr(data-placeholder); color: #CBD5E1; pointer-events: none; }
                  `}</style>
                </div>
              </div>
            )}

            {/* ── SEO TAB ── */}
            {editorTab === "seo" && (
              <div style={{ flex: 1, overflow: "auto", minHeight: 0 }}>
                <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 32px 80px" }}>

                  {/* Google preview */}
                  <div style={{ marginBottom: 32, padding: 20, background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                    <p style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 700, marginBottom: 12, letterSpacing: "0.05em" }}>GOOGLE 検索プレビュー</p>
                    <div style={{ fontFamily: "Arial, sans-serif" }}>
                      <div style={{ fontSize: 13, color: "#4D5156", marginBottom: 2 }}>
                        {typeof window !== "undefined" ? window.location.origin : "https://example.com"}/column/<span style={{ color: "#202124" }}>{selected.slug}</span>
                      </div>
                      <div style={{ fontSize: 20, color: "#1558D6", marginBottom: 4, lineHeight: 1.3, cursor: "pointer" }}
                        onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
                        onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
                        {(selected.metaTitle || selected.title || "ページタイトル").slice(0, 60)}
                        {(selected.metaTitle || selected.title || "").length > 60 && "..."}
                      </div>
                      <div style={{ fontSize: 14, color: "#4D5156", lineHeight: 1.57 }}>
                        {(selected.metaDescription || selected.excerpt || "メタディスクリプションが設定されていません。").slice(0, 160)}
                        {(selected.metaDescription || selected.excerpt || "").length > 160 && "..."}
                      </div>
                    </div>
                  </div>

                  {/* SEO fields */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

                    {/* Meta title */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>SEOタイトル (title タグ)</label>
                        <span style={{ fontSize: 11, color: titleInfo.color, fontWeight: 600 }}>
                          {(selected.metaTitle || "").length}/60 — {titleInfo.label}
                        </span>
                      </div>
                      <input
                        value={selected.metaTitle || ""}
                        onChange={e => updateArticle({ metaTitle: e.target.value })}
                        placeholder={selected.title || "未設定の場合は記事タイトルを使用"}
                        maxLength={80}
                        style={{ width: "100%", fontSize: 14, padding: "10px 12px", border: `1.5px solid ${titleInfo.color}`, borderRadius: 8, outline: "none", boxSizing: "border-box", background: "#FAFAFA" }} />
                      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>推奨: 30〜60文字。主要キーワードを前半に含めると効果的です。</p>
                    </div>

                    {/* Meta description */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>メタディスクリプション</label>
                        <span style={{ fontSize: 11, color: descInfo.color, fontWeight: 600 }}>
                          {descSeo.length}/160 — {descInfo.label}
                        </span>
                      </div>
                      {/* progress bar */}
                      <div style={{ height: 4, background: "#F3F4F6", borderRadius: 999, marginBottom: 8, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.min(100, (descSeo.length / 160) * 100)}%`, background: descInfo.color, borderRadius: 999, transition: "width 0.3s" }} />
                      </div>
                      <textarea
                        value={selected.metaDescription || ""}
                        onChange={e => updateArticle({ metaDescription: e.target.value })}
                        placeholder={selected.excerpt || "未設定の場合は概要文を使用します"}
                        rows={3}
                        maxLength={200}
                        style={{ width: "100%", fontSize: 14, padding: "10px 12px", border: `1.5px solid ${descInfo.color}`, borderRadius: 8, outline: "none", resize: "vertical", boxSizing: "border-box", background: "#FAFAFA", lineHeight: 1.7 }} />
                      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>推奨: 120〜160文字。検索ユーザーがクリックしたくなる自然な文章にしてください。</p>
                    </div>

                    {/* Keywords */}
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>キーワード (keywords)</label>
                      <input
                        value={selected.keywords || ""}
                        onChange={e => updateArticle({ keywords: e.target.value })}
                        placeholder="例: 税理士, 確定申告, 節税対策（カンマ区切り）"
                        style={{ width: "100%", fontSize: 14, padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", boxSizing: "border-box", background: "#FAFAFA" }} />
                      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>主要キーワードを3〜7個程度。タイトルや本文にも自然に含めることが重要です。</p>
                    </div>

                    {/* OG image */}
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>OGP画像 URL（SNS シェア時）</label>
                      <input
                        value={selected.ogImage || ""}
                        onChange={e => updateArticle({ ogImage: e.target.value })}
                        placeholder={selected.imageUrl || "未設定の場合はアイキャッチ画像を使用"}
                        style={{ width: "100%", fontSize: 14, padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", boxSizing: "border-box", background: "#FAFAFA" }} />
                      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>推奨サイズ: 1200×630px。Twitter/Facebook でシェアされた際に表示されます。</p>
                    </div>

                    {/* Canonical */}
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>Canonical URL（重複コンテンツ対策）</label>
                      <input
                        value={selected.canonicalUrl || ""}
                        onChange={e => updateArticle({ canonicalUrl: e.target.value })}
                        placeholder="未設定の場合は自動生成されます"
                        style={{ width: "100%", fontSize: 14, padding: "10px 12px", border: "1.5px solid #E5E7EB", borderRadius: 8, outline: "none", boxSizing: "border-box", background: "#FAFAFA" }} />
                    </div>

                    {/* noindex */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: selected.noindex ? "#FEF3C7" : "#F0FDF4", borderRadius: 10, border: `1px solid ${selected.noindex ? "#FDE68A" : "#BBF7D0"}` }}>
                      <input type="checkbox" id="noindex" checked={selected.noindex ?? false}
                        onChange={e => updateArticle({ noindex: e.target.checked })}
                        style={{ width: 16, height: 16, cursor: "pointer" }} />
                      <div>
                        <label htmlFor="noindex" style={{ fontSize: 13, fontWeight: 700, color: "#374151", cursor: "pointer" }}>
                          検索エンジンにインデックスさせない (noindex)
                        </label>
                        <p style={{ fontSize: 11, color: "#6B7280", margin: 0 }}>
                          {selected.noindex ? "⚠️ この記事は検索結果に表示されません" : "✅ 検索エンジンにインデックスされます"}
                        </p>
                      </div>
                    </div>

                    {/* SEO checklist */}
                    <div style={{ padding: "16px 18px", background: "#F8FAFC", borderRadius: 12, border: "1px solid #E2E8F0" }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12 }}>SEO チェックリスト</p>
                      {[
                        { ok: !!selected.title && selected.title.length >= 10, text: "タイトルが10文字以上ある" },
                        { ok: !!selected.excerpt && selected.excerpt.length >= 60, text: "概要文が60文字以上ある" },
                        { ok: !!(selected.metaDescription || selected.excerpt) && (selected.metaDescription || selected.excerpt || "").length >= 120, text: "メタディスクリプションが120文字以上" },
                        { ok: !!selected.imageUrl || !!selected.ogImage, text: "アイキャッチ/OGP画像が設定されている" },
                        { ok: !!selected.keywords && selected.keywords.length > 0, text: "キーワードが設定されている" },
                        { ok: !!selected.body && selected.body.replace(/<[^>]*>/g, "").length >= 300, text: "本文が300文字以上ある" },
                        { ok: !!selected.slug && !selected.slug.includes("article-"), text: "スラッグが意味のある文字列になっている" },
                      ].map((item, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>{item.ok ? "✅" : "⬜"}</span>
                          <span style={{ fontSize: 12, color: item.ok ? "#374151" : "#9CA3AF" }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 48 }}>📝</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>記事を選択または新規作成してください</p>
            <button onClick={addArticle}
              style={{ fontSize: 13, padding: "8px 20px", background: "#4F46E5", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>
              ＋ 新しい記事を作成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
