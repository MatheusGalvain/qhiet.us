import { notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import TransmissaoCard from '@/components/transmissoes/TransmissaoCard'
import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import { CATEGORY_META } from '@/types'
import type { Transmissao } from '@/types'
import type { Metadata } from 'next'
import { sanitizeHtml } from '@/lib/sanitize'
import { canAccessAny, resolvePlans } from '@/lib/plans'

export const revalidate = 0

interface PageProps { params: { slug: string } }

interface CategoryContent {
  category: string
  desc_col1_html: string
  desc_col2_html: string
  timeline: Array<{ title: string; date: string; desc: string }>
  figures: Array<{ name: string; period: string; desc: string; symbol: string; image_url?: string }>
}

export async function generateStaticParams() {
  try {
    const service = createServiceClient()
    const { data } = await service.from('categories').select('slug')
    if (data && data.length > 0) return data.map((row: { slug: string }) => ({ slug: row.slug }))
  } catch {}
  return Object.keys(CATEGORY_META).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const service = createServiceClient()
    const { data } = await service.from('categories').select('label').eq('slug', params.slug).single()
    if (data) return { title: data.label, description: `Transmissões sobre ${data.label} no portal QHIETHUS.` }
  } catch {}
  const meta = CATEGORY_META[params.slug as keyof typeof CATEGORY_META]
  if (!meta) return { title: 'Categoria não encontrada' }
  return { title: meta.label, description: `Transmissões sobre ${meta.label} no portal QHIETHUS.` }
}

async function getData(slug: string) {
  // Try fetching category from DB first, fall back to CATEGORY_META
  let meta: { label: string; symbol: string; slug: string } | null = null
  try {
    const service = createServiceClient()
    const { data } = await service.from('categories').select('slug,label,symbol').eq('slug', slug).single()
    if (data) meta = data
  } catch {}
  if (!meta) {
    const fallback = CATEGORY_META[slug as keyof typeof CATEGORY_META]
    if (!fallback) return null
    meta = { slug, label: fallback.label, symbol: fallback.symbol }
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let isSubscriber = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('plan, plans, is_admin').eq('id', user.id).single()
    const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)
    isSubscriber = canAccessAny(activePlans, 'transmissoes_exclusivas') || (profile as any)?.is_admin || false
  }

  const [{ data: transmissoesData, count }, { data: catContent }] = await Promise.all([
    supabase
      .from('transmissoes')
      .select('id, slug, number, title, excerpt, categories, access, read_time_minutes, published_at, xp_reward, status', { count: 'exact' })
      .contains('categories', [slug])
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(12),
    supabase
      .from('category_content')
      .select('*')
      .eq('category', slug)
      .single(),
  ])

  return {
    meta,
    transmissoes: (transmissoesData ?? []) as Transmissao[],
    total: count ?? 0,
    isSubscriber,
    content: catContent as CategoryContent | null,
  }
}


export default async function CategoriaPage({ params }: PageProps) {
  const data = await getData(params.slug)
  if (!data) notFound()
    
    const { meta, transmissoes, total, isSubscriber, content } = data

  return (
    <>
      {/* HEADER */}
      <div className="page-header" style={{ paddingBottom: 'clamp(24px,3vw,40px)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3,
          color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 20,
        }}>
          <Link href="/categorias" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Categorias</Link>
          <span style={{ color: 'var(--faint)' }}>›</span>
          <span>{meta.label}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(64px,10vw,96px)', lineHeight: 0.9, color: 'var(--gold)', opacity: 0.4 }}>
            {meta.symbol}
          </span>
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Categoria · {total} transmissões</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,6vw,80px)', letterSpacing: 4, color: 'var(--cream)', lineHeight: 1 }}>
              {meta.label.toUpperCase()}
            </h1>
          </div>
        </div>
      </div>

      {/* DESCRIPTION — 2 columns */}
      {content && (content.desc_col1_html || content.desc_col2_html) && (
        <section 
          className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-[var(--faint)] cat-desc-grid"
          style={{ padding: 'clamp(32px,4vw,56px) var(--px)' }}
        >
          {content.desc_col1_html && (
            <div
              className="article-prose border-b md:border-b-0 md:border-r border-[var(--faint)] pb-8 md:pb-0 md:pr-[clamp(20px,3vw,48px)]"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.desc_col1_html) }}
            />
          )}
          
          {content.desc_col2_html && (
            <div
              className="article-prose pt-8 md:pt-0 md:pl-[clamp(20px,3vw,48px)]"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(content.desc_col2_html) }}
            />
          )}
        </section>
      )}

      {/* TIMELINE */}
      {content?.timeline && content.timeline.length > 0 && (
        <section style={{ borderBottom: '1px solid var(--faint)' }}>
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px var(--px)', borderBottom: '1px solid var(--faint)',
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 13, letterSpacing: 6, color: 'var(--muted)', textTransform: 'uppercase' }}>
              <span style={{ color: 'var(--red-dim)' }}>// </span>Linha do Tempo
            </p>
          </div>
          {/* Track */}
          <div style={{ padding: '40px var(--px)', position: 'relative' }}>
            {/* Vertical line at 120px */}
            <div style={{
              position: 'absolute', left: 'calc(var(--px) + 120px)',
              top: 0, bottom: 0, width: 1, background: 'var(--faint)',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {content.timeline.map((item, i) => {
                const isKey = i === 0 || i === content.timeline.length - 1
                return (
                  <div key={i} style={{
                    display: 'grid',
                    gridTemplateColumns: '120px 1fr',
                    gap: 32,
                    padding: '22px 0',
                    borderBottom: i < content.timeline.length - 1 ? '1px solid var(--faint)' : 'none',
                    position: 'relative',
                    alignItems: 'flex-start',
                  }}>
                    {/* Dot on the vertical line */}
                    <div style={{
                      position: 'absolute',
                      left: 'calc(120px - 5px)',
                      top: 30,
                      width: isKey ? 11 : 9,
                      height: isKey ? 11 : 9,
                      borderRadius: '50%',
                      background: isKey ? 'var(--red-faint)' : 'var(--ink)',
                      border: `1px solid ${isKey ? 'var(--red-dim)' : 'var(--faint)'}`,
                      zIndex: 1,
                    }} />
                    <div style={{
                      fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 2,
                      color: isKey ? 'var(--red)' : 'var(--muted)',
                      textAlign: 'right', paddingRight: 16, paddingTop: 4,
                      lineHeight: 1.2,
                    }}>
                      {item?.date}
                    </div>
                    <div>
                      <p style={{
                        fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 2,
                        color: 'var(--cream)', marginBottom: 6, lineHeight: 1.2,
                      }}>
                        {item?.title}
                      </p>
                      <p style={{ fontFamily: 'var(--font-body-article)', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7 }}>
                        {item?.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* NOTABLE FIGURES */}
      {content?.figures && content.figures.length > 0 && (
        <section style={{ borderBottom: '1px solid var(--faint)', padding: 'clamp(32px,4vw,56px) var(--px)' }}>
          <p className="eyebrow" style={{ marginBottom: 32 }}>Figuras Notáveis</p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {content.figures.map((fig, i) => {
              const hasImage = !!fig?.image_url
              return hasImage ? (
                /* ── Card com imagem ── */
                <div key={i} style={{
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: 340,
                  border: '1px solid var(--faint)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}>
                  {/* Foto de fundo */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${fig.image_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center top',
                    filter: 'sepia(0.15) contrast(1.05)',
                  }} />
                  {/* Gradiente escuro em cima da foto */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(8,8,8,0) 15%, rgba(8,8,8,0.55) 50%, rgba(8,8,8,0.96) 100%)',
                  }} />
                  {/* Símbolo no topo */}
                  {fig?.symbol && (
                    <div style={{
                      position: 'absolute', top: 16, left: 18,
                      fontFamily: 'var(--font-display)', fontSize: 22,
                      color: 'var(--gold)', opacity: 0.7,
                      textShadow: '0 1px 6px rgba(0,0,0,0.7)',
                    }}>
                      {fig.symbol}
                    </div>
                  )}
                  {/* Texto sobreposto */}
                  <div style={{ position: 'relative', padding: '20px 20px 24px', background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.45) 100%)' }}>
                    <p style={{
                      fontFamily: 'var(--font-display)', fontSize: 21, letterSpacing: 2,
                      color: '#f5f0e8', marginBottom: 4, lineHeight: 1.2,
                      textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                    }}>
                      {fig?.name}
                    </p>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
                      color: 'var(--red)', textTransform: 'uppercase', display: 'block', marginBottom: 8,
                    }}>
                      {fig?.period}
                    </span>
                    <p style={{
                      fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(200,196,188,0.85)', lineHeight: 1.6,
                    }}>
                      {fig?.desc}
                    </p>
                  </div>
                </div>
              ) : (
                /* ── Card sem imagem (original) ── */
                <div key={i} style={{
                  padding: '24px 20px',
                  border: '1px solid var(--faint)',
                  minHeight: 180,
                }}>
                  {fig?.symbol && (
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 25, letterSpacing: 2, color: 'var(--gold)', marginBottom: 4, opacity: 0.6 }}>
                      {fig.symbol}
                    </p>
                  )}
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 2, color: 'var(--cream)', marginBottom: 4 }}>
                    {fig?.name}
                  </p>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--red)', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                    {fig?.period}
                  </span>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {fig?.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* TRANSMISSÕES */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px var(--px)', borderBottom: '1px solid var(--faint)', marginTop: 0 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
         {total} transmissões sobre {meta.label}
        </p>
         <Link href="/transmissoes" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Todas as Transmissões
        </Link>
      </div>

      <div className="grid-3col section-pad">
        {transmissoes.slice(0, 3).map(t => (
          <TransmissaoCard key={t.id} transmissao={t} isSubscriber={isSubscriber} />
        ))}

        {transmissoes.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '64px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Em breve — transmissões chegando
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, padding: '16px var(--px)',
        borderTop: '1px solid var(--faint)',
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
          
        </p>
        <Link href="/categorias" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Todas as categorias
        </Link>
      </div>

      <HermesBot message={`Explore ${total} transmissões sobre ${meta.label}. ${meta.symbol}`} />
    </>
  )
}
