"use client";
import { MarqueeTextBlock, SiteConfig } from "@/types/site";

interface Props { block: MarqueeTextBlock; config: SiteConfig; onChange: (b: MarqueeTextBlock) => void; }

export default function MarqueeTextBlockComponent({ block, config }: Props) {
  const items = [...block.items, ...block.items]; // duplicate for seamless loop

  return (
    <section className="py-4 overflow-hidden border-y" style={{ borderColor: `${config.primaryColor}20`, backgroundColor: `${config.primaryColor}04` }}>
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-track { animation: marquee-scroll 20s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div className="flex whitespace-nowrap marquee-track">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-6 px-6">
            <span className="text-sm font-semibold tracking-wider" style={{ color: config.primaryColor }}>
              {item}
            </span>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: config.accentColor }} />
          </div>
        ))}
      </div>
    </section>
  );
}
