import Link from 'next/link'
import { canAccessAny, resolvePlans, PLAN_META } from '@/lib/plans'
import type { Plan } from '@/types'

interface Props {
  plan: Plan
  plans?: string[]
  bookCount?: number
}

/**
 * Subscriber badge shown in the profile page alongside TrailBadges.
 * Renders an amber medal linking to /perfil/biblioteca when user has access.
 * Returns null when user has no access (no teaser here — sidebar handles that).
 */
export default function AcervoBadge({ plan, plans, bookCount = 0 }: Props) {
  const activePlans = resolvePlans(plans ?? null, plan)
  if (!canAccessAny(activePlans, 'acervo')) return null

  // Show badge for the highest acervo-granting plan
  const displayPlan = activePlans.includes('adepto') ? 'adepto' : activePlans.includes('acervo') ? 'acervo' : plan
  const planMeta = PLAN_META[displayPlan as Plan] ?? PLAN_META[plan]

  return (
    <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--faint)' }}>
      {/* Section header — same style as TrailBadges */}
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4,
        color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 20,
      }}>
        <span style={{ color: '#b8a07a' }}>◉ </span>Acervo desbloqueado
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        {/* Main badge — links to biblioteca */}
        <Link href="/perfil/biblioteca" style={{ textDecoration: 'none' }} className="acervo-badge-medal">
          {/* Diamond ring */}
          <div className="acervo-badge-ring">
            <span className="acervo-badge-symbol">◉</span>
          </div>

          {/* Label */}
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 13,
            color: '#e8d5b0', letterSpacing: 1.5, lineHeight: 1.3,
            textAlign: 'center', marginTop: 12, maxWidth: 116,
          }}>
            Biblioteca<br />
            <span style={{ fontSize: 11, opacity: 0.7 }}>Oculta</span>
          </p>

          {/* Book count */}
          {bookCount > 0 && (
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: '#b8a07a', letterSpacing: 2, marginTop: 7,
            }}>
              {bookCount} <span style={{ color: 'var(--muted)', fontSize: 8 }}>
                {bookCount === 1 ? 'obra' : 'obras'}
              </span>
            </p>
          )}

          {/* Plan source label */}
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            color: planMeta.color, letterSpacing: 2, marginTop: 5,
            textAlign: 'center', opacity: 0.8,
          }}>
            {planMeta.symbol} {planMeta.label}
          </p>
        </Link>

        {/* Descriptor — right side */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, maxWidth: 280, paddingTop: 4 }}>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 18,
            color: '#b8a07a', letterSpacing: 2, lineHeight: 1.2,
          }}>
            Guardião do Acervo
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5,
            color: 'var(--muted)', lineHeight: 1.8,
          }}>
            Acesso à coleção de obras raras do esoterismo ocidental —
            hermetismo, cabala, alquimia, rosacruz e mais.
          </p>
          <Link
            href="/perfil/biblioteca"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3,
              textTransform: 'uppercase', color: '#b8a07a',
              textDecoration: 'none', marginTop: 4,
              transition: 'opacity .2s',
            }}
          >
            Abrir biblioteca <span style={{ fontSize: 11 }}>→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
