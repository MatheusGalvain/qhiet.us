import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'
import Link from 'next/link'
import HermesBot from '@/components/layout/HermesBot'
import type { Metadata } from 'next'
import BibliotecaShell from '@/components/biblioteca/BibliotecaShell'

export const revalidate = 0
export const metadata: Metadata = { title: 'Biblioteca', description: 'Acervo de livros esotéricos em PDF — Hermetismo, Cabala, Alquimia, Tarot e mais.' }

async function getData(category?: string) {
  const supabase = await createClient()
  const service  = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userId: string | null = null
  let hasAccess = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('plan, plans').eq('id', user.id).single()
    userId = user.id
    const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)
    hasAccess = canAccessAny(activePlans, 'acervo')
  }

  let query = service
    .from('biblioteca')
    .select('id, title, author, year, category, era, description, cover_url, is_published')
    .eq('is_published', true)

  if (category && category !== 'Todos' && category !== 'Recentes') {
    query = query.ilike('category', category)
  }

  let books: any[]
  if (category === 'Recentes') {
    const { data } = await query.order('created_at', { ascending: false }).limit(5)
    books = data ?? []
  } else {
    const { data } = await query.order('order_index', { ascending: true }).order('created_at', { ascending: false })
    books = data ?? []
  }

  let progress: Record<string, { current_page: number; total_pages: number }> = {}
  if (userId && hasAccess) {
    const { data: progressRows } = await service
      .from('biblioteca_progress')
      .select('book_id, current_page, total_pages')
      .eq('user_id', userId)
    for (const row of progressRows ?? []) {
      progress[row.book_id] = { current_page: row.current_page, total_pages: row.total_pages }
    }
  }

  // Categorias dinâmicas do banco
  const { data: catRows } = await service
    .from('biblioteca_categorias')
    .select('name')
    .order('order_index', { ascending: true })
    .order('name', { ascending: true })
  const categories = (catRows ?? []).map((r: any) => r.name as string)

  const { count: totalBooks } = await service
    .from('biblioteca')
    .select('*', { count: 'exact', head: true })
    .eq('is_published', true)

  return { books, hasAccess, userId, progress, totalBooks: totalBooks ?? 0, categories }
}

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: { cat?: string }
}) {
  const category = searchParams?.cat ?? 'Todos'
  const { books, hasAccess, userId, progress, totalBooks, categories } = await getData(category)

  return (
    <>
      {/* HEADER */}
      <div style={{ padding: 'clamp(32px,5vw,56px) var(--px) 0' }}>
        <p className="eyebrow" style={{ marginBottom: 12 }}>Acervo · Biblioteca Esotérica</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,7vw,80px)', letterSpacing: 3, color: 'var(--cream)', lineHeight: 1 }}>
            BIBLIOTECA
          </h1>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,48px)', color: 'var(--red)', letterSpacing: 2, lineHeight: 1 }}>
              {totalBooks}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
              obras disponíveis
            </p>
          </div>
        </div>

        {/* Plan gate banner */}
        {!hasAccess && (
          <div style={{
            padding: '16px 20px', marginBottom: 24,
            border: '1px solid var(--gold-dim)', background: 'rgba(130,111,18,.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 4 }}>
                ✦ Conteúdo Bloqueado
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)' }}>
                Assine o plano <strong style={{ color: 'var(--gold)' }}>Acervo</strong> ou <strong style={{ color: 'var(--gold)' }}>Adepto</strong> para acessar todos os PDFs.
              </p>
            </div>
            <Link href="/membros" style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
              padding: '10px 20px', background: 'var(--gold)', color: '#000', textDecoration: 'none',
            }}>
              Consulte nossos planos →
            </Link>
          </div>
        )}
      </div>

      {/* NAV + SEARCH + GRID — client shell (compartilha estado de busca) */}
      <BibliotecaShell
        books={books}
        hasAccess={hasAccess}
        userId={userId}
        progress={progress}
        category={category}
        isRecentes={category === 'Recentes'}
        categories={categories}
      />

      <HermesBot message="Parabéns por ter chegado até aqui, absorva todo conhecimento necessário com o nosso acervo! :)" />
    </>
  )
}
