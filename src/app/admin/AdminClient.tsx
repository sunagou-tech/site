"use client";

import { useState, useEffect, useRef } from "react";
import { defaultConfig, SiteConfig, SitePage, uid } from "@/types/site";
import CanvasEditor from "@/components/canvas/CanvasEditor";
import { RefreshCw, ExternalLink, Plus, Layout, Globe, Check, AlertCircle } from "lucide-react";
import { EditingContext } from "@/contexts/EditingContext";
import { publishSite, isSupabaseConfigured } from "@/lib/supabase";

interface PageTab { id: string; slug: string; title: string; isHome: boolean; }

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || "my-site";
}

export default function AdminClient() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [activePageId, setActivePageId] = useState<string>("home");
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Slug for Supabase publish
  const [siteSlug, setSiteSlug] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "success" | "error">("idle");
  const [publishError, setPublishError] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("site-config");
    if (saved) try {
      const sanitized = saved.replace(/https:\/\/picsum\.photos[^"]*/g, "");
      setConfig(JSON.parse(sanitized));
    } catch {}
    const savedSlug = localStorage.getItem("site-slug");
    if (savedSlug) setSiteSlug(savedSlug);
  }, []);

  // Debounced auto-save — 800ms after last change
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!siteSlug) setSiteSlug(toSlug(config.title));
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem("site-config", JSON.stringify(config));
    }, 800);
    return () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); };
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (siteSlug) localStorage.setItem("site-slug", siteSlug);
  }, [siteSlug]);

  const allPageTabs: PageTab[] = [
    { id: "home", slug: "", title: "ホーム", isHome: true },
    ...config.pages.map((p) => ({ id: p.id, slug: p.slug, title: p.title, isHome: false })),
  ];

  function addPage() {
    const newPage: SitePage = {
      id: uid(), slug: `page-${config.pages.length + 1}`,
      title: `新しいページ ${config.pages.length + 1}`, sections: [],
    };
    setConfig({ ...config, pages: [...config.pages, newPage] });
    setActivePageId(newPage.id);
  }

  function deletePage(pageId: string) {
    setConfig({ ...config, pages: config.pages.filter((p) => p.id !== pageId) });
    if (activePageId === pageId) setActivePageId("home");
  }

  function commitRename() {
    if (!renamingPageId || renamingPageId === "home") { setRenamingPageId(null); return; }
    setConfig({
      ...config,
      pages: config.pages.map((p) =>
        p.id === renamingPageId
          ? { ...p, title: renameValue, slug: renameValue.toLowerCase().replace(/[\s　]+/g, "-") }
          : p
      ),
    });
    setRenamingPageId(null);
  }

  async function handlePublish() {
    if (!siteSlug) return;
    setPublishing(true);
    setPublishStatus("idle");

    const { error } = await publishSite(siteSlug, config);

    setPublishing(false);
    if (error) {
      setPublishStatus("error");
      setPublishError(error);
      setTimeout(() => setPublishStatus("idle"), 5000);
    } else {
      setPublishStatus("success");
      setTimeout(() => setPublishStatus("idle"), 4000);
    }
  }

  const publishUrl = typeof window !== "undefined" ? `${window.location.origin}/sites/${siteSlug}` : `/sites/${siteSlug}`;

  return (
    <EditingContext.Provider value={true}>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* ─── Top bar ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", height: 48, flexShrink: 0, minWidth: 0, overflow: "hidden" }}>
          {/* Logo */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg, #4F46E5, #7C3AED)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="4" height="4" rx="1" fill="white" opacity="0.9"/><rect x="7" y="1" width="4" height="4" rx="1" fill="white" opacity="0.6"/><rect x="1" y="7" width="4" height="4" rx="1" fill="white" opacity="0.6"/><rect x="7" y="7" width="4" height="4" rx="1" fill="white" opacity="0.9"/></svg>
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em" }}>ツクリエ</span>
          </div>

          <div style={{ width: 1, height: 20, background: "#E2E8F0", flexShrink: 0 }} />

          {/* Page tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, overflowX: "auto", minWidth: 0 }}>
            {allPageTabs.map((page) => (
              <div key={page.id} className="relative group/tab flex-shrink-0">
                {renamingPageId === page.id ? (
                  <input autoFocus value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingPageId(null); }}
                    style={{ fontSize: 12, background: "#F8FAFC", color: "#111827", borderRadius: 6, padding: "4px 8px", outline: "none", border: "1.5px solid #4F46E5", width: 100 }} />
                ) : (
                  <button
                    onClick={() => setActivePageId(page.id)}
                    onDoubleClick={() => !page.isHome && (setRenamingPageId(page.id), setRenameValue(page.title))}
                    style={{ fontSize: 12, padding: "4px 10px", borderRadius: 6, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap", transition: "all 0.12s",
                      background: activePageId === page.id ? "#EEF2FF" : "transparent",
                      color: activePageId === page.id ? "#4F46E5" : "#6B7280",
                      fontWeight: activePageId === page.id ? 600 : 400,
                    }}
                  >
                    <Layout size={10} /> {page.title}
                  </button>
                )}
                {!page.isHome && renamingPageId !== page.id && (
                  <button onClick={() => deletePage(page.id)}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white hidden group-hover/tab:flex items-center justify-center text-[8px] z-10">
                    x
                  </button>
                )}
              </div>
            ))}
            <button onClick={addPage}
              style={{ fontSize: 11, color: "#94A3B8", padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, flexShrink: 0, transition: "color 0.12s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#4F46E5"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}>
              <Plus size={10} /> ページ追加
            </button>
          </div>

          {/* Right side: slug + actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {/* Site slug */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "4px 10px" }}>
              <Globe size={10} style={{ color: "#94A3B8", flexShrink: 0 }} />
              {editingSlug ? (
                <input
                  autoFocus
                  value={siteSlug}
                  onChange={(e) => setSiteSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                  onBlur={() => setEditingSlug(false)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingSlug(false); }}
                  style={{ background: "transparent", color: "#111827", fontSize: 11, outline: "none", width: 100, fontFamily: "monospace" }}
                  placeholder="my-site"
                />
              ) : (
                <button
                  onClick={() => setEditingSlug(true)}
                  style={{ background: "none", border: "none", color: "#374151", fontSize: 11, fontFamily: "monospace", cursor: "pointer", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  title="URLスラッグを編集"
                >
                  {siteSlug || "スラッグ設定"}
                </button>
              )}
            </div>

            <a href="/admin/column"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#059669", padding: "5px 10px", borderRadius: 7, border: "1px solid #D1FAE5", background: "#F0FDF4", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}
              title="コラム記事の作成・SEO管理">
              コラム
            </a>

            <a href="/admin/setup"
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#7C3AED", padding: "5px 10px", borderRadius: 7, border: "1px solid #DDD6FE", background: "#F5F3FF", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}
              title="AIヒアリングでサイトを自動生成">
              AI生成
            </a>

            <button onClick={() => setConfig(defaultConfig)}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6B7280", padding: "5px 8px", borderRadius: 7, border: "1px solid #E2E8F0", background: "transparent", cursor: "pointer" }}>
              <RefreshCw size={11} /> リセット
            </button>

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={publishing || !siteSlug}
              title={!isSupabaseConfigured ? "Supabase未設定" : undefined}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: "none", cursor: publishing || !siteSlug ? "not-allowed" : "pointer", opacity: publishing || !siteSlug ? 0.5 : 1, transition: "all 0.15s", whiteSpace: "nowrap",
                background: publishStatus === "success" ? "#059669" : publishStatus === "error" ? "#DC2626" : "#4F46E5",
                color: "#fff" }}
            >
              {publishing ? (
                <><span style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} /> 保存中...</>
              ) : publishStatus === "success" ? (
                <><Check size={12} /> 公開済み</>
              ) : publishStatus === "error" ? (
                <><AlertCircle size={12} /> エラー</>
              ) : (
                <><ExternalLink size={12} /> 保存して公開</>
              )}
            </button>
          </div>
        </div>

        {/* ─── Publish success banner ──────────────────── */}
        {publishStatus === "success" && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between shrink-0">
            <p className="text-xs text-green-700 flex items-center gap-1.5">
              <Check size={12} /> 公開しました！
              <span className="font-mono text-green-600">{publishUrl}</span>
            </p>
            <a href={publishUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
              サイトを見る <ExternalLink size={10} />
            </a>
          </div>
        )}

        {/* ─── Publish error banner ─────────────────────── */}
        {publishStatus === "error" && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 shrink-0">
            <p className="text-xs text-red-700 flex items-center gap-1.5">
              <AlertCircle size={12} /> 公開に失敗しました: {publishError}
            </p>
          </div>
        )}

        {/* ─── Main layout ─────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          <CanvasEditor config={config} onChange={setConfig} />
        </div>
      </div>
    </EditingContext.Provider>
  );
}
