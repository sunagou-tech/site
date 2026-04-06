"use client";

/**
 * GlobalStyleInjector
 * ─────────────────────────────────────────────────────────
 * SiteConfig.globalStyle の内容を <style> タグで注入する。
 * 対象スコープ: .gs-root（SitePreview のサイト本体ラッパー）
 *
 * - Google Fonts を <link> で読み込む
 * - font-family / font-size / line-height / letter-spacing を上書き
 * - section の padding-y をオーバーライド（!important）
 * - Tailwind の固定クラスよりも高い CSS 詳細度で適用
 */

import { GlobalStyle } from "@/types/site";

interface Props {
  style?: GlobalStyle;
}

function buildCSS(s: GlobalStyle): string {
  const lines: string[] = [];

  const hf = s.headingFont ? `'${s.headingFont}', sans-serif` : null;
  const bf = s.bodyFont    ? `'${s.bodyFont}', -apple-system, BlinkMacSystemFont, sans-serif` : null;

  // ── 本文フォント ──────────────────────────────────────
  if (bf) {
    lines.push(`.gs-root { font-family: ${bf}; }`);
  }

  // ── 見出しフォント / 共通スタイル ─────────────────────
  {
    const hRules: string[] = [];
    if (hf)                      hRules.push(`font-family: ${hf}`);
    if (s.headingLineHeight)     hRules.push(`line-height: ${s.headingLineHeight}`);
    if (s.headingLetterSpacing)  hRules.push(`letter-spacing: ${s.headingLetterSpacing}`);
    if (s.headingWeight)         hRules.push(`font-weight: ${s.headingWeight}`);
    if (hRules.length > 0) {
      lines.push(`.gs-root h1, .gs-root h2, .gs-root h3, .gs-root h4 { ${hRules.join("; ")}; }`);
    }
  }

  // ── 見出しサイズ（clamp で responsive）──────────────────
  if (s.h1Size) {
    lines.push(`.gs-root h1 { font-size: clamp(1.8rem, 5vw, ${s.h1Size}) !important; }`);
  }
  if (s.h2Size) {
    lines.push(`.gs-root h2 { font-size: clamp(1.4rem, 3.5vw, ${s.h2Size}) !important; }`);
  }
  if (s.h3Size) {
    lines.push(`.gs-root h3 { font-size: clamp(1.1rem, 2.5vw, ${s.h3Size}) !important; }`);
  }

  // ── 本文 ────────────────────────────────────────────────
  {
    const pRules: string[] = [];
    if (s.bodySize)          pRules.push(`font-size: ${s.bodySize}`);
    if (s.bodyLineHeight)    pRules.push(`line-height: ${s.bodyLineHeight}`);
    if (s.bodyLetterSpacing) pRules.push(`letter-spacing: ${s.bodyLetterSpacing}`);
    if (pRules.length > 0) {
      lines.push(`.gs-root p, .gs-root li, .gs-root span:not([class]) { ${pRules.join("; ")}; }`);
    }
  }

  // ── セクションパディング ─────────────────────────────────
  if (s.sectionPaddingY) {
    lines.push(
      `.gs-root section { padding-top: ${s.sectionPaddingY} !important; padding-bottom: ${s.sectionPaddingY} !important; }`
    );
  }

  // ── コンテナ最大幅 ───────────────────────────────────────
  if (s.containerMaxWidth) {
    lines.push(
      `.gs-root .max-w-5xl, .gs-root .max-w-4xl, .gs-root .max-w-6xl, .gs-root .max-w-7xl { max-width: ${s.containerMaxWidth} !important; }`
    );
  }

  // ── カード角丸 ───────────────────────────────────────────
  if (s.cardBorderRadius) {
    lines.push(
      `.gs-root [class*="rounded-2xl"], .gs-root [class*="rounded-xl"] { border-radius: ${s.cardBorderRadius} !important; }`
    );
  }

  return lines.join("\n");
}

export default function GlobalStyleInjector({ style }: Props) {
  if (!style) return null;

  const css   = buildCSS(style);
  const fonts = style.googleFontsUrl;

  return (
    <>
      {fonts && (
        <>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href={fonts} rel="stylesheet" />
        </>
      )}
      {css && <style id="gs-overrides">{css}</style>}
    </>
  );
}
