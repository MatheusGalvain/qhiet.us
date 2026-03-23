import { createServiceClient } from '@/lib/supabase/server'
import BooksManager from '@/components/admin/BooksManager'

export const revalidate = 0

async function getBooks() {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('monthly_books')
    .select('*')
    .order('month', { ascending: false })
  return data ?? []
}

export default async function AdminLivrosPage() {
  const books = await getBooks()

  const totalProfano  = books.filter((b: any) => !b.plan || b.plan === 'profano').length
  const totalIniciado = books.filter((b: any) => b.plan === 'iniciado').length

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 8 }}>
            Biblioteca
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>
            Livros
          </h1>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--muted)', marginTop: 8 }}>
            {books.length} livros · {totalProfano} para Profano · {totalIniciado} para Iniciado
          </p>
        </div>
      </div>

      {/* Regras de distribuição */}
      <div style={{ padding: '16px 20px', border: '1px solid var(--faint)', marginBottom: 40, background: 'var(--surface)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
          <span style={{ color: 'var(--red-dim)' }}>// </span>Regras de acesso
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
          <span style={{ color: 'var(--cream)' }}>Profano</span> — 1 livro por mês (marcados como "Profano").<br />
          <span style={{ color: 'var(--gold)' }}>Iniciado</span> — até 4 livros por mês (todos os livros, incluindo marcados como "Iniciado").<br />
          O controle de quantos livros cada usuário acessou no mês é feito automaticamente pelo sistema.
        </p>
      </div>

      <BooksManager initialBooks={books} />
    </div>
  )
}
