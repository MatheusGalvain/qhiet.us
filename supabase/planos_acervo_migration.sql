-- ═══════════════════════════════════════════════════════════════════
-- QHIETHUS — Migration: Planos & Acervo (feature/planos-acervo)
-- Run in Supabase SQL Editor (service role / postgres user)
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 1. Add `plan` column to profiles
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT
    NOT NULL
    DEFAULT 'profano'
    CHECK (plan IN ('profano', 'iniciado', 'adepto', 'acervo'));

-- Back-fill: anyone who was already a subscriber becomes 'iniciado'
UPDATE profiles
  SET plan = 'iniciado'
  WHERE is_subscriber = TRUE AND plan = 'profano';

-- ─────────────────────────────────────────────────────────────────
-- 2. Create `biblioteca` table
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS biblioteca (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT NOT NULL,
  author       TEXT NOT NULL DEFAULT '',
  year         INTEGER,
  category     TEXT NOT NULL DEFAULT 'Hermetismo'
                 CHECK (category IN ('Hermetismo','Cabala','Gnosticismo','Alquimia','Tarot','Rosacruz')),
  era          TEXT DEFAULT 'Moderno'
                 CHECK (era IN ('Antiguidade','Medieval','Renascimento','Moderno')),
  description  TEXT NOT NULL DEFAULT '',
  file_url     TEXT NOT NULL,        -- Cloudflare R2 key (never a real URL)
  cover_url    TEXT,                 -- Supabase Storage public URL
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  order_index  INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Updated-at trigger
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS biblioteca_updated_at ON biblioteca;
CREATE TRIGGER biblioteca_updated_at
  BEFORE UPDATE ON biblioteca
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- 3. Create `biblioteca_progress` table
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS biblioteca_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id      UUID NOT NULL REFERENCES biblioteca(id) ON DELETE CASCADE,
  current_page INTEGER NOT NULL DEFAULT 1,
  total_pages  INTEGER NOT NULL DEFAULT 0,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, book_id)
);

CREATE INDEX IF NOT EXISTS biblioteca_progress_user_idx ON biblioteca_progress(user_id);
CREATE INDEX IF NOT EXISTS biblioteca_progress_book_idx ON biblioteca_progress(book_id);

-- ─────────────────────────────────────────────────────────────────
-- 4. RLS — biblioteca (public read for published, admin full access)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE biblioteca ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read published books
CREATE POLICY "biblioteca_read_published"
  ON biblioteca FOR SELECT
  TO authenticated
  USING (is_published = TRUE);

-- Admins can read all (including drafts)
CREATE POLICY "biblioteca_admin_read_all"
  ON biblioteca FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  );

-- Only admins can insert / update / delete
CREATE POLICY "biblioteca_admin_write"
  ON biblioteca FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- 5. RLS — biblioteca_progress (users can only see/write their own)
-- ─────────────────────────────────────────────────────────────────

ALTER TABLE biblioteca_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_own"
  ON biblioteca_progress FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────
-- 6. Supabase Storage bucket for covers (run in Storage section or via API)
-- ─────────────────────────────────────────────────────────────────
-- NOTE: Create a public bucket named `biblioteca-covers` in the
--       Supabase dashboard (Storage → New bucket → Public: true).
--       Alternatively, use the Supabase CLI:
--
--   supabase storage create biblioteca-covers --public
--
-- After creating the bucket, add this storage policy via SQL:

INSERT INTO storage.buckets (id, name, public)
  VALUES ('biblioteca-covers', 'biblioteca-covers', TRUE)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "biblioteca_covers_public_read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'biblioteca-covers');

CREATE POLICY "biblioteca_covers_admin_write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'biblioteca-covers'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_admin = TRUE
    )
  );

-- ─────────────────────────────────────────────────────────────────
-- 7. Optional: plan-aware RLS on transmissoes
--    (uncomment and adjust if transmissoes table exists)
-- ─────────────────────────────────────────────────────────────────
-- ALTER TABLE transmissoes ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "transmissoes_paid_read"
--   ON transmissoes FOR SELECT
--   TO authenticated
--   USING (
--     is_published = TRUE
--     AND EXISTS (
--       SELECT 1 FROM profiles
--       WHERE profiles.id = auth.uid()
--         AND profiles.plan IN ('iniciado', 'adepto')
--     )
--   );

-- ─────────────────────────────────────────────────────────────────
-- 8. Useful indexes
-- ─────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS biblioteca_category_idx    ON biblioteca(category);
CREATE INDEX IF NOT EXISTS biblioteca_published_idx   ON biblioteca(is_published);
CREATE INDEX IF NOT EXISTS biblioteca_order_idx       ON biblioteca(order_index);
CREATE INDEX IF NOT EXISTS biblioteca_created_at_idx  ON biblioteca(created_at DESC);
CREATE INDEX IF NOT EXISTS profiles_plan_idx          ON profiles(plan);

-- ─────────────────────────────────────────────────────────────────
-- Done ✓
-- ─────────────────────────────────────────────────────────────────
