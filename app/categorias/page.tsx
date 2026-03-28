import Link from 'next/link'
import HermesBot from '@/components/layout/HermesBot'
import { CATEGORY_META } from '@/types'
import { createServiceClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import CategoryRow from './CategoryRow'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Categorias',
  description: 'Navegue pelos domínios do conhecimento oculto: Hermetismo, Cabala, Gnosticismo, Alquimia, Tarot e Rosacruz.',
}

// Fallback tags used only if `categories` table has no `tags` data yet
const FALLBACK_TAGS: Record<string, string[]> = {
  hermetismo:  ['Tábua de Esmeralda', 'Kybalion', 'Corpus Hermeticum'],
  cabala:      ['Árvore da Vida', 'Sefirot', 'Gematria'],
  gnosticismo: ['Nag Hammadi', 'Demiurgo', 'Pneuma'],
  alquimia:    ['Nigredo', 'Grande Obra', 'Solve et Coagula'],
  tarot:       ['Arcanos Maiores', 'Simbolismo', 'Jornada do Herói'],
  rosacruz:    ['Manifestos', 'Fraternidade', 'Christian Rosenkreuz'],
}

export default async function CategoriasPage() {
  const service = createServiceClient()

  const [{ data: dbCats }, { data: transmissoes }] = await Promise.all([
    service.from('categories').select('*').order('sort_order'),
    service.from('transmissoes').select('categories').eq('status', 'published'),
  ])

  // Fall back to CATEGORY_META if table not yet migrated
  const cats: Array<{ slug: string; label: string; symbol: string; color?: string; tags?: string[] }> =
    dbCats && dbCats.length > 0
      ? dbCats
      : Object.entries(CATEGORY_META).map(([slug, m]) => ({ slug, label: m.label, symbol: m.symbol }))

  // Count transmissões per category slug
  const counts: Record<string, number> = {}
  for (const t of (transmissoes ?? [])) {
    for (const cat of (t.categories ?? [])) {
      counts[cat] = (counts[cat] ?? 0) + 1
    }
  }

  return (
    <>
      {/* HEADER */}
      <div style={{ borderBottom: '1px solid var(--faint)' }}
        className="page-hero flex-col lg:flex-row"
      >
        <div className='pb-16' style={{ padding: 'clamp(32px,5vw,56px) var(--px) clamp(0px, 2vw,48px)', borderRight: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <p className="eyebrow" style={{ marginBottom: 16 }}>Portal Oculto · {cats.length} categorias</p>
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
            {[{ n: String(transmissoes?.length), l: 'Transmissões' }, { n: String(cats.length), l: 'Categorias' }].map(({ n, l }, i) => (
              <div key={l} style={{ padding: `0 ${i > 0 ? 25 : 0}px 0 0`, paddingRight: i < 2 ? 25 : 0, borderRight: i < 2 ? '1px solid var(--faint)' : 'none', paddingLeft: i > 0 ? 25 : 0 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,52px)', color: 'var(--cream)', letterSpacing: 2, display: 'block' }}>{n}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>{l}</span>
              </div>
            ))}
          </div>
          <blockquote style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, borderLeft: '1px solid var(--red-dim)', paddingLeft: 16 }}>
            "Conhece a ti mesmo e conhecerás o universo e os deuses."
            <br />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--cream)', fontStyle: 'normal' }}>— Inscrição no Templo de Delfos</span>
          </blockquote>
        </div>
      </div>

      {/* CATEGORY LIST — rows on desktop, cards on mobile */}
      <div style={{ borderBottom: '1px solid var(--faint)' }}>
        {cats.map(({ slug, label, symbol, color, tags }) => (
          <CategoryRow
            key={slug}
            slug={slug}
            label={label}
            symbol={symbol}
            color={color}
            count={counts[slug] ?? 0}
            tags={(tags && tags.length > 0) ? tags : (FALLBACK_TAGS[slug] ?? [])}
          />
        ))}
      </div>

      {/* FOOTER STRIP */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '16px var(--px)', borderTop: '1px solid var(--faint)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
          {transmissoes?.length ?? 0} transmissões · {cats.length} categorias de conhecimento
        </p>
        <Link href="/transmissoes" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)', border: '1px solid var(--red-dim)', padding: '8px 20px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
          Ver todas →
        </Link>
      </div>

      <HermesBot message="Escolha um domínio para explorar suas transmissões ou navegue por todas." />
    </>
  )
}
