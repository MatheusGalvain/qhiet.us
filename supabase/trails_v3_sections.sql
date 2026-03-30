-- ═══════════════════════════════════════════════════════════
--  TRILHAS v3 — Seções (agrupamento de transmissões)
--  Execute no Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Adiciona coluna section_title em trail_transmissoes
-- Transmissões com o mesmo section_title formam um grupo/capítulo no mapa
-- Transmissões com section_title NULL aparecem como nós individuais (padrão anterior)
alter table trail_transmissoes
  add column if not exists section_title text default null;

-- Índice para buscas por seção
create index if not exists idx_trail_tx_section
  on trail_transmissoes(trail_id, section_title);
