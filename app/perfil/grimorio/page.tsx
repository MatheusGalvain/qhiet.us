import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import GrimoireList from '@/components/trilhas/GrimoireList'
import ProfileSidebar from '@/components/perfil/ProfileSidebar'
import { getRank } from '@/lib/utils'
import { canAccess, canAccessAny, resolvePlans } from '@/lib/plans'

export const revalidate = 0

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()

  const { data: profile } = await service
    .from('profiles')
    .select('plan, plans, is_admin, name, email, xp_total')
    .eq('id', user.id)
    .single()

  const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)
  if (!canAccessAny(activePlans, 'grimorio') && !profile?.is_admin) redirect('/membros?upgrade=true')

  // Trilhas que o usuário tem progresso
  const { data: progressTrails } = await service
    .from('user_trail_progress')
    .select('trail_id')
    .eq('user_id', user.id)

  const trailIds = [...new Set((progressTrails ?? []).map((r: any) => r.trail_id))]

  let trailsData: any[] = []
  if (trailIds.length > 0) {
    const { data } = await service
      .from('trails')
      .select('id, title')
      .in('id', trailIds)
    trailsData = data ?? []
  }

  // Anotações existentes
  const { data: grimoireEntries } = await service
    .from('user_grimoire')
    .select('trail_id, content, updated_at')
    .eq('user_id', user.id)
    .not('trail_id', 'is', null)  // apenas por trilha, sem geral

  const grimoireMap: Record<string, { content: string; updated_at: string | null }> = {}
  for (const g of grimoireEntries ?? []) {
    if (g.trail_id) grimoireMap[g.trail_id] = { content: g.content ?? '', updated_at: g.updated_at }
  }

  const entries = trailsData.map((t: any) => ({
    trail_id: t.id,
    trail_title: t.title,
    content: grimoireMap[t.id]?.content ?? '',
    updated_at: grimoireMap[t.id]?.updated_at ?? null,
  }))

  return { entries, profile }
}

export default async function GrimorioPage() {
  const { entries, profile } = await getData()
  const rank = getRank(profile?.xp_total ?? 0)
  const plan = (profile as any)?.plan ?? 'profano'

  return (
    <div className="profile-layout">
      <ProfileSidebar
        name={profile?.name ?? ''}
        email={profile?.email ?? ''}
        plan={plan}
        plans={(profile as any)?.plans ?? undefined}
        isSubscriber={canAccessAny(activePlans, 'transmissoes_exclusivas')}
        rankName={rank.name}
        rankSymbol={(rank as any).symbol}
      />

      <div style={{ padding: 'clamp(28px,4vw,48px) var(--px)', minWidth: 0 }}>
        <div style={{ borderBottom: '1px solid var(--faint)', paddingBottom: 16, marginBottom: 40 }}>
          <Link
            href="/perfil"
            className="back-link"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3,
              color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none',
              marginBottom: 20, transition: 'color .15s',
            }}
          >
            ← Perfil
          </Link>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--red)', textTransform: 'uppercase', marginBottom: 8 }}>
            Exclusivo Iniciado
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,52px)', letterSpacing: 3, color: 'var(--cream)', marginBottom: 8 }}>
            GRIMÓRIO
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>
            Suas anotações pessoais por trilha — até 7500 caracteres cada. Auto-salvo enquanto você digita.
          </p>
        </div>

        <GrimoireList initialEntries={entries} />
      </div>
    </div>
  )
}
