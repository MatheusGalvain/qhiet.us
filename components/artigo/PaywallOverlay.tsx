import Link from 'next/link'

export default function PaywallOverlay() {
  return (
    <div className="paywall-wrap">
      {/* Blurred continuation text */}
      <div className="paywall-blur">
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, lineHeight: 1.85, color: '#d8d0c0', marginBottom: 28 }}>
          O conhecimento mais profundo permanece velado para aqueles que ainda não cruzaram o limiar. A tradição hermética sempre distinguiu entre o exotérico — aberto a todos — e o esotérico, reservado aos iniciados.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, lineHeight: 1.85, color: '#d8d0c0', marginBottom: 28 }}>
          Como Hermes Trismegisto ensina nas tábuas de esmeralda, certos segredos só se revelam àqueles que demonstraram capacidade de recebê-los. A iniciação não é um mero ritual — é a transformação interna que precede a revelação exterior.
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, lineHeight: 1.85, color: '#d8d0c0', marginBottom: 28 }}>
          A continuação deste texto aprofunda a doutrina central que define este domínio — explorando as correspondências entre os sistemas simbólicos e sua aplicação na transformação interior do buscador.
        </p>
      </div>

      {/* Gradient overlay + centered veil badge — matches home page FeaturedArticle style */}
      <div className="paywall-overlay">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 20, textAlign: 'center', maxWidth: 520,
        }}>
          {/* Veil tag */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 1, height: 32, background: 'var(--red-dim)' }} />
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              border: '1px solid var(--red)', background: 'var(--red-faint)', margin: '6px 0',
            }} />
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 6,
              textTransform: 'uppercase', color: 'var(--red)',
              border: '1px solid var(--red-dim)', padding: '6px 20px',
              background: 'rgba(176,42,30,0.06)',
            }}>
              Assinantes
            </div>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              border: '1px solid var(--red)', background: 'var(--red-faint)', margin: '6px 0',
            }} />
            <div style={{ width: 1, height: 20, background: 'var(--red-dim)' }} />
          </div>

          <div>
            <h3 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)',
              letterSpacing: 4, color: 'var(--cream)', lineHeight: 1,
            }}>
              CONTEÚDO <span style={{ color: 'var(--red)' }}>EXCLUSIVO</span>
            </h3>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--muted)',
              lineHeight: 1.75, marginTop: 14, maxWidth: 420,
            }}>
              Esta transmissão continua por mais alguns minutos de leitura. Torne-se assinante Iniciado para acessar o conteúdo completo, o quiz de IA Hermes e 4 livros mensais.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/membros" className="btn-primary" style={{ fontSize: 12, padding: '13px 28px' }}>
              Tornar-se Iniciado →
            </Link>
            <Link href="/login" className="btn-secondary" style={{ fontSize: 12, padding: '13px 28px' }}>
              Já sou assinante
            </Link>
          </div>

          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
            color: 'var(--muted)', textTransform: 'uppercase',
          }}>
            acesso exclusivo
          </p>
        </div>
      </div>
    </div>
  )
}
