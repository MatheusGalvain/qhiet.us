import Link from 'next/link'

export default function PaywallOverlay() {
  return (
    <div className="paywall-wrap">
      {/* Dense blurred text — visually fills the page behind the overlay */}
      <div className="paywall-blur">
        {[
          'Na tradição hermética, o véu que separa o manifestado do inmanifesto não é uma barreira imposta de fora, mas uma expressão da própria natureza do conhecimento: ele se revela apenas àqueles que já carregam, em si, a capacidade de recebê-lo. Cada etapa da iniciação corresponde a uma dissolução progressiva do eu superficial.',
          'A doutrina das emanações — das Sefirot na Cabala, dos Aeons no Gnosticismo, dos Neter no Hermetismo egípcio — descreve não cosmologias abstratas, mas mapas internos. O iniciado que percorre o caminho do Meio aprende que a descida ao Abismo precede toda ascensão verdadeira.',
          'Os cabalistas de Gerona, no século XIII, foram os primeiros a sistematizar o paradoxo central: o Infinito só pode criar o finito através de uma contração deliberada, um ato de auto-ocultamento pelo qual o Todo faz espaço para o Outro. Este é o Tzimtzum — e ele ecoa em toda tradição de transformação interior.',
          'Como Hermes Trismegisto afirma na Tábua de Esmeralda: o que está em baixo corresponde ao que está em cima, e o que está em cima corresponde ao que está em baixo. Esta lei de correspondências é a chave que destranca cada nível da realidade para o iniciado que persevera.',
          'A alquimia interior — a Grande Obra — começa sempre com o Nigredo, a escuridão necessária. Antes do ouro vem a putrefação. Antes da iluminação vem o deserto. A tradição é unânime neste ponto, através de culturas e séculos: a transformação real exige a morte do que era.',
        ].map((text, i) => (
          <p key={i} style={{
            fontFamily: 'var(--font-body)', fontSize: 19,
            lineHeight: 1.85, color: '#d8d0c0', marginBottom: 28,
          }}>
            {text}
          </p>
        ))}
      </div>

      {/* Gradient overlay + CTA card */}
      <div className="paywall-overlay">
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: 'black',
          gap: 16, textAlign: 'center', maxWidth: 480,
          padding: 20,
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
            Esta transmissão é exclusiva para assinantes Iniciados. Assine por R$19,99/mês e acesse todo o acervo, quiz de IA e 4 livros mensais.
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
