-- Supabase で実行するSQL
-- Dashboard > SQL Editor に貼り付けて Run してください

create table public.sites (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text,
  config jsonb not null,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 公開サイトは誰でも読める
alter table public.sites enable row level security;

create policy "public can read sites"
  on public.sites for select
  using (true);

create policy "anyone can upsert sites"
  on public.sites for all
  using (true)
  with check (true);

-- updated_at を自動更新するトリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger sites_updated_at
  before update on public.sites
  for each row execute function update_updated_at();
