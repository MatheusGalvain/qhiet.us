-- ═══════════════════════════════════════════════════════════════
-- QHIETHUS — Reading History Migration  (v3 — idempotent)
-- Run this in the Supabase SQL Editor.
-- Handles the case where the table was already created with
-- the wrong column name "read_at" from a previous partial run.
-- ═══════════════════════════════════════════════════════════════

-- ─── Step 1: drop and recreate cleanly ────────────────────────────
-- (table has no user data yet so this is safe)
drop table if exists public.reading_history cascade;

create table public.reading_history (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  transmissao_id  uuid not null references public.transmissoes(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique(user_id, transmissao_id)
);

create index reading_history_user_id_idx   on public.reading_history (user_id);
create index reading_history_created_at_idx on public.reading_history (created_at desc);

-- ─── Step 2: RLS ─────────────────────────────────────────────────
alter table public.reading_history enable row level security;

create policy "Users can view own reading history"
  on public.reading_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own reading history"
  on public.reading_history for insert
  with check (auth.uid() = user_id);


-- ─── Step 3: complete_reading() RPC ──────────────────────────────
create or replace function public.complete_reading(
  p_transmissao_id uuid,
  p_xp             int default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id   uuid := auth.uid();
  v_already   boolean;
  v_xp_earned int := 0;
  v_inserted  int;
begin
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  select exists(
    select 1 from public.reading_history
    where user_id = v_user_id and transmissao_id = p_transmissao_id
  ) into v_already;

  if v_already then
    return jsonb_build_object('success', true, 'already_read', true, 'xp_earned', 0);
  end if;

  insert into public.reading_history (user_id, transmissao_id)
  values (v_user_id, p_transmissao_id)
  on conflict (user_id, transmissao_id) do nothing;

  insert into public.xp_events (user_id, transmissao_id, type, xp)
  values (v_user_id, p_transmissao_id, 'reading', p_xp)
  on conflict (user_id, transmissao_id, type) do nothing;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  if v_inserted > 0 then
    v_xp_earned := p_xp;
    update public.profiles set xp_total = xp_total + p_xp where id = v_user_id;
  end if;

  return jsonb_build_object('success', true, 'already_read', false, 'xp_earned', v_xp_earned);

exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

grant execute on function public.complete_reading(uuid, int) to authenticated;


-- ─── Step 4: add nick + nick_updated_at to profiles ─────────────
alter table public.profiles
  add column if not exists nick             text,
  add column if not exists nick_updated_at  timestamptz;

-- Unique index (case-insensitive) so two users can't have the same nick
create unique index if not exists profiles_nick_lower_idx
  on public.profiles (lower(nick))
  where nick is not null;
