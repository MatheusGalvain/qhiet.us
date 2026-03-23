-- ══════════════════════════════════════════════════════════
-- Adiciona coluna `tags` na tabela categories
-- Execute no Supabase SQL Editor
-- ══════════════════════════════════════════════════════════

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Popula tags das 6 categorias existentes com os valores padrão
UPDATE public.categories SET tags = ARRAY['Tábua de Esmeralda', 'Kybalion', 'Corpus Hermeticum'] WHERE slug = 'hermetismo';
UPDATE public.categories SET tags = ARRAY['Árvore da Vida', 'Sefirot', 'Gematria']               WHERE slug = 'cabala';
UPDATE public.categories SET tags = ARRAY['Nag Hammadi', 'Demiurgo', 'Pneuma']                   WHERE slug = 'gnosticismo';
UPDATE public.categories SET tags = ARRAY['Nigredo', 'Grande Obra', 'Solve et Coagula']           WHERE slug = 'alquimia';
UPDATE public.categories SET tags = ARRAY['Arcanos Maiores', 'Simbolismo', 'Jornada do Herói']   WHERE slug = 'tarot';
UPDATE public.categories SET tags = ARRAY['Manifestos', 'Fraternidade', 'Christian Rosenkreuz']  WHERE slug = 'rosacruz';
