'use client'

import { useState } from 'react'
import Link from 'next/link'
import BibliotecaGrid, { type Book } from './BibliotecaGrid'

const MAIN_TABS = ['Todos', 'Recentes', 'Categorias'] as const
type MainTab = typeof MAIN_TABS[number]

interface Props {
  allBooks: Book[]
  recentBooks: Book[]
  hasAccess: boolean
  userId: string | null
  progress: Record<string, { current_page: number; total_pages: number }>
  category: string        // from URL ?cat=
  categories: string[]   // from DB
}

// Pastel palette cycling for category cards
const CAT_COLORS = [
  'rgba(212,175,55,0.10)',   // gold
  'rgba(160,80,80,0.10)',    // red
  'rgba(80,120,160,0.10)',   // blue
  'rgba(80,160,120,0.10)',   // green
  'rgba(160,120,80,0.10)',   // amber
  'rgba(140,80,160,0.10)',   // purple
]
const CAT_BORDERS = [
  'rgba(212,175,55,0.22)',
  'rgba(160,80,80,0.22)',
  'rgba(80,120,160,0.22)',
  'rgba(80,160,120,0.22)',
  'rgba(160,120,80,0.22)',
  'rgba(140,80,160,0.22)',
]

// Number of book thumbnails to preview per category in "Todos"
const PREVIEW_COUNT = 5

export default function BibliotecaShell({
  allBooks, recentBooks, hasAccess, userId, progress, category, categories,
}: Props) {
  const [search, setSearch] = useState('')

  // Active tab logic
  const isSpecificCat = category !== '' && !(MAIN_TABS as readonly string[]).includes(category)
  const activeTab: MainTab | string = isSpecificCat ? 'Categorias' : (category || 'Todos')

  // Group allBooks by category (preserving DB category order)
  const grouped: { cat: string; books: Book[] }[] = []
  const seen = new Set<string>()
  // First, ordered categories
  for (const cat of categories) {
    const catBooks = allBooks.filter(b => b.category === cat)
    if (catBooks.length > 0) { grouped.push({ cat, books: catBooks }); seen.add(cat) }
  }
  // Then any book whose category isn't in the list
  for (const book of allBooks) {
    if (!seen.has(book.category)) {
      const existing = grouped.find(g => g.cat === book.category)
      if (existing) existing.books.push(book)
      else { grouped.push({ cat: book.category, books: [book] }); seen.add(book.category) }
    }
  }

  // Category counts (for cards)
  const catCounts: Record<string, number> = {}
  for (const book of allBooks) {
    catCounts[book.category] = (catCounts[book.category] ?? 0) + 1
  }
  const allCategories = [...categories, ...Object.keys(catCounts).filter(c => !categories.includes(c))]

  // Current books for search/grid (when in specific category)
  const specificBooks = isSpecificCat
    ? allBooks.filter(b => b.category.toLowerCase() === category.toLowerCase())
    : []

  return (
    <>
      {/* ── Nav ── */}
      <div className="bib-nav" style={{ padding: 'clamp(15px,5vw,5px) var(--px) 0' }}>

        {/* Row 1 — 3 abas fixas */}
        <div className="bib-nav-tabs">
          {MAIN_TABS.map(tab => (
            <Link
              key={tab}
              href={`/biblioteca?cat=${tab}`}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
                textTransform: 'uppercase', padding: '14px 20px',
                whiteSpace: 'nowrap', textDecoration: 'none', flexShrink: 0,
                color: activeTab === tab ? 'var(--cream)' : 'var(--muted)',
                borderBottom: activeTab === tab ? '2px solid var(--red)' : '2px solid transparent',
                transition: 'color .15s',
              }}
            >
              {tab}
            </Link>
          ))}

          {/* Se estiver em uma categoria específica, mostra o nome dela como tab ativa */}
          {isSpecificCat && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
              textTransform: 'uppercase', padding: '14px 20px',
              whiteSpace: 'nowrap', flexShrink: 0,
              color: 'var(--cream)',
              borderBottom: '2px solid var(--gold)',
            }}>
              {category}
            </span>
          )}
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

      {/* ── Content area ── */}
      <div style={{ padding: 'clamp(24px,4vw,48px) var(--px)' }}>

        {/* BUSCA ativa — sobrepõe a view atual */}
        {search.trim() && (
          <BibliotecaGrid
            books={allBooks}
            hasAccess={hasAccess}
            userId={userId}
            progress={progress}
            search={search}
          />
        )}

        {!search.trim() && (

          <>
            {/* ─── TODOS: agrupado por categoria ─── */}
            {activeTab === 'Todos' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 52 }}>
                {grouped.map(({ cat, books: catBooks }) => {
                  const preview = catBooks.slice(0, PREVIEW_COUNT)
                  const hasMore = catBooks.length > PREVIEW_COUNT
                  return (
                    <section key={cat}>
                      {/* Category header */}
                      <div style={{
                        display: 'flex', alignItems: 'baseline',
                        justifyContent: 'space-between', gap: 12,
                        marginBottom: 20, paddingBottom: 12,
                        borderBottom: '1px solid var(--faint)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                          <h2 style={{
                            fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,2.5vw,24px)',
                            letterSpacing: 3, color: 'var(--cream)', textTransform: 'uppercase',
                          }}>
                            {cat}
                          </h2>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--cream-dim)', textTransform: 'uppercase' }}>
                            {catBooks.length} {catBooks.length === 1 ? 'obra' : 'obras'} no total
                          </span>
                        </div>
                        {hasMore && (
                          <Link
                            href={`/biblioteca?cat=${encodeURIComponent(cat)}`}
                            style={{
                              fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
                              textTransform: 'uppercase', textDecoration: 'none',
                              color: 'var(--muted)', whiteSpace: 'nowrap',
                              transition: 'color .15s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--cream)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)' }}
                          >
                            Ver todos ({catBooks.length}) →
                          </Link>
                        )}
                      </div>

                      {/* Book grid (preview) */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: 16,
                      }}>
                        {preview.map(book => (
                          <MiniBookCard
                            key={book.id}
                            book={book}
                            prog={progress[book.id]}
                            hasAccess={hasAccess}
                          />
                        ))}

                        {/* "Ver mais" card no final */}
                        {hasMore && (
                          <Link
                            href={`/biblioteca?cat=${encodeURIComponent(cat)}`}
                            style={{
                              border: '1px dashed var(--faint)',
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center',
                              gap: 8, textDecoration: 'none',
                              aspectRatio: '2/3',
                              transition: 'border-color .15s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--cream-dim)' }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--faint)' }}
                          >
                            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--muted)' }}>+{catBooks.length - PREVIEW_COUNT}</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--cream)', textTransform: 'uppercase' }}>ver mais obras</span>
                          </Link>
                        )}
                      </div>
                    </section>
                  )
                })}
              </div>
            )}

            {/* ─── RECENTES ─── */}
            {activeTab === 'Recentes' && (
              <>
                <p style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
                  color: 'var(--muted)', textTransform: 'uppercase',
                  marginBottom: 28, borderLeft: '2px solid var(--red)', paddingLeft: 12,
                }}>
                  Últimas 5 obras adicionadas ao acervo
                </p>
                <BibliotecaGrid
                  books={recentBooks}
                  hasAccess={hasAccess}
                  userId={userId}
                  progress={progress}
                  search=""
                />
              </>
            )}

            {/* ─── CATEGORIAS: grid de cards ─── */}
            {(activeTab === 'Categorias' && !isSpecificCat) && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 16,
              }}>
                {allCategories.map((cat, i) => {
                  const count = catCounts[cat] ?? 0
                  const bg     = CAT_COLORS[i % CAT_COLORS.length]
                  const border = CAT_BORDERS[i % CAT_BORDERS.length]
                  return (
                    <Link
                      key={cat}
                      href={`/biblioteca?cat=${encodeURIComponent(cat)}`}
                      style={{
                        display: 'flex', flexDirection: 'column',
                        justifyContent: 'space-between',
                        padding: '24px 20px',
                        background: bg,
                        border: `1px solid ${border}`,
                        textDecoration: 'none',
                        minHeight: 120,
                        transition: 'background .15s, border-color .15s, transform .15s',
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLAnchorElement
                        el.style.transform = 'translateY(-2px)'
                        el.style.borderColor = border.replace('0.22', '0.45')
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLAnchorElement
                        el.style.transform = 'none'
                        el.style.borderColor = border
                      }}
                    >
                      <div>
                        <p style={{
                          fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 2,
                          color: 'var(--cream)', textTransform: 'uppercase',
                        }}>
                          {cat}
                        </p>
                      </div>
                      <p style={{
                        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2,
                        color: 'var(--muted)', textTransform: 'uppercase', marginTop: 16,
                      }}>
                        {count} {count === 1 ? 'livro' : 'livros'}
                      </p>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* ─── CATEGORIA ESPECÍFICA: grid filtrado ─── */}
            {isSpecificCat && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                  <Link
                    href="/biblioteca?cat=Categorias"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', textDecoration: 'none' }}
                  >
                    ← Categorias
                  </Link>
                  <span style={{ color: 'var(--faint)' }}>/</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--cream)', textTransform: 'uppercase' }}>
                    {category} · {specificBooks.length} {specificBooks.length === 1 ? 'obra' : 'obras'}
                  </span>
                </div>
                <BibliotecaGrid
                  books={specificBooks}
                  hasAccess={hasAccess}
                  userId={userId}
                  progress={progress}
                  search=""
                />
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

/** Card compacto para a view "Todos" (sem hover de descrição, mais leve) */
function MiniBookCard({
  book, prog, hasAccess,
}: {
  book: Book
  prog?: { current_page: number; total_pages: number }
  hasAccess: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const pct = prog && prog.total_pages > 0
    ? Math.round((prog.current_page / prog.total_pages) * 100)
    : 0

  return (
    <Link
      href={`/biblioteca/${book.id}`}
      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        border: `1px solid ${hovered && hasAccess ? 'var(--cream-dim)' : 'var(--faint)'}`,
        transform: hovered && hasAccess ? 'translateY(-2px)' : 'none',
        transition: 'border-color .15s, transform .15s',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Cover */}
        <div style={{ width: '100%', aspectRatio: '2/3', position: 'relative', overflow: 'hidden', background: 'var(--surface)' }}>
          {book.cover_url ? (
            <img
              src={book.cover_url}
              alt={book.title}
              style={{
                width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                filter: !hasAccess ? 'blur(6px) brightness(0.4)' : 'none',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: 'var(--surface)',
            }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--muted)' }}>◉</span>
            </div>
          )}
          {!hasAccess && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--gold)' }}>⬡</span>
            </div>
          )}
          {/* Hover: description overlay */}
          {hovered && hasAccess && book.description && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(8,5,3,0.88)',
              display: 'flex', alignItems: 'flex-end',
              padding: 12,
            }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
                {book.description.slice(0, 100)}{book.description.length > 100 ? '…' : ''}
              </p>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '10px 10px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <p style={{
            fontFamily: 'var(--font-serif)', fontSize: 13, color: !hasAccess ? 'var(--faint)' : 'var(--cream)',
            lineHeight: 1.4, marginBottom: 3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            minHeight: '2.8em',
          }}>
            {book.title}
          </p>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--muted)',
            textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {book.author}
          </p>
          {prog && prog.total_pages > 0 && hasAccess && (
            <div style={{ marginTop: 'auto', paddingTop: 8 }}>
              <div style={{ height: 2, background: 'var(--faint)', borderRadius: 1, overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: 'var(--red)' }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}