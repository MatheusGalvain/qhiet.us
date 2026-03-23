import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Avatar from '@/components/ui/Avatar'
import Link from 'next/link'
import type { Profile } from '@/types'
import { getRank, getNextRank, RANK_THRESHOLDS, formatDatePT, formatNumber, getCategorySymbol, padNumber } from '@/lib/utils'
import type { Metadata } from 'next'
import ActivityHeatmap from '@/components/perfil/ActivityHeatmap'

export const metadata: Metadata = { title: 'Perfil' }

async function getData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  // Auto-create profile if it doesn't exist (e.g. trigger not fired, or first login)
  if (!profile) {
    const { data: created, error: createError } = await supabase
      .from('profiles')
      .upsert({
        id:    user.id,
        email: user.email ?? '',
        name:  user.user_metadata?.name ?? (user.email ?? 'Usuário').split('@')[0],
        plan:  user.user_metadata?.plan ?? 'profano',
      }, { onConflict: 'id' })
      .select()
      .single()

    if (createError || !created) {
      // Schema provavelmente não foi aplicado — redireciona com mensagem
      redirect('/login?error=schema_missing')
    }

    profile = created
  }

  const { data: xpEvents } = await supabase
    .from('xp_events')
    .select('*, transmissoes(number, title, categories)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const { data: books } = await supabase
    .from('monthly_books').select('*').order('month', { ascending: false }).limit(8)

  // Activity heatmap — fetch past year of reading history
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
  const { data: activityRows } = await supabase
    .from('reading_history')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', oneYearAgo.toISOString())

  // Build date → count map
  const activityMap: Record<string, number> = {}
  for (const row of activityRows ?? []) {
    const date = row.created_at.slice(0, 10) // YYYY-MM-DD
    activityMap[date] = (activityMap[date] ?? 0) + 1
  }
  const totalActiveDays = Object.keys(activityMap).length

  return { profile: profile as Profile, xpEvents: xpEvents ?? [], books: books ?? [], activityMap, totalActiveDays }
}

export default async function PerfilPage() {
  const { profile, xpEvents, books, activityMap, totalActiveDays } = await getData()
  const rank = getRank(profile.xp_total)
  const nextRank = getNextRank(profile.xp_total)
  const xpToNext = nextRank ? nextRank.min - profile.xp_total : 0
  const xpProgress = nextRank
    ? ((profile.xp_total - rank.min) / (nextRank.min - rank.min)) * 100
    : 100

  const sidebarLinks = [
    { href: '#xp',        label: 'XP & Rank',    icon: '✦' },
    { href: '#atividade', label: 'Atividade',     icon: '◈' },
    { href: '#historico', label: 'Histórico',     icon: '◎' },
    { href: '#livros',    label: 'Livros',         icon: '☿' },
    { href: '#config',    label: 'Configurações',  icon: '○' },
  ]

  return (
    <div className="profile-layout">

      {/* SIDEBAR / MOBILE TABS */}
      <aside className="profile-sidebar">
        {/* Identity */}
        <div className="profile-identity-mobile-hide" style={{ padding: '0 32px 32px', borderBottom: '1px solid var(--faint)', marginBottom: 8 }}>
          <div style={{ marginBottom: 14 }}>
          <Avatar name={profile.name} size="lg" />
        </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 3, color: 'var(--cream)' }}>{profile.name}</p>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: profile.is_subscriber ? 'var(--red)' : 'var(--muted)', textTransform: 'uppercase', marginTop: 4 }}>
             {(rank as any).symbol} {rank.name} · {profile.is_subscriber ? 'Iniciado' : 'Profano'}
          </span>
        </div>

        {/* Mobile identity strip (visible on mobile only) */}
        <div style={{ padding: '16px var(--px-sm) 16px', borderBottom: '1px solid var(--faint)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={profile.name} size="sm" />
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 2, color: 'var(--cream)' }}>{profile.name}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--red)', textTransform: 'uppercase', marginTop: 2 }}>
              {rank.symbol} {rank.name} · {profile.is_subscriber ? 'Iniciado' : 'Profano'}
            </p>
          </div>
        </div>

        {/* Nav / Tab bar */}
        <ul className="profile-sidebar-nav" style={{ listStyle: 'none', padding: '8px 0', flex: 1 }}>
          {sidebarLinks.map(({ href, label, icon }) => (
            <li key={href}>
              <a
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 32px',
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
                  color: 'var(--muted)', textDecoration: 'none',
                  transition: 'all .2s', borderLeft: '2px solid transparent',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--gold)', opacity: 0.5, width: 16, textAlign: 'center' }}>{icon}</span>
                {label}
              </a>
            </li>
          ))}
        </ul>

        {/* Upgrade CTA */}
        {!profile.is_subscriber && (
          <div style={{ padding: '0 32px', marginBottom: 16, marginTop: 'auto' }} className="profile-identity-mobile-hide">
            <Link href="/membros" className="btn-primary" style={{ display: 'block', textAlign: 'center', fontSize: 12, padding: '12px' }}>
              Upgrade → Iniciado
            </Link>
          </div>
        )}

        {/* Logout */}
        <div style={{ padding: '0 32px' }} className="profile-identity-mobile-hide">
          <LogoutButton />
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ padding: 'clamp(28px,4vw,48px) var(--px)' }}>

        {/* ═══ XP & RANK ═══ */}
        <section id="xp" style={{ marginBottom: 56, scrollMarginTop: 'calc(var(--nav-h) + 8px)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--faint)', paddingBottom: 16, marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,52px)', letterSpacing: 3, color: 'var(--cream)' }}>XP & RANK</h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>Posição no ranking global</p>
          </div>

          {/* XP hero */}
          <div className="xp-hero-grid">
            <div style={{ padding: 'clamp(20px,3vw,36px)', borderRight: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase' }}>Rank Atual</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,6vw,64px)', letterSpacing: 4, color: 'var(--cream)', lineHeight: 1 }}>
                {rank.name.split(' ')[0]}<br />
                <span style={{ color: 'var(--red)' }}>{rank.name.split(' ').slice(1).join(' ')}</span>
              </p>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>XP Total</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', color: 'var(--gold)', letterSpacing: 2 }}>{formatNumber(profile.xp_total)}</p>
              </div>
              {nextRank && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                    <span>{rank.name}</span>
                    <span>{nextRank.name}</span>
                  </div>
                  <div style={{ height: 3, background: 'var(--faint)' }}>
                    <div style={{ height: '100%', width: `${xpProgress}%`, background: 'var(--gold)' }} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', marginTop: 4 }}>
                    Faltam <span style={{ color: 'var(--gold)' }}>{xpToNext} XP</span> para {nextRank.name}
                  </p>
                </div>
              )}
            </div>

            <div style={{ padding: 'clamp(20px,3vw,36px)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 20 }}>Escala de Ranks</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {RANK_THRESHOLDS.map((r) => {
                  const isDone = profile.xp_total >= r.min && rank.name !== r.name
                  const isCurrent = rank.name === r.name
                  return (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--faint)' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, width: 24, textAlign: 'center', color: isDone ? 'var(--red-dim)' : isCurrent ? 'var(--gold)' : 'var(--faint)' }}>{r.symbol}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: isDone ? 'var(--muted)' : isCurrent ? 'var(--gold)' : 'var(--faint)' }}>{r.name}</p>
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, color: isCurrent ? 'var(--muted)' : 'var(--faint)' }}>{r.min} XP</p>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isDone ? 'var(--red-dim)' : isCurrent ? 'var(--gold)' : 'transparent' }}>
                        {isDone ? '✓' : isCurrent ? '→' : '○'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* XP by domain */}
          <div className="domain-xp-grid">
            {Object.entries(profile.xp_by_domain ?? {}).map(([cat, xp], i) => (
              <div key={cat} style={{ padding: 'clamp(14px,2vw,20px) clamp(14px,2vw,24px)', borderRight: i % 3 !== 2 ? '1px solid var(--faint)' : 'none', borderBottom: i < 3 ? '1px solid var(--faint)' : 'none' }}>
                <p style={{ fontSize: 18, color: 'var(--gold)', opacity: 0.5, marginBottom: 6 }}>{getCategorySymbol(cat)}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>{cat}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,28px)', color: 'var(--cream)', letterSpacing: 2 }}>{formatNumber(Number(xp))}</p>
                <div style={{ height: 2, background: 'var(--faint)', marginTop: 8 }}>
                  <div style={{ height: '100%', width: `${Math.min((Number(xp) / Math.max(profile.xp_total, 1)) * 100, 100)}%`, background: 'var(--red)' }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ ACTIVITY HEATMAP ═══ */}
        <section id="atividade" style={{ marginBottom: 56, scrollMarginTop: 'calc(var(--nav-h) + 8px)' }}>
          <ActivityHeatmap activityMap={activityMap} totalActiveDays={totalActiveDays} />
        </section>

        {/* ═══ HISTÓRICO ═══ */}
        <section id="historico" style={{ marginBottom: 56, scrollMarginTop: 'calc(var(--nav-h) + 8px)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--faint)', paddingBottom: 16, marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,52px)', letterSpacing: 3, color: 'var(--cream)' }}>HISTÓRICO</h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>Últimas {xpEvents.length} atividades</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {xpEvents.map((event: any) => (
              <div
                key={event.id}
                className="history-item"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'clamp(48px,6vw,80px) 1fr clamp(80px,12vw,160px) clamp(60px,8vw,120px)',
                  alignItems: 'center', gap: 'clamp(12px,2vw,24px)',
                  padding: 'clamp(14px,2vw,20px) 0', borderBottom: '1px solid var(--faint)',
                  transition: 'background .2s',
                }}
              >
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,32px)', color: 'var(--faint)', letterSpacing: 2 }}>
                  {event.transmissoes ? padNumber(event.transmissoes.number) : '—'}
                </span>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(14px,2vw,18px)', letterSpacing: 1, color: 'var(--cream)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {event.transmissoes?.title ?? '—'}
                  </p>
                  {event.transmissoes?.categories?.[0] && (
                    <p className="history-cat" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--red)', textTransform: 'uppercase', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: 'var(--gold)' }}>{getCategorySymbol(event.transmissoes.categories[0])}</span>
                      {event.transmissoes.categories[0]}{event.type === 'quiz' ? ' · Quiz' : ''}
                    </p>
                  )}
                </div>
                <p className="history-date" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  {formatDatePT(event.created_at)}
                </p>
                <p className="history-xp" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px,2vw,22px)', letterSpacing: 2, color: 'var(--gold)', textAlign: 'right' }}>
                  +{event.xp} <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>XP</span>
                </p>
              </div>
            ))}
            {xpEvents.length === 0 && (
              <div style={{ padding: '48px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'center' }}>
                  Nenhuma atividade ainda
                </p>
                <Link
                  href="/transmissoes"
                  className="btn-historico-cta"
                >
                  Começar a ler →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* ═══ LIVROS ═══ */}
        <section id="livros" style={{ marginBottom: 56, scrollMarginTop: 'calc(var(--nav-h) + 8px)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--faint)', paddingBottom: 16, marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,52px)', letterSpacing: 3, color: 'var(--cream)' }}>LIVROS</h2>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
              {profile.is_subscriber ? '4 livros/mês · Iniciado' : '1 livro/mês · Profano'}
            </p>
          </div>

          <div className="books-grid">
            {books.map((book: any, i: number) => (
              <div key={book.id} style={{ padding: 'clamp(16px,2vw,24px) clamp(14px,2vw,20px)', borderRight: '1px solid var(--faint)', borderBottom: '1px solid var(--faint)' }}>
                <div style={{ width: '100%', height: 140, background: 'var(--red-faint)', border: '1px solid var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)', letterSpacing: 2, textAlign: 'center', padding: 12, lineHeight: 1.8, marginBottom: 14 }}>
                  {book.title.split(' ').slice(0, 3).join('\n')}
                </div>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--cream)', marginBottom: 4 }}>{book.title}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>{book.author}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--red-dim)', textTransform: 'uppercase', marginBottom: 10 }}>{book.month}</p>
                <a href={book.file_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', padding: 8, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', textDecoration: 'none' }}>
                  Baixar →
                </a>
              </div>
            ))}
            {books.length === 0 && (
              <div style={{ gridColumn: '1/-1', padding: '32px 0' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  Nenhum livro enviado ainda.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Mobile logout */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--faint)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {!profile.is_subscriber && (
            <Link href="/membros" className="btn-primary" style={{ fontSize: 12, padding: '10px 20px' }}>Upgrade → Iniciado</Link>
          )}
          <LogoutButton />
        </div>

      </div>
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', padding: '10px 20px', cursor: 'pointer', transition: 'all .2s' }}>
        Sair
      </button>
    </form>
  )
}
