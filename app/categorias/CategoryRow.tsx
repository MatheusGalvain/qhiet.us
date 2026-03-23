'use client'

import Link from 'next/link'

// Sci-fi accent palette per category
const CAT_COLORS: Record<string, { text: string; border: string; bg: string }> = {
  hermetismo:  { text: '#c8960a', border: 'rgba(200,150,10,0.4)',  bg: 'rgba(200,150,10,0.08)'  },
  cabala:      { text: '#7eb8d4', border: 'rgba(126,184,212,0.4)', bg: 'rgba(126,184,212,0.08)' },
  gnosticismo: { text: '#9b7fd4', border: 'rgba(155,127,212,0.4)', bg: 'rgba(155,127,212,0.08)' },
  alquimia:    { text: '#6db87e', border: 'rgba(109,184,126,0.4)', bg: 'rgba(109,184,126,0.08)' },
  tarot:       { text: '#d47eb0', border: 'rgba(212,126,176,0.4)', bg: 'rgba(212,126,176,0.08)' },
  rosacruz:    { text: '#d47e7e', border: 'rgba(212,126,126,0.4)', bg: 'rgba(212,126,126,0.08)' },
}

export default function CategoryRow({ slug, label, symbol, count, tags }: {
  slug: string; label: string; symbol: string; count: number; tags: string[]
}) {
  const accent = CAT_COLORS[slug] ?? CAT_COLORS.hermetismo

  return (
    <Link href={`/categorias/${slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="category-row"
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(176,42,30,.025)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Symbol */}
        <span style={{ fontSize: 'clamp(20px,3vw,28px)', color: accent.text, opacity: 0.7, lineHeight: 1 }}>
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
            {tags.slice(0, 2).map(tag => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: 2,
                  color: accent.text,
                  border: `1px solid ${accent.border}`,
                  background: accent.bg,
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
        <div className="cat-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px,4vw,42px)',
              color: accent.text,
              opacity: 0.5,
              letterSpacing: 2,
              lineHeight: 1,
              display: 'block',
            }}>
              {count}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>textos</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accent.text, letterSpacing: 2 }}>→</span>
        </div>
      </div>
    </Link>
  )
}
