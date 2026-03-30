-- ═══════════════════════════════════════════════════════════
--  TRILHAS v2 — Migration
--  Execute este arquivo no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ─── 1. trails: is_free + categories[] ───────────────────────
alter table trails add column if not exists is_free boolean default false;
alter table trails add column if not exists categories text[] default '{}';

-- Migra dados existentes: copia category → categories
update trails set categories = array[category]
  where categories is null or array_length(categories, 1) is null;

-- ─── 2. categories: parent_id para hierarquia ─────────────────
alter table categories add column if not exists parent_id uuid references categories(id) on delete set null;

-- ─── 3. user_grimoire: redesign para por trilha + geral ───────
-- Remove coluna antiga (transmissao_id) — atenção: isso apaga notas existentes
alter table user_grimoire drop constraint if exists user_grimoire_user_id_transmissao_id_key;
alter table user_grimoire drop column if exists transmissao_id;

-- Adiciona trail_id (nullable = grimório geral)
alter table user_grimoire add column if not exists trail_id uuid references trails(id) on delete cascade;

-- Índices únicos: um por trilha, um geral
drop index if exists user_grimoire_trail_unique;
drop index if exists user_grimoire_general_unique;
create unique index user_grimoire_trail_unique
  on user_grimoire(user_id, trail_id)
  where trail_id is not null;
create unique index user_grimoire_general_unique
  on user_grimoire(user_id)
  where trail_id is null;

-- Remove check antigo de 1000 chars e aplica novo de 7500 por campo
alter table user_grimoire drop constraint if exists user_grimoire_content_check;
alter table user_grimoire add constraint user_grimoire_content_check
  check (char_length(content) <= 7500);

-- ─── 4. RLS — trails: trails gratuitas visíveis a todos ───────
drop policy if exists "trails_read_subscriber" on trails;
drop policy if exists "trails_read_all" on trails;
create policy "trails_read_all" on trails
  for select using (
    is_published = true and (
      is_free = true
      or auth.uid() is not null and (
        exists (select 1 from profiles where id = auth.uid() and is_subscriber = true)
        or exists (select 1 from profiles where id = auth.uid() and is_admin = true)
      )
    )
  );

-- ─── 5. RLS — trail_transmissoes: acompanha is_free da trilha ─
drop policy if exists "trail_tx_read_subscriber" on trail_transmissoes;
drop policy if exists "trail_tx_read_all" on trail_transmissoes;
create policy "trail_tx_read_all" on trail_transmissoes
  for select using (
    exists (
      select 1 from trails t
      where t.id = trail_transmissoes.trail_id
        and t.is_published = true
        and (
          t.is_free = true
          or auth.uid() is not null and (
            exists (select 1 from profiles where id = auth.uid() and (is_subscriber = true or is_admin = true))
          )
        )
    )
  );

-- ─── 6. RLS — user_trail_progress: aberto para trilhas gratuitas
drop policy if exists "utp_own" on user_trail_progress;
drop policy if exists "utp_own_v2" on user_trail_progress;
create policy "utp_own_v2" on user_trail_progress
  for all using (user_id = auth.uid());

-- ─── 7. RLS — user_trail_completions ─────────────────────────
drop policy if exists "utc_own" on user_trail_completions;
drop policy if exists "utc_own_v2" on user_trail_completions;
create policy "utc_own_v2" on user_trail_completions
  for all using (user_id = auth.uid());

-- ─── 8. RLS — user_grimoire: exclusivo assinante ─────────────
drop policy if exists "grimoire_own" on user_grimoire;
drop policy if exists "grimoire_own_v2" on user_grimoire;
create policy "grimoire_own_v2" on user_grimoire
  for all using (
    user_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid()
        and (is_subscriber = true or is_admin = true)
    )
  );

-- ─── 9. Trilha de Boas-Vindas (seed) ─────────────────────────
-- Insere a trilha gratuita se ainda não existir
do $$
declare
  v_trail_id uuid;
begin
  -- Verifica se já existe
  select id into v_trail_id from trails where title = 'Boas-Vindas a Qhiethus' limit 1;

  if v_trail_id is null then
    -- Cria trilha
    insert into trails (title, description, category, categories, is_free, duration_days, xp_reward, is_published, order_index)
    values (
      'Boas-Vindas a Qhiethus',
      'Uma iniciação ao universo de Qhiethus. Descubra como a plataforma funciona, o que são as Transmissões, e por que o conhecimento esotérico exige presença e intenção.',
      'boas-vindas',
      array['boas-vindas'],
      true,
      7,
      50,
      true,
      -1
    )
    returning id into v_trail_id;

    -- Transmissão 1
    insert into trail_transmissoes (trail_id, title, content, order_index, read_time_minutes)
    values (
      v_trail_id,
      'O que é Qhiethus',
      '# O que é Qhiethus

Qhiethus não é um repositório de informações.

É uma plataforma de **iniciação ao conhecimento esotérico e hermético** — construída para quem leva o estudo a sério.

---

## A distinção

Há uma diferença entre *consumir* e *absorver*.

A maioria das plataformas de conteúdo foi projetada para consumo. Posts curtos, notificações, a próxima leitura já esperando. O modelo é o da quantidade — quanto mais você consome, melhor para o algoritmo.

Qhiethus foi construída ao contrário.

Aqui, cada *Transmissão* é um texto completo, criado para ser lido com atenção. Sem rolagem infinita. Sem recomendações automáticas puxando você para o próximo vídeo.

---

## O que você encontrará aqui

**Transmissões** são os artigos da plataforma — ensaios sobre hermetismo, filosofia oculta, astrologia simbólica, alquimia, gnose e tradições esotéricas do Ocidente e do Oriente.

**Trilhas de Iniciação** são sequências de transmissões organizadas em ordem pedagógica, pensadas para guiar seu estudo de forma gradual e coerente.

**XP e Domínios** registram sua jornada. A cada leitura concluída, você acumula experiência em categorias específicas — uma forma de tornar visível o que foi absorvido.

---

## Por onde começar

Continue esta trilha. Nas próximas transmissões, você entenderá como navegar pela plataforma, o que são os Iniciados, e como estruturar seu estudo.

*A jornada começa com presença.*',
      0,
      6
    );

    -- Transmissão 2
    insert into trail_transmissoes (trail_id, title, content, order_index, read_time_minutes)
    values (
      v_trail_id,
      'Transmissões: a Lógica da Leitura Profunda',
      '# Transmissões: a Lógica da Leitura Profunda

Uma Transmissão é um texto criado para durar.

Não para ser marcado como lido em 30 segundos. Não para ser escaneado por palavras-chave. Criado para ser *lido* — com pausa, com releitura quando necessário, com a atenção que o conhecimento exige.

---

## A estrutura de uma Transmissão

Cada texto possui:

- Um **número de identificação** — a ordem cronológica de publicação
- **Categorias** — os domínios do conhecimento que o texto toca
- **Tempo estimado de leitura** — para que você possa se preparar
- **XP** — a experiência acumulada ao concluir a leitura

---

## O sistema de XP

O XP não é apenas uma gamificação decorativa.

Ele reflete o mapa do seu estudo. Se você passa os próximos três meses lendo apenas textos de Astrologia, seu perfil mostrará exatamente isso — um domínio profundo em uma área específica.

Se você lê de forma ampla, seu perfil refletirá uma formação diversa.

Não há julgamento. Há apenas o registro do que foi feito.

---

## Concluindo uma Transmissão

Ao terminar a leitura, clique em **Concluir Leitura** na parte inferior do texto. Isso:

- Registra sua conclusão
- Adiciona o XP ao seu perfil
- Libera o Quiz, quando disponível

O Quiz é um aprofundamento — não uma prova. As perguntas existem para fazer você pensar, não para testar memorização.',
      1,
      7
    );

    -- Transmissão 3
    insert into trail_transmissoes (trail_id, title, content, order_index, read_time_minutes)
    values (
      v_trail_id,
      'Iniciados: o Acesso Completo',
      '# Iniciados: o Acesso Completo

Qhiethus possui um modelo claro: algumas transmissões são gratuitas, abertas a qualquer visitante. O restante é exclusivo para **Iniciados** — assinantes da plataforma.

---

## O que muda ao se tornar Iniciado

**Acesso a todas as Transmissões**

Textos marcados como exclusivos ficam bloqueados para não-assinantes. Ao se tornar Iniciado, o arquivo completo fica disponível.

**Trilhas de Iniciação**

As trilhas premium são sequências de estudo estruturadas. Cada trilha possui entre 5 e 20 transmissões, organizadas em progressão pedagógica. O mapa em espiral ou constelação mostra onde você está e o que vem a seguir.

**O Grimório**

O Grimório é seu caderno de anotações dentro da plataforma. Para cada trilha, você tem um espaço de escrita — um lugar para registrar insights, reflexões, conexões que surgem durante a leitura.

O Grimório não desaparece. Ele fica vinculado à sua conta, construído ao longo do tempo.

---

## Por que existe esse modelo

Manter uma plataforma de conteúdo de qualidade exige trabalho contínuo de pesquisa, escrita e curadoria.

A assinatura torna isso possível — sem anúncios, sem patrocínio corporativo, sem comprometer o rigor do conteúdo.

---

*Se você está lendo isto, já está aqui. A próxima pergunta é: você quer ir mais fundo?*',
      2,
      6
    );

  end if;
end;
$$;
