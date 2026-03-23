"use client";

import { ServicesBlock, SiteConfig, Service } from "@/types/site";
import EditableText from "../EditableText";
import EditableImage from "../EditableImage";

interface Props {
  block: ServicesBlock;
  config: SiteConfig;
  onChange: (b: ServicesBlock) => void;
}

function patchService(block: ServicesBlock, idx: number, patch: Partial<Service>): ServicesBlock {
  const next = [...block.services] as ServicesBlock["services"];
  next[idx] = { ...next[idx], ...patch };
  return { ...block, services: next };
}

function patchSubLabel(block: ServicesBlock, si: number, bi: number, label: string): ServicesBlock {
  const next = [...block.services] as ServicesBlock["services"];
  const subs = [...next[si].subs] as Service["subs"];
  subs[bi] = { ...subs[bi], label };
  next[si] = { ...next[si], subs };
  return { ...block, services: next };
}

function patchSubItem(block: ServicesBlock, si: number, bi: number, ii: 0 | 1, val: string): ServicesBlock {
  const next = [...block.services] as ServicesBlock["services"];
  const subs = [...next[si].subs] as Service["subs"];
  const items = [...subs[bi].items] as [string, string];
  items[ii] = val;
  subs[bi] = { ...subs[bi], items };
  next[si] = { ...next[si], subs };
  return { ...block, services: next };
}

// イラストプレースホルダー（imageUrl 未設定のとき表示）
function PersonIllustration({ colors }: { colors: string[] }) {
  return (
    <div className="flex items-end justify-center gap-2.5 py-5 h-full">
      {colors.map((c, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5">
          <div className="rounded-full border-2 border-white shadow-sm"
               style={{ width: 24 + i * 2, height: 24 + i * 2, backgroundColor: c }} />
          <div className="rounded-t-lg"
               style={{ width: 20 + i * 2, height: 34 + i * 4, backgroundColor: c, opacity: 0.72 }} />
        </div>
      ))}
    </div>
  );
}

export default function ServicesBlockComponent({ block, config, onChange }: Props) {
  const fontClass =
    config.fontFamily === "serif" ? "font-serif" : config.fontFamily === "mono" ? "font-mono" : "font-sans";

  return (
    <section className="bg-[#fbfbfb]">
      {/* セクションヘッダー */}
      <div className="px-12 pt-20 pb-2 flex items-center gap-3">
        <div className="w-6 h-6 rounded flex items-center justify-center shadow-sm"
             style={{ backgroundColor: config.accentColor }}>
          <div className="w-3 h-3 bg-white rounded-sm" />
        </div>
        <div>
          <p className="text-[10px] text-gray-400 tracking-widest uppercase">services</p>
          <p className={`text-base font-bold text-gray-900 ${fontClass}`}>サービス</p>
        </div>
      </div>

      <div className="relative">
        {/* サイドアクセントバー */}
        <div className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center"
             style={{ backgroundColor: config.accentColor }}>
          <p className="text-[9px] font-bold text-white/80 whitespace-nowrap tracking-wider"
             style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
            社内では賄かえないプロジェクトも動き出す。
          </p>
        </div>

        <div className="ml-8 divide-y divide-gray-100">
          {block.services.map((svc, si) => (
            <div key={svc.num} className="px-10 py-12">
              {/* 番号 + タグ */}
              <div className="flex items-baseline gap-3 mb-5">
                <span className="text-2xl font-black" style={{ color: config.accentColor }}>{svc.num}</span>
                <EditableText tag="span" value={svc.tag}
                  onChange={(v) => onChange(patchService(block, si, { tag: v }))}
                  className="text-xs text-gray-400 tracking-widest" />
              </div>

              {/* 画像 + タイトルエリア */}
              <div className="flex gap-8 items-start mb-7">
                {/* ────── 画像 / イラスト ────── */}
                <div className="flex-shrink-0 w-40 h-32 rounded-2xl overflow-hidden shadow-md relative"
                     style={{ background: `linear-gradient(135deg, ${config.accentColor}30, ${config.accentColor}10)` }}>
                  {svc.imageUrl ? (
                    /* 実画像があるとき */
                    <EditableImage
                      url={svc.imageUrl}
                      onChange={(url) => onChange(patchService(block, si, { imageUrl: url }))}
                      className="absolute inset-0"
                      primaryColor={config.primaryColor}
                      accentColor={config.accentColor}
                      alt={svc.title}
                    />
                  ) : (
                    /* イラストプレースホルダー + 画像追加ボタン */
                    <div className="relative w-full h-full group/svcimg">
                      <PersonIllustration colors={svc.figColors} />
                      {/* ホバーで画像追加オーバーレイ */}
                      <div className="absolute inset-0 flex items-end justify-center pb-2
                           bg-black/0 group-hover/svcimg:bg-black/30
                           opacity-0 group-hover/svcimg:opacity-100 transition-all duration-200">
                        <button
                          onClick={() => {
                            // imageUrl を空文字からワンクリックで EditableImage の開閉を操作するため
                            // ダミーの URL を一時セットして EditableImage を表示させる
                            onChange(patchService(block, si, { imageUrl: " " }));
                          }}
                          className="text-[10px] text-white bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full"
                        >
                          + 画像を追加
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ────── テキスト ────── */}
                <div className="flex-1 min-w-0">
                  <EditableText tag="h3" value={svc.title}
                    onChange={(v) => onChange(patchService(block, si, { title: v }))}
                    className={`text-xl font-bold text-gray-900 block ${fontClass}`} />
                  <EditableText tag="p" value={svc.subtitle}
                    onChange={(v) => onChange(patchService(block, si, { subtitle: v }))}
                    multiline
                    className={`text-base font-semibold text-gray-800 leading-snug whitespace-pre-line mt-1 block ${fontClass}`} />
                  <EditableText tag="p" value={svc.desc}
                    onChange={(v) => onChange(patchService(block, si, { desc: v }))}
                    multiline
                    className="text-xs text-gray-500 mt-2 leading-relaxed body-text block" />

                  {/* 画像があるとき「画像を削除」リンク */}
                  {svc.imageUrl && svc.imageUrl.trim() && (
                    <button
                      onClick={() => onChange(patchService(block, si, { imageUrl: "" }))}
                      className="mt-1 text-[10px] text-red-400 hover:text-red-600 underline transition-colors"
                    >
                      画像を削除してイラストに戻す
                    </button>
                  )}
                </div>
              </div>

              {/* サブ項目グリッド */}
              <div className="grid grid-cols-3 gap-3">
                {svc.subs.map((sub, bi) => (
                  <div key={bi} className="rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors"
                       style={{ backgroundColor: `${config.accentColor}0a` }}>
                    <EditableText tag="p" value={sub.label}
                      onChange={(v) => onChange(patchSubLabel(block, si, bi, v))}
                      style={{ color: config.primaryColor }}
                      className="text-xs font-bold mb-2 block" />
                    <ul className="space-y-1.5">
                      {sub.items.map((item, ii) => (
                        <li key={ii} className="flex items-start gap-1.5">
                          <span className="mt-1.5 w-1 h-1 rounded-full flex-shrink-0"
                                style={{ backgroundColor: config.accentColor }} />
                          <EditableText tag="span" value={item}
                            onChange={(v) => onChange(patchSubItem(block, si, bi, ii as 0 | 1, v))}
                            className="text-xs text-gray-600 leading-relaxed" />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <button className="mt-6 inline-flex items-center gap-2 text-xs font-semibold px-5 py-2 rounded-full hover:opacity-70 transition-opacity"
                      style={{ backgroundColor: `${config.primaryColor}12`, color: config.primaryColor }}>
                もっと見る →
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
