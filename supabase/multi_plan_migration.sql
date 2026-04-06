-- ══════════════════════════════════════════════════════════════
-- QHIETHUS — Multi-plan support
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor)
-- ══════════════════════════════════════════════════════════════

-- 1. Adiciona coluna plans[] ao profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plans text[] DEFAULT '{}';

-- 2. Backfill: quem já tem um plano pago entra no array
UPDATE public.profiles
SET plans = ARRAY[plan]
WHERE plan IS DISTINCT FROM 'profano'
  AND (plans IS NULL OR plans = '{}');

-- 3. Garante que plano adepto também está preenchido corretamente
UPDATE public.profiles
SET plans = ARRAY['iniciado', 'acervo']
WHERE plan = 'adepto'
  AND (plans IS NULL OR plans = '{}' OR plans = ARRAY['adepto']);

-- ══════════════════════════════════════════════════════════════
-- Pronto. Rode no Supabase antes de fazer deploy.
-- ══════════════════════════════════════════════════════════════
