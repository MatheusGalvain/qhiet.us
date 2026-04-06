import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getCategoryLabelMap, resolveCategoryLabel } from '@/lib/getCategoryLabelMap'
import TrailMap from '@/components/trilhas/TrailMap'
import Link from 'next/link'
import { canAccessAny, resolvePlans } from '@/lib/plans'

export const revalidate = 0

async function getData(trailId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  // Fetch trail first (to check is_free)
  const { data: trail } = await service
    .from('trails')
    .select('*')
    .eq('id', trailId)
    .eq('is_published', true)
    .single()

  if (!trail) notFound()

  // Security: non-free trails require subscription
  const { data: profile } = await service
    .from('profiles')
    .select('plan, plans, is_admin')
    .eq('id', user.id)
    .single()

  const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)
  const isSubscriber = canAccessAny(activePlans, 'trilhas') || profile?.is_admin || false

  if (!trail.is_free && !canAccessAny(activePlans, 'trilhas') && !profile?.is_admin) {
    // User tried to access a premium trail directly — redirect to listing
    redirect('/perfil/trilhas')
  }

  const [txRes, progressRes, completionRes] = await Promise.all([
    service.from('trail_transmissoes').select('*').eq('trail_id', trailId).order('order_index'),
    service.from('user_trail_progress').select('transmissao_id').eq('user_id', user.id).eq('trail_id', trailId),
    service.from('user_trail_completions').select('id, xp_earned').eq('user_id', user.id).eq('trail_id', trailId).single(),
  ])

  const completedSet = new Set<string>((progressRes.data ?? []).map((r: any) => r.transmissao_id as string))

  return {
    trail,
    transmissoes: txRes.data ?? [],
    completedSet,
    isTrailCompleted: !!completionRes.data,
    xpEarned: completionRes.data?.xp_earned ?? 0,
    userId: user.id,
    isSubscriber,
  }
}

export default async function TrailDetailPage({ params }: { params: { id: string } }) {
  const { trail, transmissoes, completedSet, isTrailCompleted, xpEarned, isSubscriber } = await getData(params.id)
  const labelMap = await getCategoryLabelMap()

  const txPerWeek = transmissoes.length > 0
    ? Math.ceil(transmissoes.length / Math.ceil(trail.duration_days / 7))
    : 0

  const categories: string[] = trail.categories?.length > 0
    ? trail.categories
    : (trail.category ? [trail.category] : [])

  return (
    <div style={{ padding: 'clamp(28px,4vw,48px) var(--px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <a href="/perfil/trilhas" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          ← Trilhas
        </a>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          {categories.map((cat: string) => (
            <span key={cat} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', border: '1px solid var(--faint)', padding: '2px 8px' }}>
              {resolveCategoryLabel(cat, labelMap)}
            </span>
          ))}
          {trail.is_free && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', border: '1px solid var(--faint)', padding: '2px 8px' }}>
              Gratuita
            </span>
          )}
          {isTrailCompleted && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', border: '1px solid var(--gold-dim)', padding: '2px 8px' }}>
              ✦ Trilha concluída — {xpEarned} XP
            </span>
          )}
        </div>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,52px)', letterSpacing: 3, color: 'var(--cream)', marginBottom: 12 }}>
          {trail.title}
        </h1>

        {trail.description && (
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7 }}>
            {trail.description}
          </p>
        )}

        {/* Info banner */}
        {transmissoes.length > 0 && (
          <div style={{
            marginTop: 20,
            display: 'inline-flex', alignItems: 'center', gap: 10,
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
            color: 'var(--muted)', textTransform: 'uppercase',
            border: '1px solid var(--faint)', padding: '8px 16px',
          }}>
            <span style={{ color: 'var(--gold)', opacity: 0.7 }}>◈</span>
            {trail.is_free
              ? `${transmissoes.length} transmissões`
              : `Tempo estimado para conclusão e liberação de XP ${trail.duration_days} dias ·`
            }
            <span style={{ color: 'var(--faint)' }}>·</span>
            {isTrailCompleted ? (
              <span style={{ color: 'var(--gold)' }}>✦ {xpEarned} XP obtidos</span>
            ) : (
              <span>{trail.is_free ? '○' : '🔒'} {trail.xp_reward} XP ao concluir</span>
            )}
          </div>
        )}

        {/* Grimoire CTA for non-subscribers on free trails */}
        {trail.is_free && !isSubscriber && (
          <div style={{ marginTop: 20, padding: '14px 20px', border: '1px solid var(--faint)', background: 'rgba(200,150,10,0.02)', display: 'inline-flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
              ◈ Grimório disponível para Iniciados
            </span>
            <Link href="/membros" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', textDecoration: 'none' }}>
              Consulte nossos planos →
            </Link>
          </div>
        )}
      </div>

      {/* Trail Map */}
      <TrailMap
        trail={trail}
        transmissoes={transmissoes}
        completedSet={Array.from(completedSet)}
        isTrailCompleted={isTrailCompleted}
        isSubscriber={isSubscriber}
      />
    </div>
  )
}
