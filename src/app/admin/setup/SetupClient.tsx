"use client";

import "@material-symbols/font-400/rounded.css";
import { useState, useRef, useCallback } from "react";
import { GlobalStyle } from "@/types/site";
import type { CloneText } from "@/app/api/clone-site/route";

const NAVY = "#1A365D";

type Phase = "form" | "generating" | "preview";

const GEN_STEPS = [
  { pct: 10,  text: "参考サイトのHTMLを取得中..." },
  { pct: 28,  text: "デザイン・構成を解析中..." },
  { pct: 45,  text: "テキスト要素を抽出中..." },
  { pct: 60,  text: "AIがビジネス情報を書き込み中..." },
  { pct: 75,  text: "見出し・コピーを最適化中..." },
  { pct: 88,  text: "HTMLを組み立て中..." },
  { pct: 96,  text: "最終チェック中..." },
];

const TAG_LABEL: Record<string, string> = {
  h1: "メインキャッチコピー",
  h2: "セクション見出し",
  h3: "小見出し",
  h4: "小見出し",
  h5: "小見出し",
  p:  "本文テキスト",
};

function MsIcon({ name, size = 20, color = NAVY, className = "" }: {
  name: string; size?: number; color?: string; className?: string;
}) {
  return (
    <span
      className={`material-symbols-rounded select-none leading-none ${className}`}
      style={{ fontSize: size, color }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

function FontLinks() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Montserrat:wght@600;700&display=swap"
        rel="stylesheet"
      />
    </>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
export default function SetupClient() {
  const [phase,          setPhase]          = useState<Phase>("form");
  const [referenceUrl,   setReferenceUrl]   = useState("");
  const [isAnalyzing,    setIsAnalyzing]    = useState(false);
  const [analysisResult, setAnalysisResultState] = useState<GlobalStyle | null>(null);
  const analysisResultRef = useRef<GlobalStyle | null>(null);
  const [cloneHtml,      setCloneHtml]      = useState<string | null>(null);
  const [previewTexts,   setPreviewTexts]   = useState<CloneText[]>([]);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error,          setError]          = useState("");
  const [genPct,         setGenPct]         = useState(0);
  const [genText,        setGenText]        = useState(GEN_STEPS[0].text);

  const [businessName, setBusinessName] = useState("");
  const [serviceDesc,  setServiceDesc]  = useState("");
  const [target,       setTarget]       = useState("");
  const [strengths,    setStrengths]    = useState("");

  function setAnalysisResult(val: GlobalStyle | null) {
    analysisResultRef.current = val;
    setAnalysisResultState(val);
  }

  // ─── 参考サイト解析 ──────────────────────────────────────
  const analyzeUrl = useCallback(async () => {
    const url = referenceUrl.trim();
    if (!url || isAnalyzing) return;
    setIsAnalyzing(true);
    setError("");
    try {
      const res  = await fetch("/api/analyze-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      let data: { error?: string; style?: unknown };
      try { data = await res.json(); } catch { throw new Error("デザイン解析をスキップしました（そのまま生成できます）"); }
      if (!res.ok || data.error) throw new Error(data.error ?? "デザイン解析をスキップしました（そのまま生成できます）");
      setAnalysisResult(data.style as GlobalStyle);
    } catch (e) {
      setError(e instanceof Error ? e.message : "URL解析に失敗しました");
    } finally {
      setIsAnalyzing(false);
    }
  }, [referenceUrl, isAnalyzing]);

  // ─── サイト生成 ──────────────────────────────────────────
  const generateSite = useCallback(async () => {
    setPhase("generating");
    setGenPct(0);
    setGenText(GEN_STEPS[0].text);

    GEN_STEPS.forEach(({ pct, text }, i) => {
      setTimeout(() => { setGenPct(pct); setGenText(text); }, i * 1800);
    });

    try {
      const res = await fetch("/api/clone-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: referenceUrl.trim(),
          formData: { businessName, serviceDesc, target, strengths },
        }),
      });
      let data: { error?: string; html?: string; texts?: CloneText[] };
      try { data = await res.json(); } catch { throw new Error("サーバーエラーが発生しました。もう一度お試しください。"); }
      if (!res.ok || data.error) throw new Error(data.error ?? "生成に失敗しました");

      setGenPct(100);
      setTimeout(() => {
        setCloneHtml(data.html ?? "");
        setPreviewTexts(data.texts ?? []);
        setPhase("preview");
      }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
      setPhase("form");
    }
  }, [referenceUrl, businessName, serviceDesc, target, strengths]);

  // ─── テキストをリアルタイムで更新 ─────────────────────────
  const updateText = useCallback((id: number, newText: string) => {
    setPreviewTexts(prev => prev.map(t => t.id === id ? { ...t, text: newText } : t));
    // iframe の DOM を直接書き換え（再レンダリングなし）
    const doc = iframeRef.current?.contentDocument;
    if (doc) {
      const el = doc.querySelector(`[data-tsk-id="${id}"]`);
      if (el) el.textContent = newText;
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("form");
    setCloneHtml(null);
    setPreviewTexts([]);
    setDrawerOpen(false);
    setError("");
    setReferenceUrl("");
    setAnalysisResult(null);
  }, []);

  // ══════════════════════════════════════════════════════════
  // PHASE: GENERATING
  // ══════════════════════════════════════════════════════════
  if (phase === "generating") {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4"
        style={{ background: "#F9FAFB", fontFamily: "'Noto Sans JP', sans-serif" }}
      >
        <FontLinks />

        {/* スピナー */}
        <div className="relative w-36 h-36 mb-10">
          <div className="absolute inset-0 rounded-full border-[3px] border-[#E2E8F0]" />
          <div
            className="absolute inset-0 rounded-full border-[3px] border-t-[#1A365D] border-r-[#2B6CB0] border-b-transparent border-l-transparent"
            style={{ animation: "spin 1.2s linear infinite" }}
          />
          <div
            className="absolute inset-[10px] rounded-full border-[3px] border-t-transparent border-r-transparent border-b-[#D69E2E] border-l-[#ED8936]"
            style={{ animation: "spin 1.8s linear infinite reverse" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <MsIcon name="auto_awesome" size={36} color={NAVY} />
          </div>
        </div>

        <h2
          className="text-3xl font-bold mb-2 text-center"
          style={{ color: "#111827", letterSpacing: "-0.03em" }}
        >
          AIがサイトを生成中
        </h2>
        <p className="text-xs mb-2 text-center px-6 truncate max-w-sm" style={{ color: "#9CA3AF" }}>
          {referenceUrl}
        </p>
        <p className="text-sm mb-10 text-center" style={{ color: "#6B7280" }}>{genText}</p>

        {/* プログレスバー */}
        <div className="w-80 bg-[#E2E8F0] rounded-full h-1.5 mb-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${genPct}%`, background: `linear-gradient(90deg, ${NAVY}, #2B6CB0)` }}
          />
        </div>
        <p
          className="text-sm tabular-nums font-semibold"
          style={{ fontFamily: "'Montserrat', sans-serif", color: NAVY }}
        >
          {genPct}%
        </p>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // PHASE: PREVIEW
  // ══════════════════════════════════════════════════════════
  if (phase === "preview" && cloneHtml) {
    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", fontFamily: "'Noto Sans JP', sans-serif" }}>
        <FontLinks />

        {/* ─── トップバー ─── */}
        <div style={{
          background: "#FFFFFF", borderBottom: "1px solid #E2E8F0",
          height: 52, flexShrink: 0, display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "0 16px", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ツクリエ" style={{ width: 26, height: 26, borderRadius: 7, objectFit: "cover" }} />
            <div>
              <p className="font-bold text-sm" style={{ color: "#111827" }}>サイトが完成しました！</p>
              <p className="text-xs truncate max-w-xs" style={{ color: "#9CA3AF" }}>{referenceUrl}</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {previewTexts.length > 0 && (
              <button
                onClick={() => setDrawerOpen(o => !o)}
                className="flex items-center gap-1.5 font-semibold text-sm px-4 py-2 rounded-xl transition-all"
                style={{
                  background: drawerOpen ? "#059669" : NAVY,
                  color: "#FFFFFF",
                }}
              >
                <MsIcon name={drawerOpen ? "check" : "edit"} size={16} color="#FFFFFF" />
                {drawerOpen ? "編集を閉じる" : "テキストを編集する"}
              </button>
            )}
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg"
              style={{ color: "#6B7280", border: "1px solid #E2E8F0", background: "#FFFFFF" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}
            >
              <MsIcon name="refresh" size={14} color="#6B7280" />
              やり直す
            </button>
          </div>
        </div>

        {/* ─── iframeフル幅＋右ドロワー ─── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>

          {/* iframe：常に全幅 */}
          <iframe
            ref={iframeRef}
            srcDoc={cloneHtml}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title="生成されたサイト"
          />

          {/* 右ドロワー：テキスト編集パネル */}
          <div style={{
            position: "absolute", top: 0, right: 0, height: "100%", width: 320,
            background: "#FFFFFF", borderLeft: "1px solid #E2E8F0",
            overflowY: "auto", padding: "20px 16px",
            transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
            transition: "transform 0.25s ease",
            boxShadow: drawerOpen ? "-4px 0 20px rgba(0,0,0,0.08)" : "none",
          }}>
            <div style={{ marginBottom: 16 }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#9CA3AF" }}>テキストを編集</p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "#6B7280" }}>
                入力するとサイトがリアルタイムで更新されます
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {previewTexts.map((t, i) => (
                <div key={t.id}>
                  <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#9CA3AF", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {TAG_LABEL[t.tag] ?? t.tag.toUpperCase()} {i + 1}
                  </label>
                  {t.tag === "h1" || t.text.length > 50 ? (
                    <textarea
                      value={t.text}
                      onChange={e => updateText(t.id, e.target.value)}
                      rows={t.tag === "h1" ? 2 : 3}
                      className="w-full text-xs rounded-lg px-3 py-2 outline-none resize-none focus:ring-2 focus:ring-blue-200"
                      style={{ border: "1.5px solid #E2E8F0", background: "#F9FAFB", color: "#111827", lineHeight: 1.6 }}
                    />
                  ) : (
                    <input
                      type="text"
                      value={t.text}
                      onChange={e => updateText(t.id, e.target.value)}
                      className="w-full text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                      style={{ border: "1.5px solid #E2E8F0", background: "#F9FAFB", color: "#111827" }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // PHASE: FORM
  // ══════════════════════════════════════════════════════════
  const canGenerate = !!referenceUrl.trim() && !!businessName.trim() && !!serviceDesc.trim();

  return (
    <div
      style={{ height: "100vh", display: "flex", overflow: "hidden", background: "#F9FAFB", fontFamily: "'Noto Sans JP', sans-serif" }}
    >
      <FontLinks />

      {/* ─── 左サイドバー（固定） ─── */}
      <aside
        style={{
          width: 300, height: "100vh", background: "#FFFFFF", borderRight: "1px solid #E2E8F0",
          flexShrink: 0, display: "flex", flexDirection: "column",
          padding: "36px 28px", gap: 28, overflowY: "auto",
        }}
        className="hidden lg:flex"
      >
        {/* ロゴ */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ツクリエ" style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover" }} />
          <span className="font-bold text-base" style={{ color: "#111827" }}>ツクリエ</span>
        </div>

        {/* URL入力 */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <MsIcon name="travel_explore" size={16} color={NAVY} />
            <p className="text-sm font-bold" style={{ color: "#111827" }}>参考サイトのURLを入力</p>
          </div>
          <p className="text-xs mb-3 leading-relaxed" style={{ color: "#6B7280" }}>
            真似したいサイトのURLを入れると、そのデザイン・配色・フォントを丸ごと取り込みます
          </p>
          <input
            type="url"
            value={referenceUrl}
            onChange={e => setReferenceUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") analyzeUrl(); }}
            placeholder="https://example.com"
            className="w-full text-xs rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-blue-200 mb-2"
            style={{ border: "1px solid #E2E8F0", background: "#F9FAFB", color: "#111827" }}
          />
          <button
            onClick={analyzeUrl}
            disabled={isAnalyzing || !referenceUrl.trim()}
            className="w-full text-sm py-2.5 rounded-lg font-semibold transition-opacity disabled:opacity-40"
            style={{ background: NAVY, color: "#FFFFFF" }}
          >
            {isAnalyzing
              ? <span className="flex items-center justify-center gap-2"><MsIcon name="hourglass_top" size={14} color="#FFFFFF" />解析中...</span>
              : "このデザインを取り込む"
            }
          </button>

          {/* 解析結果 */}
          {analysisResult && (
            <div className="mt-3 p-3 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#059669" }}>✓ デザイン解析完了</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                {[
                  { key: "primaryColor",  label: "メイン" },
                  { key: "accentColor",   label: "アクセント" },
                  { key: "heroBgColor",   label: "Hero" },
                  { key: "bgColor",       label: "背景" },
                  { key: "cardBgColor",   label: "カード" },
                  { key: "buttonBgColor", label: "ボタン" },
                ].map(({ key, label }) => {
                  const color = (analysisResult as Record<string, string>)[key];
                  if (!color) return null;
                  return (
                    <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, backgroundColor: color, border: "1.5px solid rgba(0,0,0,0.12)" }} />
                      <span style={{ fontSize: 9, color: "#9CA3AF" }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysisResult.headingFont && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#EBF4FF", color: NAVY }}>
                    {analysisResult.headingFont}
                  </span>
                )}
                {analysisResult.designStyle && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#FFF7ED", color: "#92400E" }}>
                    {analysisResult.designStyle}
                  </span>
                )}
                {analysisResult.designNotes && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F0FFF4", color: "#065F46" }}>
                    {analysisResult.designNotes}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 使い方ステップ */}
        <div style={{ paddingTop: 20, borderTop: "1px solid #E2E8F0" }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: "#9CA3AF" }}>使い方</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { num: "01", text: "真似したいサイトのURLを入力する" },
              { num: "02", text: "あなたの事業情報を入力する" },
              { num: "03", text: "ボタンを押してサイトを生成" },
              { num: "04", text: "テキストを編集してオリジナルに仕上げる" },
            ].map(step => (
              <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <span
                  className="font-bold text-xs shrink-0"
                  style={{ color: NAVY, fontFamily: "'Montserrat', sans-serif" }}
                >
                  {step.num}
                </span>
                <span className="text-xs leading-relaxed" style={{ color: "#374151" }}>{step.text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── メインエリア ─── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        {/* ヘッダー */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 24px", borderBottom: "1px solid #E2E8F0",
            background: "#FFFFFF", flexShrink: 0,
          }}
        >
          <div className="flex items-center gap-2 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="ツクリエ" style={{ width: 28, height: 28, borderRadius: 8, objectFit: "cover" }} />
            <span className="text-sm font-bold" style={{ color: "#111827" }}>ツクリエ</span>
          </div>
          <div className="hidden lg:block" />

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {error && (
              <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "#6B7280", background: "#F3F4F6", border: "1px solid #E5E7EB" }}>
                {error}
              </span>
            )}
            <a
              href="/admin"
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ color: "#6B7280", border: "1px solid #E2E8F0", background: "#FFFFFF" }}
            >
              スキップして編集へ →
            </a>
          </div>
        </div>

        {/* フォームエリア */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-12">

            <div className="mb-10">
              <h1
                className="font-bold mb-3 leading-tight"
                style={{ fontSize: 26, color: "#111827", letterSpacing: "-0.03em" }}
              >
                参考サイトのデザインで
                <br />
                <span style={{ color: NAVY }}>プロ級サイト</span>を自動生成
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#6B7280" }}>
                真似したいサイトのURLを左のメニューから入力するだけ。
                <br />
                同じデザインのプロ仕様サイトが自動で完成します。
              </p>
            </div>

            {!referenceUrl.trim() && (
              <div
                className="mb-8 flex items-start gap-3 p-4 rounded-xl"
                style={{ background: "#FFF7ED", border: "1px solid #FED7AA" }}
              >
                <MsIcon name="info" size={18} color="#EA580C" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#EA580C" }}>
                    まず参考サイトのURLを入力してください
                  </p>
                  <p className="text-xs mt-0.5 leading-relaxed" style={{ color: "#92400E" }}>
                    左のメニューに真似したいサイトのURLを入力して「このデザインを取り込む」を押してください
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                  事業・サービス名 <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  placeholder="例：田中税理士事務所 / フリーランスデザイナー 山田太郎"
                  className="w-full text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ border: "1.5px solid #E2E8F0", background: "#FFFFFF", color: "#111827" }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: "#111827" }}>
                  どんなサービス・商品ですか？ <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <textarea
                  value={serviceDesc}
                  onChange={e => setServiceDesc(e.target.value)}
                  placeholder="例：中小企業向けの税務申告・節税対策サービスを提供しています。年間100社以上のサポート実績があります。"
                  rows={3}
                  className="w-full text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  style={{ border: "1.5px solid #E2E8F0", background: "#FFFFFF", color: "#111827" }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#111827" }}>
                  ターゲット（誰に向けたサービスですか？）
                </label>
                <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>任意</p>
                <input
                  type="text"
                  value={target}
                  onChange={e => setTarget(e.target.value)}
                  placeholder="例：30〜50代の経営者 / 副業を始めたいサラリーマン"
                  className="w-full text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
                  style={{ border: "1.5px solid #E2E8F0", background: "#FFFFFF", color: "#111827" }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1" style={{ color: "#111827" }}>
                  強み・特徴（他社との違い）
                </label>
                <p className="text-xs mb-2" style={{ color: "#9CA3AF" }}>任意</p>
                <textarea
                  value={strengths}
                  onChange={e => setStrengths(e.target.value)}
                  placeholder="例：即日対応 / 完全オンライン / 初回相談無料 / 20年の実績"
                  rows={2}
                  className="w-full text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 resize-none"
                  style={{ border: "1.5px solid #E2E8F0", background: "#FFFFFF", color: "#111827" }}
                />
              </div>

              <button
                onClick={generateSite}
                disabled={!canGenerate}
                className="w-full flex items-center justify-center gap-3 font-bold text-base py-4 rounded-2xl text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: canGenerate
                    ? `linear-gradient(135deg, ${NAVY}, #2B6CB0)`
                    : "#CBD5E1",
                  boxShadow: canGenerate ? "0 4px 20px rgba(26,54,93,0.3)" : "none",
                }}
              >
                <MsIcon name="auto_awesome" size={20} color="#FFFFFF" />
                このデザインでサイトを生成する
              </button>

              {!canGenerate && (
                <p className="text-center text-xs" style={{ color: "#9CA3AF" }}>
                  {!referenceUrl.trim()
                    ? "左のメニューに参考サイトのURLを入力してください"
                    : "事業名とサービス内容を入力してください"
                  }
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
