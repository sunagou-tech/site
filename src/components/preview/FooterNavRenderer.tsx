"use client";

import { FooterNavConfig } from "@/types/site";

interface Props {
  config: FooterNavConfig;
  siteSlug?: string;  // 公開サイトのURL解決用
}

export default function FooterNavRenderer({ config, siteSlug }: Props) {
  if (!config.show) return null;

  function resolveUrl(url: string): string {
    if (!siteSlug) return url;
    if (!url || url === "/") return `/sites/${siteSlug}`;
    if (url.startsWith("http") || url.startsWith("//")) return url;
    return `/sites/${siteSlug}${url.startsWith("/") ? url : `/${url}`}`;
  }

  const addressLines = config.address.split("\n").filter(Boolean);

  return (
    <footer style={{ background: "#0f172a", color: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 32px 32px", display: "grid", gridTemplateColumns: config.columns.length > 0 ? "1fr 2fr" : "1fr", gap: 48 }}>

        {/* 左：会社情報 */}
        <div>
          <p style={{ fontWeight: 800, fontSize: 20, margin: "0 0 16px", letterSpacing: "-0.01em" }}>
            {config.companyName}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {addressLines.map((line, i) => (
              <p key={i} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: 0, lineHeight: 1.7 }}>
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* 右：ナビコラム */}
        {config.columns.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(config.columns.length, 4)}, 1fr)`, gap: 32 }}>
            {config.columns.map(col => (
              <div key={col.id}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", margin: "0 0 12px", textTransform: "uppercase" }}>
                  {col.heading}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.links.map(link => (
                    <a
                      key={link.id}
                      href={resolveUrl(link.url)}
                      style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", textDecoration: "none", lineHeight: 1.5 }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.75)")}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* コピーライト */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", padding: "16px 32px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", margin: 0 }}>
          © {new Date().getFullYear()} {config.companyName}
        </p>
      </div>
    </footer>
  );
}
