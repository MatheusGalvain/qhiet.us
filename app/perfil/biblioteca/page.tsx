import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { canAccess, canAccessAny, resolvePlans } from '@/lib/plans'
import ProfileSidebar from '@/components/perfil/ProfileSidebar'
import { getRank } from '@/lib/utils'
import Link from 'next/link'
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

  // Books the user has opened (has progress entry)
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
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--faint)', paddingBottom: 16, marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,48px)', letterSpacing: 3, color: 'var(--cream)' }}>
            ◈ BIBLIOTECA
          </h2>
          <Link href="/biblioteca" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none' }}>
            Ver acervo completo →
          </Link>
        </div>

        {books.length === 0 ? (
          <div style={{ padding: '48px 0' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16 }}>
              Nenhum livro aberto ainda.
            </p>
            <Link href="/biblioteca" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--red)', textTransform: 'uppercase', textDecoration: 'none' }}>
              Explorar biblioteca →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {books.map((book: any) => {
              const prog = progressMap[book.id]
              const pct = prog?.total_pages > 0
                ? Math.round((prog.current_page / prog.total_pages) * 100)
                : 0
              const lastRead = prog?.last_read_at
                ? new Date(prog.last_read_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
                : ''

              return (
                <div key={book.id} style={{
                  display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0',
                  borderBottom: '1px solid var(--faint)', flexWrap: 'wrap',
                }}>
                  {/* Cover */}
                  <div style={{ width: 52, height: 72, flexShrink: 0, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--faint)' }}>
                    {book.cover_url
                      ? <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--faint)' }}>◉</div>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 17, color: 'var(--cream)', marginBottom: 4 }}>{book.title}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>{book.author}</p>

                    {/* Progress bar */}
                    {prog?.total_pages > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ height: 2, background: 'var(--faint)', borderRadius: 1, overflow: 'hidden', maxWidth: 240 }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--red)' }} />
                        </div>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--muted)', marginTop: 4 }}>
                          Pág. {prog.current_page} de {prog.total_pages} · {pct}%
                        </p>
                      </div>
                    )}

                    {lastRead && (
                      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--cream-dim)' }}>
                        Último acesso: {lastRead}
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/biblioteca/${book.id}`}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
                      padding: '10px 18px', border: '1px solid var(--red-dim)', color: 'var(--red)',
                      textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
                    }}
                  >
                    {prog?.current_page > 1 ? 'Continuar lendo →' : 'Começar leitura →'}
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
