-- Migração: categorias da biblioteca
-- Tabela separada das categorias de conteúdo do site

CREATE TABLE IF NOT EXISTS biblioteca_categorias (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL UNIQUE,
  order_index int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Leitura pública (qualquer usuário autenticado pode ver as categorias)
ALTER TABLE biblioteca_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias visíveis para todos"
  ON biblioteca_categorias FOR SELECT
  USING (true);

-- Apenas admins podem modificar (via service role — sem policy de escrita necessária)

-- Seed: categorias iniciais
INSERT INTO biblioteca_categorias (name, order_index) VALUES
  ('Hermetismo',  1),
  ('Cabala',      2),
  ('Gnosticismo', 3),
  ('Alquimia',    4),
  ('Tarot',       5),
  ('Rosacruz',    6),
  ('Maçonaria',   7),
  ('Magia',       8),
  ('Astrologia',  9),
  ('Teosofia',   10)
ON CONFLICT (name) DO NOTHING;
