import { createClient } from '@/lib/supabase/server'
import HermesBot from '@/components/layout/HermesBot'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ranking Global',
  description: 'Os buscadores mais dedicados do portal QHIETHUS — ranqueados por XP acumulado.',
}

export const revalidate = 300 // 5 min cache

interface RankEntry {
  rank: number
  name: string
  xp_total: number
  xp_by_domain: Record<string, number>
  is_subscriber: boolean
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
  'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX', 'XXX']

function toRoman(n: number): string {
  if (n <= 30) return ROMAN[n - 1]
  return String(n)
}

function getFavoriteDomain(xp_by_domain: Record<string, number>): string | null {
  const entries = Object.entries(xp_by_domain).filter(([, v]) => v > 0)
  if (!entries.length) return null
  return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
}

const DOMAIN_LABEL: Record<string, string> = {
  hermetismo: 'Hermetismo',
  cabala: 'Cabala',
  gnosticismo: 'Gnosticismo',
  alquimia: 'Alquimia',
  tarot: 'Tarot',
  rosacruz: 'Rosa-Cruz',
}

const RANK_SYMBOL: Record<number, string> = { 1: '◈', 2: '◉', 3: '◎' }

async function getData() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.rpc('get_ranking', { p_limit: 50 })
    if (error) throw error

    const entries = (data ?? []) as RankEntry[]

    // Find current user's rank if logged in
    let myRank: number | null = null
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('name').eq('id', user.id).single()
      if (profile) {
        const idx = entries.findIndex(e => e.name === profile.name)
        if (idx >= 0) myRank = entries[idx].rank
      }
    }

    return { entries, myRank }
  } catch {
    return { entries: [], myRank: null }
  }
}

export default async function RankingPage() {
  const { entries, myRank } = await getData()

  const top3 = entries.slice(0, 3)
  const rest = entries.slice(3)

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Portal Oculto · Tabela de Honra</p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 8vw, 80px)',
          letterSpacing: 4, color: 'var(--cream)', lineHeight: 1, marginBottom: 0,
        }}>
          RANK<span style={{ color: 'var(--red)' }}>ING</span>
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
          color: 'var(--muted)', textTransform: 'uppercase', marginTop: 12, marginBottom: 0, paddingBottom: 24,
        }}>
          Os buscadores mais dedicados · XP acumulado por leituras e quizzes
        </p>
      </div>

      {entries.length === 0 ? (
        <div style={{ padding: '80px var(--px)', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Nenhum buscador registrado ainda
          </p>
        </div>
      ) : (
        <>
          {/* TOP 3 PODIUM */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            borderBottom: '1px solid var(--faint)',
          }} className="ranking-podium">
            {top3.map((entry) => {
              const fav = getFavoriteDomain(entry.xp_by_domain)
              const isMe = entry.rank === myRank
              const symbol = RANK_SYMBOL[entry.rank] ?? '·'
              return (
                <div
                  key={entry.rank}
                  style={{
                    padding: 'clamp(32px,4vw,48px) var(--px)',
                    borderRight: entry.rank < 3 ? '1px solid var(--faint)' : 'none',
                    background: entry.rank === 1
                      ? 'linear-gradient(180deg, rgba(200,150,10,0.04) 0%, transparent 100%)'
                      : entry.rank === 2
                      ? 'linear-gradient(180deg, rgba(176,42,30,0.04) 0%, transparent 100%)'
                      : 'transparent',
                    position: 'relative',
                    ...(isMe ? { outline: '1px solid var(--red-dim)', outlineOffset: -1 } : {}),
                  }}
                >
                  {/* Rank number */}
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(64px, 8vw, 96px)',
                    lineHeight: 1,
                    color: entry.rank === 1 ? 'var(--gold)' : entry.rank === 2 ? 'var(--red)' : 'var(--faint)',
                    letterSpacing: 2,
                    marginBottom: 8,
                  }}>
                    {toRoman(entry.rank)}
                  </div>

                  {/* Symbol + name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 14,
                      color: entry.rank === 1 ? 'var(--gold)' : 'var(--red)',
                    }}>{symbol}</span>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(18px, 2vw, 24px)',
                      letterSpacing: 2,
                      color: 'var(--cream)',
                    }}>
                      {entry.name || 'Anônimo'}
                      {isMe && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--red)', marginLeft: 12, textTransform: 'uppercase' }}>· Você</span>}
                    </span>
                  </div>

                  {/* XP */}
                  <div style={{ marginBottom: 12 }}>
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(28px, 3vw, 40px)',
                      color: entry.rank === 1 ? 'var(--gold)' : 'var(--cream)',
                      letterSpacing: 2,
                    }}>
                      {entry.xp_total.toLocaleString('pt-BR')}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
                      color: 'var(--muted)', marginLeft: 8,
                    }}>XP</span>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {entry.is_subscriber && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2,
                        color: 'var(--gold)', border: '1px solid var(--gold-dim)',
                        padding: '3px 10px', textTransform: 'uppercase',
                      }}>◈ Iniciado</span>
                    )}
                    {fav && (
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2,
                        color: 'var(--muted)', border: '1px solid var(--faint)',
                        padding: '3px 10px', textTransform: 'uppercase',
                      }}>{DOMAIN_LABEL[fav] ?? fav}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* REST OF RANKING — table rows */}
          {rest.length > 0 && (
            <div>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 120px 160px',
                padding: '10px var(--px)',
                borderBottom: '1px solid var(--faint)',
              }}>
                {['Rank', 'Buscador', 'XP', 'Domínio'].map(h => (
                  <span key={h} style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3,
                    color: 'var(--muted)', textTransform: 'uppercase',
                  }}>{h}</span>
                ))}
              </div>

              {rest.map(entry => {
                const fav = getFavoriteDomain(entry.xp_by_domain)
                const isMe = entry.rank === myRank
                return (
                  <div
                    key={entry.rank}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '80px 1fr 120px 160px',
                      padding: '16px var(--px)',
                      borderBottom: '1px solid var(--faint)',
                      alignItems: 'center',
                      transition: 'background .2s',
                      background: isMe ? 'rgba(176,42,30,0.04)' : 'transparent',
                    }}
                  >
                    {/* Rank */}
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 20,
                      color: 'var(--muted)',
                      letterSpacing: 2,
                    }}>
                      {toRoman(entry.rank)}
                    </span>

                    {/* Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 16,
                        color: isMe ? 'var(--cream)' : 'var(--text-secondary)',
                      }}>
                        {entry.name || 'Anônimo'}
                      </span>
                      {isMe && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3,
                          color: 'var(--red)', border: '1px solid var(--red-dim)',
                          padding: '2px 8px', textTransform: 'uppercase',
                        }}>Você</span>
                      )}
                      {entry.is_subscriber && (
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: 'var(--gold-dim)',
                        }}>◈</span>
                      )}
                    </div>

                    {/* XP */}
                    <span style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 18,
                      color: 'var(--cream)',
                      letterSpacing: 1,
                    }}>
                      {entry.xp_total.toLocaleString('pt-BR')}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginLeft: 6 }}>XP</span>
                    </span>

                    {/* Domain */}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2,
                      color: 'var(--muted)', textTransform: 'uppercase',
                    }}>
                      {fav ? (DOMAIN_LABEL[fav] ?? fav) : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Footer note */}
          <div style={{ padding: '24px var(--px)', borderTop: '1px solid var(--faint)' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
              XP acumulado por leituras concluídas e quizzes completados · Atualizado a cada 5 minutos
            </p>
          </div>
        </>
      )}

      <HermesBot message="O ranking é atualizado conforme você lê e completa quizzes. Cada transmissão concluída vale XP." />
    </>
  )
}
