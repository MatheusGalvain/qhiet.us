'use client'

import Link from 'next/link'

export default function CategoryRow({ slug, label, symbol, count, tags }: {
  slug: string; label: string; symbol: string; count: number; tags: string[]
}) {
  return (
    <Link href={`/categorias/${slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="category-row"
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(176,42,30,.025)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <span style={{ fontSize: 'clamp(20px,3vw,28px)', color: 'var(--gold)', opacity: 0.6, lineHeight: 1 }}>{symbol}</span>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)', letterSpacing: 3, color: 'var(--muted)', lineHeight: 1 }}>
            {label}
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {tags.slice(0, 2).map(tag => (
              <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--faint)', border: '1px solid var(--faint)', padding: '2px 8px', textTransform: 'uppercase' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="cat-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)', color: 'var(--faint)', letterSpacing: 2, lineHeight: 1, display: 'block' }}>{count}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>textos</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: 2 }}>→</span>
        </div>
      </div>
    </Link>
  )
}