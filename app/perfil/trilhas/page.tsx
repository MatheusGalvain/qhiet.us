import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { getCategoryLabelMap, resolveCategoryLabel } from '@/lib/getCategoryLabelMap'

export const revalidate = 0

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('is_subscriber, is_admin')
    .eq('id', user.id)
    .single()

  const isSubscriber = profile?.is_subscriber || profile?.is_admin || false

  // Trails visíveis: is_free=true para todos; premium só para assinantes
  const { data: allTrails } = await service
    .from('trails')
    .select('*, trail_transmissoes(id)')
    .eq('is_published', true)
    .order('order_index')

  // Filtra: free trails para todos; premium só se assinante
  const trails = (allTrails ?? []).filter((t: any) => t.is_free || isSubscriber)

  const [
    { data: progressRows },
    { data: completions },
  ] = await Promise.all([
    service
      .from('user_trail_progress')
      .select('trail_id, transmissao_id')
      .eq('user_id', user.id),
    service
      .from('user_trail_completions')
      .select('trail_id, xp_earned, completed_at')
      .eq('user_id', user.id),
  ])

  // Build progress map
  const progressMap: Record<string, Set<string>> = {}
  for (const row of progressRows ?? []) {
    if (!progressMap[row.trail_id]) progressMap[row.trail_id] = new Set()
    progressMap[row.trail_id].add(row.transmissao_id)
  }

  const completedTrails = new Set((completions ?? []).map((c: any) => c.trail_id))

  // Premium trails locked to non-subscribers
  const premiumLocked = !isSubscriber ? (allTrails ?? []).filter((t: any) => !t.is_free) : []

  return { trails, progressMap, completedTrails, userId: user.id, isSubscriber, premiumLocked }
}

export default async function TrilhasPage() {
  const { trails, progressMap, completedTrails, isSubscriber, premiumLocked } = await getData()
  const labelMap = await getCategoryLabelMap()

  const allCategories = (trail: any): string[] => {
    const cats = trail.categories ?? []
    return cats.length > 0 ? cats : (trail.category ? [trail.category] : [])
  }

  const inProgressTrails = trails.filter((t: any) =>
    (progressMap[t.id]?.size ?? 0) > 0 && !completedTrails.has(t.id)
  )

  return (
    <div style={{ padding: 'clamp(28px,4vw,48px) var(--px)' }}>
      <div style={{ borderBottom: '1px solid var(--faint)', paddingBottom: 16, marginBottom: 40 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--red)', textTransform: 'uppercase', marginBottom: 8 }}>
          {isSubscriber ? 'Exclusivo Iniciado' : 'Trilhas'}
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,52px)', letterSpacing: 3, color: 'var(--cream)' }}>
          TRILHAS DE INICIAÇÃO
        </h1>
        {!isSubscriber && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginTop: 10, maxWidth: 520 }}>
            A trilha de boas-vindas está disponível para você explorar. Trilhas avançadas são exclusivas para Iniciados.
          </p>
        )}
      </div>

      {trails.length === 0 && premiumLocked.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--muted)', letterSpacing: 2 }}>
            Nenhuma trilha publicada ainda.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Em andamento ── */}
          {inProgressTrails.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, letterSpacing: 3, color: 'var(--cream)', textTransform: 'uppercase', marginBottom: 16 }}>
                — Em andamento
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {inProgressTrails.map((trail: any) => {
                  const txList = trail.trail_transmissoes ?? []
                  const total = txList.length
                  const done = progressMap[trail.id]?.size ?? 0
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0
                  const cats = allCategories(trail)
                  return (
                    <div
                      key={trail.id}
                      style={{
                        border: '1px solid var(--red-dim)',
                        background: 'rgba(180,30,20,0.03)',
                        padding: 'clamp(16px,2vw,24px)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            {cats.map((cat: string) => (
                              <span key={cat} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', border: '1px solid var(--faint)', padding: '2px 8px' }}>
                                {resolveCategoryLabel(cat, labelMap)}
                              </span>
                            ))}
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--red)', textTransform: 'uppercase', border: '1px solid var(--red-dim)', padding: '2px 8px' }}>
                              ◎ Em andamento
                            </span>
                          </div>
                          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,24px)', letterSpacing: 2, color: 'var(--cream)', marginBottom: 10, lineHeight: 1.2 }}>
                            {trail.title}
                          </h3>
                          <div style={{ maxWidth: 380 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                              <span>{done} de {total} transmissões</span>
                              <span>{pct}%</span>
                            </div>
                            <div style={{ height: 2, background: 'var(--faint)' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: 'var(--red)', transition: 'width .5s ease' }} />
                            </div>
                          </div>
                        </div>
                        <Link href={`/perfil/trilhas/${trail.id}`} className="btn-primary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                          Continuar →
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ borderBottom: '1px solid var(--faint)', marginTop: 28 }} />
            </div>
          )}

          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, letterSpacing: 3, color: 'var(--cream)', textTransform: 'uppercase', marginBottom: 16 }}>
              — Trilhas Disponíveis
          </p>
          {/* Free + subscriber trails */}
          {trails.map((trail: any) => {
            const txList = trail.trail_transmissoes ?? []
            const total  = txList.length
            const done   = progressMap[trail.id]?.size ?? 0
            const pct    = total > 0 ? Math.round((done / total) * 100) : 0
            const isCompleted = completedTrails.has(trail.id)
            const txPerWeek = total > 0 ? Math.ceil(total / Math.ceil(trail.duration_days / 7)) : 0
            const cats = allCategories(trail)
            const isFree = trail.is_free

            return (
              <div
                key={trail.id}
                style={{
                  border: `1px solid ${isCompleted ? 'var(--gold-dim)' : 'var(--faint)'}`,
                  background: isCompleted ? 'rgba(200,150,10,0.04)' : 'transparent',
                  padding: 'clamp(20px,3vw,32px)',
                }}
              >
                {total > 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
                    color: 'var(--muted)', textTransform: 'uppercase',
                    marginBottom: 20,
                  }}>
                    <span style={{ color: isFree ? 'var(--muted)' : 'var(--gold)', opacity: 0.6 }}>
                      {isFree ? '○' : '◈'}
                    </span>
                    {isFree
                      ? 'Trilha gratuita — aberta a todos'
                      : `Trilha para ${trail.duration_days} dias — ~${txPerWeek} transmis${txPerWeek > 1 ? 'sões' : 'são'}/semana`}
                  </div>
                )}
              
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    {/* Categories + completed badge */}
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                      {cats.map((cat: string) => (
                        <span key={cat} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', border: '1px solid var(--faint)', padding: '2px 8px' }}>
                          {resolveCategoryLabel(cat, labelMap)}
                        </span>
                      ))}
                      {isFree && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', border: '1px solid var(--faint)', padding: '2px 8px' }}>
                          Gratuita
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', border: '1px solid var(--gold-dim)', padding: '2px 8px' }}>
                          ✦ Concluída
                        </span>
                      )}
                    </div>

                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,30px)', letterSpacing: 2, color: 'var(--cream)', marginBottom: 8, lineHeight: 1.2 }}>
                      {trail.title}
                    </h2>

                    {trail.description && (
                      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16 }}>
                        {trail.description}
                      </p>
                    )}

                    {/* Progress */}
                    <div style={{ marginBottom: 16, maxWidth: 400 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                        <span>{done} de {total} transmissões</span>
                        <span>{pct}%</span>
                      </div>
                      <div style={{ height: 2, background: 'var(--faint)' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isCompleted ? 'var(--gold)' : 'var(--red)', transition: 'width .5s ease' }} />
                      </div>
                    </div>

                    {/* XP badge */}
                    {!isFree && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
                        color: isCompleted ? 'var(--gold)' : 'var(--cream)',
                        textTransform: 'uppercase',
                        border: `1px solid ${isCompleted ? 'var(--gold-dim)' : 'var(--faint)'}`,
                        padding: '4px 12px',
                      }}>
                        {isCompleted ? '✦' : '🔒'} {trail.xp_reward} XP
                        {!isCompleted && <span style={{ fontSize: 9, opacity: 0.6 }}>ao concluir</span>}
                      </div>
                    )}
                    {isFree && trail.xp_reward > 0 && (
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
                        color: isCompleted ? 'var(--gold)' : 'var(--cream)',
                        textTransform: 'uppercase',
                        border: `1px solid ${isCompleted ? 'var(--gold-dim)' : 'var(--faint)'}`,
                        padding: '4px 12px',
                      }}>
                        {isCompleted ? '✦' : '○'} {trail.xp_reward} XP
                        {!isCompleted && <span style={{ fontSize: 9, opacity: 0.6 }}>ao concluir</span>}
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end' }}>
                    <Link
                      href={`/perfil/trilhas/${trail.id}`}
                      className="btn-primary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {done === 0 ? 'Iniciar trilha →' : isCompleted ? 'Ver trilha →' : 'Continuar →'}
                    </Link>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
                      {total} transmissões{!isFree ? ` · ${trail.duration_days}d` : ''}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Locked premium trails preview (non-subscribers) */}
          {premiumLocked.length > 0 && (
            <>
              <div style={{ marginTop: 20, marginBottom: 12 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  — Exclusivo Iniciado
                </p>
              </div>

              {premiumLocked.slice(0, 3).map((trail: any) => {
                const cats = allCategories(trail)
                return (
                  <div
                    key={trail.id}
                    style={{
                      border: '1px solid var(--faint)',
                      padding: 'clamp(20px,3vw,32px)',
                      opacity: 0.6,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Lock overlay */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to right, transparent 60%, var(--bg) 100%)',
                      pointerEvents: 'none',
                    }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 240 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
                          {cats.map((cat: string) => (
                            <span key={cat} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', border: '1px solid var(--faint)', padding: '2px 8px' }}>
                              {resolveCategoryLabel(cat, labelMap)}
                            </span>
                          ))}
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--faint)', textTransform: 'uppercase', border: '1px solid var(--faint)', padding: '2px 8px' }}>
                            🔒 Iniciado
                          </span>
                        </div>
                        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3vw,28px)', letterSpacing: 2, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.2 }}>
                          {trail.title}
                        </h2>
                        {trail.description && (
                          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--faint)', lineHeight: 1.6, maxWidth: 400 }}>
                            {trail.description.slice(0, 120)}{trail.description.length > 120 ? '…' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {premiumLocked.length > 3 && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--faint)', textTransform: 'uppercase', textAlign: 'center' }}>
                  + {premiumLocked.length - 3} trilhas adicionais exclusivas
                </p>
              )}

              {/* Upgrade CTA */}
              <div style={{
                border: '1px solid var(--gold-dim)',
                padding: '32px',
                textAlign: 'center',
                background: 'rgba(200,150,10,0.03)',
                marginTop: 12,
              }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 12 }}>
                  Acesso Completo
                </p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--cream)', letterSpacing: 2, marginBottom: 10 }}>
                  Torne-se Iniciado
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24, maxWidth: 440, margin: '0 auto 24px' }}>
                  Desbloqueie todas as trilhas, o Grimório e o arquivo completo de Transmissões.
                </p>
                <Link href="/assinar" className="btn-primary">
                  Ver planos →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
    