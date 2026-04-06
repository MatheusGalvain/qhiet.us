'use client'

import { useState } from 'react'
import Link from 'next/link'
import { canAccess, canAccessAny, resolvePlans } from '@/lib/plans'
import type { Plan } from '@/types'

interface AcervoGatewayProps {
  plan: Plan
  plans?: string[]     // full active plans array
  bookCount?: number   // injected by server (total published books)
  collapsed?: boolean
}

export default function AcervoGateway({ plan, plans, bookCount = 0, collapsed = false }: AcervoGatewayProps) {
  const [hovered, setHovered] = useState(false)
  const activePlans = resolvePlans(plans ?? null, plan)
  const hasAccess = canAccessAny(activePlans, 'acervo')

  if (collapsed) {
    return (
      <div title="Acervo" style={{ padding: '0 0 4px', display: 'flex', justifyContent: 'center' }}>
        {hasAccess ? (
          <Link href="/perfil/biblioteca" style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(184,160,122,0.35)',
            color: '#b8a07a', fontSize: 16, textDecoration: 'none',
            transition: 'box-shadow 0.3s',
          }}>
            ◉
          </Link>
        ) : (
          <div style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--faint)', color: 'var(--faint)', fontSize: 16, opacity: 0.5,
          }}>
            ◉
          </div>
        )}
      </div>
    )
  }

  /* ── Has access: glowing portal card ── */
  if (hasAccess) {
    return (
      <div style={{ margin: '0 20px 4px', borderTop: '1px solid rgba(184,160,122,0.20)', paddingTop: 12 }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 4,
          textTransform: 'uppercase', color: 'rgba(184,160,122,0.55)',
          marginBottom: 8, paddingLeft: 2,
        }}>
          ◉ Acervo
        </p>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          border: `1px solid ${hovered ? '#b8a07a' : 'rgba(184,160,122,0.35)'}`,
          background: hovered
            ? 'rgba(184,160,122,0.08)'
            : 'rgba(184,160,122,0.03)',
          transition: 'all 0.35s ease',
          boxShadow: hovered ? '0 0 20px rgba(184,160,122,0.18), inset 0 0 16px rgba(184,160,122,0.04)' : 'none',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Decorative top line */}
        <div style={{
          height: 1,
          background: hovered
            ? 'linear-gradient(90deg, transparent, rgba(184,160,122,0.6), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(184,160,122,0.2), transparent)',
          transition: 'background 0.35s ease',
        }} />

        <Link
          href="/perfil/biblioteca"
          style={{ display: 'block', padding: '14px 16px', textDecoration: 'none' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <div>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 14,
                letterSpacing: 2,
                color: 'var(--cream)',
                lineHeight: 1.3,
              }}>
                Biblioteca<br />
                <span style={{ opacity: 0.6, fontSize: 12 }}>Oculta</span>
              </p>
            </div>
            {bookCount > 0 && (
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 20,
                fontWeight: 'normal',
                color: '#b8a07a',
                opacity: hovered ? 0.9 : 0.45,
                transition: 'opacity 0.3s',
                lineHeight: 1,
                marginTop: 2,
                letterSpacing: -1,
              }}>
                {bookCount}
              </span>
            )}
          </div>

          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: 1.5,
            color: 'var(--muted)',
            marginTop: 10,
            lineHeight: 1.6,
          }}>
            {bookCount > 0
              ? `${bookCount} obra${bookCount !== 1 ? 's' : ''} disponível${bookCount !== 1 ? 'eis' : ''}`
              : 'Obras raras do esoterismo'}
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 12,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: hovered ? '#b8a07a' : 'var(--muted)',
              transition: 'color 0.25s',
            }}>
              Acessar
            </span>
            <span style={{
              color: hovered ? '#b8a07a' : 'var(--faint)',
              fontSize: 11,
              transition: 'color 0.25s, transform 0.25s',
              transform: hovered ? 'translateX(3px)' : 'translateX(0)',
              display: 'inline-block',
            }}>→</span>
          </div>
        </Link>

        {/* Decorative bottom line */}
        <div style={{
          height: 1,
          background: hovered
            ? 'linear-gradient(90deg, transparent, rgba(184,160,122,0.6), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(184,160,122,0.2), transparent)',
          transition: 'background 0.35s ease',
        }} />
      </div>
      </div>
    )
  }

  /* ── No access: locked teaser ── */
  const upgradeHref = plan === 'profano'
    ? '/membros?upgrade=iniciado'
    : plan === 'iniciado'
    ? '/membros?upgrade=adepto'
    : '/membros'

  return (
    <div style={{
      margin: '8px 20px',
      border: '1px solid var(--faint)',
      opacity: 0.55,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 18px' }}>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9, letterSpacing: 4,
          textTransform: 'uppercase',
          color: 'var(--faint)',
          marginBottom: 5,
        }}>
          ◉ Acervo
        </p>
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14, letterSpacing: 2,
          color: 'var(--muted)', lineHeight: 1.3,
        }}>
          Biblioteca<br />
          <span style={{ opacity: 0.5, fontSize: 12 }}>Oculta</span>
        </p>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 9, letterSpacing: 1.5,
          color: 'var(--faint)', marginTop: 10, lineHeight: 1.6,
        }}>
          Disponível nos planos<br />Adepto e Acervo
        </p>
        <Link
          href="/membros"
          style={{
            display: 'inline-block',
            marginTop: 12,
            fontFamily: 'var(--font-mono)',
            fontSize: 9, letterSpacing: 3,
            textTransform: 'uppercase',
            color: 'var(--gold)',
            textDecoration: 'none',
            border: '1px solid var(--gold-dim)',
            padding: '4px 10px',
            transition: 'border-color 0.2s, color 0.2s',
          }}
        >
          ✦ Consulte nossos planos
        </Link>
      </div>
    </div>
  )
}
