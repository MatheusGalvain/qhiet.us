'use client'

import { useRef, useState, useEffect } from 'react'

interface DomainEntry {
  cat: string
  xp: number
  label: string
  symbol: string | null
  xpTotal: number
}

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.', ',') + 'k'
  return n.toString()
}

export default function DomainCarousel({ entries }: { entries: DomainEntry[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const CARD_W = 180 // px per card (approx)

  function updateArrows() {
    const el = trackRef.current
    if (!el) return
    setCanPrev(el.scrollLeft > 4)
    setCanNext(el.scrollLeft < el.scrollWidth - el.clientWidth - 4)
  }

  useEffect(() => {
    updateArrows()
    const el = trackRef.current
    el?.addEventListener('scroll', updateArrows, { passive: true })
    window.addEventListener('resize', updateArrows)
    return () => {
      el?.removeEventListener('scroll', updateArrows)
      window.removeEventListener('resize', updateArrows)
    }
  }, [])

  function scroll(dir: 'prev' | 'next') {
    const el = trackRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'next' ? CARD_W * 2 : -CARD_W * 2, behavior: 'smooth' })
  }

  const isGrid = entries.length <= 3

  if (isGrid) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${entries.length}, 1fr)`,
        border: '1px solid var(--faint)',
      }}>
        {entries.map(({ cat, xp, label, symbol, xpTotal }, i) => (
          <div
            key={cat}
            style={{
              padding: 'clamp(14px,2vw,20px) clamp(14px,2vw,24px)',
              borderRight: i < entries.length - 1 ? '1px solid var(--faint)' : 'none',
            }}
          >
            <p style={{ fontSize: 18, color: 'var(--gold)', opacity: 0.5, marginBottom: 6 }}>
              {symbol ?? '◈'}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              {label}
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,28px)', color: 'var(--cream)', letterSpacing: 2 }}>
              {formatNumber(xp)}
            </p>
            <div style={{ height: 2, background: 'var(--faint)', marginTop: 8 }}>
              <div style={{ height: '100%', width: `${Math.min((xp / Math.max(xpTotal, 1)) * 100, 100)}%`, background: 'var(--red)' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Carrossel (> 3 categorias)
  return (
    <div style={{ position: 'relative', border: '1px solid var(--faint)' }}>
      {/* Botão prev */}
      {canPrev && (
        <button
          onClick={() => scroll('prev')}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
            width: 40,
            background: 'linear-gradient(to right, rgba(0,0,0,0.85) 60%, transparent)',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--cream)',
            fontFamily: 'var(--font-mono)',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Anterior"
        >
          ‹
        </button>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      >
        {entries.map(({ cat, xp, label, symbol, xpTotal }, i) => (
          <div
            key={cat}
            style={{
              flex: '0 0 auto',
              width: 'clamp(140px, 22vw, 200px)',
              scrollSnapAlign: 'start',
              padding: 'clamp(14px,2vw,20px) clamp(14px,2vw,24px)',
              borderRight: i < entries.length - 1 ? '1px solid var(--faint)' : 'none',
            }}
          >
            <p style={{ fontSize: 18, color: 'var(--gold)', opacity: 0.5, marginBottom: 6 }}>
              {symbol ?? '◈'}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              {label}
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(20px,3vw,28px)', color: 'var(--cream)', letterSpacing: 2 }}>
              {formatNumber(xp)}
            </p>
            <div style={{ height: 2, background: 'var(--faint)', marginTop: 8 }}>
              <div style={{ height: '100%', width: `${Math.min((xp / Math.max(xpTotal, 1)) * 100, 100)}%`, background: 'var(--red)' }} />
            </div>
          </div>
        ))}
      </div>

      {/* Botão next */}
      {canNext && (
        <button
          onClick={() => scroll('next')}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 10,
            width: 40,
            background: 'linear-gradient(to left, rgba(0,0,0,0.85) 60%, transparent)',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--cream)',
            fontFamily: 'var(--font-mono)',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Próximo"
        >
          ›
        </button>
      )}

      {/* Indicadores de página */}
      <div style={{
        position: 'absolute',
        bottom: -20,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        gap: 6,
        pointerEvents: 'none',
      }}>
        {Array.from({ length: Math.ceil(entries.length / 2) }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'var(--faint)',
            }}
          />
        ))}
      </div>
    </div>
  )
}
