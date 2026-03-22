import Link from 'next/link'
import HermesBot from '@/components/layout/HermesBot'
import { CATEGORY_META } from '@/types'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Categorias',
  description: 'Navegue pelos 6 domínios do conhecimento oculto: Hermetismo, Cabala, Gnosticismo, Alquimia, Tarot e Rosacruz.',
}

const CAT_TAGS: Record<string, string[]> = {
  hermetismo:  ['Tábua de Esmeralda', 'Kybalion', 'Corpus Hermeticum'],
  cabala:      ['Árvore da Vida', 'Sefirot', 'Gematria'],
  gnosticismo: ['Nag Hammadi', 'Demiurgo', 'Pneuma'],
  alquimia:    ['Nigredo', 'Grande Obra', 'Solve et Coagula'],
  tarot:       ['Arcanos Maiores', 'Simbolismo', 'Jornada do Herói'],
  rosacruz:    ['Manifestos', 'Fraternidade', 'Christian Rosenkreuz'],
}

async function getCounts(): Promise<Record<string, number>> {
  try {
    const supabase = await createClient()
    const results: Record<string, number> = {}
    await Promise.all(
      Object.keys(CATEGORY_META).map(async (cat) => {
        const { count } = await supabase
          .from('transmissoes')
          .select('*', { count: 'exact', head: true })
          .contains('categories', [cat])
        results[cat] = count ?? 0
      })
    )
    return results
  } catch {
    return { hermetismo: 28, cabala: 41, gnosticismo: 33, alquimia: 19, tarot: 55, rosacruz: 14 }
  }
}

export default async function CategoriasPage() {
  const counts = await getCounts()

  return (
    <>
      {/* HEADER */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', borderBottom: '1px solid var(--faint)' }}
        className="page-hero"
      >
        <div style={{ padding: 'clamp(32px,5vw,56px) var(--px) clamp(32px,5vw,48px)', borderRight: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 16 }}>Portal Oculto · 6 domínios</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,8vw,80px)', letterSpacing: 4, color: 'var(--cream)', lineHeight: 1 }}>
              CATE<span style={{ color: 'var(--red)' }}>GO</span>RIAS
            </h1>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(14px,1.5vw,17px)', color: 'var(--muted)', lineHeight: 1.75, maxWidth: 400 }}>
            Cada domínio é um caminho distinto em direção ao mesmo mistério. Escolha o que ressoa — ou percorra todos.
          </p>
        </div>

        <div className="hero-right" style={{ padding: 'clamp(32px,5vw,56px) var(--px) clamp(32px,5vw,48px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ display: 'flex', gap: 0, flexWrap: 'wrap' }}>
            {[{ n: '212', l: 'Transmissões' }, { n: '6', l: 'Domínios' }, { n: '87', l: 'Livros' }].map(({ n, l }, i) => (
              <div key={l} style={{ padding: `0 ${i > 0 ? 32 : 0}px 0 0`, paddingRight: i < 2 ? 32 : 0, borderRight: i < 2 ? '1px solid var(--faint)' : 'none', paddingLeft: i > 0 ? 32 : 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,52px)', color: 'var(--cream)', letterSpacing: 2, display: 'block' }}>{n}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>{l}</span>
              </div>
            ))}
          </div>
          <blockquote style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, borderLeft: '1px solid var(--red-dim)', paddingLeft: 16 }}>
            "Conhece a ti mesmo e conhecerás o universo e os deuses."
            <br />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--faint)', fontStyle: 'normal' }}>— Inscrição no Templo de Delfos</span>
          </blockquote>
        </div>
      </div>

      {/* CATEGORY LIST — rows on desktop, cards on mobile */}
      <div style={{ borderBottom: '1px solid var(--faint)' }}>
        {Object.entries(CATEGORY_META).map(([key, { label, symbol }]) => (
          <CategoryRow
            key={key}
            slug={key}
            label={label}
            symbol={symbol}
            count={counts[key] ?? 0}
            tags={CAT_TAGS[key] ?? []}
          />
        ))}
      </div>

      {/* FOOTER STRIP */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '16px var(--px)', borderTop: '1px solid var(--faint)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
          212 transmissões · 6 domínios do conhecimento
        </p>
        <Link href="/transmissoes" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)', border: '1px solid var(--red-dim)', padding: '8px 20px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Ver todas →
        </Link>
      </div>

      <HermesBot message="Escolha um domínio para explorar suas transmissões ou navegue por todas." />
    </>
  )
}

function CategoryRow({ slug, label, symbol, count, tags }: {
  slug: string; label: string; symbol: string; count: number; tags: string[]
}) {
  return (
    <Link href={`/categorias/${slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="category-row"
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(176,42,30,.025)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        {/* Symbol */}
        <span style={{ fontSize: 'clamp(20px,3vw,28px)', color: 'var(--gold)', opacity: 0.6, lineHeight: 1 }}>{symbol}</span>

        {/* Label + tags */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)', letterSpacing: 3, color: 'var(--muted)', lineHeight: 1 }}>
            {label}
          </span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {tags.slice(0, 2).map(tag => (
              <span key={tag} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--faint)', border: '1px solid var(--faint)', padding: '2px 8px', textTransform: 'uppercase' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Count + arrow */}
        <div className="cat-arrow" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,42px)', color: 'var(--faint)', letterSpacing: 2, lineHeight: 1, display: 'block' }}>{count}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>textos</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: 2 }}>→</span>
        </div>
      </div>
    </Link>
  )
}
