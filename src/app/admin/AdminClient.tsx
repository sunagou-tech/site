"use client";

import { useState, useEffect, useRef } from "react";
import {
  defaultConfig, SiteConfig, SitePage, SectionBlock,
  uid, BLOCK_META,
} from "@/types/site";
import SitePreview from "@/components/preview/SitePreview";
import BlockInsertModal from "@/components/admin/BlockInsertModal";
import { RefreshCw, ExternalLink, Plus, Layout, Globe, Check, AlertCircle, Undo2, Image, Copy, Trash2 } from "lucide-react";
import { EditingContext } from "@/contexts/EditingContext";
import { ImagePickContext } from "@/contexts/ImagePickContext";
import { publishSite, isSupabaseConfigured } from "@/lib/supabase";

type SidePanel = "settings" | "blocks" | "upload" | "ai-image" | "seo";
type DeviceMode = "pc" | "tablet" | "sp";
interface PageTab { id: string; slug: string; title: string; isHome: boolean; }
interface UploadedImage { id: string; name: string; url: string; uploadedAt: number; }

function toSlug(title: string) {
  return title.toLowerCase().replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || "my-site";
}

export default function AdminClient() {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [undoStack, setUndoStack] = useState<SiteConfig[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // AI 画像生成
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStyleIdx, setAiStyleIdx] = useState(0);
  const [aiSizeIdx, setAiSizeIdx] = useState(0);
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [aiGeneratedUrl, setAiGeneratedUrl] = useState<string | null>(null);
  const [activePageId, setActivePageId] = useState("home");
  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Device preview
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("pc");
  const [previewKey, setPreviewKey] = useState(0);

  // Sidebar state
  const [sidePanel, setSidePanel] = useState<SidePanel>("blocks");
  const [blockDragIdx, setBlockDragIdx] = useState<number | null>(null);
  const [blockDragOver, setBlockDragOver] = useState<number | null>(null);

  // Block insert modal
  const [insertPosition, setInsertPosition] = useState<number | null>(null); // null = append
  const [showBlockModal, setShowBlockModal] = useState(false);

  // 画像ピック（ライブラリ → ブロック配置）
  const [pickedUrl, setPickedUrl] = useState<string | null>(null);

  // Slug / publish
  const [siteSlug, setSiteSlug] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState<"idle" | "success" | "error">("idle");
  const [publishError, setPublishError] = useState("");

  // HTML直接編集モード（デモ生成時）
  const [htmlMode,    setHtmlMode]    = useState(false);
  const [siteHtml,    setSiteHtml]    = useState("");
  const [htmlBlobUrl, setHtmlBlobUrl] = useState("");

  // HTML → Blob URL（フローティング編集ポップアップ注入）
  useEffect(() => {
    if (!siteHtml) return;
    const script = `<script>
(function(){
  // ── ホバー用CSS（レイアウト非破壊）─────────────────────────────
  var style = document.createElement('style');
  style.textContent =
    '.ce-hover{outline:2px dashed rgba(79,70,229,0.5)!important;cursor:pointer!important;}' +
    '.ce-selected{outline:2px solid #4F46E5!important;}';
  document.head.appendChild(style);

  // ── アンカー・フォームのデフォルト動作を無効化 ─────────────────
  document.addEventListener('click', function(e){
    var t = e.target;
    while(t && t.tagName){
      if(t.tagName==='A'||t.tagName==='FORM'){ e.preventDefault(); break; }
      t = t.parentNode;
    }
  }, true);

  // ── フローティングポップアップ ─────────────────────────────────
  var activeEl = null;
  var popup = null;

  function removePopup(){
    if(popup){ popup.remove(); popup = null; }
    if(activeEl){ activeEl.classList.remove('ce-selected'); activeEl = null; }
  }

  function openPopup(el){
    removePopup();
    activeEl = el;
    el.classList.add('ce-selected');

    var rect = el.getBoundingClientRect();
    var popW = Math.max(rect.width, 260);
    var popLeft = Math.min(rect.left, window.innerWidth - popW - 8);
    if(popLeft < 4) popLeft = 4;
    var spaceBelow = window.innerHeight - rect.bottom;
    var popTop = spaceBelow > 130 ? rect.bottom + 6 : rect.top - 130;
    if(popTop < 4) popTop = 4;

    popup = document.createElement('div');
    popup.id = '__ce_popup';
    popup.style.cssText =
      'position:fixed;z-index:2147483647;' +
      'top:' + popTop + 'px;left:' + popLeft + 'px;width:' + popW + 'px;' +
      'background:#fff;border:2px solid #4F46E5;border-radius:8px;' +
      'box-shadow:0 4px 24px rgba(79,70,229,0.25);overflow:hidden;';

    var ta = document.createElement('textarea');
    ta.value = el.innerText;
    ta.style.cssText =
      'display:block;width:100%;min-height:64px;max-height:200px;padding:10px;' +
      'border:none;outline:none;resize:vertical;font:inherit;font-size:13px;' +
      'color:#111;background:#fff;box-sizing:border-box;line-height:1.5;';

    var bar = document.createElement('div');
    bar.style.cssText =
      'display:flex;gap:6px;padding:7px 8px;background:#EEF2FF;' +
      'border-top:1px solid #C7D2FE;';

    var btnOk = document.createElement('button');
    btnOk.textContent = '✓ 確定（Enter）';
    btnOk.style.cssText =
      'flex:1;padding:5px 8px;background:#4F46E5;color:#fff;border:none;' +
      'border-radius:5px;cursor:pointer;font-size:11px;font-weight:700;';

    var btnCancel = document.createElement('button');
    btnCancel.textContent = 'キャンセル';
    btnCancel.style.cssText =
      'padding:5px 8px;background:transparent;color:#6B7280;' +
      'border:1px solid #D1D5DB;border-radius:5px;cursor:pointer;font-size:11px;';

    bar.appendChild(btnOk); bar.appendChild(btnCancel);
    popup.appendChild(ta); popup.appendChild(bar);
    document.body.appendChild(popup);
    ta.focus(); ta.select();

    function commit(){
      // テキストノードのみ置換（HTMLタグ構造はそのまま）
      var newText = ta.value;
      var nodes = el.childNodes;
      var replaced = false;
      for(var i=0;i<nodes.length;i++){
        if(nodes[i].nodeType===3 && nodes[i].textContent.trim()){
          nodes[i].textContent = newText;
          replaced = true;
          break;
        }
      }
      if(!replaced) el.innerText = newText;
      removePopup();
      window.parent.postMessage({type:'html-update',html:document.documentElement.outerHTML},'*');
    }

    btnOk.addEventListener('mousedown', function(e){ e.preventDefault(); commit(); });
    btnCancel.addEventListener('mousedown', function(e){ e.preventDefault(); removePopup(); });
    ta.addEventListener('keydown', function(e){
      if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); commit(); }
      if(e.key==='Escape'){ removePopup(); }
    });

    // ポップアップ外クリックで閉じる
    setTimeout(function(){
      function outsideClick(e){
        if(popup && !popup.contains(e.target) && e.target !== el){
          removePopup();
          document.removeEventListener('mousedown', outsideClick);
        }
      }
      document.addEventListener('mousedown', outsideClick);
    }, 200);
  }

  // ── テキスト要素を全て検索してホバー+クリック設定 ───────────────
  var BLOCK = ['DIV','SECTION','ARTICLE','ASIDE','HEADER','FOOTER','NAV',
               'UL','OL','TABLE','TBODY','TR','FORM','IFRAME'];
  var sel = 'h1,h2,h3,h4,h5,h6,p,a,button,li,td,th,label,span,dt,dd,figcaption,blockquote,small,strong,em';

  document.querySelectorAll(sel).forEach(function(el){
    if(!el.textContent.trim()) return;
    // ブロック要素の子を含むコンテナはスキップ
    for(var i=0;i<el.children.length;i++){
      if(BLOCK.indexOf(el.children[i].tagName)>=0) return;
    }
    // ポップアップ自身はスキップ
    if(el.closest && el.closest('#__ce_popup')) return;

    el.addEventListener('mouseenter', function(){
      if(el !== activeEl) el.classList.add('ce-hover');
    });
    el.addEventListener('mouseleave', function(){
      el.classList.remove('ce-hover');
    });
    el.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      el.classList.remove('ce-hover');
      openPopup(el);
    });
  });
})();
<\/script>`;
    const injected = siteHtml.replace('</body>', script + '</body>');
    const url = URL.createObjectURL(new Blob([injected], { type: "text/html" }));
    setHtmlBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [siteHtml]);

  // iframeからのテキスト変更を受け取る（編集後のHTMLをsessionStorageに保存）
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === "html-update") {
        setSiteHtml(e.data.html);
        // 編集内容をsessionStorageに上書き保存（リフレッシュ後も反映）
        try { sessionStorage.setItem("site-html", e.data.html); } catch {}
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  // Load from sessionStorage (HTML mode) or localStorage (block mode) on mount
  useEffect(() => {
    const mode = sessionStorage.getItem("site-mode");
    if (mode === "html") {
      const html = sessionStorage.getItem("site-html") ?? "";
      setHtmlMode(true);
      setSiteHtml(html);
      setSidePanel("blocks");
      // sessionStorageはリフレッシュでも残す（タブを閉じるまで保持）
      return;
    }
    sessionStorage.removeItem("site-html");
    const saved = localStorage.getItem("site-config");
    if (saved) try {
      const sanitized = saved.replace(/https:\/\/picsum\.photos[^"]*/g, "");
      setConfig(JSON.parse(sanitized));
    } catch {}
    const savedSlug = localStorage.getItem("site-slug");
    if (savedSlug) setSiteSlug(savedSlug);
    const savedImages = localStorage.getItem("uploaded-images");
    if (savedImages) try { setUploadedImages(JSON.parse(savedImages)); } catch {}
  }, []);

  // ── Image upload ───────────────────────────────────────────
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    files.forEach((file) => {
      if (file.size > 3 * 1024 * 1024) {
        alert(`${file.name} は3MBを超えています。圧縮してからアップロードしてください。`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        const newImg: UploadedImage = { id: uid(), name: file.name, url, uploadedAt: Date.now() };
        setUploadedImages((prev) => {
          const next = [newImg, ...prev];
          try { localStorage.setItem("uploaded-images", JSON.stringify(next)); } catch {
            alert("ストレージ容量が不足しています。不要な画像を削除してください。");
          }
          return next;
        });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function deleteUploadedImage(id: string) {
    setUploadedImages((prev) => {
      const next = prev.filter((img) => img.id !== id);
      localStorage.setItem("uploaded-images", JSON.stringify(next));
      return next;
    });
  }

  function copyImageUrl(img: UploadedImage) {
    navigator.clipboard.writeText(img.url).then(() => {
      setCopiedId(img.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

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

  // ── Undo ──────────────────────────────────────────────────
  function updateConfig(next: SiteConfig) {
    setUndoStack((prev) => [...prev.slice(-49), config]); // 最大50件
    setConfig(next);
  }

  function handleUndo() {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setConfig(prev);
  }

  // ── AI 画像生成 ────────────────────────────────────────────
  const AI_STYLES = [
    { label: "リアル写真", en: "realistic photography, professional, high quality, 4k" },
    { label: "イラスト",   en: "flat illustration, digital art, clean vector style" },
    { label: "シネマ",     en: "cinematic, dramatic lighting, film photography" },
    { label: "ミニマル",   en: "minimal, clean, white background, simple" },
  ];
  const AI_SIZES = [
    { label: "横長 (PC)", w: 1080, h: 680 },
    { label: "縦長 (SP)", w: 800,  h: 1200 },
    { label: "正方形",    w: 800,  h: 800 },
  ];

  function generateAiImage() {
    if (!aiPrompt.trim()) return;
    setAiStatus("loading");
    setAiGeneratedUrl(null);
    const { w, h } = AI_SIZES[aiSizeIdx];
    const fullPrompt = `${aiPrompt}, ${AI_STYLES[aiStyleIdx].en}`;
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${w}&height=${h}&nologo=true&seed=${Math.floor(Math.random() * 99999)}&model=turbo`;
    const img = new window.Image();
    img.onload = () => { setAiGeneratedUrl(url); setAiStatus("done"); };
    img.onerror = () => setAiStatus("error");
    img.src = url;
  }

  function saveAiImageToLibrary() {
    if (!aiGeneratedUrl) return;
    const newImg: UploadedImage = {
      id: uid(), name: `AI生成_${new Date().toLocaleDateString("ja")}`, url: aiGeneratedUrl, uploadedAt: Date.now(),
    };
    setUploadedImages((prev) => {
      const next = [newImg, ...prev];
      try { localStorage.setItem("uploaded-images", JSON.stringify(next)); } catch {}
      return next;
    });
    setAiStatus("idle");
    setAiGeneratedUrl(null);
    setSidePanel("upload");
  }

  // ── Device switching ───────────────────────────────────────
  function switchDevice(mode: DeviceMode) {
    setDeviceMode(mode);
    if (mode !== "pc") {
      // Persist immediately so iframe can read latest config
      localStorage.setItem("site-config", JSON.stringify(config));
      setPreviewKey((k) => k + 1);
    }
  }

  // ── Active page helpers ────────────────────────────────────
  function getActiveConfig(): SiteConfig {
    if (activePageId === "home") return config;
    const page = config.pages.find((p) => p.id === activePageId);
    return { ...config, sections: page?.sections ?? [] };
  }

  function handleActiveConfigChange(newConfig: SiteConfig) {
    if (activePageId === "home") {
      updateConfig(newConfig);
    } else {
      updateConfig({
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
      updateConfig({ ...config, sections });
    } else {
      updateConfig({
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
  const u = (patch: Partial<SiteConfig>) => updateConfig({ ...config, ...patch });

  // ── Sidebar icons ──────────────────────────────────────────
  const SIDE_ICONS: { id: SidePanel; label: string; icon: React.ReactNode }[] = [
    { id: "settings", label: "設定",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
    { id: "blocks", label: "ブロック",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg> },
    { id: "upload", label: "画像",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
    { id: "ai-image", label: "AI画像",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L9.09 8.26L2 9.27L7 14.14L5.82 21L12 17.77L18.18 21L17 14.14L22 9.27L14.91 8.26L12 2Z"/></svg> },
    { id: "seo", label: "SEO",
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
  ];

  return (
    <EditingContext.Provider value={true}>
    <ImagePickContext.Provider value={{ pickedUrl, pick: setPickedUrl, clear: () => setPickedUrl(null) }}>
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

          {/* Device switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: 1, background: "#F1F5F9", borderRadius: 8, padding: 3, flexShrink: 0 }}>
            {([
              { mode: "pc" as DeviceMode, label: "PC",
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
              { mode: "tablet" as DeviceMode, label: "Tab",
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg> },
              { mode: "sp" as DeviceMode, label: "SP",
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><circle cx="12" cy="17" r="1" fill="currentColor"/></svg> },
            ] as { mode: DeviceMode; label: string; icon: React.ReactNode }[]).map(({ mode, label, icon }) => (
              <button key={mode} onClick={() => switchDevice(mode)}
                title={mode === "pc" ? "PC表示" : mode === "tablet" ? "タブレット表示 (768px)" : "スマホ表示 (390px)"}
                style={{ display: "flex", alignItems: "center", gap: 3, padding: "4px 8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600, transition: "all 0.12s",
                  background: deviceMode === mode ? "#FFFFFF" : "transparent",
                  color: deviceMode === mode ? "#4F46E5" : "#64748B",
                  boxShadow: deviceMode === mode ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                }}>
                {icon} {label}
              </button>
            ))}
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
            <button onClick={handleUndo} disabled={undoStack.length === 0}
              title={`元に戻す (${undoStack.length}件)`}
              style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "5px 8px", borderRadius: 7, border: "1px solid #E2E8F0", background: "transparent", cursor: undoStack.length === 0 ? "not-allowed" : "pointer",
                color: undoStack.length === 0 ? "#CBD5E1" : "#4F46E5",
                borderColor: undoStack.length === 0 ? "#F1F5F9" : "#C7D2FE",
              }}>
              <Undo2 size={11} /> 元に戻す
            </button>
            <button onClick={() => { setUndoStack([]); setConfig(defaultConfig); }}
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
                    : sidePanel === "upload" ? "画像ライブラリ"
                    : sidePanel === "ai-image" ? "AI画像生成"
                    : "SEO / 集客設定"}
                </p>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>

                {/* ── 設定パネル ── */}
                {sidePanel === "settings" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                    {/* タイトル・ロゴ */}
                    <div style={{ padding: "10px", background: "#F8FAFC", borderRadius: 8, display: "flex", flexDirection: "column", gap: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: "#475569", margin: 0, letterSpacing: "0.05em" }}>タイトル・ロゴ</p>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>サイト名</span>
                        <input value={config.title} onChange={e => u({ title: e.target.value })}
                          style={{ fontSize: 12, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111", background: "#fff" }} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>ロゴ画像 URL <span style={{ color: "#94A3B8", fontWeight: 400 }}>(任意)</span></span>
                        <input value={config.logoUrl ?? ""} onChange={e => u({ logoUrl: e.target.value || undefined })}
                          placeholder="https://example.com/logo.png"
                          style={{ fontSize: 11, padding: "7px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", color: "#111", background: "#fff" }} />
                        {config.logoUrl && (
                          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E2E8F0", borderRadius: 7, padding: "6px 8px" }}>
                            <img src={config.logoUrl} alt="logo preview" style={{ height: 28, maxWidth: 80, objectFit: "contain" }}
                              onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                            <span style={{ fontSize: 10, color: "#94A3B8" }}>プレビュー</span>
                            <button onClick={() => u({ logoUrl: undefined })}
                              style={{ marginLeft: "auto", fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer" }}>削除</button>
                          </div>
                        )}
                      </label>
                    </div>

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
                    {/* HTMLモード時の案内 */}
                    {htmlMode && (
                      <div style={{ marginBottom: 14, padding: "10px 12px", background: "#EEF2FF", borderRadius: 8, border: "1px solid #C7D2FE" }}>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#4F46E5", margin: "0 0 4px" }}>✏️ テキストをクリックして編集</p>
                        <p style={{ fontSize: 10, color: "#6366F1", margin: 0, lineHeight: 1.6 }}>右のプレビュー上でテキストを直接クリックすると編集できます。Enterまたはクリック外で確定。</p>
                      </div>
                    )}
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

                {/* ── 画像アップロードパネル ── */}
                {sidePanel === "upload" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* アップロードボタン */}
                    <input ref={uploadInputRef} type="file" accept="image/*" multiple
                      onChange={handleImageUpload} style={{ display: "none" }} />
                    <button onClick={() => uploadInputRef.current?.click()}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 0", borderRadius: 8, border: "1.5px dashed #C7D2FE", background: "#EEF2FF", cursor: "pointer", color: "#4F46E5", fontWeight: 700, fontSize: 12, transition: "background 0.12s" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#E0E7FF"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EEF2FF"; }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
                      画像をアップロード
                    </button>
                    <p style={{ fontSize: 10, color: "#94A3B8", margin: 0, textAlign: "center" }}>
                      最大3MB / JPG・PNG・WebP対応
                    </p>

                    {uploadedImages.length === 0 ? (
                      <div style={{ padding: "20px 0", textAlign: "center", color: "#CBD5E1", fontSize: 11 }}>
                        まだ画像がありません
                      </div>
                    ) : (
                      <>
                        <p style={{ fontSize: 10, fontWeight: 600, color: "#64748B", margin: "4px 0 2px", letterSpacing: "0.05em" }}>
                          アップロード済み ({uploadedImages.length}枚)
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                          {uploadedImages.map((img) => (
                            <div key={img.id}
                              onClick={() => setPickedUrl(pickedUrl === img.url ? null : img.url)}
                              style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: pickedUrl === img.url ? "2.5px solid #4F46E5" : "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", boxShadow: pickedUrl === img.url ? "0 0 0 3px #C7D2FE" : "none" }}>
                              {pickedUrl === img.url && (
                                <div style={{ position: "absolute", top: 4, right: 4, zIndex: 10, background: "#4F46E5", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><polyline points="1.5,5 3.8,7.5 8.5,2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </div>
                              )}
                              <img src={img.url} alt={img.name}
                                style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block", pointerEvents: "none" }} />
                              <div style={{ padding: "4px 6px", background: "#fff" }}>
                                <p style={{ fontSize: 9, color: "#64748B", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</p>
                              </div>
                              {/* アクションボタン */}
                              <div style={{ display: "flex", gap: 2, padding: "0 4px 4px", background: "#fff" }}>
                                <button onClick={() => copyImageUrl(img)}
                                  style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, padding: "4px 0", borderRadius: 5, border: "1px solid #E2E8F0", background: copiedId === img.id ? "#D1FAE5" : "#F8FAFC", color: copiedId === img.id ? "#059669" : "#4F46E5", cursor: "pointer", fontSize: 9, fontWeight: 600 }}>
                                  {copiedId === img.id ? "✓ コピー済" : "URLコピー"}
                                </button>
                                <button onClick={() => deleteUploadedImage(img.id)}
                                  style={{ width: 26, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, border: "1px solid #FEE2E2", background: "#FFF5F5", color: "#EF4444", cursor: "pointer" }}>
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p style={{ fontSize: 10, color: "#94A3B8", textAlign: "center", margin: "4px 0 0" }}>
                          クリックで選択 → プレビューの画像エリアをクリックで配置
                        </p>
                      </>
                    )}
                  </div>
                )}

                {/* ── AI画像生成パネル ── */}
                {sidePanel === "ai-image" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* プロンプト */}
                    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>どんな画像？（日本語でOK）</span>
                      <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                        rows={3} placeholder={"例：笑顔のビジネスチームが\n会議室で話し合う場面"}
                        onKeyDown={e => { if (e.key === "Enter" && e.metaKey) generateAiImage(); }}
                        style={{ fontSize: 11, padding: "8px 10px", border: "1px solid #E2E8F0", borderRadius: 7, outline: "none", resize: "none", color: "#111", lineHeight: 1.6 }} />
                    </label>

                    {/* サンプル */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>サンプル</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {["笑顔のビジネスチーム", "モダンオフィスの夜景", "自然の中でPCを開く人", "カフェで仕事する女性"].map(ex => (
                          <button key={ex} onClick={() => setAiPrompt(ex)}
                            style={{ fontSize: 9, padding: "3px 7px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#64748B", cursor: "pointer" }}>
                            {ex}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* スタイル */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>スタイル</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                        {AI_STYLES.map((s, i) => (
                          <button key={i} onClick={() => setAiStyleIdx(i)}
                            style={{ fontSize: 10, padding: "5px 0", borderRadius: 6, border: `1.5px solid ${aiStyleIdx === i ? config.primaryColor : "#E2E8F0"}`, background: aiStyleIdx === i ? config.primaryColor + "15" : "transparent", color: aiStyleIdx === i ? config.primaryColor : "#64748B", cursor: "pointer", fontWeight: aiStyleIdx === i ? 700 : 400 }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* サイズ */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#64748B" }}>サイズ</span>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
                        {AI_SIZES.map((s, i) => (
                          <button key={i} onClick={() => setAiSizeIdx(i)}
                            style={{ fontSize: 9, padding: "5px 2px", borderRadius: 6, border: `1.5px solid ${aiSizeIdx === i ? config.accentColor : "#E2E8F0"}`, background: aiSizeIdx === i ? config.accentColor + "20" : "transparent", color: aiSizeIdx === i ? "#374151" : "#64748B", cursor: "pointer", fontWeight: aiSizeIdx === i ? 700 : 400, textAlign: "center" }}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 生成ボタン */}
                    <button onClick={generateAiImage} disabled={!aiPrompt.trim() || aiStatus === "loading"}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%", padding: "10px 0", borderRadius: 8, border: "none", background: !aiPrompt.trim() || aiStatus === "loading" ? "#E2E8F0" : config.primaryColor, color: !aiPrompt.trim() || aiStatus === "loading" ? "#94A3B8" : "#fff", fontWeight: 700, fontSize: 12, cursor: !aiPrompt.trim() || aiStatus === "loading" ? "not-allowed" : "pointer" }}>
                      {aiStatus === "loading" ? (
                        <><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid currentColor", borderRadius: "50%", display: "inline-block", animation: "spin 0.6s linear infinite" }} /> 生成中… (10〜30秒)</>
                      ) : (
                        <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L9.09 8.26L2 9.27L7 14.14L5.82 21L12 17.77L18.18 21L17 14.14L22 9.27L14.91 8.26L12 2Z" fill="currentColor"/></svg> 画像を生成</>
                      )}
                    </button>

                    {/* 生成中プログレスバー */}
                    {aiStatus === "loading" && (
                      <div style={{ height: 3, background: "#F1F5F9", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ height: "100%", background: config.accentColor, borderRadius: 2, animation: "ai-progress 1.5s ease-in-out infinite", width: "40%" }} />
                        <style>{`@keyframes ai-progress{0%{transform:translateX(-100%);width:40%}50%{width:60%}100%{transform:translateX(300%);width:40%}}`}</style>
                      </div>
                    )}

                    {/* 生成結果 */}
                    {aiStatus === "done" && aiGeneratedUrl && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <img src={aiGeneratedUrl} alt="generated" style={{ width: "100%", borderRadius: 8, display: "block", border: "1px solid #E2E8F0" }} />
                        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 6 }}>
                          <button onClick={saveAiImageToLibrary}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 7, border: "none", background: "#059669", color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            ライブラリに保存
                          </button>
                          <button onClick={generateAiImage}
                            style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 10px", borderRadius: 7, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#64748B", fontSize: 10, cursor: "pointer" }}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                            再生成
                          </button>
                        </div>
                        <p style={{ fontSize: 9, color: "#94A3B8", textAlign: "center", margin: 0 }}>
                          保存後→「画像」タブからドラッグ&ドロップで設定
                        </p>
                      </div>
                    )}

                    {/* エラー */}
                    {aiStatus === "error" && (
                      <div style={{ padding: 10, background: "#FEF2F2", borderRadius: 8 }}>
                        <p style={{ fontSize: 11, color: "#DC2626", margin: "0 0 6px" }}>生成に失敗しました。</p>
                        <button onClick={generateAiImage}
                          style={{ fontSize: 10, color: "#DC2626", border: "1px solid #FECACA", borderRadius: 5, padding: "4px 10px", background: "#fff", cursor: "pointer" }}>
                          再試行
                        </button>
                      </div>
                    )}

                    <p style={{ fontSize: 9, color: "#CBD5E1", textAlign: "center", margin: 0 }}>
                      Powered by Pollinations AI · 無料・APIキー不要
                    </p>
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

          {/* ═══ Center: SitePreview / Device Preview ════ */}
          {htmlMode && htmlBlobUrl ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* 編集ヒントバー */}
              <div style={{ background: "#4F46E5", padding: "6px 16px", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span style={{ color: "white", fontSize: 11, fontWeight: 600 }}>編集モード</span>
                <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 11 }}>テキストをクリックして直接編集できます</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = htmlBlobUrl;
                      a.download = "site.html";
                      a.click();
                    }}
                    style={{ fontSize: 11, fontWeight: 600, padding: "3px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "white", cursor: "pointer" }}>
                    ↓ ダウンロード
                  </button>
                </div>
              </div>
              <iframe
                key={htmlBlobUrl}
                src={htmlBlobUrl}
                style={{ flex: 1, border: "none", display: "block" }}
                title="サイトプレビュー（クリックして編集）"
              />
            </div>
          ) : deviceMode === "pc" ? (
            <SitePreview
              config={getActiveConfig()}
              onConfigChange={handleActiveConfigChange}
              onInsertRequest={handleInsertRequest}
            />
          ) : (
            <div style={{ flex: 1, overflowY: "auto", background: "#E2E8F0", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 20, paddingBottom: 20, gap: 12 }}>
              {/* Refresh hint bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 8, padding: "6px 14px", fontSize: 11, color: "#64748B", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                <span>{deviceMode === "sp" ? "スマホ (390px)" : "タブレット (768px)"}</span>
                <button onClick={() => { localStorage.setItem("site-config", JSON.stringify(config)); setPreviewKey((k) => k + 1); }}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", borderRadius: 5, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#4F46E5", cursor: "pointer", fontSize: 10, fontWeight: 600 }}>
                  <RefreshCw size={10} /> 更新
                </button>
              </div>
              {/* Device frame */}
              <div style={{
                width: deviceMode === "sp" ? 390 : 768,
                background: "#fff",
                borderRadius: deviceMode === "sp" ? 36 : 12,
                boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
                overflow: "hidden",
                border: deviceMode === "sp" ? "8px solid #1E293B" : "6px solid #1E293B",
                flexShrink: 0,
              }}>
                <iframe
                  key={previewKey}
                  src="/"
                  style={{ width: "100%", height: deviceMode === "sp" ? 760 : 1000, border: "none", display: "block" }}
                  title="デバイスプレビュー"
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 画像選択中バナー */}
      {pickedUrl && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 9999, background: "#4F46E5", color: "#fff", borderRadius: 999, padding: "10px 20px", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 4px 20px rgba(79,70,229,0.4)", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12,8 12,12 14,14"/></svg>
          画像を選択中 — 配置したい画像エリアをクリック
          <button onClick={() => setPickedUrl(null)} style={{ marginLeft: 6, background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>×</button>
        </div>
      )}

      {/* Block insert modal */}
      {showBlockModal && (
        <BlockInsertModal
          onInsert={handleBlockInsert}
          onClose={() => { setShowBlockModal(false); setInsertPosition(null); }}
        />
      )}
    </ImagePickContext.Provider>
    </EditingContext.Provider>
  );
}
