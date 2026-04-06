import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccess, canAccessAny, resolvePlans } from '@/lib/plans'
import Link from 'next/link'
import HermesBot from '@/components/layout/HermesBot'
import type { Metadata } from 'next'
import BibliotecaGrid from '@/components/biblioteca/BibliotecaGrid'

export const revalidate = 0
export const metadata: Metadata = { title: 'Biblioteca', description: 'Acervo de livros esotéricos em PDF — Hermetismo, Cabala, Alquimia, Tarot e mais.' }

const CATEGORIES = ['Todos', 'Recentes', 'Hermetismo', 'Cabala', 'Gnosticismo', 'Alquimia', 'Tarot', 'Rosacruz']

async function getData(category?: string) {
  const supabase = await createClient()
  const service  = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user plan — select both columns for multi-plan support
  let userPlan = 'profano'
  let userId: string | null = null
  let hasAccess = false
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('plan, plans').eq('id', user.id).single()
    userPlan = (profile as any)?.plan ?? 'profano'
    userId = user.id
    const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)
    hasAccess = canAccessAny(activePlans, 'acervo')
  }

  // Build books query — always show all published books (blur non-accessible)
  let query = service.from('biblioteca').select('id, title, author, year, category, era, description, cover_url, is_published').eq('is_published', true)

  if (category && category !== 'Todos' && category !== 'Recentes') {
    query = query.ilike('category', category)
  }
  if (category === 'Recentes') {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    query = query.gte('created_at', thirtyDaysAgo)
  }

  const { data: books } = await query.order('order_index', { ascending: true }).order('created_at', { ascending: false })

  // User reading progress
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

  const { count: totalBooks } = await service.from('biblioteca').select('*', { count: 'exact', head: true }).eq('is_published', true)

  return { books: books ?? [], hasAccess, userPlan, userId, progress, totalBooks: totalBooks ?? 0 }
}

export default async function BibliotecaPage({
  searchParams,
}: {
  searchParams: { cat?: string }
}) {
  const category = searchParams?.cat ?? 'Todos'
  const { books, hasAccess, userPlan, userId, progress, totalBooks } = await getData(category)

  return (
    <>
      {/* HEADER */}
      <div style={{ borderBottom: '1px solid var(--faint)', padding: 'clamp(32px,5vw,56px) var(--px) 0' }}>
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

        {/* Category tabs */}
        <nav style={{ display: 'flex', gap: 0, overflowX: 'auto', borderTop: '1px solid var(--faint)' }}>
          {CATEGORIES.map(cat => (
            <Link
              key={cat}
              href={`/biblioteca?cat=${cat}`}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                padding: '14px 20px', whiteSpace: 'nowrap', textDecoration: 'none',
                color: category === cat ? 'var(--cream)' : 'var(--muted)',
                borderBottom: category === cat ? '2px solid var(--red)' : '2px solid transparent',
                transition: 'color .15s',
              }}
            >
              {cat}
            </Link>
          ))}
        </nav>
      </div>

      {/* GRID */}
      <div style={{ padding: 'clamp(24px,4vw,48px) var(--px)' }}>
        <BibliotecaGrid
          books={books}
          hasAccess={hasAccess}
          userId={userId}
          prog