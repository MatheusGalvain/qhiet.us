-- ═══════════════════════════════════════════════════════════════
-- QHIETHUS — Site Settings Table
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now()
);

-- Disable public read access (admin only via service role)
alter table public.site_settings enable row level security;

-- Only service role / admin can read and write
create policy "admin_all" on public.site_settings
  using (true)
  with check (true);

-- Default: next post 7 days from today
insert into public.site_settings (key, value)
values ('next_post_at', to_jsonb((now() + interval '7 days')::date::text))
on conflict (key) do nothing;
