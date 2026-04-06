"use client";

/**
 * /admin/setup — AIヒアリング＆自動生成画面
 * ─────────────────────────────────────────────────────────
 * Phase 1 (interview): チャット形式でビジネス情報をヒアリング
 * Phase 2 (generating): アニメーション付きサイト生成
 * Phase 3 (preview): 実際のブロックをプレビュー + 編集開始
 *
 * デザイン: 白基調・清潔感・日本市場特化
 * アイコン: Material Symbols Rounded (@material-symbols/font-400)
 */

import "@material-symbols/font-400/rounded.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SiteConfig, GlobalStyle } from "@/types/site";
import CanvasEditor from "@/components/canvas/CanvasEditor";
import { EditingContext } from "@/contexts/EditingContext";

// ─── カラー定数 ──────────────────────────────────────────
const NAVY = "#1A365D";

// ─── 型 ────────────────────────────────────────────────────
type Phase = "interview" | "generating" | "preview";
type Msg = { role: "user" | "assistant"; content: string };

// ─── 生成進捗テキスト ────────────────────────────────────────
const GEN_STEPS = [
  { pct: 10,  text: "ヒアリング内容を分析中..." },
  { pct: 25,  text: "ファーストビューを構築中..." },
  { pct: 40,  text: "課題・解決策セクションを生成中..." },
  { pct: 55,  text: "強み・特徴カードを作成中..." },
  { pct: 70,  text: "ステップ・お客様の声を生成中..." },
  { pct: 82,  text: "FAQ・CTAを最適化中..." },
  { pct: 92,  text: "デザインを日本市場向けに調整中..." },
  { pct: 98,  text: "最終チェック中..." },
];

// ─── セクション名マップ ─────────────────────────────────────
const SECTION_LABELS: Record<string, string> = {
  "hero-gradient": "① ファーストビュー（Hero）",
  problem:         "② お悩み共感セクション",
  solution:        "③ 解決策の提示",
  features:        "④ 選ばれる理由（3つの強み）",
  steps:           "⑤ ご利用の流れ",
  testimonials:    "⑥ お客様の声",
  faq:             "⑦ よくある質問",
  cta:             "⑧ お問い合わせ CTA",
  footer:          "フッター",
};

// ─── How it works（Material Symbols アイコン）─────────────
const HOW_IT_WORKS = [
  { icon: "chat",          title: "AIがヒアリング",     desc: "5つの質問に答えるだけ" },
  { icon: "bolt",          title: "自動でサイト生成",   desc: "日本市場の黄金構成で即時生成" },
  { icon: "edit_note",     title: "自由に編集",         desc: "テキスト・色・画像をカスタマイズ" },
  { icon: "rocket_launch", title: "公開",               desc: "ワンクリックで世界に公開" },
];

// ─── Material Symbol コンポーネント ─────────────────────────
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

// ─── SSE ストリームパーサー ─────────────────────────────────
async function* parseAnthropicStream(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<string> {
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === "content_block_delta" && parsed.delta?.type === "text_delta") {
          yield parsed.delta.text as string;
        }
      } catch { /* ignore */ }
    }
  }
}

// ─── Markdown 簡易レンダラー ────────────────────────────────
function RenderMarkdown({ text }: { text: string }) {
  const cleaned = text.replace(/\[GENERATE\]/g, "");
  return (
    <>
      {cleaned.split("\n").map((line, i, arr) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={i}>
            {parts.map((p, k) =>
              p.startsWith("**") && p.endsWith("**") ? (
                <strong key={k} style={{ fontWeight: 700 }}>{p.slice(2, -2)}</strong>
              ) : p
            )}
            {i < arr.length - 1 && <br />}
          </span>
        );
      })}
    </>
  );
}

// ══════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════
export default function SetupClient() {
  const router = useRouter();

  const [phase,           setPhase]           = useState<Phase>("interview");
  const [messages,        setMessages]        = useState<Msg[]>([]);
  const [input,           setInput]           = useState("");
  const [isStreaming,     setIsStreaming]      = useState(false);
  const [genPct,          setGenPct]          = useState(0);
  const [genText,         setGenText]         = useState(GEN_STEPS[0].text);
  const [generatedConfig, setGeneratedConfig] = useState<SiteConfig | null>(null);
  const [error,           setError]           = useState("");
  const [referenceUrl,    setReferenceUrl]    = useState("");
  const [isAnalyzing,     setIsAnalyzing]     = useState(false);
  const [analysisResult,  setAnalysisResultState] = useState<GlobalStyle | null>(null);
  const analysisResultRef = useRef<GlobalStyle | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLTextAreaElement>(null);

  function setAnalysisResult(val: GlobalStyle | null) {
    analysisResultRef.current = val;
    setAnalysisResultState(val);
  }

  // 初期 AI メッセージ
  useEffect(() => {
    setMessages([{
      role: "assistant",
      content:
        "こんにちは！私はAIウェブサイトコンサルタントです😊\n\nあなたのビジネスにぴったりの**プロ仕様サイト**を、たった5つの質問で自動生成します！\n\nまず最初に教えてください👇\n\n**どのような事業・サービスを行っていますか？**\n（例：税理士事務所、フリーランスデザイナー、カフェ、ECサイトなど）",
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // AIの返答完了後にフォーカスを戻す
    if (!isStreaming) inputRef.current?.focus();
  }, [messages, isStreaming]);

  // ─── チャット送信 ────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    setError("");

    const userMsg: Msg = { role: "user", content: text };
    const historyWithUser = [...messages, userMsg];
    setMessages([...historyWithUser, { role: "assistant", content: "" }]);
    setIsStreaming(true);

    try {
      const res = await fetch("/api/setup-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyWithUser, phase: "chat" }),
      });
      if (!res.ok || !res.body) throw new Error(await res.text());

      const reader = res.body.getReader();
      let accumulated = "";
      for await (const chunk of parseAnthropicStream(reader)) {
        accumulated += chunk;
        setMessages(prev => {
          const next = [...prev];
          next[next.length - 1] = { role: "assistant", content: accumulated };
          return next;
        });
      }
      setIsStreaming(false);
      inputRef.current?.focus();
      if (accumulated.includes("[GENERATE]")) {
        setTimeout(() => generateSite(historyWithUser), 600);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setIsStreaming(false);
      inputRef.current?.focus();
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: "assistant", content: "申し訳ありません、エラーが発生しました。もう一度お試しください。" };
        return next;
      });
    }
  }, [input, messages, isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── サイト生成 ──────────────────────────────────────────
  const generateSite = useCallback(async (chatMessages: Msg[]) => {
    setPhase("generating");
    setGenPct(0);
    setGenText(GEN_STEPS[0].text);

    GEN_STEPS.forEach(({ pct, text }, i) => {
      setTimeout(() => { setGenPct(pct); setGenText(text); }, i * 1200);
    });

    try {
      const res  = await fetch("/api/setup-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          phase: "generate",
          analysisResult: analysisResultRef.current ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "生成に失敗しました");

      setGenPct(100);
      setTimeout(() => { setGeneratedConfig(data.config); setPhase("preview"); }, 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
      setPhase("interview");
    }
  }, []);


  const startEditing = useCallback(() => {
    if (!generatedConfig) return;
    localStorage.setItem("site-config", JSON.stringify(generatedConfig));
    router.push("/admin");
  }, [generatedConfig, router]);

  const reset = useCallback(() => {
    setPhase("interview");
    setMessages([{ role: "assistant", content: "最初からやり直しましょう😊\n\n**どのような事業・サービスを行っていますか？**" }]);
    setInput(""); setGeneratedConfig(null); setError("");
  }, []);

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
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error ?? "解析に失敗しました");
      setAnalysisResult(data.style);
    } catch (e) {
      setError(e instanceof Error ? e.message : "URL解析に失敗しました");
    } finally {
      setIsAnalyzing(false);
    }
  }, [referenceUrl, isAnalyzing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME変換中（日本語入力確定のEnter）は送信しない
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── フォント link タグ（全 phase 共通） ──────────────────
  const FontLinks = () => (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Montserrat:wght@600;700&display=swap"
        rel="stylesheet"
      />
    </>
  );

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
            <MsIcon name="bolt" size={36} color={NAVY} />
          </div>
        </div>

        <h2
          className="text-3xl font-bold mb-2 text-center"
          style={{ color: "#111827", letterSpacing: "-0.03em" }}
        >
          AIがサイトを生成中
        </h2>
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

        {/* セクション進捗バッジ */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-lg">
          {Object.values(SECTION_LABELS).map((label, i) => {
            const done = genPct >= (i + 1) * 10;
            return (
              <div
                key={label}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-500"
                style={{
                  background: done ? "#EBF4FF" : "#FFFFFF",
                  borderColor: done ? "#BEE3F8" : "#E2E8F0",
                  color: done ? NAVY : "#9CA3AF",
                }}
              >
                {done
                  ? <MsIcon name="check_circle" size={12} color={NAVY} />
                  : <span className="w-3 h-3 rounded-full border border-[#E2E8F0] shrink-0" />
                }
                <span>{label.replace(/^[①-⑨] /, "")}</span>
              </div>
            );
          })}
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // PHASE: PREVIEW
  // ══════════════════════════════════════════════════════════
  if (phase === "preview" && generatedConfig) {
    const cfg = generatedConfig;
    const TOP_H = 60; // px

    return (
      <div style={{ minHeight: "100vh", background: "#F9FAFB", fontFamily: "'Noto Sans JP', sans-serif" }}>
        <FontLinks />

        <EditingContext.Provider value={true}>
          {/* ─── トップバー ─── */}
          <div
            className="sticky top-0 z-50 shadow-sm"
            style={{ background: "#FFFFFF", borderBottom: "1px solid #E2E8F0", height: TOP_H }}
          >
            <div className="max-w-7xl mx-auto px-5 h-full flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "#EBF4FF" }}
                >
                  <MsIcon name="check_circle" size={18} color={NAVY} />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight" style={{ color: "#111827" }}>
                    サイトが完成しました
                  </p>
                  <p className="text-xs" style={{ color: "#6B7280" }}>
                    テキストをクリックして直接編集できます
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors"
                  style={{ color: "#6B7280", border: "1px solid #E2E8F0", background: "#FFFFFF" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#F9FAFB"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#FFFFFF"; }}
                >
                  <MsIcon name="refresh" size={14} color="#6B7280" />
                  やり直す
                </button>
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 font-bold text-sm px-5 py-2 rounded-xl text-white transition-all shadow-md"
                  style={{ background: "#EA580C" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#C2410C"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EA580C"; }}
                >
                  この内容で編集を始める
                  <MsIcon name="arrow_forward" size={16} color="#FFFFFF" />
                </button>
              </div>
            </div>
          </div>

          {/* ─── 2カラムレイアウト ─── */}
          <div className="flex max-w-7xl mx-auto">
            {/* 左：サマリー */}
            <aside
              className="w-68 shrink-0 overflow-y-auto p-6"
              style={{
                width: 272,
                borderRight: "1px solid #E2E8F0",
                background: "#FFFFFF",
                position: "sticky",
                top: TOP_H,
                height: `calc(100vh - ${TOP_H}px)`,
              }}
            >
              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: NAVY }}>
                  生成されたサイト
                </p>
                <h2 className="text-lg font-bold leading-snug" style={{ color: "#111827" }}>
                  {cfg.title}
                </h2>
                <p className="text-sm mt-1 leading-relaxed" style={{ color: "#6B7280" }}>
                  {cfg.catchCopy}
                </p>
              </div>

              {/* カラー */}
              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
                  カラー設定
                </p>
                <div className="flex gap-3">
                  {[
                    { label: "メイン", color: cfg.primaryColor },
                    { label: "アクセント", color: cfg.accentColor },
                  ].map(({ label, color }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full shadow-sm"
                        style={{ backgroundColor: color, border: "2px solid #E2E8F0" }}
                      />
                      <span className="text-xs" style={{ color: "#6B7280" }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* キャンバス要素数 */}
              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
                  キャンバス要素
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: "#374151" }}>
                  <MsIcon name="check_circle" size={13} color="#10B981" />
                  {cfg.elements?.length ?? 0} 個の要素が配置されました
                </div>
              </div>

              {/* ナビゲーション */}
              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#9CA3AF" }}>
                  ナビゲーション
                </p>
                <div className="space-y-1">
                  {cfg.navLinks.map(n => (
                    <div key={n.id} className="text-xs" style={{ color: "#6B7280" }}>
                      {n.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4" style={{ borderTop: "1px solid #E2E8F0" }}>
                <p className="text-[10px] text-center leading-relaxed mb-4" style={{ color: "#9CA3AF" }}>
                  右のプレビューでテキストを
                  <br />
                  クリック編集できます
                </p>
                <button
                  onClick={startEditing}
                  className="w-full flex items-center justify-center gap-2 font-bold text-sm px-4 py-3 rounded-xl text-white transition-colors"
                  style={{ background: "#EA580C" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#C2410C"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#EA580C"; }}
                >
                  編集画面へ進む
                  <MsIcon name="arrow_forward" size={14} color="#FFFFFF" />
                </button>
              </div>
            </aside>

            {/* 右：キャンバスプレビュー */}
            <main className="flex-1 overflow-hidden flex flex-col">
              <CanvasEditor config={cfg} onChange={setGeneratedConfig} />
            </main>
          </div>
        </EditingContext.Provider>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════
  // PHASE: INTERVIEW
  // ══════════════════════════════════════════════════════════
  return (
    <div
      style={{ minHeight: "100vh", display: "flex", background: "#F9FAFB", fontFamily: "'Noto Sans JP', sans-serif" }}
    >
      <FontLinks />

      {/* ─── 左サイドバー ─── */}
      <aside
        style={{ width: 300, background: "#FFFFFF", borderRight: "1px solid #E2E8F0", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px 32px" }}
        className="hidden lg:block"
      >
        <div>
          {/* ロゴ */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40 }}>
            <div
              style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "#EBF4FF", flexShrink: 0 }}
            >
              <MsIcon name="bolt" size={20} color={NAVY} />
            </div>
            <span className="font-bold text-sm" style={{ color: "#111827" }}>
              AI サイトビルダー
            </span>
          </div>

          {/* キャッチ */}
          <h2
            className="font-bold mb-2 leading-snug"
            style={{ fontSize: 22, color: "#111827", letterSpacing: "-0.03em" }}
          >
            5つの質問で
            <br />
            <span style={{ color: NAVY }}>プロ仕様サイト</span>
            を生成
          </h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: "#6B7280" }}>
            AIが日本市場の黄金構成で
            <br />
            自動的にコンテンツを作成します
          </p>

          {/* How it works */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div
                  style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#F0F4FF", border: "1px solid #E2E8F0" }}
                >
                  <MsIcon name={item.icon} size={20} color={NAVY} />
                </div>
                <div style={{ paddingTop: 2 }}>
                  <p className="text-sm font-semibold" style={{ color: "#111827" }}>
                    {item.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 参考サイト解析 */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <MsIcon name="travel_explore" size={14} color={NAVY} />
              <p className="text-xs font-semibold" style={{ color: "#374151" }}>
                参考サイトのデザインを取り込む
              </p>
            </div>
            <p className="text-[11px] mb-3 leading-relaxed" style={{ color: "#6B7280" }}>
              URLを入力するとフォント・余白を自動解析しデザインに反映します
            </p>
            <div className="flex gap-1.5">
              <input
                type="url"
                value={referenceUrl}
                onChange={e => setReferenceUrl(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") analyzeUrl(); }}
                placeholder="https://example.com"
                className="flex-1 text-xs rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-200"
                style={{ border: "1px solid #E2E8F0", background: "#F9FAFB", color: "#111827" }}
              />
              <button
                onClick={analyzeUrl}
                disabled={isAnalyzing || !referenceUrl.trim()}
                className="text-xs px-3 py-2 rounded-lg font-medium shrink-0 transition-opacity disabled:opacity-40"
                style={{ background: NAVY, color: "#FFFFFF" }}
              >
                {isAnalyzing
                  ? <span className="flex items-center gap-1"><MsIcon name="hourglass_top" size={12} color="#FFFFFF" />解析中</span>
                  : "解析"
                }
              </button>
            </div>
            {analysisResult && (
              <div className="mt-2.5 space-y-2">
                <p className="text-[10px] font-semibold" style={{ color: "#10B981" }}>
                  ✓ デザインDNA解析完了
                </p>

                {/* カラースウォッチ */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
                        <div
                          title={`${label}: ${color}`}
                          style={{
                            width: 22, height: 22, borderRadius: 6,
                            backgroundColor: color,
                            border: "1.5px solid rgba(0,0,0,0.12)",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                          }}
                        />
                        <span style={{ fontSize: 8, color: "#9CA3AF", lineHeight: 1 }}>{label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* フォント・スタイルチップ */}
                <div className="flex flex-wrap gap-1.5">
                  {analysisResult.headingFont && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#EBF4FF", color: NAVY }}>
                      見出し: {analysisResult.headingFont}
                    </span>
                  )}
                  {analysisResult.bodyFont && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#EBF4FF", color: NAVY }}>
                      本文: {analysisResult.bodyFont}
                    </span>
                  )}
                  {analysisResult.buttonRadius && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#F0F4FF", color: "#4338CA" }}>
                      ボタンR: {analysisResult.buttonRadius}
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
        </div>

        {/* 黄金構成カード */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#F0F4FF", border: "1px solid #C3DAFE" }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: NAVY }}
          >
            黄金のセクション構成
          </p>
          <div className="space-y-1.5">
            {Object.values(SECTION_LABELS).slice(0, 8).map(label => (
              <div key={label} className="flex items-center gap-2 text-xs" style={{ color: "#374151" }}>
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: NAVY }} />
                {label}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── チャットエリア ─── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        {/* ヘッダー */}
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid #E2E8F0", background: "#FFFFFF", flexShrink: 0 }}
        >
          {/* SP: タイトル */}
          <div className="flex items-center gap-2 lg:hidden">
            <MsIcon name="bolt" size={16} color={NAVY} />
            <span className="text-sm font-semibold" style={{ color: "#111827" }}>
              AIサイト自動生成
            </span>
          </div>
          <div className="hidden lg:block" />

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {error && (
              <span className="text-xs px-3 py-1.5 rounded-lg" style={{ color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA" }}>
                {error}
              </span>
            )}
            <a
              href="/admin"
              className="text-xs px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: "#6B7280", border: "1px solid #E2E8F0", background: "#FFFFFF" }}
            >
              スキップして編集へ →
            </a>
          </div>
        </div>

        {/* メッセージ */}
        <div className="flex-1 overflow-y-auto px-4 py-8 space-y-5 max-w-2xl mx-auto w-full">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* AI アバター */}
              {msg.role === "assistant" && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                  style={{ background: "#EBF4FF", border: "1.5px solid #BEE3F8" }}
                >
                  <MsIcon name="smart_toy" size={18} color={NAVY} />
                </div>
              )}

              {/* バブル */}
              <div
                className="max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-loose"
                style={msg.role === "user" ? {
                  // ユーザー: 白背景 + メインカラー文字 + グレー枠線
                  background: "#FFFFFF",
                  color: NAVY,
                  border: "1.5px solid #E2E8F0",
                  borderRadius: "18px 4px 18px 18px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                } : {
                  // AI: 薄ベージュ
                  background: "#FEFCE8",
                  color: "#111827",
                  border: "1.5px solid #FEF08A",
                  borderRadius: "4px 18px 18px 18px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <RenderMarkdown text={msg.content} />
                {/* ストリーミングカーソル */}
                {isStreaming && i === messages.length - 1 && msg.role === "assistant" && (
                  <span
                    className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
                    style={{ background: NAVY, verticalAlign: "middle" }}
                  />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div
          className="px-4 py-5 max-w-2xl mx-auto w-full"
          style={{ borderTop: "1px solid #E2E8F0" }}
        >
          <div
            style={{ display: "flex", alignItems: "flex-end", gap: 12, padding: "12px 16px", borderRadius: 16, background: "#FFFFFF", border: "1.5px solid #E2E8F0" }}
            onFocus={() => {}}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isStreaming ? "AIが回答中..." : "メッセージを入力（Enter で送信）"}
              disabled={isStreaming}
              rows={1}
              className="bg-transparent text-sm resize-none outline-none leading-relaxed"
              style={{
                flex: 1,
                fontFamily: "'Noto Sans JP', sans-serif",
                color: "#111827",
                maxHeight: "120px",
                overflowY: "auto",
              }}
              onInput={e => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={sendMessage}
              disabled={isStreaming || !input.trim()}
              style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: NAVY, opacity: isStreaming || !input.trim() ? 0.3 : 1, cursor: isStreaming || !input.trim() ? "not-allowed" : "pointer", border: "none" }}
              onMouseEnter={e => { if (!isStreaming && input.trim()) (e.currentTarget as HTMLElement).style.background = "#2B6CB0"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = NAVY; }}
            >
              <MsIcon name="send" size={16} color="#FFFFFF" />
            </button>
          </div>
          <p className="text-center text-[10px] mt-2" style={{ color: "#9CA3AF" }}>
            Shift+Enter で改行 &nbsp;/&nbsp; Enter で送信
          </p>
        </div>
      </main>
    </div>
  );
}
