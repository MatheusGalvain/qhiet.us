-- ═══════════════════════════════════════════════════════════════
-- QHIETHUS — Admin Migration
-- Run this ONCE in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Add is_admin column to profiles
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- 2. Add status column to transmissoes (draft / published)
alter table public.transmissoes
  add column if not exists status text not null default 'published'
    check (status in ('draft', 'published'));

-- 3. RLS: admins can do anything on transmissoes
create policy "Admins can insert transmissoes"
  on public.transmissoes for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can update transmissoes"
  on public.transmissoes for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

create policy "Admins can delete transmissoes"
  on public.transmissoes for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- 4. RLS: admins can read all profiles
create policy "Admins can read all profiles"
  on public.profiles for select
  to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1 from public.profiles p2
      where p2.id = auth.uid() and p2.is_admin = true
    )
  );

-- ─────────────────────────────────────────────────────────────
-- TORNAR-SE ADMIN
-- Substitua 'seu@email.com' pelo seu e-mail cadastrado
-- ─────────────────────────────────────────────────────────────
update public.profiles
set is_admin = true
where email = 'seu@email.com';

-- Confirma
select id, email, is_admin from public.profiles where is_admin = true;
