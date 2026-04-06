"use client";

import { use, useState, useEffect } from "react";
import { defaultConfig, SiteConfig } from "@/types/site";

export default function ArticleDetailPage({ params }: { params: Promise<{ articleSlug: string }> }) {
  const { articleSlug } = use(params);
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("site-config");
    if (saved) {
      try { setConfig(JSON.parse(saved)); }
      catch { setConfig(defaultConfig); }
    } else {
      setConfig(defaultConfig);
    }
  }, []);

  // Inject SEO meta tags after config loads
  useEffect(() => {
    if (!config) return;
    const article = config.articles?.find(a => a.slug === articleSlug);
    if (!article) return;

    const origin = window.location.origin;
    const canonical = article.canonicalUrl || `${origin}/column/${article.slug}`;
    const metaTitle = article.metaTitle || article.title;
    const metaDesc  = article.metaDescription || article.excerpt;
    const ogImage   = article.ogImage || article.imageUrl || "";
    const keywords  = article.keywords || "";

    document.title = metaTitle ? `${metaTitle} | ${config.title}` : config.title;

    function setMeta(name: string, content: string, prop = false) {
      const attr = prop ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, name); document.head.appendChild(el); }
      el.content = content;
    }
    function setLink(rel: string, href: string) {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!el) { el = document.createElement("link"); el.rel = rel; document.head.appendChild(el); }
      el.href = href;
    }

    setMeta("description", metaDesc);
    if (keywords) setMeta("keywords", keywords);
    if (article.noindex) setMeta("robots", "noindex,nofollow");
    else setMeta("robots", "index,follow");

    // OGP
    setMeta("og:title",       metaTitle, true);
    setMeta("og:description", metaDesc,  true);
    setMeta("og:type",        "article", true);
    setMeta("og:url",         canonical, true);
    if (ogImage) setMeta("og:image", ogImage, true);

    // Twitter Card
    setMeta("twitter:card",        ogImage ? "summary_large_image" : "summary");
    setMeta("twitter:title",       metaTitle);
    setMeta("twitter:description", metaDesc);
    if (ogImage) setMeta("twitter:image", ogImage);

    // Canonical
    setLink("canonical", canonical);

    // Article structured data (JSON-LD)
    let jsonld = document.querySelector("#article-jsonld") as HTMLScriptElement;
    if (!jsonld) { jsonld = document.createElement("script"); jsonld.id = "article-jsonld"; jsonld.type = "application/ld+json"; document.head.appendChild(jsonld); }
    jsonld.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: metaDesc,
      datePublished: article.date,
      author: { "@type": "Person", name: article.author },
      image: ogImage || undefined,
      url: canonical,
      publisher: { "@type": "Organization", name: config.title },
    });
  }, [config, articleSlug]);

  if (!config) return (
    <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", background: "#F9FAFB", color: "#9CA3AF", fontSize: 14 }}>
      読み込み中...
    </div>
  );

  const article = config.articles?.find(a => a.slug === articleSlug);
  const primary = config.primaryColor || "#1E40AF";
  const accent  = config.accentColor  || "#7C3AED";

  return (
    <div style={{ fontFamily: "'Noto Sans JP', -apple-system, sans-serif", background: "#FFFFFF" }}>

      {/* Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 20, background: "#FFFFFF", borderBottom: "1px solid #F3F4F6", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>
            {config.title?.charAt(0).toUpperCase() ?? "S"}
          </div>
          <a href="/" style={{ fontWeight: 700, fontSize: 14, color: "#111827", textDecoration: "none" }}>{config.title}</a>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {config.navLinks?.map(link => (
            <a key={link.id} href={link.url} style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>{link.label}</a>
          ))}
          <a href="/column" style={{ fontSize: 13, color: "#6B7280", textDecoration: "none" }}>コラム</a>
        </div>
      </nav>

      {!article ? (
        <div style={{ display: "flex", minHeight: "60vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: "#374151" }}>記事が見つかりません</p>
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>お探しの記事は存在しないか、削除された可能性があります。</p>
          <a href="/column" style={{ fontSize: 14, fontWeight: 600, padding: "10px 24px", borderRadius: 999, background: primary, color: "#fff", textDecoration: "none" }}>
            ← コラムに戻る
          </a>
        </div>
      ) : (
        <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 24px 96px" }}>

          {/* Back */}
          <a href="/column" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6B7280", textDecoration: "none", marginBottom: 32 }}>
            ← コラム一覧へ
          </a>

          {/* Featured image */}
          {article.imageUrl && (
            <div style={{ width: "100%", height: 320, borderRadius: 16, overflow: "hidden", marginBottom: 32 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={article.imageUrl} alt={article.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}

          {/* Meta */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: `${accent}20`, color: primary }}>
              {article.category}
            </span>
            <span style={{ fontSize: 13, color: "#9CA3AF" }}>{article.date}</span>
            {article.author && <span style={{ fontSize: 13, color: "#9CA3AF" }}>by {article.author}</span>}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", lineHeight: 1.4, marginBottom: 24, letterSpacing: "-0.02em" }}>
            {article.title}
          </h1>

          {/* Excerpt */}
          {article.excerpt && (
            <p style={{ fontSize: 16, color: "#6B7280", lineHeight: 1.8, marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid #F3F4F6" }}>
              {article.excerpt}
            </p>
          )}

          {/* Body */}
          <div
            style={{ fontSize: 16, color: "#374151", lineHeight: 1.9 }}
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          <style>{`
            main h2 { font-size: 1.35rem; font-weight: 700; color: #111827; margin: 2.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #E5E7EB; }
            main h3 { font-size: 1.1rem; font-weight: 700; color: #1E293B; margin: 2rem 0 0.75rem; }
            main p  { margin-bottom: 1.25rem; }
            main ul { list-style: disc; padding-left: 1.75rem; margin: 1rem 0; }
            main ol { list-style: decimal; padding-left: 1.75rem; margin: 1rem 0; }
            main li { margin-bottom: 0.4rem; }
            main a  { color: ${primary}; text-decoration: underline; }
            main strong { font-weight: 700; }
          `}</style>

          {/* Footer */}
          <div style={{ marginTop: 64, paddingTop: 32, borderTop: "1px solid #F3F4F6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <a href="/column" style={{ fontSize: 13, fontWeight: 600, color: primary, textDecoration: "none" }}>
              ← コラム一覧へ
            </a>
            <div style={{ display: "flex", gap: 12 }}>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(typeof window !== "undefined" ? window.location.href : "")}`}
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, padding: "6px 14px", borderRadius: 6, background: "#000000", color: "#fff", textDecoration: "none", fontWeight: 600 }}>
                X でシェア
              </a>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
