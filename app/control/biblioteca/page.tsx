import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import BibliotecaAdminForm from '@/components/biblioteca/BibliotecaAdminForm'
import type { Metadata } from 'next'

export const revalidate = 0
export const metadata: Metadata = { title: 'Admin · Biblioteca' }

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/control/login')

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!(profile as any)?.is_admin) redirect('/control')

  const { data: books } = await service
    .from('biblioteca')
    .select('id, title, author, year, category, era, is_published, order_index, created_at')
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: false })

  return { books: books ?? [] }
}

export default async function AdminBibliotecaPage() {
  const { books } = await getData()

  return (
    <div>
      {/* Header */}
      <div style={{ borderBottom: '1px solid var(--faint)', padding: 'clamp(24px,3vw,40px) var(--px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            <Link href="/control" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Admin</Link> › Biblioteca
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', letterSpacing: 3, color: 'var(--cream)' }}>
            BIBLIOTECA
          </h1>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)' }}>
            {books.length} obra{books.length !== 1 ? 's' : ''}
          </p>
          <Link
            href="/control/biblioteca/categorias"
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
              textTransform: 'uppercase', color: 'var(--gold)',
              textDecoration: 'none', border: '1px solid var(--gold-dim)',
              padding: '5px 12px', whiteSpace: 'nowrap',
            }}
          >
            ◈ Gerenciar Categorias
          </Link>
        </div>
      </div>

      {/* Book list */}
      <div style={{ borderBottom: '1px solid var(--faint)', padding: 'clamp(20px,3vw,32px) var(--px)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Título', 'Autor', 'Categoria', 'Era', 'Status', 'Ações'].map(h => (
                <th key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', padding: '10px 12px', borderBottom: '1px solid var(--faint)', textAlign: 'left' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {books.map((book: any) => (
              <tr key={book.id}>
                <td style={tdSt}>{book.title}</td>
                <td style={tdSt}>{book.author}</td>
                <td style={tdSt}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {book.category}
                  </span>
                </td>
                <td style={tdSt}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {book.era ?? '—'}
                  </span>
                </td>
                <td style={tdSt}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
                    color: book.is_published ? 'var(--red)' : 'var(--faint)',
                    border: `1px solid ${book.is_published ? 'var(--red-dim)' : 'var(--faint)'}`,
                    padding: '1px 8px',
                  }}>
                    {book.is_published ? '◉ Publicado' : '○ Rascunho'}
                  </span>
                </td>
                <td style={tdSt}>
                  <Link
                    href={`/control/biblioteca/${book.id}/editar`}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none' }}
                  >
                    Editar →
                  </Link>
                </td>
              </tr>
            ))}
            {books.length === 0 && (
              <tr>
                <td colSpan={6} style={{ ...tdSt, textAlign: 'center', padding: '32px 0', color: 'var(--faint)' }}>
                  Nenhuma obra cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* New book form */}
      <div style={{ padding: 'clamp(24px,3vw,40px) var(--px)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 3, color: 'var(--cream)', marginBottom: 28 }}>
          + Nova Obra
        </h2>
        <BibliotecaAdminForm />
      </div>
    </div>
  )
}

const tdSt: React.CSSProperties = {
  fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--cream-dim)',
  padding: '12px', borderBottom: '1px solid var(--faint)',
}
