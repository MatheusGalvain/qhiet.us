import Link from 'next/link'
import { padNumber, getCategorySymbol, formatDatePT } from '@/lib/utils'
import type { Transmissao } from '@/types'

interface TransmissaoCardProps {
  transmissao: Transmissao
  isSubscriber: boolean
}

export default function TransmissaoCard({ transmissao: t, isSubscriber }: TransmissaoCardProps) {
  const isLocked = t.access === 'locked' && !isSubscriber

  return (
    <Link href={`/artigo/${t.slug}`} style={{ textDecoration: 'none', display: 'flex', height: '100%' }}>
      <article
        className="transmissao-card"
        style={{
          padding: 'clamp(20px, 2.5vw, 32px) clamp(16px, 2vw, 28px)',
          borderRight: '1px solid var(--faint)',
          borderBottom: '1px solid var(--faint)',
          cursor: 'pointer',
          transition: 'background .3s',
          display: 'flex', flexDirection: 'column', gap: 10,
          position: 'relative',
          width: '100%',
        }}
      >
        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2,
            color: t.access === 'free' ? 'var(--red)' : 'var(--gold)',
            whiteSpace: 'nowrap',
          }}>
            {t.access === 'free' ? '◉ Leitura Livre' : '◈ Assinantes'}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, color: 'var(--muted)', border: '1px solid var(--faint)', padding: '3px 9px', whiteSpace: 'nowrap' }}>
            est.{' '}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--cream)', verticalAlign: 'middle' }}>
              {t.read_time_minutes} min
            </span>
          </span>
        </div>

        {/* Number */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 4vw, 52px)',
          color: isLocked ? 'var(--gold)' : 'rgba(var(--cream), 0.2)',
          lineHeight: 1,
        }}>
          {padNumber(t.number)}
        </div>

        {/* Categories */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {t.categories.map(cat => (
            <span key={cat} className="cat-tag-inline">
              <span className="cat-sym">{getCategorySymbol(cat)}</span>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 2vw, 20px)', letterSpacing: 1, lineHeight: 1.2, color: 'var(--cream)' }}>
          {t.title}
        </h3>

        {/* Excerpt */}
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 15, color: '#b8b8b8', lineHeight: 1.75, flex: 1,
          ...(isLocked ? { filter: 'blur(3.5px)', userSelect: 'none', opacity: 0.5 } : {}),
        }}>
          {t.excerpt}
        </p>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--faint)', marginTop: 'auto' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>
            {formatDatePT(t.published_at)}
          </span>
        </div>
      </article>
    </Link>
  )
}
