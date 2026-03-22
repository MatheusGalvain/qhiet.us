import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import FilterBar from '@/components/transmissoes/FilterBar'
import TransmissaoCard from '@/components/transmissoes/TransmissaoCard'
import HermesBot from '@/components/layout/HermesBot'
import type { Transmissao } from '@/types'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Transmissões',
  description: 'Todas as transmissões do portal QHIETHUS — artigos sobre hermetismo, cabala, gnosticismo, alquimia e tarot.',
}

interface PageProps {
  searchParams: { cat?: string; q?: string; tab?: string; sort?: string }
}

async function getData(searchParams: PageProps['searchParams']) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isSubscriber = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles').select('is_subscriber').eq('id', user.id).single()
    isSubscriber = profile?.is_subscriber ?? false
  }

  let query = supabase
    .from('transmissoes')
    .select('*', { count: 'exact' })
    .order(searchParams.sort === 'antigo' ? 'number' : 'published_at', {
      ascending: searchParams.sort === 'antigo',
    })

  if (searchParams.cat && searchParams.cat !== 'todos') {
    query = query.contains('categories', [searchParams.cat])
  }
  if (searchParams.q) {
    query = query.ilike('title', `%${searchParams.q}%`)
  }
  const accessFilter = searchParams.tab === 'locked' ? 'locked' : 'free'
  query = query.eq('access', accessFilter)

  const { data, count } = await query.limit(12)
  return { transmissoes: (data ?? []) as Transmissao[], total: count ?? 0, isSubscriber }
}

export default async function TransmisoesPage({ searchParams }: PageProps) {
  const { transmissoes, total, isSubscriber } = await getData(searchParams)
  const activeTab = searchParams.tab ?? 'free'

  return (
    <>
      {/* PAGE HEADER */}
      <div className="page-header">
        <p className="eyebrow" style={{ marginBottom: 12 }}>Portal Oculto · 212 registros</p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(48px, 8vw, 80px)',
          letterSpacing: 4, color: 'var(--cream)', lineHeight: 1, marginBottom: 0,
        }}>
          TRANS<span style={{ color: 'var(--red)' }}>MIS</span>SÕES
        </h1>

        <div style={{ marginTop: 24 }}>
          <Suspense>
            <FilterBar />
          </Suspense>
        </div>
      </div>

      {/* TABS — full-width on mobile */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: '1px solid var(--faint)',
        padding: '0 var(--px)',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        <TabBtn href="?tab=free"   active={activeTab === 'free'}   label="◉ Leitura Livre" />
        <TabBtn href="?tab=locked" active={activeTab === 'locked'} label="◈ Assinantes" />
      </div>

      {/* META */}
      <div style={{
        padding: '14px var(--px)', borderBottom: '1px solid var(--faint)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
          Exibindo <span style={{ color: 'var(--cream)' }}>{transmissoes.length}</span> transmissões
        </p>
      </div>

      {/* GRID */}
      <div className="grid-3col section-pad">
        {transmissoes.map(t => (
          <TransmissaoCard key={t.id} transmissao={t} isSubscriber={isSubscriber} />
        ))}
        {transmissoes.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '64px 0', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Nenhuma transmissão encontrada
            </p>
          </div>
        )}
      </div>

      <HermesBot message="Use o filtro acima para navegar por categoria ou busque por título." />
    </>
  )
}

function TabBtn({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <a
      href={href}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 4,
        textTransform: 'uppercase',
        color: active ? 'var(--cream)' : 'var(--muted)',
        background: 'transparent', border: 'none',
        padding: '16px 24px 16px 0', marginRight: 24,
        cursor: 'pointer', textDecoration: 'none',
        display: 'inline-block', transition: 'color .2s',
        borderBottom: active ? '1px solid var(--red)' : '1px solid transparent',
        marginBottom: -1, whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {label}
    </a>
  )
}
