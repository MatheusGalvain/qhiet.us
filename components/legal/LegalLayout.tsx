import type { ReactNode } from 'react'
import Link from 'next/link'

interface Props {
  label: string
  title: string
  date: string
  intro: string
  children: ReactNode
}

export default function LegalLayout({ label, title, date, intro, children }: Props) {
  return (
    <div style={{
      maxWidth: 800,
      margin: '0 auto',
      padding: 'clamp(48px, 8vw, 80px) clamp(24px, 5vw, 40px)',
    }}>
      {/* Breadcrumb */}
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
        color: 'var(--muted)', textTransform: 'uppercase',
        marginBottom: 48, display: 'flex', gap: 10, alignItems: 'center',
      }}>
        <Link href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Home</Link>
        <span style={{ color: 'var(--faint)' }}>›</span>
        <span>{label}</span>
      </div>

      {/* Doc label */}
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 5,
        color: 'var(--red)', textTransform: 'uppercase', marginBottom: 12,
      }}>
        <span style={{ color: 'var(--red-dim)' }}>// </span>Documento Legal
      </p>

      {/* Title */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(40px, 8vw, 56px)',
        letterSpacing: 3, color: 'var(--cream)', marginBottom: 8, lineHeight: 1,
      }}>
        {title}
      </h1>

      {/* Date */}
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3,
        color: 'var(--muted)', marginBottom: 48, textTransform: 'uppercase',
      }}>
        {date}
      </p>

      {/* Intro */}
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--muted)',
        lineHeight: 1.8,
        borderLeft: '1px solid var(--red-dim)', paddingLeft: 20,
        marginBottom: 48,
      }}>
        {intro}
      </div>

      {/* Sections */}
      <div className="legal-content">
        {children}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 64, paddingTop: 24,
        borderTop: '1px solid var(--faint)',
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3,
        color: 'var(--faint)', textTransform: 'uppercase',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <span>© MMXXVI · QHIETHUS · Todos os mistérios reservados</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/politica-de-privacidade" style={{ color: 'var(--faint)', textDecoration: 'none' }}>Privacidade</Link>
          <Link href="/termos-de-uso" style={{ color: 'var(--faint)', textDecoration: 'none' }}>Termos</Link>
          <Link href="/politica-de-assinatura" style={{ color: 'var(--faint)', textDecoration: 'none' }}>Assinatura</Link>
        </div>
      </div>
    </div>
  )
}

/* ── Reusable section heading ── */
export function LegalH2({ children }: { children: ReactNode }) {
  return (
    <h2 style={{
      fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: 3,
      color: 'var(--cream)', marginTop: 48, marginBottom: 16,
      paddingBottom: 10, borderBottom: '1px solid var(--faint)',
    }}>
      <span style={{ color: 'var(--red-dim)', fontSize: 16 }}>// </span>
      {children}
    </h2>
  )
}

/* ── Body paragraph ── */
export function LegalP({ children }: { children: ReactNode }) {
  return (
    <p style={{
      fontFamily: 'var(--font-body)', fontSize: 16,
      color: 'var(--muted)', lineHeight: 1.85, marginBottom: 16,
    }}>
      {children}
    </p>
  )
}

/* ── Unordered list ── */
export function LegalUL({ children }: { children: ReactNode }) {
  return (
    <ul style={{ margin: '0 0 16px 0', padding: 0, listStyle: 'none' }}>
      {children}
    </ul>
  )
}

/* ── List item ── */
export function LegalLI({ children }: { children: ReactNode }) {
  return (
    <li style={{
      fontFamily: 'var(--font-body)', fontSize: 16,
      color: 'var(--muted)', lineHeight: 1.85, marginBottom: 8,
      paddingLeft: 20, position: 'relative',
    }}>
      <span style={{
        position: 'absolute', left: 0,
        color: 'var(--red-dim)',
      }}>—</span>
      {children}
    </li>
  )
}

/* ── Highlight box (used in assinatura policy) ── */
export function LegalHighlight({ children }: { children: ReactNode }) {
  return (
    <div style={{
      background: '#0f0c09',
      border: '1px solid var(--faint)',
      borderLeft: '2px solid var(--red-dim)',
      padding: '20px 24px',
      margin: '24px 0',
    }}>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 16,
        color: 'var(--muted)', lineHeight: 1.85, margin: 0,
      }}>
        {children}
      </p>
    </div>
  )
}

/* ── Strong (cream, normal weight) ── */
export function S({ children }: { children: ReactNode }) {
  return <span style={{ color: 'var(--cream)', fontWeight: 'normal' }}>{children}</span>
}
