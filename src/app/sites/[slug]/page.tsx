import { getSiteBySlug } from "@/lib/supabase";
import ProductionSiteView from "@/components/preview/ProductionSiteView";
import { defaultConfig } from "@/types/site";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);
  return {
    title: site?.title ?? slug,
    description: site?.config.catchCopy ?? "",
  };
}

export default async function SitePage({ params }: Props) {
  const { slug } = await params;
  const site = await getSiteBySlug(slug);

  if (!site) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-700 mb-2">サイトが見つかりません</p>
          <p className="text-sm text-gray-400">
            スラッグ <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{slug}</code> のサイトは存在しません。
          </p>
        </div>
      </div>
    );
  }

  return <ProductionSiteView config={site.config ?? defaultConfig} />;
}
