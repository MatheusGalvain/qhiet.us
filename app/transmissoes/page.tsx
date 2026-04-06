import { Suspense } from 'react'

export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'
import { canAccessAny, resolvePlans } from '@/lib/plans'
import FilterBar from '@/components/transmissoes/FilterBar'
import TransmissaoCard from '@/components/transmissoes/TransmissaoCard'
import HermesBot from '@/components/layout/HermesBot'
import Link from 'next/link'
import type { Transmissao } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transmissões',
  description: 'Todas as transmissões do portal QHIETHUS — artigos sobre hermetismo, cabala, gnosticismo, alquimia e tarot.',
}

const PER_PAGE = 12

interface PageProps {
  searchParams: { cat?: string; q?: string; tab?: string; sort?: string; page?: string }
}

async function getActiveCategories() {
  const service = createServiceClient()
  const { data } = await service
    .from('categories')
    .select('slug, label, symbol')
    .eq('active', true)
    .order('sort_order')
  return (data ?? []) as { slug: string; label: string; symbol: string }[]
}

async function getData(searchParams: PageProps['searchParams']) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isSubscriber = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('plan, plans, is_admin').eq('id', user.id).single()
    const activePlans = resolvePlans((profile as any)?.plans, (profile as any)?.plan)
    isSubscriber = canAccessAny(activePlans, 'transmissoes_exclusivas') || (profile as any)?.is_admin || false
  }

  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const from  = (page - 1) * PER_PAGE
  const to    = from + PER_PAGE - 1

  let query = supabase
    .from('transmissoes')
    .select('id, slug, number, title, excerpt, categories, access, read_time_minutes, published_at, xp_reward, status', { count: 'exact' })
    .order(searchParams.sort === 'antigo' ? 'number' : 'published_at', {
      ascending: searchParams.sort === 'antigo',
    })

  if (searchParams.cat && searchParams.cat !== 'todos') {
    const cats = searchParams.cat.split(',').filter(Boolean)
    if (cats.length === 1) {
      query = query.contains('categories', cats)
    } else {
      query = query.overlaps('categories', cats)
    }
  }
  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }

  query = query.eq('status', 'published')

  if (searchParams.tab === 'locked') {
    query = query.eq('access', 'locked')
  } else {
    query = query.eq('access', 'free')
  }

  const { data, count } = await query.range(from, to)
  const total      = count ?? 0
  const totalPages = Math.ceil(total / PER_PAGE)

  return {
    transmissoes: (data ?? []) as Transmissao[],
    total,
    totalPages,
    page,
    isSubscriber,
  }
}

export default async function TransmisoesPage({ searchParams }: PageProps) {
  const [{ transmissoes, total, totalPages, page, isSubscriber }, activeCategories] = await Promise.all([
    getData(searchParams),
    getActiveCategories(),
  ])

  const labelMap = Object.fromEntries(
    activeCategories.map(c => [c.slug, { label: c.label, symbol: c.symbol, parent_id: null, parent_slug: null }])
  )
  const activeTab = searchParams.tab ?? 'free'

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    if (searchParams.tab)  params.set('tab',  searchParams.tab)
    if (searchParams.cat)  params.set('cat',  searchParams.cat)
    if (searchParams.q)    params.set('q',    searchParams.q)
    if (searchParams.sort) params.set('sort', searchParams.sort)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Portal Oculto · {total} registros</p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 8vw, 80px)',
          letterSpacing: 4, color: 'var(--cream)', lineHeight: 1, marginBottom: 0,
        }}>
          TRANS<span style={{ color: 'var(--red)' }}>MIS</span>SÕES
        </h1>
        <div style={{ marginTop: 24 }}>
          <Suspense>
            <FilterBar categories={activeCategories} />
          </Suspense>
        </div>
      </div>

      {/* TABS */}
      <div className="lg:justify-end justify-center" style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: '1px solid var(--faint)',
        padding: '0 var(--px)', overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        <TabBtn href="?tab=free"   active={activeTab === 'free'}   label="◉ Leitura Livre" />
        <TabBtn href="?tab=locked" active={activeTab === 'locked'} label="◈ Assinantes" />
      </div>

      {/* META */}
      <div style={{
        padding: '14px var(--px)', borderBottom: '1px solid var(--faint)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--cream)' }}>{total}</span> transmissões
          {totalPages > 1 && (
            <span style={{ color: 'var(--cream-dim)', marginLeft: 12 }}>
              · página {page} de {totalPages}
            </span>
          )}
        </p>
      </div>

      {/* GRID */}
      <div className="grid-3col section-pad">
        {transmissoes.map(t => (
          <TransmissaoCard key={t.id} transmissao={t} isSubscriber={isSubscriber} labelMap={labelMap} />
        ))}
        {transmissoes.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '64px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Nenhuma transmissão encontrada
            </p>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: '40px var(--px)', borderTop: '1px solid var(--faint)',
          flexWrap: 'wrap',
        }}>
          {page > 1 ? (
            <Link href={pageUrl(page - 1)} style={pgStyle(false)}>← Anterior</Link>
          ) : (
            <span style={pgStyle(true)}>← Anterior</span>
          )}

          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => {
            const isNear  = Math.abs(p - page) <= 1
            const isEdge  = p === 1 || p === totalPages
            const showDot = p === page - 2 || p === page + 2

            if (!isNear && !isEdge) {
              if (showDot) return (
                <span key={p} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)', padding: '0 4px' }}>…</span>
              )
              return null
            }

            return (
              <Link key={p} href={pageUrl(p)} style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
                textDecoration: 'none', padding: '8px 12px',
                background: p === page ? 'var(--red)' : 'transparent',
                border: `1px solid ${p === page ? 'var(--red)' : 'var(--faint)'}`,
                color: p === page ? '#fff' : 'var(--muted)',
                textTransform: 'uppercase',
              }}>
                {p}
              </Link>
            )
          })}

          {page < totalPages ? (
            <Link href={pageUrl(page + 1)} style={pgStyle(false)}>Próxima →</Link>
          ) : (
            <span style={pgStyle(true)}>Próxima →</span>
          )}
        </div>
      )}

      <HermesBot message="Use o filtro acima para navegar por categoria ou busque por título." />
    </>
  )
}

const pgStyle = (disabled: boolean): React.CSSProperties => ({
  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
  textTransform: 'uppercase', textDecoration: 'none',
  padding: '8px 16px',
  background: 'transparent',
  border: '1px solid var(--faint)',
  color: disabled ? 'var(--faint)' : 'var(--muted)',
  pointerEvents: disabled ? 'none' : 'auto',
  display: 'inline-block',
})

function TabBtn({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      className='mr-0 lg:text-xs text-[9px] lg:mr-6 py-4 px-2 lg:px-6'
      style={{
        fontFamily: 'var(--font-mono)', letterSpacing: 4, textTransform: 'uppercase',
        color: active ? 'var(--cream)' : 'var(--muted)',
        background: 'transparent', border: 'none',
        cursor: 'pointer', textDecoration: 'none',
        display: 'inline-block', transition: 'color .2s',
        borderBottom: active ? '1px solid var(--red)' : '1px solid transparent',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {label}
    </a>
  )
}
