import Link from 'next/link'
import type { Plan } from '@/types'

interface Props {
  plan: Plan          // primary plan (backward compat)
  plans?: string[]    // full active plans array (multi-plan support)
  bookCount?: number
}

/* ── Single badge blocks ── */

function Iniciado() {
  return (
    <Link href="/membros" className="sub-badge sub-badge-iniciado" style={{ textDecoration: 'none' }} title="Iniciado no Caminho">
      <div className="sub-ring-iniciado">
        <span className="sub-symbol-iniciado">◈</span>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#e8b0a8', letterSpacing: 1.5, lineHeight: 1.3, textAlign: 'center', marginTop: 11, maxWidth: 108 }}>
        Iniciado
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c0352a', letterSpacing: 2, marginTop: 6 }}>
        ◈ PLANO
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: 1.5, marginTop: 4, textAlign: 'center', lineHeight: 1.6 }}>
        O Véu foi rasgado
      </p>
    </Link>
  )
}

function Adepto() {
  return (
    <Link href="/membros" className="sub-badge sub-badge-adepto" style={{ textDecoration: 'none' }} title="Adepto dos Mistérios">
      <div className="sub-ring-adepto">
        <span className="sub-symbol-adepto">✦</span>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#e8d5a0', letterSpacing: 1.5, lineHeight: 1.3, textAlign: 'center', marginTop: 12, maxWidth: 116 }}>
        Adepto
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c8960a', letterSpacing: 2, marginTop: 6 }}>
        ✦ PLANO
      </p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: 1.5, marginTop: 4, textAlign: 'center', lineHeight: 1.6 }}>
        Portador da Chave de Ouro
      </p>
    </Link>
  )
}

function Acervo({ bookCount = 0 }: { bookCount?: number }) {
  return (
    <Link href="/perfil/biblioteca" className="sub-badge sub-badge-acervo" style={{ textDecoration: 'none' }} title="Guardião do Acervo">
      <div className="sub-ring-acervo">
        <span className="sub-symbol-acervo">◉</span>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: '#e8d5b0', letterSpacing: 1.5, lineHeight: 1.3, textAlign: 'center', marginTop: 11, maxWidth: 108 }}>
        Acervo
      </p>
      {bookCount > 0 ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#b8a07a', letterSpacing: 2, marginTop: 6 }}>
          {bookCount} <span style={{ color: 'var(--muted)', fontSize: 8 }}>{bookCount === 1 ? 'obra' : 'obras'}</span>
        </p>
      ) : (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#b8a07a', letterSpacing: 2, marginTop: 6 }}>
          ◉ ACERVO
        </p>
      )}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: 1.5, marginTop: 4, textAlign: 'center', lineHeight: 1.6 }}>
        Guardião do Acervo
      </p>
    </Link>
  )
}

/* ── Main export ── */
export default function SubscriberBadges({ plan, plans, bookCount = 0 }: Props) {
  // Use plans array if available, otherwise derive from single plan
  const activePlans: string[] = plans && plans.length > 0
    ? plans
    : plan !== 'profano' ? [plan] : []

  if (activePlans.length === 0) return null

  const hasIniciado = activePlans.includes('iniciado') || activePlans.includes('adepto')
  const hasAdepto   = activePlans.includes('adepto')
  const hasAcervo   = activePlans.includes('adepto') || activePlans.includes('acervo')

  /* Label and description */
  const sectionTitle =
    hasAdepto                          ? '✦ Insígnias do Adepto'   :
    hasIniciado && hasAcervo           ? '◈ Insígnias do Iniciado + Acervo' :
    hasIniciado                        ? '◈ Insígnia do Iniciado'  :
                                         '◉ Insígnia do Acervo'

  const sectionSub =
    hasAdepto                          ? 'Acesso total à plataforma — trilhas, grimório e acervo.' :
    hasIniciado && hasAcervo           ? 'Transmissões exclusivas, trilhas, grimório e biblioteca desbloqueados.' :
    hasIniciado                        ? 'Transmissões exclusivas, trilhas e grimório desbloqueados.' :
                                         'Biblioteca oculta desbloqueada.'

  return (
    <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid var(--faint)' }}>
      {/* Header */}
      <div style={{ marginBottom: 22 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6 }}>
          {sectionTitle}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5, color: 'var(--cream-dim)', lineHeight: 1.7 }}>
          {sectionSub}
        </p>
      </div>

      {/* Badge row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
        {hasIniciado && <Iniciado />}
        {hasAdepto   && <Adepto />}
        {hasAcervo   && <Acervo bookCount={bookCount} />}
      </div>
    </div>
  