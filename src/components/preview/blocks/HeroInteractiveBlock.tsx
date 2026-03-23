"use client";

import { useRef, useCallback } from "react";
import { motion, useSpring, useTransform, MotionValue } from "framer-motion";
import { HeroInteractiveBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";

interface Props {
  block: HeroInteractiveBlock;
  config: SiteConfig;
  onChange: (b: HeroInteractiveBlock) => void;
}

const SHAPES = [
  { x: "72%", y: "12%", size: 88,  color: "#F5C842", shape: "circle",   speedX: 18,  speedY: 11,  opacity: 0.85 },
  { x: "60%", y: "58%", size: 68,  color: "#6366f1", shape: "square",   speedX: -12, speedY: -7,  opacity: 0.70 },
  { x: "80%", y: "48%", size: 54,  color: "#f87171", shape: "triangle", speedX: 25,  speedY: 15,  opacity: 0.75 },
  { x: "85%", y: "22%", size: 46,  color: "#4ade80", shape: "pentagon", speedX: -20, speedY: -12, opacity: 0.68 },
  { x: "55%", y: "28%", size: 28,  color: "#fb923c", shape: "circle",   speedX: 30,  speedY: 18,  opacity: 0.60 },
  { x: "90%", y: "68%", size: 34,  color: "#a78bfa", shape: "diamond",  speedX: -15, speedY: -9,  opacity: 0.55 },
  { x: "65%", y: "78%", size: 20,  color: "#34d399", shape: "circle",   speedX: 22,  speedY: 13,  opacity: 0.50 },
];

// ─── 各シェイプは独立したコンポーネント（Hooksをループ外に置くため）
function ParallaxShape({
  s, rawX, rawY,
}: {
  s: typeof SHAPES[0];
  rawX: MotionValue<number>;
  rawY: MotionValue<number>;
}) {
  const mx = useTransform(rawX, [-0.5, 0.5], [-s.speedX, s.speedX]);
  const my = useTransform(rawY, [-0.5, 0.5], [-s.speedY, s.speedY]);

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: s.x, top: s.y, x: mx, y: my, opacity: s.opacity, filter: "blur(0.4px)" }}
    >
      <ShapeEl size={s.size} color={s.color} shape={s.shape} />
    </motion.div>
  );
}

function ShapeEl({ size, color, shape }: { size: number; color: string; shape: string }) {
  if (shape === "circle")
    return <div style={{ width: size, height: size, backgroundColor: color, borderRadius: "50%" }} />;
  if (shape === "square")
    return <div style={{ width: size, height: size, backgroundColor: color, borderRadius: 6, transform: "rotate(15deg)" }} />;
  if (shape === "diamond")
    return <svg width={size} height={size} viewBox="0 0 30 30"><polygon points="15,1 29,15 15,29 1,15" fill={color} /></svg>;
  if (shape === "pentagon")
    return <svg width={size} height={size} viewBox="0 0 40 40"><polygon points="20,2 37,13 31,34 9,34 3,13" fill={color} /></svg>;
  return <svg width={size} height={size} viewBox="0 0 40 40"><polygon points="20,3 38,37 2,37" fill={color} /></svg>;
}

export default function HeroInteractiveBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<HeroInteractiveBlock>) => onChange({ ...block, ...patch });
  const sectionRef = useRef<HTMLElement>(null);
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  const rawX = useSpring(0, { stiffness: 60, damping: 20 });
  const rawY = useSpring(0, { stiffness: 60, damping: 20 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = sectionRef.current?.getBoundingClientRect();
      if (!rect) return;
      rawX.set((e.clientX - rect.left) / rect.width - 0.5);
      rawY.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [rawX, rawY]
  );

  const handleMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden min-h-[560px] flex items-center"
      style={{ backgroundColor: "#0d0d1a" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* グリッドパターン */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)`, backgroundSize: "60px 60px" }} />

      {/* アンビエントグロウ */}
      <div className="absolute inset-0 opacity-20"
        style={{ background: `radial-gradient(ellipse at 70% 40%, ${config.accentColor} 0%, transparent 60%)` }} />

      {/* インタラクティブシェイプ（各シェイプは独立したコンポーネント） */}
      {SHAPES.map((s, i) => (
        <ParallaxShape key={i} s={s} rawX={rawX} rawY={rawY} />
      ))}

      {/* テキスト */}
      <div className="relative z-10 px-14 py-24 max-w-2xl">
        <p className="text-white/25 text-xs tracking-[0.4em] uppercase mb-6">Hero — Pattern C · Interactive</p>

        <EditableText
          tag="h1"
          value={block.tagline}
          onChange={(v) => u({ tagline: v })}
          multiline
          className={`display-heading font-black text-white whitespace-pre-line block ${fontClass}`}
        />

        <div className="mt-8 flex flex-col gap-2">
          <EditableText
            tag="p"
            value={block.taglineSub}
            onChange={(v) => u({ taglineSub: v })}
            className="text-sm text-white/50 tracking-[0.1em] block"
          />
          <p className="text-[10px] text-white/20 tracking-widest">
            ← カーソルを動かすとシェイプがリアクションします
          </p>
        </div>

        <button
          className="mt-10 inline-flex items-center gap-3 text-sm font-semibold px-8 py-4 rounded-full transition-all hover:scale-105"
          style={{ backgroundColor: config.accentColor, color: "#1a1a2e" }}
        >
          <EditableText tag="span" value={block.buttonText} onChange={(v) => u({ buttonText: v })} /> →
        </button>
      </div>

      <div className="absolute bottom-6 right-8 text-white/10 text-[10px] tracking-widest font-mono">
        {config.title} / interactive hero
      </div>
    </section>
  );
}
