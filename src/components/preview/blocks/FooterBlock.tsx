"use client";

import { FooterBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";

interface Props {
  block: FooterBlock;
  config: SiteConfig;
  onChange: (b: FooterBlock) => void;
}

const NAV_COLS = [
  { heading: "会社案内について", links: ["会社概要", "代表挨拶", "アクセス"] },
  { heading: "サービス",         links: ["採用支援事業", "アウトソーシング事業", "コンサルティング事業"] },
  { heading: "事例",             links: ["採用支援事例", "アウトソーシング事例", "コンサルティング事例"] },
];

export default function FooterBlockComponent({ block, config, onChange }: Props) {
  const u = (patch: Partial<FooterBlock>) => onChange({ ...block, ...patch });

  return (
    <footer className="bg-gray-900 text-white px-6 md:px-10 py-10 md:py-12">
      <div className="flex flex-col gap-8 md:flex-row md:gap-12 mb-8 md:mb-10">

        {/* Brand column */}
        <div className="md:w-44 md:flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: config.accentColor }}>
              {config.title?.charAt(0)?.toUpperCase() ?? "S"}
            </div>
            <EditableText tag="span" value={config.title} onChange={() => {}} className="font-bold text-sm text-white" readOnly />
          </div>
          <EditableText tag="p" value={block.companyName} onChange={(v) => u({ companyName: v })} className="text-xs text-gray-400 block" />
          <EditableText tag="p" value={block.address} onChange={(v) => u({ address: v })} multiline className="text-xs text-gray-500 mt-2 leading-6 whitespace-pre-line block" />
        </div>

        {/* Nav columns — 2-col grid on SP, row on PC */}
        <div className="grid grid-cols-2 gap-6 md:contents">
          {NAV_COLS.map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-semibold text-gray-300 mb-3">{col.heading}</p>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}><span className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors">{l}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-gray-700 pt-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-xs text-gray-500">© 2026 <EditableText tag="span" value={block.companyName} onChange={(v) => u({ companyName: v })} className="text-gray-500" /></p>
        <div className="flex gap-4">
          {["プライバシーポリシー", "利用規約"].map((l) => (
            <span key={l} className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer">{l}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
