import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Profile } from '@/types'
import { getRank, getNextRank, RANK_THRESHOLDS, formatDatePT, formatNumber, getCategorySymbol, padNumber } from '@/lib/utils'
import type { Metadata } from 'next'
import ActivityHeatmap from '@/components/perfil/ActivityHeatmap'
import NickForm from '@/components/perfil/NickForm'
import ProfileSidebar from '@/components/perfil/ProfileSidebar'
import BillingPortalButton from '@/components/perfil/BillingPortalButton'

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
        plan:  'profano', // Always start unpaid — Stripe webhook sets actual plan
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

  // Activity heatmap — fetch reading history from Jan 1 to Dec 31 of current year
  const currentYear = new Date().getFullYear()
  const yearStart = new Date(currentYear, 0, 1).toISOString()
  const yearEnd   = new Date(currentYear, 11, 31, 23, 59, 59).toISOString()
  const { data: activityRows } = await supabase
    .from('reading_history')
    .select('created_at')
    .eq('user_id', user.id)
    .gte('created_at', yearStart)
    .lte('created_at', yearEnd)

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

  return (
    <div className="profile-layout">

      {/* SIDEBAR */}
      <ProfileSidebar
        name={profile.name}
        email={profile.email}
        isSubscriber={profile.is_subscriber}
        rankName={rank.name}
        rankSymbol={(rank as any).symbol}
      />

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
            {books.map((book: any) => (
              <a
                key={book.id}
                href={book.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="book-card-link"
              >
                {/* Cover */}
                <div style={{ width: '100%', aspectRatio: '2/3', marginBottom: 14, overflow: 'hidden', flexShrink: 0 }}>
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--red-faint)', border: '1px solid var(--red-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: 2, textAlign: 'center', padding: 12, lineHeight: 2 }}>
                      {book.title.split(' ').slice(0, 4).join(' ')}
                    </div>
                  )}
                </div>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 15, color: 'var(--cream)', marginBottom: 4, flex: 1 }}>{book.title}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 4 }}>{book.author}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--red-dim)', textTransform: 'uppercase', marginBottom: 10 }}>{book.month}</p>
                <span style={{ display: 'block', width: '100%', padding: 8, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)' }}>
                  Acessar →
                </span>
              </a>
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

        {/* ═══ CONFIGURAÇÕES ═══ */}
        <section id="config" style={{ marginBottom: 56, scrollMarginTop: 'calc(var(--nav-h) + 8px)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, borderBottom: '1px solid var(--faint)', paddingBottom: 16, marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,5vw,52px)', letterSpacing: 3, color: 'var(--cream)' }}>CONFIGURAÇÕES</h2>
          </div>

          <div style={{ maxWidth: 480 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              <span style={{ color: 'var(--red-dim)' }}>// </span>Identidade no Ranking
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--faint)', textTransform: 'uppercase', marginBottom: 24 }}>
              Conta: {profile.email}
            </p>
            <NickForm currentNick={profile.nick ?? null} currentName={profile.name} nickUpdatedAt={profile.nick_updated_at ?? null} />
          </div>

          {/* Subscription management — only for subscribers */}
          {profile.is_subscriber && (
            <div style={{ maxWidth: 480, marginTop: 40, paddingTop: 40, borderTop: '1px solid var(--faint)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16 }}>
                <span style={{ color: 'var(--red-dim)' }}>// </span>Plano Iniciado
              </p>
              <div style={{
                border: '1px solid var(--faint)',
                padding: '20px 24px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2, color: 'var(--gold)', marginBottom: 4 }}>
                    ◈ Plano Iniciado ativo
                  </p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    Acesso completo · transmissões + livros
                  </p>
                </div>
                <BillingPortalButton />
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--faint)', lineHeight: 1.9 }}>
                Para cancelar, clique em &ldquo;Gerenciar assinatura&rdquo;. Você será redirecionado
                para o portal seguro da Stripe onde pode cancelar, alterar o método de pagamento
                ou ver o histórico de cobranças. O acesso permanece ativo até o fim do período pago.
              </p>
            </div>
          )}
        </section>

        {/* Mobile-only logout (sidebar is hidden on mobile) */}
        <div className="profile-mobile-actions">
          <LogoutButton />
        </div>

      </div>
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/api/auth/logout" method="POST">
      <button type="submit" className="btn-historico-cta" style={{ width: '100%' }}>
        Sair →
      </button>
    </form>
  )
}
