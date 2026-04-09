import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'
import ProfileSidebar from '@/components/perfil/ProfileSidebar'
import BibliotecaProgressList from '@/components/perfil/BibliotecaProgressList'
import { getRank } from '@/lib/utils'
import type { Metadata } from 'next'

export const revalidate = 0
export const metadata: Metadata = { title: 'Minha Biblioteca' }

async function getData() {
  const supabase = await createClient()
  const service  = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await service
    .from('profiles')
    .select('plan, plans, is_admin, name, email, xp_total')
    .eq('id', user.id)
    .single()

  const plan = (profile as any)?.plan ?? 'profano'
  const activePlans = resolvePlans((profile as any)?.plans, plan)

  if (!canAccessAny(activePlans, 'acervo') && !(profile as any)?.is_admin) {
    redirect('/membros?upgrade=acervo')
  }

  const { data: progressRows } = await service
    .from('biblioteca_progress')
    .select('book_id, current_page, total_pages, last_read_at')
    .eq('user_id', user.id)
    .order('last_read_at', { ascending: false })

  const bookIds = (progressRows ?? []).map((r: any) => r.book_id)
  let books: any[] = []
  if (bookIds.length > 0) {
    const { data } = await service
      .from('biblioteca')
      .select('id, title, author, year, category, cover_url')
      .in('id', bookIds)
      .eq('is_published', true)
    books = data ?? []
    // preserve last_read_at order
    books.sort((a, b) => bookIds.indexOf(a.id) - bookIds.indexOf(b.id))
  }

  const progressMap: Record<string, { current_page: number; total_pages: number; last_read_at: string }> = {}
  for (const row of progressRows ?? []) {
    progressMap[row.book_id] = row
  }

  return { profile, books, progressMap, userId: user.id, plan, activePlans }
}

export default async function PerfilBibliotecaPage() {
  const { profile, books, progressMap, plan, activePlans } = await getData()
  const rank = getRank((profile as any)?.xp_total ?? 0)

  return (
    <div className="profile-layout">
      <ProfileSidebar
        name={(profile as any)?.name ?? ''}
        email={(profile as any)?.email ?? ''}
        plan={plan}
        plans={(profile as any)?.plans ?? undefined}
        isSubscriber={canAccessAny(activePlans, 'transmissoes_exclusivas')}
        rankName={rank.name}
        rankSymbol={(rank as any).symbol}
      />

      <div style={{ padding: 'clamp(28px,4vw,48px) var(--px)', minWidth: 0 }}>

        {/* Header */}
        <div style={{ borderBottom: '1px solid var(--faint)', paddingBottom: 20, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,48px)', letterSpacing: 3, color: 'var(--cream)' }}>
              ◈ EM LEITURA
            </h2>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
              {books.length} {books.length === 1 ? 'obra' : 'obras'}
            </span>
          </div>

          {/* Ver acervo completo — destaque (via BibliotecaProgressList que é client) */}
          <a
            href="/biblioteca"
            className="btn-acervo-gold"
          >
            <span style={{ fontSize: 14 }}>◈</span>
            Ver acervo completo
            <span style={{ fontSize: 13 }}>→</span>
          </a>
        </div>

        {/* Reading list */}
        <BibliotecaProgressList
          initialBooks={books}
          initialProgress={progressMap}
        />

      </div>
    </div>
  )
}
