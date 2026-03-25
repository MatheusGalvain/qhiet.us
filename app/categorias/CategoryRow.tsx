'use client'

import Link from 'next/link'

// Fallback colors for categories not yet in DB (keyed by slug)
const FALLBACK_COLORS: Record<string, string> = {
  hermetismo:  '#c8960a',
  cabala:      '#7eb8d4',
  gnosticismo: '#9b7fd4',
  alquimia:    '#6db87e',
  tarot:       '#d47eb0',
  rosacruz:    '#d47e7e',
}

/** Convert a hex color to rgba string with given alpha (0-1) */
function hexAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(176,42,30,${alpha})`
  return `rgba(${r},${g},${b},${alpha})`
}

export default function CategoryRow({ slug, label, symbol, count, tags, color }: {
  slug: string
  label: string
  symbol: string
  count: number
  tags: string[]
  color?: string
}) {
  const hex = color || FALLBACK_COLORS[slug] || '#b02a1e'

  return (
    <Link href={`/categorias/${slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="category-row"
        onMouseEnter={e => (e.currentTarget.style.background = hexAlpha(hex, 0.04))}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Symbol */}
        <span style={{ fontSize: 'clamp(20px,3vw,28px)', color: hex, opacity: 0.7, lineHeight: 1 }}>
          {symbol}
        </span>

        {/* Name + tags stacked vertically */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px,4vw,42px)',
            letterSpacing: 3,
            color: 'var(--cream)',
            lineHeight: 1,
          }}>
            {label}
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {tags.map(tag => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: 2,
                  color: hex,
                  border: `1px solid ${hexAlpha(hex, 0.4)}`,
                  background: hexAlpha(hex, 0.08),
                  padding: '3px 10px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Count + arrow */}
        <div className="cat-arrow flex-none md:d-flex" style={{ alignItems: 'center', justifyContent: 'flex-end', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px,4vw,42px)',
              color: hex,
              opacity: 0.5,
              letterSpacing: 2,
              lineHeight: 1,
              display: 'block',
            }}>
              {count}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>textos</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: hex, letterSpacing: 2 }}>→</span>
        </div>
      </div>
    </Link>
  )
}
