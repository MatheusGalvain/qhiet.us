'use client'

interface Completion {
  xp_earned: number
  completed_at: string
  trails: {
    id: string
    title: string
    category: string
    xp_reward: number
  } | null
}

interface Props {
  completions: Completion[]
  labelMap: Record<string, { label: string; symbol: string }>
}

function resolveCategoryLabel(slug: string, map: Record<string, { label: string; symbol: string }>): string {
  return map[slug]?.label ?? (slug.charAt(0).toUpperCase() + slug.slice(1))
}

function resolveCategorySymbol(slug: string, map: Record<string, { label: string; symbol: string }>): string {
  return map[slug]?.symbol ?? '◈'
}

export default function TrailBadges({ completions, labelMap }: Props) {
  if (completions.length === 0) return null

  return (
    <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--faint)' }}>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4,
        color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 20,
      }}>
        <span style={{ color: 'var(--gold)' }}>✦ </span>Trilhas concluídas
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        {completions.map((c, idx) => {
          const trail = c.trails
          if (!trail) return null
          const catLabel = resolveCategoryLabel(trail.category, labelMap)
          const catSymbol = resolveCategorySymbol(trail.category, labelMap)

          return (
            <a
              key={trail.id + idx}
              href={`/perfil/trilhas/${trail.id}`}
              style={{ textDecoration: 'none' }}
              title={`${trail.title} — ${catLabel}`}
            >
              <div className="trail-badge-medal">
                {/* Outer ring */}
                <div className="trail-badge-ring">
                  <span className="trail-badge-symbol">{catSymbol}</span>
                </div>
                {/* Trail name */}
                <p style={{
                  fontFamily: 'var(--font-display)', fontSize: 12,
                  color: '#e8d5a0', letterSpacing: 1, lineHeight: 1.3,
                  textAlign: 'center', marginTop: 10, maxWidth: 110,
                }}>
                  {trail.title}
                </p>
                {/* XP */}
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10,
                  color: '#c8960a', letterSpacing: 2, marginTop: 6,
                }}>
                  +{c.xp_earned} <span style={{ color: 'var(--muted)', fontSize: 8 }}>XP</span>
                </p>
                {/* Date */}
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8,
                  color: 'var(--cream)', letterSpacing: 1, marginTop: 3,
                  textAlign: 'center',
                }}>
                  {new Date(c.completed_at).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
