import Link from 'next/link'

export default function PaywallOverlay() {
  return (
    <div className="paywall-wrap">
      {/* Blurred continuation */}
      <div className="paywall-blur">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, lineHeight: 1.85, color: '#d8d0c0', marginBottom: 28 }}>
          O conhecimento mais profundo permanece velado para aqueles que ainda não cruzaram o limiar. A tradição hermética sempre distinguiu entre o exotérico — aberto a todos — e o esotérico, reservado aos iniciados.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, lineHeight: 1.85, color: '#d8d0c0', marginBottom: 28 }}>
          Como Hermes Trismegisto ensina, certos segredos só se revelam àqueles que demonstraram capacidade de recebê-los. A iniciação não é um mero ritual — é a transformação interna que precede a revelação exterior.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, lineHeight: 1.85, color: '#d8d0c0', marginBottom: 28 }}>
          Este texto continua por mais alguns minutos explorando as correspondências entre os sistemas simbólicos e sua aplicação na transformação interior do buscador.
        </p>
      </div>

      {/* Gradient overlay + CTA card */}
      <div className="paywall-overlay">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 16, textAlign: 'center', maxWidth: 480,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)', fontSize: 48,
            color: 'var(--gold)', opacity: 0.4, letterSpacing: 8,
          }}>
            ◈
          </span>

          <h3 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,36px)',
            letterSpacing: 4, color: 'var(--cream)', lineHeight: 1,
          }}>
            CONTEÚDO <span style={{ color: 'var(--red)' }}>INICIADO</span>
          </h3>

          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 16,
            color: 'var(--muted)', lineHeight: 1.7,
          }}>
            Este texto continua por mais alguns minutos de leitura. Torne-se assinante para acessar o conteúdo completo — e ganhar seu rank de conhecimento ao final.
          </p>

          <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
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
