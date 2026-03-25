-- ═══════════════════════════════════════
-- Categories — DB-driven with color support
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.categories (
  id           uuid primary key default uuid_generate_v4(),
  slug        text PRIMARY KEY,
  label       text NOT NULL,
  symbol      text NOT NULL DEFAULT '◉',
  color       text NOT NULL DEFAULT '#b02a1e',   -- hex color
  description text,
  sort_order  int  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Seed from existing hardcoded CATEGORY_META
INSERT INTO public.categories (slug, label, symbol, color, sort_order) VALUES
  ('hermetismo',  'Hermetismo',  '☿', '#b02a1e', 1),
  ('cabala',      'Cabala',      '✡', '#8b6914', 2),
  ('gnosticismo', 'Gnosticismo', '⊕', '#4a7a5e', 3),
  ('alquimia',    'Alquimia',    '☽', '#7a4e8b', 4),
  ('tarot',       'Tarot',       '⊗', '#2a6e8b', 5),
  ('rosacruz',    'Rosacruz',    '△', '#6e2a4a', 6)
ON CONFLICT (slug) DO NOTHING;

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read
CREATE POLICY "categories_read_all" ON public.categories
  FOR SELECT USING (true);

-- Only admins can write (service role bypasses RLS)
CREATE POLICY "categories_write_admin" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
