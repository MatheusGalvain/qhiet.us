'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORY_META } from '@/types'

const CATEGORIES = Object.entries(CATEGORY_META)

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const currentCat = searchParams.get('cat') ?? 'todos'
  const currentSearch = searchParams.get('q') ?? ''
  const [search, setSearch] = useState(currentSearch)

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v && v !== 'todos') params.set(k, v)
      else params.delete(k)
    })
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }, [router, searchParams])

  return (
    <div>
      {/* Search bar */}
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        borderBottom: '1px solid var(--faint)',
        padding: '0 var(--px)',
      }}>
        <span style={{ color: 'var(--muted)', fontSize: 16, flexShrink: 0, marginRight: 12 }}>⌕</span>
        <input
          type="text"
          placeholder="Buscar transmissão..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            updateParams({ q: e.target.value })
          }}
          style={{
            width: '100%',
            background: 'transparent', border: 'none', outline: 'none',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
            color: 'var(--cream)', padding: '18px 0', textTransform: 'uppercase',
          }}
        />
      </div>

      {/* Category pills — horizontal scroll on mobile */}
      <div className="filter-bar" style={{ padding: '0 var(--px)', gap: 0 }}>
        <CatButton active={currentCat === 'todos'} onClick={() => updateParams({ cat: 'todos' })}>
          Todos
        </CatButton>
        {CATEGORIES.map(([key, { label, symbol }]) => (
          <CatButton
            key={key}
            active={currentCat === key}
            onClick={() => updateParams({ cat: key })}
            symbol={symbol}
          >
            {label}
          </CatButton>
        ))}
      </div>
    </div>
  )
}

function CatButton({
  children, active, onClick, symbol,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  symbol?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3,
        textTransform: 'uppercase',
        color: active ? 'var(--cream)' : 'var(--muted)',
        padding: '0 18px', height: 48,
        cursor: 'pointer', border: 'none',
        borderRight: '1px solid var(--faint)',
        transition: 'all .2s',
        background: active ? 'rgba(176,42,30,.06)' : 'transparent',
        display: 'inline-flex', alignItems: 'center', gap: 8,
        whiteSpace: 'nowrap', flexShrink: 0,
      }}
    >
      {symbol && <span style={{ color: 'var(--gold)', fontSize: 12 }}>{symbol}</span>}
      <span style={{
        width: 4, height: 4, borderRadius: '50%',
        background: active ? 'var(--red)' : 'transparent',
        transition: 'background .2s', flexShrink: 0,
      }} />
      {children}
    </button>
  )
}
