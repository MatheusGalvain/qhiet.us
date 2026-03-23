import { createServiceClient } from '@/lib/supabase/server'
import { getRank } from '@/types'

export const revalidate = 0

export default async function AdminMembrosPage() {
  const supabase = createServiceClient()
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, email, plan, is_subscriber, is_admin, xp_total, created_at')
    .order('created_at', { ascending: false })

  const list = profiles ?? []
 const totalSubscribers = list.filter((p: any) => p.is_subscriber).length
  const totalXp = list.reduce((s: number, p: any) => s + (p.xp_total ?? 0), 0)
  const avgXp = list.length > 0 ? Math.round(totalXp / list.length) : 0

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 8 }}>
          Usuários
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>
          Membros
        </h1>
      </div>

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 40 }}>
        {[
          { label: 'Total',       value: list.length },
          { label: 'Assinantes',  value: totalSubscribers },
          { label: 'XP Médio',    value: avgXp },
        ].map(s => (
          <div key={s.label} style={{ border: '1px solid var(--faint)', padding: '20px 24px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8 }}>{s.label}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 1, color: 'var(--cream)', lineHeight: 1 }}>
              {s.value.toLocaleString('pt-BR')}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--faint)' }}>
        {/* Head */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 120px 100px 100px 80px', gap: 0, padding: '10px 20px', borderBottom: '1px solid var(--faint)', background: 'rgba(255,255,255,0.02)' }}>
          {['Membro', 'E-mail', 'Plano', 'XP Total', 'Rank', 'Cadastro'].map(h => (
            <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)' }}>{h}</span>
          ))}
        </div>

        {list.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Nenhum membro cadastrado ainda.</p>
          </div>
        )}

        {list.map((p: any, i: number) => {
          const rank = getRank(p.xp_total ?? 0)
          const date = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

          return (
            <div
              key={p.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 220px 120px 100px 100px 80px',
                gap: 0,
                padding: '14px 20px',
                borderBottom: i < list.length - 1 ? '1px solid var(--faint)' : 'none',
                alignItems: 'center',
              }}
            >
              {/* Name + admin badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--red-faint)', border: '1px solid var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, letterSpacing: 1, color: 'var(--red)' }}>
                    {(p.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--cream)', display: 'block' }}>
                    {p.name || '—'}
                  </span>
                  {p.is_admin && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>admin</span>
                  )}
                </div>
              </div>

              {/* Email */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 0.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.email}
              </span>

              {/* Plan */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', padding: '3px 10px', border: `1px solid ${p.is_subscriber ? 'var(--gold)' : 'var(--faint)'}`, color: p.is_subscriber ? 'var(--gold)' : 'var(--muted)', display: 'inline-block' }}>
                {p.plan}
              </span>

              {/* XP */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--cream)' }}>
                {(p.xp_total ?? 0).toLocaleString('pt-BR')}
              </span>

              {/* Rank */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, color: 'var(--muted)' }}>
                {rank.symbol} {rank.name}
              </span>

              {/* Date */}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>
                {date}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
