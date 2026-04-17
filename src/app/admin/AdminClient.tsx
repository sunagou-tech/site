"use client";

import { useState, useEffect, useRef } from "react";
import {
  defaultConfig, SiteConfig, SitePage, SectionBlock,
  uid, BLOCK_META,
} from "@/types/site";
import SitePreview from "@/components/preview/SitePreview";
import BlockInsertModal from "@/components/admin/BlockInsertModal";
import { RefreshCw, ExternalLink, Plus, Layout, Globe, Check, AlertCircle } from "lucide-react";
import { EditingContext } from "@/contexts/EditingContext";
import { publishSite, isSupabaseConfigured } from "@/lib/supabase";

type SidePanel = "settings" | "blocks" | "images" | "elements" | "seo" | "ai-image";
interface PageTab { id: string; slug: string; title: string; isHome: boolean; }

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || "my-site";
}

export default function AdminClient() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [activePageId, setActivePageId] = useState("home");
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Sidebar state
  const [sidePanel, setSidePanel] = useState<SidePanel>("blocks");
  const [blockDragIdx, setBlockDragIdx] = useState<number | null>(null);
  const [blockDragOver, setBlockDragOver] = useState<number | null>(null);

  // Block insert modal
  const [insertPosition, setInsertPosition] = useState<number | null>(null); // null = append
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Slug / publish
  const [siteSlug, setSiteSlug] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
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

  // Debounced auto-save
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

  // ── Active page helpers ────────────────────────────────────
  function getActiveConfig(): SiteConfig {
    if (activePageId === "home") return config;
    const page = config.pages.find((p) => p.id === activePageId);
    return { ...config, sections: page?.sections ?? [] };
  }

  function handleActiveConfigChange(newConfig: SiteConfig) {
    if (activePageId === "home") {
      setConfig(newConfig);
    } else {
      setConfig({
        ...newConfig,
        sections: config.sections,
        pages: config.pages.map((p) =>
          p.id === activePageId ? { ...p, sections: newConfig.sections } : p
        ),
      });
    }
  }

  function getActiveSections(): SectionBlock[] {
    if (activePageId === "home") return config.sections;
    return config.pages.find((p) => p.id === activePageId)?.sections ?? [];
  }

  function setActiveSections(sections: SectionBlock[]) {
    if (activePageId === "home") {
      setConfig({ ...config, sections });
    } else {
      setConfig({
        ...config,
        pages: config.pages.map((p) =>
          p.id === activePageId ? { ...p, sections } : p
        ),
      });
    }
  }

  // ── Block operations ───────────────────────────────────────
  function deleteSection(id: string) {
    setActiveSections(getActiveSections().filter((s) => s.id !== id));
  }

  function reorderSections(from: number, to: number) {
    const next = [...getActiveSections()];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setActiveSections(next);
    setBlockDragIdx(null);
    setBlockDragOver(null);
  }

  function handleInsertRequest(position: number) {
    setInsertPosition(position);
    setShowBlockModal(true);
  }

  function handleBlockInsert(block: SectionBlock) {
    const sections = getActiveSections();
    const next = [...sections];
    const pos = insertPosition === null ? next.length : insertPosition;
    next.splice(pos, 0, block);
    setActiveSections(next);
    setShowBlockModal(false);
    setInsertPosition(null);
  }

  // ── Page management ────────────────────────────────────────
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

  // ── Publish ────────────────────────────────────────────────
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

  const publishUrl = typeof window !== "undefined"
    ? `${window.location.origin}/sites/${siteSlug}`
    : `/sites/${siteSlug}`;

  const activeSections = getActiveSections();
  const u = (patch: Partial<SiteConfig>) => setConfig({ ...config, ...patch });

  // ── Sidebar icons ──────────────────────────────────────────
  const SIDE_ICONS: { id: SidePanel; label: string; icon: React.ReactNode }[] = [
    { id: "settings", label: "設定",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    { id: "blocks", label: "ブロック",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
    { id: "seo", label: "SEO",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  ];

  return (
    <EditingContext.Provider value={true}>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* ─── Top bar ─────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 16px", background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", height: 48, flexShrink: 0, minWidth: 0, overflow: "hidden" }}>
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
                    }}>
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
              style={{ fontSize: 11, color: "#94A3B8", padding: "4px 8px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#4F46E5"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}>
              <Plus size={10} /> ページ追加
            </button>
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "4px 10px" }}>
              <Globe size={10} style={{ color: "#94A3B8" }} />
              {editingSlug ? (
                <input autoFocus value={siteSlug}
                  onChange={(e) => setSiteSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
                  onBlur={() => setEditingSlug(false)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingSlug(false); }}
                  style={{ background: "transparent", color: "#111827", fontSize: 11, outline: "none", width: 100, fontFamily: "monospace" }}
                  placeholder="my-site" />
              ) : (
                <button onClick={() => setEditingSlug(true)}
                  style={{ background: "none", border: "none", color: "#374151", fontSize: 11, fontFamily: "monospace", cursor: "pointer", maxWidth: 110, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {siteSlug || "スラッグ設定"}
                </button>
              )}
            </div>
            <a href="/admin/column" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#059669", padding: "5px 10px", borderRadius: 7, border: "1px solid #D1FAE5", background: "#F0FDF4", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>コラム</a>
            <a href="/admin/setup" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#7C3AED", padding: "5px 10px", borderRadius: 7, border: "1px solid #DDD6FE", background: "#F5F3FF", textDecoration: "none", fontWeight: 600, whiteSpace: "nowrap" }}>AI生成</a>
            <button onClick={() => setConfig(defaultConfig)}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6B7280", padding: "5px 8px", borderRadius: 7, border: "1px solid #E2E8F0", background: "transparent", cursor: "pointer" }}>
              <RefreshCw size={11} /> リセット
            </button>
            <button onClick={handlePublish} disabled={publishing || !siteSlug}
              title={!isSupabaseConfigured ? "Supabase未設定" : undefined}
              style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 700, padding: "6px 14px", borderRadius: 8, border: "none", cursor: publishing || !siteSlug ? "not-allowed" : "pointer", opacity: publishing || !siteSlug ? 0.5 : 1, transition: "all 0.15s", whiteSpace: "nowrap",
                background: publishStatus === "success" ? "#059669" : publishStatus === "error" ? "#DC2626" : "#4F46E5", color: "#fff" }}>
              {publishing ? <><span style={{ width: 11, height: 11, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid #fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} /> 保存中...</>
                : publishStatus === "success" ? <><Check size={12} /> 公開済み</>
                : publishStatus === "error" ? <><AlertCircle size={12} /> エラー</>
                : <><ExternalLink size={12} /> 保存して公開</>}
            </button>
          </div>
        </div>

        {/* Banners */}
        {publishStatus === "success" && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between shrink-0">
            <p className="text-xs text-green-700 flex items-center gap-1.5"><Check size={12} /> 公開しました！ <span className="font-mono text-green-600">{publishUrl}</span></p>
            <a href={publishUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1">サイトを見る <ExternalLink size={10} /></a>
          </div>
        )}
        {publishStatus === "error" && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 shrink-0">
            <p className="text-xs text-red-700 flex items-center gap-1.5"><AlertCircle size={12} /> 公開に失敗しました: {publishError}</p>
          </div>
        )}

        {/* ─── Main layout ─────────────────────────────── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>

          {/* ═══ Left sidebar (CanvasEditor style) ═══════ */}
          <div style={{ display: "flex", flexShrink: 0, height: "100%" }}>

            {/* Dark icon rail */}
            <div style={{ width: 56, background: "#0F172A", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10, gap: 2, flexShrink: 0 }}>
              {SIDE_ICONS.map((item) => (
                <button key={item.id} onClick={() => setSidePanel(item.id)}
                  style={{ width: 46, padding: "8px 0 6px", border: "none", borderRadius: 8,
                    background: sidePanel === item.id ? "rgba(99,102,241,0.18)" : "transparent",
                    color: sidePanel === item.id ? "#818CF8" : "#475569",
                    cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, transition: "all 0.15s" }}
                  onMouseEnter={e => { if (sidePanel !== item.id) (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
                  onMouseLeave={e => { if (sidePanel !== item.id) (e.currentTarget as HTMLElement).style.color = "#475569"; }}>
                  {item.icon}
                  <span style={{ fontSize: 8, fontWeight: 600, letterSpacing: "0.02em" }}>{item.label}</span>
                </button>
              ))}
            </div>

            {/* White content panel */}
            <div style={{ width: 240, background: "#FFFFFF", borderRight: "1px solid #E2E8F0", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
              <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid #F1F5F9", flexShrink: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  {sidePanel === "settings" ? "サイト全体設定"
                    : sidePanel === "blocks" ? "ブロック編集"
                    : "SEO / 集客設定"}
                </p>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>

                {/* ── 設定パネル ── */}
                {sidePanel === "settings" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>サイト名</span>
                      <input value={config.title} onChange={e => u({ title: e.target.value })}
                        style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111" }} />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>ディスクリプション</span>
                      <textarea value={config.description ?? ""} onChange={e => u({ description: e.target.value })}
                        rows={3} style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", resize: "none", color: "#111", lineHeight: 1.6 }}
                        placeholder="検索結果に表示される説明文 (120文字以内)" />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>メインカラー</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0", borderRadius: 7, padding: "4px 8px" }}>
                          <input type="color" value={config.primaryColor} onChange={e => u({ primaryColor: e.target.value })}
                            style={{ width: 24, height: 24, border: "none", padding: 0, borderRadius: 4, cursor: "pointer" }} />
                          <span style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>{config.primaryColor}</span>
                        </div>
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>アクセント</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, border: "1px solid #E2E8F0", borderRadius: 7, padding: "4px 8px" }}>
                          <input type="color" value={config.accentColor} onChange={e => u({ accentColor: e.target.value })}
                            style={{ width: 24, height: 24, border: "none", padding: 0, borderRadius: 4, cursor: "pointer" }} />
                          <span style={{ fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>{config.accentColor}</span>
                        </div>
                      </label>
                    </div>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>フォント</span>
                      <select value={config.siteFont ?? "Noto Sans JP"} onChange={e => u({ siteFont: e.target.value })}
                        style={{ fontSize: 11, padding: "7px 8px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111", background: "#fff", cursor: "pointer" }}>
                        <option value="Noto Sans JP">Noto Sans JP（源ノ角ゴシック）</option>
                        <option value="Noto Serif JP">Noto Serif JP（源ノ明朝）</option>
                        <option value="M PLUS Rounded 1c">M PLUS Rounded 1c（まるもじ）</option>
                        <option value="Zen Kaku Gothic New">Zen Kaku Gothic New（新ゴシック）</option>
                        <option value="Shippori Mincho">Shippori Mincho（しっぽり明朝）</option>
                      </select>
                    </label>
                  </div>
                )}

                {/* ── ブロックパネル ── */}
                {sidePanel === "blocks" && (
                  <div>
                    {/* 配置済みブロック一覧 */}
                    {activeSections.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: "#64748B", marginBottom: 8, letterSpacing: "0.05em" }}>配置済みブロック（ドラッグで並び替え）</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                          {activeSections.map((section, idx) => {
                            const label = BLOCK_META.find((m) => m.type === section.type)?.label ?? section.type;
                            return (
                              <div key={section.id}>
                                <div
                                  draggable
                                  onDragStart={() => setBlockDragIdx(idx)}
                                  onDragEnd={() => { setBlockDragIdx(null); setBlockDragOver(null); }}
                                  onDragOver={e => { e.preventDefault(); setBlockDragOver(idx); }}
                                  onDragLeave={() => setBlockDragOver(null)}
                                  onDrop={e => { e.preventDefault(); if (blockDragIdx !== null) reorderSections(blockDragIdx, idx); }}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8,
                                    padding: "7px 10px", borderRadius: 8,
                                    border: blockDragOver === idx && blockDragIdx !== idx ? "1.5px solid #4F46E5" : "1px solid #E2E8F0",
                                    background: blockDragIdx === idx ? "#EEF2FF" : "#FAFAFA",
                                    opacity: blockDragIdx === idx ? 0.5 : 1,
                                    cursor: "grab", marginBottom: 2, transition: "all 0.1s",
                                  }}>
                                  <svg width="10" height="14" viewBox="0 0 10 14" fill="#CBD5E1" style={{ flexShrink: 0 }}>
                                    <circle cx="3" cy="2.5" r="1.3"/><circle cx="7" cy="2.5" r="1.3"/>
                                    <circle cx="3" cy="7" r="1.3"/><circle cx="7" cy="7" r="1.3"/>
                                    <circle cx="3" cy="11.5" r="1.3"/><circle cx="7" cy="11.5" r="1.3"/>
                                  </svg>
                                  <span style={{ fontSize: 11, fontWeight: 600, color: "#374151", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {label}
                                  </span>
                                  <button onClick={() => deleteSection(section.id)}
                                    style={{ width: 22, height: 22, border: "1px solid #FEE2E2", borderRadius: 5, background: "#FFF5F5", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}
                                    title="ブロックを削除">×</button>
                                </div>
                                {idx < activeSections.length - 1 && (
                                  <button
                                    onClick={() => handleInsertRequest(idx + 1)}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, width: "100%", height: 22, border: "1px dashed #C7D2FE", borderRadius: 6, background: "transparent", cursor: "pointer", color: "#818CF8", fontSize: 13, fontWeight: 700, margin: "2px 0", transition: "all 0.12s" }}
                                    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = "#EEF2FF"; el.style.borderColor = "#818CF8"; }}
                                    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = "transparent"; el.style.borderColor = "#C7D2FE"; }}>
                                    +
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ height: 1, background: "#F1F5F9", margin: "12px 0" }} />
                      </div>
                    )}

                    {/* ブロックを追加 */}
                    <button
                      onClick={() => { setInsertPosition(null); setShowBlockModal(true); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 0", borderRadius: 8, border: "1.5px dashed #C7D2FE", background: "#EEF2FF", cursor: "pointer", color: "#4F46E5", fontWeight: 700, fontSize: 12, marginBottom: 12, transition: "background 0.12s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E0E7FF"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EEF2FF"; }}>
                      <span style={{ fontSize: 15 }}>+</span> ブロックを追加
                    </button>
                  </div>
                )}

                {/* ── SEOパネル ── */}
                {sidePanel === "seo" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>OGP 画像 URL</span>
                      <input value={config.ogImage ?? ""} onChange={e => u({ ogImage: e.target.value })}
                        style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111" }}
                        placeholder="https://..." />
                    </label>
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>ファビコン URL</span>
                      <input value={config.favicon ?? ""} onChange={e => u({ favicon: e.target.value })}
                        style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111" }}
                        placeholder="https://..." />
                    </label>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ═══ Center: SitePreview ══════════════════════ */}
          <SitePreview
            config={getActiveConfig()}
            onConfigChange={handleActiveConfigChange}
            onInsertRequest={handleInsertRequest}
          />

        </div>
      </div>

      {/* Block insert modal */}
      {showBlockModal && (
        <BlockInsertModal
          onInsert={handleBlockInsert}
          onClose={() => { setShowBlockModal(false); setInsertPosition(null); }}
        />
      )}
    </EditingContext.Provider>
  );
}
