import Sigil, { SigilInner } from '@/components/ui/Sigil'
import Link from 'next/link'
import { CATEGORY_META } from '@/types'

export default function Hero() {
  return (
    <section className="hero-grid">
      {/* LEFT */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(32px, 4vw, 60px) var(--px) clamp(32px, 4vw, 52px)',
        borderRight: '1px solid var(--faint)',
      }}>
        {/* Eyebrow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: 'var(--red-dim)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>//</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 5, color: 'var(--red)', textTransform: 'uppercase' }}>
            Portal Oculto · Est. MMXXVI
          </span>
        </div>

        {/* Headline block */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 'clamp(24px, 4vw, 48px)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--muted)', opacity: 0.35 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 8, color: 'var(--muted)', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Pax et Lux.
            </span>
          </div>

          <span className="hl-giant">QHIETH-</span>
          <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <span className="hl-red">US</span>
            {/* Hide outline text on mobile — too cramped */}
            <span className="hl-outline" style={{ display: 'none' }}
              /* shown on desktop via media query below — use inline style for this */
            >PORTAL</span>
          </div>

          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 'clamp(15px, 2vw, 20px)',
            color: 'var(--muted)', lineHeight: 1.4,
            marginTop: 20, letterSpacing: 0.5,
            maxWidth: 480,
          }}>
            Conhecimento além do véu — sabedorias mundanas e superiores para o seu ser evoluir.
          </p>
        </div>

        {/* Bottom — description + stats */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, marginTop: 16, flexWrap: 'wrap' }}>
          <p style={{
            fontFamily: 'var(--font-body)', fontSize: 'clamp(14px, 1.5vw, 18px)',
            color: 'var(--muted)', lineHeight: 1.75,
            maxWidth: 400, minWidth: 0,
            borderLeft: '1px solid var(--red-dim)', paddingLeft: 16,
          }}>
            Para os que buscam além da superfície das coisas — um portal de transmissões sobre hermetismo, Kaballah/Cabala, gnosticismo e dentre outros mistérios da existência.
          </p>

          <div className="hero-stats-row">
            {[
              { n: '212', l: 'Transmissões' },
              { n: '6',   l: 'Domínios' },
              { n: '87',  l: 'Livros' },
            ].map(({ n, l }) => (
              <div key={l} style={{ padding: '0 28px', borderLeft: '1px solid var(--faint)', textAlign: 'right' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--cream)', letterSpacing: 2, display: 'block' }}>{n}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile CTA buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }} className="hero-mobile-ctas">
          <Link href="/transmissoes" className="btn-primary" style={{ fontSize: 12 }}>Explorar →</Link>
          <Link href="/membros" className="btn-secondary" style={{ fontSize: 12 }}>Assinar</Link>
        </div>
      </div>

      {/* RIGHT — Sigil panel (hidden on mobile via .hero-right-panel) */}
      <div className="hero-right-panel">
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3,
          color: 'var(--muted)', textTransform: 'uppercase',
          borderBottom: '1px solid var(--faint)', paddingBottom: 14,
        }}>
          <span>Ain Soph ∞</span>
          <span>MMXXVI</span>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Sigil size={280} opacity={0.5} />
          <SigilInner size={180} />
        </div>

        <div>
          <div style={{ textAlign: 'center', padding: '0 8px', marginBottom: 24 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 80, color: 'var(--red)', lineHeight: 0.5, opacity: 0.18, display: 'block', marginBottom: 16 }}>"</span>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 17, color: 'var(--cream)', lineHeight: 1.7 }}>
              "Conhece a ti mesmo e conhecerás o universo e os deuses."
            </p>
            <span style={{ display: 'block', marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)' }}>
              — Inscrição no Templo de Delfos
            </span>
          </div>

          <div style={{ borderTop: '1px solid var(--faint)', paddingTop: 24, marginTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {Object.entries(CATEGORY_META).slice(0, 4).map(([key, { label, symbol }]) => (
                <Link key={key} href={`/categorias/${key}`} style={{ textDecoration: 'none', padding: '0 12px', borderRight: '1px solid var(--faint)', cursor: 'pointer' }}>
                  <span style={{ display: 'block', fontSize: 15, color: 'var(--gold)', marginBottom: 4 }}>{symbol}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', display: 'block' }}>{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
