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
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", background: "#111827", color: "#fff", height: 48, flexShrink: 0, minWidth: 0, overflow: "hidden" }}>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-semibold">Site Builder</span>
          </div>

          {/* Page tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flex: 1, overflowX: "auto", minWidth: 0 }}>
            {allPageTabs.map((page) => (
              <div key={page.id} className="relative group/tab flex-shrink-0">
                {renamingPageId === page.id ? (
                  <input autoFocus value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingPageId(null); }}
                    className="text-xs bg-white/20 text-white rounded px-2 py-1 outline-none border border-white/40 w-28" />
                ) : (
                  <button
                    onClick={() => setActivePageId(page.id)}
                    onDoubleClick={() => !page.isHome && (setRenamingPageId(page.id), setRenameValue(page.title))}
                    className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      activePageId === page.id
                        ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
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
              className="text-xs text-gray-500 hover:text-white px-2 py-1.5 rounded-md hover:bg-white/10 flex items-center gap-1 flex-shrink-0 transition-colors">
              <Plus size={10} /> 追加
            </button>
          </div>

          {/* Right side: slug + publish */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Site slug editor */}
            <div className="flex items-center gap-1.5 bg-gray-800 rounded-lg px-2.5 py-1.5">
              <Globe size={10} className="text-gray-400 flex-shrink-0" />
              {editingSlug ? (
                <input
                  autoFocus
                  value={siteSlug}
                  onChange={(e) => setSiteSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                  onBlur={() => setEditingSlug(false)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingSlug(false); }}
                  className="bg-transparent text-white text-xs outline-none w-28 font-mono"
                  placeholder="my-site"
                />
              ) : (
                <button
                  onClick={() => setEditingSlug(true)}
                  className="text-gray-300 text-xs font-mono hover:text-white transition-colors truncate max-w-[120px]"
                  title="スラッグを編集（URLの一部になります）"
                >
                  {siteSlug || "スラッグを設定"}
                </button>
              )}
            </div>

            <a
              href="/admin/column"
              className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200 px-3 py-1.5 rounded hover:bg-gray-700 transition-colors border border-emerald-400/30"
              title="コラム記事の作成・SEO管理"
            >
              📝 コラム
            </a>

            <a
              href="/admin/setup"
              className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200 px-3 py-1.5 rounded hover:bg-gray-700 transition-colors border border-violet-400/30"
              title="AIヒアリングでサイトを自動生成"
            >
              AI生成
            </a>

            <button onClick={() => setConfig(defaultConfig)}
              className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors">
              <RefreshCw size={12} /> リセット
            </button>

            {/* Publish button */}
            <button
              onClick={handlePublish}
              disabled={publishing || !siteSlug}
              title={!isSupabaseConfigured ? "Supabase未設定 — .env.local を確認" : undefined}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-all disabled:opacity-50 ${
                publishStatus === "success" ? "bg-green-600 text-white"
                : publishStatus === "error" ? "bg-red-600 text-white"
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              {publishing ? (
                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> 保存中...</>
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
