import Link from 'next/link'

export default function PaywallOverlay() {
  return (
    <div className="paywall-wrap">
      {/* Blurred placeholder text */}
      <div className="paywall-blur">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, lineHeight: 1.85, color: '#d8d0c0', marginBottom: 28 }}>
          O conhecimento mais profundo permanece velado para aqueles que ainda não cruzaram o limiar. A tradição hermética sempre distinguiu entre o exotérico — aberto a todos — e o esotérico, reservado aos iniciados. Este não é um obstáculo arbitrário, mas um espelho da própria natureza do conhecimento sagrado.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, lineHeight: 1.85, color: '#d8d0c0', marginBottom: 28 }}>
          Como Hermes Trismegisto ensina nas tábuas de esmeralda, certos segredos só se revelam àqueles que demonstraram capacidade de recebê-los. A iniciação não é um mero ritual — é a transformação interna que precede a revelação.
        </p>
      </div>

      {/* Overlay gradient + CTA */}
      <div className="paywall-overlay">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', maxWidth: 480 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: 'var(--gold)', opacity: 0.4, letterSpacing: 8 }}>
            ◈ ◈ ◈
          </span>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 36, letterSpacing: 4, color: 'var(--cream)' }}>
            CONTEÚDO <span style={{ color: 'var(--red)' }}>EXCLUSIVO</span>
          </h3>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--muted)', lineHeight: 1.7 }}>
            Esta transmissão é exclusiva para assinantes Iniciados. Assine por R$29/mês e acesse todo o acervo, quiz de IA e 4 livros mensais.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Link href="/membros" className="btn-primary">
              Tornar-se Iniciado →
            </Link>
            <Link href="/login" className="btn-secondary">
              Já sou assinante
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
