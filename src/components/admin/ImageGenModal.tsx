"use client";

import { useState, useEffect } from "react";

type Aspect = "1:1" | "16:9" | "9:16";

interface Props {
  onClose: () => void;
  onSelect: (dataUrl: string) => void;
  defaultPrompt?: string;
  defaultAspect?: Aspect;
}

export default function ImageGenModal({ onClose, onSelect, defaultPrompt = "", defaultAspect = "1:1" }: Props) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [aspect, setAspect] = useState<Aspect>(defaultAspect);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");

  // ESCキーで閉じる
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError("");
    setImages([]);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), aspectRatio: aspect }),
      });
      const data = await res.json() as { images?: { dataUrl: string }[]; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "生成失敗");
      setImages((data.images ?? []).map(i => i.dataUrl));
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  const ASPECTS: [Aspect, string, string][] = [
    ["1:1",  "□ スクエア",  "1:1"],
    ["16:9", "▬ 横長",     "16:9"],
    ["9:16", "▮ 縦長",     "9:16"],
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 620, maxHeight: "90vh", overflow: "auto", padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.22)" }}>

        {/* ヘッダ */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: 0 }}>✨ AI画像生成</p>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: "2px 0 0" }}>ChatGPT Image 生成モデル使用</p>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB", background: "#F9FAFB", cursor: "pointer", fontSize: 16, color: "#6B7280", display: "flex", alignItems: "center", justifyContent: "center" }}>
            ×
          </button>
        </div>

        {/* プロンプト */}
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 6 }}>
          生成したい画像の説明（日本語OK）
        </label>
        <textarea
          autoFocus
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="例: 明るい学習塾の教室で個別指導中の先生と笑顔の生徒、温かみのある雰囲気"
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) generate(); }}
          style={{ width: "100%", height: 88, padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 10, fontSize: 14, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit", lineHeight: 1.6 }}
        />
        <p style={{ fontSize: 10, color: "#9CA3AF", margin: "4px 0 16px" }}>⌘+Enter / Ctrl+Enter で生成</p>

        {/* アスペクト比 */}
        <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8 }}>サイズ</label>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {ASPECTS.map(([val, label, ratio]) => (
            <button key={val} onClick={() => setAspect(val)}
              style={{ flex: 1, padding: "8px 6px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `2px solid ${aspect === val ? "#4F46E5" : "#E5E7EB"}`,
                background: aspect === val ? "#EEF2FF" : "#F9FAFB",
                color: aspect === val ? "#4F46E5" : "#6B7280" }}>
              {label}<br />
              <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>{ratio}</span>
            </button>
          ))}
        </div>

        {/* 生成ボタン */}
        <button onClick={generate} disabled={!prompt.trim() || loading}
          style={{ width: "100%", padding: "13px", borderRadius: 12, border: "none",
            cursor: loading || !prompt.trim() ? "not-allowed" : "pointer",
            background: loading || !prompt.trim() ? "#E5E7EB" : "linear-gradient(135deg, #4F46E5, #7C3AED)",
            color: loading || !prompt.trim() ? "#9CA3AF" : "#fff",
            fontWeight: 800, fontSize: 15, marginBottom: 20, transition: "opacity 0.15s" }}>
          {loading ? "✨ 生成中... しばらくお待ちください" : "✨ 画像を生成する"}
        </button>

        {/* ローディングアニメ */}
        {loading && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ display: "inline-flex", gap: 6 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#4F46E5", animation: `bounce 1.2s ${i * 0.2}s ease-in-out infinite` }} />
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#6B7280", margin: "8px 0 0" }}>AIが画像を生成しています（30〜60秒かかる場合があります）</p>
          </div>
        )}

        {/* エラー */}
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#DC2626", margin: 0 }}>⚠️ {error}</p>
          </div>
        )}

        {/* 生成された画像 */}
        {images.length > 0 && (
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10 }}>生成された画像 — クリックして使用</p>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(images.length, 3)}, 1fr)`, gap: 10 }}>
              {images.map((src, i) => (
                <div key={i} style={{ position: "relative", borderRadius: 10, overflow: "hidden", cursor: "pointer", border: "2px solid #E5E7EB" }}
                  onClick={() => { onSelect(src); onClose(); }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`生成 ${i + 1}`}
                    style={{ width: "100%", aspectRatio: aspect === "16:9" ? "16/9" : aspect === "9:16" ? "9/16" : "1/1", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(79,70,229,0)", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(79,70,229,0.55)"; (e.currentTarget.querySelector("span") as HTMLElement).style.opacity = "1"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(79,70,229,0)"; (e.currentTarget.querySelector("span") as HTMLElement).style.opacity = "0"; }}>
                    <span style={{ color: "#fff", fontSize: 14, fontWeight: 800, opacity: 0, transition: "opacity 0.2s" }}>✓ 使用する</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
