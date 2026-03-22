-- ═══════════════════════════════════════════════════════════════
-- QHIETHUS — Supabase Schema
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────────────
create table public.profiles (
  id                     uuid primary key references auth.users(id) on delete cascade,
  email                  text not null,
  name                   text not null default '',
  plan                   text not null default 'profano' check (plan in ('profano', 'iniciado')),
  is_subscriber          boolean not null default false,
  stripe_customer_id     text,
  stripe_subscription_id text,
  xp_total               int not null default 0,
  xp_by_domain           jsonb not null default '{}',
  created_at             timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, name, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'plan', 'profano')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ─── TRANSMISSOES ───────────────────────────────────────────────
create table public.transmissoes (
  id                  uuid primary key default uuid_generate_v4(),
  slug                text not null unique,
  number              int not null unique,
  title               text not null,
  excerpt             text not null default '',
  content             text not null default '',
  categories          text[] not null default '{}',
  access              text not null default 'free' check (access in ('free', 'locked')),
  read_time_minutes   int not null default 5,
  xp_reward           int not null default 30,
  published_at        timestamptz not null default now(),
  created_at          timestamptz not null default now()
);

create index on public.transmissoes (access);
create index on public.transmissoes using gin (categories);
create index on public.transmissoes (published_at desc);


-- ─── QUIZZES ────────────────────────────────────────────────────
create table public.quizzes (
  id              uuid primary key default uuid_generate_v4(),
  transmissao_id  uuid not null references public.transmissoes(id) on delete cascade unique,
  questions       jsonb not null default '[]',
  xp_reward       int not null default 50,
  created_at      timestamptz not null default now()
);


-- ─── XP EVENTS ──────────────────────────────────────────────────
create table public.xp_events (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  transmissao_id  uuid references public.transmissoes(id) on delete set null,
  type            text not null check (type in ('reading', 'quiz')),
  xp              int not null,
  created_at      timestamptz not null default now(),
  unique(user_id, transmissao_id, type)
);

create index on public.xp_events (user_id);


-- ─── MONTHLY BOOKS ──────────────────────────────────────────────
create table public.monthly_books (
  id           uuid primary key default uuid_generate_v4(),
  month        text not null,           -- e.g. "2026-03"
  title        text not null,
  author       text not null default '',
  plan_access  text[] not null default '{profano,iniciado}',
  file_url     text not null,
  sent_at      timestamptz,
  created_at   timestamptz not null default now()
);


-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles     enable row level security;
alter table public.transmissoes enable row level security;
alter table public.quizzes      enable row level security;
alter table public.xp_events    enable row level security;
alter table public.monthly_books enable row level security;

-- ─── profiles ───
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);


-- ─── transmissoes ───
-- Free articles: everyone can read
create policy "Free transmissoes are public"
  on public.transmissoes for select
  using (access = 'free');

-- Locked articles: only subscribers
create policy "Locked transmissoes for subscribers"
  on public.transmissoes for select
  using (
    access = 'locked'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and is_subscriber = true
    )
  );

-- Admin can do everything (use service role key in API routes)


-- ─── quizzes ───
create policy "Quiz accessible to subscribers"
  on public.quizzes for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_subscriber = true
    )
  );


-- ─── xp_events ───
create policy "Users can insert own XP events"
  on public.xp_events for insert
  with check (auth.uid() = user_id);

create policy "Users can view own XP events"
  on public.xp_events for select
  using (auth.uid() = user_id);


-- ─── monthly_books ───
create policy "Books visible to plan members"
  on public.monthly_books for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
      and plan = any(monthly_books.plan_access)
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- SEED DATA (sample transmissoes)
-- ═══════════════════════════════════════════════════════════════

insert into public.transmissoes (slug, number, title, excerpt, content, categories, access, read_time_minutes, xp_reward) values
(
  'a-mente-como-primeiro-principio',
  2,
  'A Mente como Primeiro Princípio: O Todo é Mental',
  'O primeiro princípio hermético afirma que o universo é de natureza mental. Toda realidade existe na mente do Todo — e na nossa.',
  '<p>O Kybalion, texto hermético do início do século XX atribuído aos "Três Iniciados", sistematiza os ensinamentos de Hermes Trismegisto em sete princípios fundamentais. O primeiro — e talvez o mais radical — é o Princípio do Mentalismo: <em>"O Todo é Mente; o Universo é Mental."</em></p><p>O que isso significa, exatamente? Para os herméticos, a realidade como a conhecemos não é composta de matéria bruta e indiferente, mas de Mente — de consciência em seus diferentes níveis de manifestação. O cosmos inteiro existe <em>dentro</em> da Mente do Todo, como um pensamento ou sonho de proporções inimagináveis.</p><h2>AS IMPLICAÇÕES DO MENTALISMO</h2><p>Se o universo é mental, então nossa própria mente não é uma ilha isolada — ela é uma expressão da mesma Mente cósmica que sustenta tudo. Cada pensamento, cada intenção, cada ato de consciência participa do tecido fundamental da realidade.</p>',
  array['hermetismo', 'cabala']::text[],
  'free',
  8,
  30
),
(
  'nigredo-a-putrefacao-necessaria',
  4,
  'Nigredo: A Putrefação Necessária do Ego',
  'O primeiro estágio alquímico representa a dissolução — a morte simbólica do eu superficial antes da transformação genuína.',
  '<p>Na Grande Obra alquímica, o primeiro e mais temido estágio é o <em>Nigredo</em> — o enegrecimento, a putrefação, a morte simbólica da matéria prima antes de sua transformação em ouro. Para os alquimistas medievais, este processo era tanto literal quanto espiritual: a matéria precisava ser reduzida a sua forma mais primitiva antes de poder ser recomposta em algo superior.</p><p>Jung reconheceu no Nigredo um processo psicológico preciso: a confrontação com a Sombra — aquelas partes de nós mesmos que reprimimos, negamos e projetamos nos outros. A dissolução do ego, a "morte do eu falso", é condição necessária para qualquer transformação real.</p>',
  array['alquimia']::text[],
  'free',
  6,
  25
),
(
  'o-silencio-entre-os-veus',
  1,
  'O Silêncio Entre os Véus: Ain Soph e a Emanação do Ser',
  'Antes da criação, havia apenas o Sem Fim — o Ain Soph. Não um vazio, mas uma plenitude tão absoluta que nenhum nome pode alcançá-la.',
  '<p>Na tradição cabalística, antes de qualquer existência — antes do Ser, antes do pensamento, antes da própria possibilidade de conceito — havia o <em>Ain Soph</em> (אין סוף), o Sem Fim. Não o nada, mas o Tudo tão pleno que não deixa espaço para qualquer distinção ou limitação.</p><p>Os cabalistas medievais, particularmente na escola de Isaac Luria (o Ari), desenvolveram uma cosmogonia de extraordinária sofisticação: o universo não emergiu do Ain Soph por criação externa, mas por um processo de <em>Tzimtzum</em> — contração ou retraimento do Infinito para criar espaço para o finito existir.</p>',
  array['cabala']::text[],
  'locked',
  14,
  60
);
