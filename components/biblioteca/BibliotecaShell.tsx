'use client'

import { useState } from 'react'
import Link from 'next/link'
import BibliotecaGrid, { type Book } from './BibliotecaGrid'

interface Props {
  books: Book[]
  hasAccess: boolean
  userId: string | null
  progress: Record<string, { current_page: number; total_pages: number }>
  category: string
  isRecentes: boolean
  categories: string[]   // fed from server (DB)
}

export default function BibliotecaShell({
  books, hasAccess, userId, progress, category, isRecentes, categories,
}: Props) {
  const [search, setSearch] = useState('')

  const tabs = ['Todos', 'Recentes', ...categories]

  return (
    <>
      {/* ── Nav ── */}
      <div className="bib-nav">

        {/* Row 1 — abas de categoria (scroll horizontal) */}
        <div className="bib-nav-tabs">
          {tabs.map(cat => (
            <Link
              key={cat}
              href={`/biblioteca?cat=${encodeURIComponent(cat)}`}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
                textTransform: 'uppercase', padding: '14px 20px',
                whiteSpace: 'nowrap', textDecoration: 'none', flexShrink: 0,
                color: category === cat ? 'var(--cream)' : 'var(--muted)',
                borderBottom: category === cat ? '2px solid var(--red)' : '2px solid transparent',
                transition: 'color .15s',
              }}
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Row 2 — busca + Em Leitura */}
        <div className="bib-nav-actions">
          <div className="bib-nav-search">
            <span className="bib-search-icon">⌕</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar obra ou autor…"
            />
            {search && (
              <button className="bib-search-clear" onClick={() => setSearch('')}>×</button>
            )}
          </div>

          <Link
            href="/perfil/biblioteca"
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
              textTransform: 'uppercase', padding: '0 18px',
              whiteSpace: 'nowrap', textDecoration: 'none',
              color: 'var(--gold)',
              borderBottom: '2px solid transparent',
              display: 'flex', alignItems: 'center', gap: 7,
              transition: 'color .15s', flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13 }}>◑</span>
            Em Leitura
          </Link>
        </div>

      </div>

      {/* ── Grid ── */}
      <div style={{ padding: 'clamp(24px,4vw,48px) var(--px)' }}>
        {isRecentes && (
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
            color: 'var(--muted)', textTransform: 'uppercase',
            marginBottom: 28, borderLeft: '2px solid var(--red)', paddingLeft: 12,
          }}>
            Últimas 5 obras adicionadas ao acervo
          </p>
        )}

        <BibliotecaGrid
          books={books}
          hasAccess={hasAccess}
          userId={userId}
          progress={progress}
          search={search}
        />
      </div>
    </>
  )
}
