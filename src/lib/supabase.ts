import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SiteConfig } from "@/types/site";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  supabaseUrl.startsWith("http") && supabaseAnonKey.length > 10;

// クライアントは設定済みの場合のみ生成
let _supabase: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (!isSupabaseConfigured) throw new Error("Supabase が未設定です。.env.local を確認してください。");
  if (!_supabase) _supabase = createClient(supabaseUrl, supabaseAnonKey);
  return _supabase;
}

export interface SiteRow {
  id: string;
  slug: string;
  title: string;
  config: SiteConfig;
  published: boolean;
  created_at: string;
  updated_at: string;
}

/** slugでサイトを取得 */
export async function getSiteBySlug(slug: string): Promise<SiteRow | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await getClient()
    .from("sites")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error || !data) return null;
  return data as SiteRow;
}

/** サイトを保存（upsert） */
export async function publishSite(slug: string, config: SiteConfig): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: "Supabase が未設定です。.env.local に URL と ANON KEY を入力してください。" };
  }
  const { error } = await getClient()
    .from("sites")
    .upsert(
      { slug, title: config.title, config, published: true },
      { onConflict: "slug" }
    );
  return { error: error?.message ?? null };
}
