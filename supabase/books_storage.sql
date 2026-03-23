-- ═══════════════════════════════════════
-- Books — Add plan column + Storage bucket
-- ═══════════════════════════════════════

-- Add new columns to monthly_books
ALTER TABLE public.monthly_books
  ADD COLUMN IF NOT EXISTS plan      text NOT NULL DEFAULT 'profano',
  ADD COLUMN IF NOT EXISTS cover_url text;

-- Create storage bucket for books (run in Supabase Dashboard > Storage)
-- Or via SQL:
INSERT INTO storage.buckets (id, name, public)
  VALUES ('livros', 'livros', true)
  ON CONFLICT (id) DO NOTHING;

-- Drop existing policies first (safe to re-run)
DROP POLICY IF EXISTS "livros_public_read"  ON storage.objects;
DROP POLICY IF EXISTS "livros_admin_upload" ON storage.objects;
DROP POLICY IF EXISTS "livros_admin_delete" ON storage.objects;

-- Allow public read on livros bucket
CREATE POLICY "livros_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'livros');

-- Allow admins to upload
CREATE POLICY "livros_admin_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'livros' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Allow admins to delete
CREATE POLICY "livros_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'livros' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );
