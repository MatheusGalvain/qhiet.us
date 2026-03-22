import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TransmissaoCard from '@/components/transmissoes/TransmissaoCard'
import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import { CATEGORY_META } from '@/types'
import type { Transmissao } from '@/types'
import type { Metadata } from 'next'

interface PageProps { params: { slug: string } }

export async function generateStaticParams() {
  return Object.keys(CATEGORY_META).map(slug => ({ slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const meta = CATEGORY_META[params.slug as keyof typeof CATEGORY_META]
  if (!meta) return { title: 'Categoria não encontrada' }
  return { title: meta.label, description: `Transmissões sobre ${meta.label} no portal QHIETHUS.` }
}

async function getData(slug: string) {
  const meta = CATEGORY_META[slug as keyof typeof CATEGORY_META]
  if (!meta) return null

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let isSubscriber = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('is_subscriber').eq('id', user.id).single()
    isSubscriber = profile?.is_subscriber ?? false
  }

  const { data, count } = await supabase
    .from('transmissoes')
    .select('*', { count: 'exact' })
    .contains('categories', [slug])
    .order('published_at', { ascending: false })
    .limit(12)

  return { meta, transmissoes: (data ?? []) as Transmissao[], total: count ?? 0, isSubscriber }
}

export default async function CategoriaPage({ params }: PageProps) {
  const data = await getData(params.slug)
  if (!data) notFound()

  const { meta, transmissoes, total, isSubscriber } = data

  return (
    <>
      {/* HEADER */}
      <div className="page-header" style={{ paddingBottom: 'clamp(24px,3vw,40px)' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 20 }}>
          <Link href="/categorias" style={{ color: 'var(--muted)', textDecoration: 'none' }}>Categorias</Link>
          <span style={{ color: 'var(--faint)' }}>›</span>
          <span>{meta.label}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(64px,10vw,96px)', lineHeight: 0.9, color: 'var(--gold)', opacity: 0.4 }}>
            {meta.symbol}
          </span>
          <div>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Domínio · {total} transmissões</p>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,6vw,80px)', letterSpacing: 4, color: 'var(--cream)', lineHeight: 1 }}>
              {meta.label.toUpperCase()}
            </h1>
          </div>
        </div>
      </div>

      {/* GRID */}
      <div className="grid-3col section-pad">
        {transmissoes.map(t => (
          <TransmissaoCard key={t.id} transmissao={t} isSubscriber={isSubscriber} />
        ))}
        {transmissoes.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '64px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Em breve — transmissões chegando
            </p>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '16px var(--px)', borderTop: '1px solid var(--faint)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
          {total} transmissões sobre {meta.label}
        </p>
        <Link href="/categorias" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
          ← Todas as categorias
        </Link>
      </div>

      <HermesBot message={`Explore ${total} transmissões sobre ${meta.label}. ${meta.symbol}`} />
    </>
  )
}
