-- ═══════════════════════════════════════════════════════════
--  TRILHAS DE INICIAÇÃO — Schema completo
-- ═══════════════════════════════════════════════════════════

-- Trilhas criadas pelo admin
create table if not exists trails (
  id             uuid default gen_random_uuid() primary key,
  title          text not null,
  description    text,
  category       text not null,
  duration_days  int  default 30,
  xp_reward      int  default 500,
  is_published   boolean default false,
  order_index    int  default 0,
  created_at     timestamp with time zone default now()
);

-- Transmissões exclusivas de trilha (separadas das transmissões normais)
create table if not exists trail_transmissoes (
  id                 uuid default gen_random_uuid() primary key,
  trail_id           uuid references trails(id) on delete cascade not null,
  title              text not null,
  content            text not null,
  order_index        int  default 0,
  read_time_minutes  int  default 8,
  created_at         timestamp with time zone default now()
);

-- Progresso do usuário por transmissão dentro da trilha
create table if not exists user_trail_progress (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references profiles(id) on delete cascade not null,
  trail_id         uuid references trails(id)  on delete cascade not null,
  transmissao_id   uuid references trail_transmissoes(id) on delete cascade not null,
  completed_at     timestamp with time zone default now(),
  started_at       timestamp with time zone default now(),
  unique(user_id, trail_id, transmissao_id)
);

-- Conclusões completas de trilhas (XP liberado aqui)
create table if not exists user_trail_completions (
  id           uuid default gen_random_uuid() primary key,
  user_id      uuid references profiles(id) on delete cascade not null,
  trail_id     uuid references trails(id)  on delete cascade not null,
  xp_earned    int  default 500,
  completed_at timestamp with time zone default now(),
  unique(user_id, trail_id)
);

-- Grimório — anotações do usuário por transmissão de trilha
create table if not exists user_grimoire (
  id               uuid default gen_random_uuid() primary key,
  user_id          uuid references profiles(id) on delete cascade not null,
  transmissao_id   uuid references trail_transmissoes(id) on delete cascade not null,
  content          text check (char_length(content) <= 1000),
  updated_at       timestamp with time zone default now(),
  unique(user_id, transmissao_id)
);

-- ═══════════════════════════════════════════════════════════
--  RLS — Row Level Security
-- ═══════════════════════════════════════════════════════════

alter table trails               enable row level security;
alter table trail_transmissoes   enable row level security;
alter table user_trail_progress  enable row level security;
alter table user_trail_completions enable row level security;
alter table user_grimoire        enable row level security;

-- trails: assinantes e admin leem; admin escreve
create policy "trails_read_subscriber" on trails
  for select using (
    is_published = true and (
      exists (select 1 from profiles where id = auth.uid() and is_subscriber = true)
      or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
    )
  );

create policy "trails_all_admin" on trails
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- trail_transmissoes: assinantes e admin leem publicadas; admin escreve
create policy "trail_tx_read_subscriber" on trail_transmissoes
  for select using (
    exists (
      select 1 from trails t
      where t.id = trail_transmissoes.trail_id
        and t.is_published = true
        and exists (select 1 from profiles where id = auth.uid() and (is_subscriber = true or is_admin = true))
    )
  );

create policy "trail_tx_all_admin" on trail_transmissoes
  for all using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- user_trail_progress: usuário lê/escreve o próprio; admin lê tudo
create policy "utp_own" on user_trail_progress
  for all using (
    user_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and (is_subscriber = true or is_admin = true))
  );

create policy "utp_admin_read" on user_trail_progress
  for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- user_trail_completions: usuário lê/escreve o próprio; admin lê tudo
create policy "utc_own" on user_trail_completions
  for all using (
    user_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and (is_subscriber = true or is_admin = true))
  );

create policy "utc_admin_read" on user_trail_completions
  for select using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- user_grimoire: usuário lê/escreve o próprio
create policy "grimoire_own" on user_grimoire
  for all using (
    user_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and (is_subscriber = true or is_admin = true))
  );
