"use client";
import { use } from "react";
import PublicSiteView from "@/components/preview/PublicSiteView";

export default function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <PublicSiteView slug={slug} />;
}
