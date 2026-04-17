"use client";

/**
 * AIImagePanel
 * ─────────────────────────────────────────────────────────
 * Pollinations AI (https://pollinations.ai) を使って
 * テキストプロンプトから画像を無料で生成する。
 * API キー不要。URL ベースで画像を直接取得。
 * ─────────────────────────────────────────────────────────
 */

import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, Check, Wand2 } from "lucide-react";

const STYLES = [
  { label: "リアル写真",  en: "realistic photography, professional, high quality, 4k" },
  { label: "イラスト",    en: "flat illustration, digital art, clean vector style" },
  { label: "シネマティック", en: "cinematic, dramatic lighting, film photography" },
  { label: "ミニマル",    en: "minimal, clean, white background, simple" },
];

const EXAMPLE_PROMPTS = [
  "会議室で笑顔で話し合うビジネスチーム",
  "モダンなオフィスと都市の夜景",
  "スタートアップで働く若い人たち",
  "テクノロジーと自然が共存する未来都市",
];

interface Props {
  onUse: (url: string) => void;
  onClose: () => void;
  primaryColor: string;
  accentColor: string;
}

export default function AIImagePanel({ onUse, onClose, primaryColor, accentColor }: Props) {
  const [prompt, setPrompt] = useState("");
  const [styleIdx, setStyleIdx] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 99999));

  const buildUrl = (p: string, s: number) => {
    const full = `${p}, ${STYLES[styleIdx].en}`;
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(full)}?width=800&height=500&nologo=true&seed=${s}&model=turbo`;
  };

  const generate = (overrideSeed?: number) => {
    if (!prompt.trim()) return;
    const useSeed = overrideSeed ?? Math.floor(Math.random() * 99999);
    setSeed(useSeed);
    setStatus("loading");
    setGeneratedUrl(null);

    const url = buildUrl(prompt, useSeed);
    const img = new window.Image();
    img.onload = () => { setGeneratedUrl(url); setStatus("done"); };
    img.onerror = () => setStatus("error");
    img.src = url;
  };

  const retry = () => generate();

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden">
      {/* ヘッダー */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)` }}
      >
        <div className="flex items-center gap-2 text-white">
          <Wand2 size={16} />
          <span className="text-sm font-semibold">AI画像生成</span>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white text-lg leading-none">✕</button>
      </div>

      <div className="p-5">
        {/* プロンプト入力 */}
        <label className="block text-xs font-medium text-gray-500 mb-1.5">
          どんな画像にしますか？（日本語でOK）
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="例：会議室で笑顔で話し合うビジネスチーム"
          rows={2}
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); generate(); } }}
        />

        {/* サンプルプロンプト */}
        <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              className="text-[11px] text-gray-500 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-full transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        {/* スタイル選択 */}
        <label className="block text-xs font-medium text-gray-500 mb-1.5">スタイル</label>
        <div className="flex gap-1.5 mb-5">
          {STYLES.map((s, i) => (
            <button
              key={i}
              onClick={() => setStyleIdx(i)}
              className="text-[11px] px-3 py-1.5 rounded-full border-2 transition-colors font-medium"
              style={
                styleIdx === i
                  ? { backgroundColor: accentColor, borderColor: accentColor, color: "#1a1a2e" }
                  : { borderColor: "#e5e7eb", color: "#6b7280" }
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* 生成ボタン */}
        <button
          onClick={() => generate()}
          disabled={!prompt.trim() || status === "loading"}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl text-white disabled:opacity-50 transition-all hover:opacity-90 active:scale-95"
          style={{ backgroundColor: primaryColor }}
        >
          {status === "loading" ? (
            <><Loader2 size={15} className="animate-spin" /> AI生成中… (10〜30秒)</>
          ) : (
            <><Sparkles size={15} /> 画像を生成</>
          )}
        </button>

        {/* 生成中プログレス */}
        {status === "loading" && (
          <div className="mt-3 h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                backgroundColor: accentColor,
                animation: "progress-indeterminate 1.5s ease-in-out infinite",
                width: "40%",
              }}
            />
            <style>{`
              @keyframes progress-indeterminate {
                0%   { transform: translateX(-100%); width: 40%; }
                50%  { width: 60%; }
                100% { transform: translateX(300%); width: 40%; }
              }
            `}</style>
          </div>
        )}

        {/* 生成結果 */}
        {status === "done" && generatedUrl && (
          <div className="mt-4">
            <div className="relative rounded-xl overflow-hidden shadow-md">
              <img src={generatedUrl} alt="generated" className="w-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { onUse(generatedUrl); onClose(); }}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl text-white transition-all hover:opacity-90"
                style={{ backgroundColor: "#22c55e" }}
              >
                <Check size={15} /> この画像を使う
              </button>
              <button
                onClick={retry}
                className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <RefreshCw size={12} /> 再生成
              </button>
            </div>
          </div>
        )}

        {/* エラー */}
        {status === "error" && (
          <div className="mt-3 p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 mb-2">生成に失敗しました。もう一度お試しください。</p>
            <button onClick={retry} className="text-xs text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50">
              再試行
            </button>
          </div>
        )}

        <p className="text-[10px] text-gray-300 text-center mt-4">
          Powered by Pollinations AI · 完全無料・APIキー不要
        </p>
      </div>
    </div>
  );
}
