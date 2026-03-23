'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CATEGORY_META } from '@/types'

const CATEGORIES = Object.entries(CATEGORY_META)

export default function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Support multi-select: cat=hermetismo,cabala
  const catParam = searchParams.get('cat') ?? ''
  const currentCats = catParam ? catParam.split(',').filter(Boolean) : []
  const isAll = currentCats.length === 0

  const currentSearch = searchParams.get('q') ?? ''
  const [search, setSearch] = useState(currentSearch)

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v)
      else params.delete(k)
    })
    startTransition(() => {
      router.push(`?${params.toString()}`, { scroll: false })
    })
  }, [router, searchParams])

  const toggleCategory = useCallback((key: string) => {
    const next = currentCats.includes(key)
      ? currentCats.filter(c => c !== key)   // deselect
      : [...currentCats, key]                // select
    updateParams({ cat: next.join(',') })
  }, [currentCats, updateParams])

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
        {currentCats.length > 0 && (
          <button
            onClick={() => updateParams({ cat: '' })}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2,
              color: 'var(--muted)', background: 'transparent', border: '1px solid var(--faint)',
              padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
              textTransform: 'uppercase',
            }}
          >
            Limpar ×
          </button>
        )}
      </div>

      {/* Category pills — horizontal scroll on mobile */}
      <div className="filter-bar" style={{ padding: '0 var(--px)', gap: 0 }}>
        <CatButton active={isAll} onClick={() => updateParams({ cat: '' })}>
          Todos
        </CatButton>
        {CATEGORIES.map(([key, { label, symbol }]) => (
          <CatButton
            key={key}
            active={currentCats.includes(key)}
            onClick={() => toggleCategory(key)}
            symbol={symbol}
          >
            {label}
          </CatButton>
        ))}
      </div>

      {/* Active filters chips */}
      {currentCats.length > 1 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: '8px var(--px)',
          borderBottom: '1px solid var(--faint)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Filtros ativos:
          </span>
          {currentCats.map(cat => {
            const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META]
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2,
                  color: 'var(--cream)', background: 'rgba(176,42,30,.1)',
                  border: '1px solid var(--red-dim)', padding: '3px 10px',
                  cursor: 'pointer', textTransform: 'uppercase',
                }}
              >
                {meta?.symbol} {meta?.label} ×
              </button>
            )
          })}
        </div>
      )}
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
        fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3,
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
