import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'
import GrimoireList from '@/components/trilhas/GrimoireList'
import ProfileSidebar from '@/components/perfil/ProfileSidebar'
import { getRank } from '@/lib/utils'
import { canAccessAny, resolvePlans } from '@/lib/plans'

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

  // Busca todas as anotações do usuário com info da trilha
  const { data: grimoireRows } = await service
    .from('user_grimoire')
    .select('trail_id, content, updated_at')
    .eq('user_id', user.id)
    .not('content', 'eq', '')
    .order('updated_at', { ascending: false })

  // Busca títulos das trilhas
  const trailIds = [...new Set((grimoireRows ?? []).map((r: any) => r.trail_id).filter(Boolean))]

  let trailTitles: Record<string, string> = {}
  if (trailIds.length > 0) {
    const { data: trails } = await service
      .from('trails')
      .select('id, title')
      .in('id', trailIds)
    for (const t of trails ?? []) {
      trailTitles[t.id] = t.title
    }
  }

  const entries = (grimoireRows ?? [])
    .filter((r: any) => r.trail_id && r.content?.trim())
    .map((r: any) => ({
      trail_id: r.trail_id,
      trail_title: trailTitles[r.trail_id] ?? 'Trilha',
      content: r.content ?? '',
      updated_at: r.updated_at ?? null,
    }))

  return { entries, profile, activePlans }
}

export default async function GrimorioPage() {
  const { entries, profile, activePlans } = await getData()
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
            Suas anotações pessoais por trilha — auto-salvo enquanto você digita.
          </p>
        </div>

        <GrimoireList initialEntries={entries} />
      </div>
    </div>
  )
}
