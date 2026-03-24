"use client";

import { useState, useEffect } from "react";
import { defaultConfig, SectionBlock, SiteConfig, SitePage, uid, BLOCK_DEFAULTS } from "@/types/site";
import Sidebar from "@/components/admin/Sidebar";
import SitePreview from "@/components/preview/SitePreview";
import BlockInsertModal from "@/components/admin/BlockInsertModal";
import ArticlePanel from "@/components/admin/ArticlePanel";
import { RefreshCw, ExternalLink, FileText, Plus, Layout, Globe, Check, AlertCircle } from "lucide-react";
import { EditingContext } from "@/contexts/EditingContext";
import { publishSite, isSupabaseConfigured } from "@/lib/supabase";

interface PageTab { id: string; slug: string; title: string; isHome: boolean; }

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || "my-site";
}

export default function AdminClient() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [activePageId, setActivePageId] = useState<string>("home");
  const [activeTab, setActiveTab] = useState<"edit" | "articles">("edit");
  const [insertAt, setInsertAt] = useState<number | null>(null);
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Slug for Supabase publish
  const [siteSlug, setSiteSlug] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);

  const [showGoldenConfirm, setShowGoldenConfirm] = useState(false);

  // Publish state
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "success" | "error">("idle");
  const [publishError, setPublishError] = useState("");

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("site-config");
    if (saved) try { setConfig(JSON.parse(saved)); } catch {}
    const savedSlug = localStorage.getItem("site-slug");
    if (savedSlug) setSiteSlug(savedSlug);
  }, []);

  // Auto-save config to localStorage
  useEffect(() => {
    localStorage.setItem("site-config", JSON.stringify(config));
    if (!siteSlug) setSiteSlug(toSlug(config.title));
  }, [config]);

  useEffect(() => {
    if (siteSlug) localStorage.setItem("site-slug", siteSlug);
  }, [siteSlug]);

  const allPageTabs: PageTab[] = [
    { id: "home", slug: "", title: "ホーム", isHome: true },
    ...config.pages.map((p) => ({ id: p.id, slug: p.slug, title: p.title, isHome: false })),
  ];
  const activePage = allPageTabs.find((p) => p.id === activePageId) ?? allPageTabs[0];

  function getActiveSections(): SectionBlock[] {
    if (activePage.isHome) return config.sections;
    return config.pages.find((p) => p.id === activePageId)?.sections ?? [];
  }

  function updateActiveSections(newConfig: SiteConfig) {
    if (activePage.isHome) {
      setConfig(newConfig);
    } else {
      setConfig({
        ...config,
        title: newConfig.title, primaryColor: newConfig.primaryColor,
        accentColor: newConfig.accentColor, fontFamily: newConfig.fontFamily,
        catchCopy: newConfig.catchCopy, navLinks: newConfig.navLinks,
        pages: config.pages.map((p) =>
          p.id === activePageId ? { ...p, sections: newConfig.sections } : p
        ),
        articles: config.articles,
      });
    }
  }

  function handleInsert(block: SectionBlock) {
    if (insertAt === null) return;
    const next = [...getActiveSections()];
    next.splice(insertAt, 0, block);
    if (activePage.isHome) {
      setConfig({ ...config, sections: next });
    } else {
      setConfig({ ...config, pages: config.pages.map((p) => p.id === activePageId ? { ...p, sections: next } : p) });
    }
    setInsertAt(null);
  }

  function addPage() {
    const newPage: SitePage = {
      id: uid(), slug: `page-${config.pages.length + 1}`,
      title: `新しいページ ${config.pages.length + 1}`, sections: [],
    };
    setConfig({ ...config, pages: [...config.pages, newPage] });
    setActivePageId(newPage.id); setActiveTab("edit");
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

  function applyGoldenTemplate() {
    const goldenSections = [
      BLOCK_DEFAULTS["hero-photo"](),
      BLOCK_DEFAULTS.problem(),
      BLOCK_DEFAULTS.solution(),
      BLOCK_DEFAULTS.features(),
      BLOCK_DEFAULTS.steps(),
      BLOCK_DEFAULTS.testimonials(),
      BLOCK_DEFAULTS.faq(),
      BLOCK_DEFAULTS.cta(),
      BLOCK_DEFAULTS.footer(),
    ];
    if (activePage.isHome) {
      setConfig({ ...config, sections: goldenSections });
    } else {
      setConfig({ ...config, pages: config.pages.map((p) => p.id === activePageId ? { ...p, sections: goldenSections } : p) });
    }
    setShowGoldenConfirm(false);
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

  const previewConfig: SiteConfig = { ...config, sections: getActiveSections() };
  const publishUrl = typeof window !== "undefined" ? `${window.location.origin}/sites/${siteSlug}` : `/sites/${siteSlug}`;

  return (
    <EditingContext.Provider value={true}>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* ─── Top bar ─────────────────────────────────── */}
        <header className="h-12 bg-gray-900 text-white flex items-center gap-3 px-4 shrink-0">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-sm font-semibold">Site Builder</span>
          </div>

          {/* Page tabs */}
          <div className="flex items-center gap-1 flex-1 overflow-x-auto min-w-0">
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
                    onClick={() => { setActivePageId(page.id); setActiveTab("edit"); }}
                    onDoubleClick={() => !page.isHome && (setRenamingPageId(page.id), setRenameValue(page.title))}
                    className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                      activePageId === page.id && activeTab === "edit"
                        ? "bg-white/20 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <Layout size={10} /> {page.title}
                  </button>
                )}
                {!page.isHome && renamingPageId !== page.id && (
                  <button onClick={() => deletePage(page.id)}
                    className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white hidden group-hover/tab:flex items-center justify-center text-[8px] z-10">
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button onClick={addPage}
              className="text-xs text-gray-500 hover:text-white px-2 py-1.5 rounded-md hover:bg-white/10 flex items-center gap-1 flex-shrink-0 transition-colors">
              <Plus size={10} /> 追加
            </button>

            <div className="w-px h-4 bg-gray-700 mx-1 flex-shrink-0" />

            <button onClick={() => setActiveTab(activeTab === "articles" ? "edit" : "articles")}
              className={`text-xs px-3 py-1.5 rounded-md flex items-center gap-1.5 flex-shrink-0 transition-colors whitespace-nowrap ${
                activeTab === "articles" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
              }`}>
              <FileText size={10} /> 記事管理
              {config.articles.length > 0 && (
                <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full">{config.articles.length}</span>
              )}
            </button>
          </div>

          {/* Right side: slug + publish */}
          <div className="flex items-center gap-2 flex-shrink-0">
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

            <button
              onClick={() => setShowGoldenConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 px-3 py-1.5 rounded hover:bg-gray-700 transition-colors border border-yellow-400/30"
              title="Hero→課題→解決策→特徴→ステップ→お客様の声→FAQ→CTAを自動配置"
            >
              ⚡ 黄金の型
            </button>

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
        </header>

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
        <div className="flex flex-1 overflow-hidden">
          {activeTab === "articles" ? (
            <ArticlePanel config={config} onConfigChange={setConfig} />
          ) : (
            <>
              <Sidebar config={previewConfig} onChange={updateActiveSections} onInsertRequest={setInsertAt} />
              <SitePreview config={previewConfig} onConfigChange={updateActiveSections} onInsertRequest={setInsertAt} />
            </>
          )}
        </div>

        {insertAt !== null && (
          <BlockInsertModal onInsert={handleInsert} onClose={() => setInsertAt(null)} />
        )}

        {showGoldenConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowGoldenConfirm(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2">⚡ 黄金の型を適用</h3>
              <p className="text-sm text-gray-600 mb-1">以下のセクション構成を自動配置します：</p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-1">
                {["① Hero（ファーストビュー）", "② Problem（課題提起）", "③ Solution（解決策）", "④ Features（特徴・強み）", "⑤ Steps（ご利用の流れ）", "⑥ Voice（お客様の声）", "⑦ FAQ（よくある質問）", "⑧ CTA（お問い合わせ）", "⑨ Footer"].map((s) => (
                  <p key={s} className="text-xs text-gray-600">{s}</p>
                ))}
              </div>
              <p className="text-xs text-red-500 mb-5">⚠️ 現在のセクションは置き換えられます</p>
              <div className="flex gap-3">
                <button onClick={applyGoldenTemplate}
                  className="flex-1 py-3 text-sm font-bold text-white rounded-xl"
                  style={{ backgroundColor: "#1a1a2e" }}>
                  適用する
                </button>
                <button onClick={() => setShowGoldenConfirm(false)}
                  className="flex-1 py-3 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50">
                  キャンセル
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EditingContext.Provider>
  );
}
