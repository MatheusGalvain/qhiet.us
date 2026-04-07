-- Migração: monthly_books → R2
-- Adiciona file_key (chave R2) e cria tabela de progresso de leitura

-- 1. Adiciona coluna file_key na tabela monthly_books
ALTER TABLE monthly_books ADD COLUMN IF NOT EXISTS file_key text;

-- 1b. Remove NOT NULL de file_url (agora o arquivo vai para R2 via file_key)
ALTER TABLE monthly_books ALTER COLUMN file_url DROP NOT NULL;

-- 2. Cria tabela de progresso de leitura de livros mensais
CREATE TABLE IF NOT EXISTS livro_progress (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id      uuid NOT NULL REFERENCES monthly_books(id) ON DELETE CASCADE,
  current_page int  NOT NULL DEFAULT 1,
  total_pages  int  NOT NULL DEFAULT 0,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- 3. RLS na tabela de progresso
ALTER TABLE livro_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own livro progress"
  ON livro_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own livro progress"
  ON livro_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own livro progress"
  ON livro_progress FOR UPDATE USING (auth.uid() = user_id);
