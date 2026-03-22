import { createServiceClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const revalidate = 60

async function getStats() {
  const supabase = createServiceClient()

  const [
    { count: totalUsers },
    { count: totalSubscribers },
    { count: totalTransmissoes },
    { count: totalPublished },
    { data: xpData },
    { data: recentMembers },
    { data: recentTransmissoes },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_subscriber', true),
    supabase.from('transmissoes').select('*', { count: 'exact', head: true }),
    supabase.from('transmissoes').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('profiles').select('xp_total'),
    supabase.from('profiles').select('name, email, plan, is_subscriber, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('transmissoes').select('id, number, title, status, access, created_at').order('created_at', { ascending: false }).limit(5),
  ])

  const allXp = xpData ?? []
  const avgXp = allXp.length > 0
    ? Math.round(allXp.reduce((s: number, p: { xp_total: number | null }) => s + (p.xp_total ?? 0), 0) / allXp.length)
    : 0

  return {
    totalUsers: totalUsers ?? 0,
    totalSubscribers: totalSubscribers ?? 0,
    totalTransmissoes: totalTransmissoes ?? 0,
    totalPublished: totalPublished ?? 0,
    avgXp,
    recentMembers: recentMembers ?? [],
    recentTransmissoes: recentTransmissoes ?? [],
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  const statCards = [
    { label: 'Transmissões', value: stats.totalTransmissoes, sub: `${stats.totalPublished} publicadas`, icon: '◎', href: '/admin/transmissoes' },
    { label: 'Membros',      value: stats.totalUsers,         sub: 'cadastrados',                        icon: '○', href: '/admin/membros' },
    { label: 'Assinantes',   value: stats.totalSubscribers,   sub: 'plano Iniciado ativo',               icon: '◆', href: '/admin/membros' },
    { label: 'XP Médio',     value: stats.avgXp,              sub: 'por usuário',                        icon: '✦', href: '/admin/membros' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 8 }}>
          Painel de Controle
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>
          Dashboard
        </h1>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 48 }}>
        {statCards.map(card => (
          <Link key={card.label} href={card.href} style={{ textDecoration: 'none' }}>
            <div style={{
              border: '1px solid var(--faint)',
              padding: '24px 24px',
              background: 'var(--surface)',
              transition: 'border-color .15s',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)' }}>
                  {card.label}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--red)', opacity: 0.6 }}>
                  {card.icon}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 52, letterSpacing: 1, color: 'var(--cream)', lineHeight: 1, marginBottom: 6 }}>
                {card.value.toLocaleString('pt-BR')}
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
                {card.sub}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Two-column: recent transmissoes + recent members */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

        {/* Recent Transmissões */}
        <div style={{ border: '1px solid var(--faint)', padding: '28px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)' }}>
              Últimas Transmissões
            </span>
            <Link href="/admin/transmissoes/nova" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--red)', textDecoration: 'none' }}>
              + Nova
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.recentTransmissoes.length === 0 && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Nenhuma transmissão ainda.</p>
            )}
            {stats.recentTransmissoes.map((t: any) => (
              <Link key={t.id} href={`/admin/transmissoes/${t.id}/editar`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--faint)' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--cream)' }}>
                  {t.title}
                </span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${t.status === 'published' ? 'var(--gold)' : 'var(--faint)'}`, color: t.status === 'published' ? 'var(--gold)' : 'var(--muted)' }}>
                    {t.status === 'published' ? 'publicado' : 'rascunho'}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${t.access === 'free' ? 'var(--faint)' : 'var(--red-dim)'}`, color: t.access === 'free' ? 'var(--muted)' : 'var(--red)' }}>
                    {t.access === 'free' ? 'livre' : 'assinante'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Members */}
        <div style={{ border: '1px solid var(--faint)', padding: '28px 28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)' }}>
              Últimos Membros
            </span>
            <Link href="/admin/membros" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--red)', textDecoration: 'none' }}>
              Ver todos
            </Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {stats.recentMembers.length === 0 && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>Nenhum membro ainda.</p>
            )}
            {stats.recentMembers.map((m: any) => (
              <div key={m.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--faint)' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--cream)', marginBottom: 2 }}>{m.name}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 1, color: 'var(--muted)' }}>{m.email}</p>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, letterSpacing: 2, textTransform: 'uppercase', padding: '3px 8px', border: `1px solid ${m.is_subscriber ? 'var(--gold)' : 'var(--faint)'}`, color: m.is_subscriber ? 'var(--gold)' : 'var(--muted)' }}>
                  {m.plan}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
