import { getSiteBySlug } from "@/lib/supabase";
import ProductionSiteView from "@/components/preview/ProductionSiteView";
import { defaultConfig } from "@/types/site";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; pageSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, pageSlug } = await params;
  const site = await getSiteBySlug(slug);
  const page = site?.config?.pages?.find((p) => p.slug === pageSlug);

  return {
    title: page?.metaTitle ?? page?.title ?? pageSlug,
    description: page?.metaDescription ?? site?.config?.description ?? "",
    openGraph: {
      images: page?.ogImage ?? site?.config?.ogImage ? [{ url: (page?.ogImage ?? site?.config?.ogImage)! }] : [],
    },
    robots: page?.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function SiteSubPage({ params }: Props) {
  const { slug, pageSlug } = await params;
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

  return (
    <ProductionSiteView
      config={site.config ?? defaultConfig}
      slug={pageSlug}
      siteSlug={slug}
    />
  );
}
