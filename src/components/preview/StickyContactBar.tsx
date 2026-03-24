"use client";
import { useState } from "react";

interface Props {
  primaryColor: string;
  contactUrl?: string;
}

export default function StickyContactBar({ primaryColor, contactUrl = "/contact" }: Props) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white border-t border-gray-100 shadow-2xl px-4 py-3 flex items-center gap-3">
        <a
          href={contactUrl}
          className="flex-1 flex items-center justify-center gap-2 text-sm font-bold text-white py-3.5 rounded-xl shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <span>📩</span>
          無料相談・お問い合わせ
        </a>
        <button
          onClick={() => setDismissed(true)}
          className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-gray-500 text-sm flex-shrink-0"
          aria-label="閉じる"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
