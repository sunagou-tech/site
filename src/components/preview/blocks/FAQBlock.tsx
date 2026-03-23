"use client";

import { FAQBlock, SiteConfig } from "@/types/site";
import EditableText from "../EditableText";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  block: FAQBlock;
  config: SiteConfig;
  onChange: (b: FAQBlock) => void;
}

function patchItem(block: FAQBlock, idx: number, patch: Partial<FAQBlock["items"][0]>): FAQBlock {
  const next = [...block.items];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, items: next };
}

function FAQAccordionItem({
  item, idx, block, config, onChange,
}: {
  item: FAQBlock["items"][0]; idx: number; block: FAQBlock; config: SiteConfig; onChange: (b: FAQBlock) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        className="w-full flex items-center justify-between py-5 text-left group"
        onClick={() => setOpen((v) => !v)}
      >
        <EditableText
          tag="span"
          value={item.question}
          onChange={(v) => onChange(patchItem(block, idx, { question: v }))}
          className="text-sm font-semibold text-gray-800 pr-4 flex-1"
        />
        <ChevronDown
          size={16}
          className="flex-shrink-0 text-gray-400 transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", color: open ? config.accentColor : undefined }}
        />
      </button>
      {open && (
        <div className="pb-5 pr-8">
          <EditableText
            tag="p"
            value={item.answer}
            onChange={(v) => onChange(patchItem(block, idx, { answer: v }))}
            multiline
            className="text-sm text-gray-500 leading-relaxed block"
          />
        </div>
      )}
    </div>
  );
}

export default function FAQBlockComponent({ block, config, onChange }: Props) {
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-[#fafafa] py-20 px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-px" style={{ backgroundColor: config.accentColor }} />
            <span className="text-xs text-gray-400 tracking-widest uppercase">FAQ</span>
          </div>
          <EditableText
            tag="h2"
            value={block.heading}
            onChange={(v) => onChange({ ...block, heading: v })}
            className={`text-3xl font-bold text-gray-900 ${fontClass}`}
          />
        </div>

        {/* Accordion */}
        <div className="bg-white rounded-2xl px-6 shadow-sm border border-gray-100">
          {block.items.map((item, idx) => (
            <FAQAccordionItem
              key={idx}
              item={item}
              idx={idx}
              block={block}
              config={config}
              onChange={onChange}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
