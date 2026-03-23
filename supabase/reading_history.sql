-- ═══════════════════════════════════════════════════════════════
-- QHIETHUS — Reading History Migration
-- Run this in the Supabase SQL Editor (after schema.sql)
-- ═══════════════════════════════════════════════════════════════

-- ─── READING HISTORY TABLE ───────────────────────────────────────
-- Tracks each time a user completes reading a transmissão
-- Used for: activity heatmap, reading streak, profile history

create table if not exists public.reading_history (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  transmissao_id  uuid not null references public.transmissoes(id) on delete cascade,
  read_at         timestamptz not null default now(),
  unique(user_id, transmissao_id)
);

create index if not exists reading_history_user_id_idx on public.reading_history (user_id);
create index if not exists reading_history_read_at_idx  on public.reading_history (read_at desc);


-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────
alter table public.reading_history enable row level security;

create policy "Users can view own reading history"
  on public.reading_history for select
  using (auth.uid() = user_id);

create policy "Users can insert own reading history"
  on public.reading_history for insert
  with check (auth.uid() = user_id);


-- ─── complete_reading() RPC ───────────────────────────────────────
-- Called by ReadingCompleteButton when the user finishes an article.
-- Idempotent: safe to call multiple times (returns already_read:true after first).
-- Awards XP, inserts into reading_history and xp_events, updates profile total.

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
  v_user_id    uuid := auth.uid();
  v_already    boolean;
  v_xp_earned  int := 0;
begin
  -- Must be logged in
  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  -- Check if already read
  select exists(
    select 1 from public.reading_history
    where user_id = v_user_id
      and transmissao_id = p_transmissao_id
  ) into v_already;

  if v_already then
    return jsonb_build_object(
      'success',      true,
      'already_read', true,
      'xp_earned',    0
    );
  end if;

  -- Insert reading_history
  insert into public.reading_history (user_id, transmissao_id)
  values (v_user_id, p_transmissao_id)
  on conflict (user_id, transmissao_id) do nothing;

  -- Insert xp_event (ignore if already exists)
  insert into public.xp_events (user_id, transmissao_id, type, xp)
  values (v_user_id, p_transmissao_id, 'reading', p_xp)
  on conflict (user_id, transmissao_id, type) do nothing;

  -- Check if xp was actually inserted (it might already exist)
  if found then
    v_xp_earned := p_xp;
    -- Update profile total
    update public.profiles
    set xp_total = xp_total + p_xp
    where id = v_user_id;
  end if;

  return jsonb_build_object(
    'success',      true,
    'already_read', false,
    'xp_earned',    v_xp_earned
  );

exception when others then
  return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.complete_reading(uuid, int) to authenticated;
