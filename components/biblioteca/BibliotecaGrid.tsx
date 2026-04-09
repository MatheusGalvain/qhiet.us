'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface Book {
  id: string
  title: string
  author: string
  year: number | null
  category: string
  era: string | null
  description: string | null
  cover_url: string | null
}

interface Props {
  books: Book[]
  hasAccess: boolean
  userId: string | null
  progress: Record<string, { current_page: number; total_pages: number }>
  search?: string
}

const ERA_COLORS: Record<string, string> = {
  antiguidade: 'var(--muted)',
  medieval:    'var(--cream-dim)',
  renascimento:'var(--red)',
  moderno:     'var(--gold)',
}

const CAT_SYMBOLS: Record<string, string> = {
  hermetismo:  '☿',
  cabala:      '✦',
  gnosticismo: '⊕',
  alquimia:    '☽',
  tarot:       '⊗',
  rosacruz:    '△',
}

export default function BibliotecaGrid({ books, hasAccess, userId, progress, search = '' }: Props) {
  const [hoveredId,      setHoveredId]      = useState<string | null>(null)
  const [showUpgradeFor, setShowUpgradeFor] = useState<string | null>(null)

  const filtered = search.trim()
    ? books.filter(b =>
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase())
      )
    : books

  return (
    <>
      {filtered.length === 0 && (
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
            {search ? `Nenhum resultado para "${search}"` : 'Nenhuma obra nesta categoria ainda.'}
          </p>
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 24,
      }}>
        {filtered.map((book) => {
          const prog = progress[book.id]
          const isHovered = hoveredId === book.id
          const catKey = book.category?.toLowerCase() ?? ''
          const catSym = CAT_SYMBOLS[catKey] ?? '◉'
          const eraColor = ERA_COLORS[book.era?.toLowerCase() ?? ''] ?? 'var(--muted)'

          return (
            <div
              key={book.id}
              style={{ position: 'relative', cursor: hasAccess ? 'pointer' : 'default' }}
              onMouseEnter={() => setHoveredId(book.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {hasAccess ? (
                <Link href={`/biblioteca/${book.id}`} style={{ textDecoration: 'none', display: 'block' }}>
                  <BookCard book={book} prog={prog} isHovered={isHovered} catSym={catSym} eraColor={eraColor} hasAccess />
                </Link>
              ) : (
                <>
                  <div
                    onClick={() => setShowUpgradeFor(book.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <BookCard book={book} prog={undefined} isHovered={isHovered} catSym={catSym} eraColor={eraColor} hasAccess={false} />
                  </div>

                  {showUpgradeFor === book.id && (
                    <div
                      style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 999, padding: 20,
                      }}
                      onClick={() => setShowUpgradeFor(null)}
                    >
                      <div
                        style={{
                          background: '#131312', border: '1px solid var(--gold-dim)',
                          padding: '32px 36px', maxWidth: 420, width: '100%',
                          textAlign: 'center',
                        }}
                        onClick={e => e.stopPropagation()}
                      >
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 3, color: 'var(--cream)', marginBottom: 8 }}>
                          {catSym}
                        </p>
                        <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 2, color: 'var(--gold)', marginBottom: 8 }}>
                          Conteúdo Bloqueado
                        </p>
                        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 24 }}>
                          <strong style={{ color: 'var(--cream)' }}>{book.title}</strong> está disponível para assinantes do plano <strong style={{ color: 'var(--gold)' }}>Acervo</strong> ou <strong style={{ color: 'var(--gold)' }}>Adepto</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                          <a
                            href="/membros?upgrade=acervo"
                            style={{
                              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
                              padding: '12px 20px', background: 'var(--gold)', color: '#000', textDecoration: 'none',
                            }}
                          >
                            Assinar Acervo →
                          </a>
                          <button
                            onClick={() => setShowUpgradeFor(null)}
                            style={{
                              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
                              padding: '12px 20px', background: 'transparent', color: 'var(--muted)',
                              border: '1px solid var(--faint)', cursor: 'pointer',
                            }}
                          >
                            Fechar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}

function BookCard({ book, prog, isHovered, catSym, eraColor, hasAccess }: {
  book: Book
  prog?: { current_page: number; total_pages: number }
  isHovered: boolean
  catSym: string
  eraColor: string
  hasAccess: boolean
}) {
  const progressPct = prog && prog.total_pages > 0
    ? Math.round((prog.current_page / prog.total_pages) * 100)
    : 0

  return (
    <div style={{
      border: '1px solid var(--faint)',
      transition: 'border-color .15s, transform .15s',
      borderColor: isHovered && hasAccess ? 'var(--cream-dim)' : 'var(--faint)',
      transform: isHovered && hasAccess ? 'translateY(-2px)' : 'none',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Cover */}
      <div style={{
        width: '100%', aspectRatio: '2/3', position: 'relative', overflow: 'hidden',
        background: 'var(--surface)',
      }}>
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            style={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              filter: !hasAccess ? 'blur(6px) brightness(0.4)' : 'none',
              transition: 'filter .2s',
            }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            background: !hasAccess ? '#0a0a09' : 'var(--surface)',
            borderBottom: '1px solid var(--faint)',
            padding: 16, textAlign: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: !hasAccess ? 'var(--faint)' : 'var(--muted)' }}>{catSym}</span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: !hasAccess ? 'var(--faint)' : 'var(--muted)', textTransform: 'uppercase', lineHeight: 1.5 }}>
              {book.title.split(' ').slice(0, 4).join(' ')}
            </p>
          </div>
        )}

        {/* Lock overlay */}
        {!hasAccess && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--gold)' }}>⬡</span>
          </div>
        )}

        {/* Hover: description overlay */}
        {isHovered && hasAccess && book.description && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(8,5,3,0.88)',
            display: 'flex', alignItems: 'flex-end',
            padding: 12,
          }}>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--cream-dim)', lineHeight: 1.6 }}>
              {book.description.slice(0, 120)}{book.description.length > 120 ? '…' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '12px 12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
            {book.category}
          </span>
          {book.era && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1, color: eraColor, textTransform: 'uppercase', whiteSpace: 'nowrap', marginLeft: 4 }}>
              {book.era}
            </span>
          )}
        </div>
        <p style={{
          fontFamily: 'var(--font-serif)', fontSize: 14, color: !hasAccess ? 'var(--faint)' : 'var(--cream)',
          marginBottom: 4, lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          minHeight: '2.8em',
        }}>
          {book.title}
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {book.author}{book.year ? ` · ${book.year}` : ''}
        </p>

        {/* Progress bar */}
        {prog && prog.total_pages > 0 && hasAccess && (
          <div style={{ marginTop: 'auto', paddingTop: 8 }}>
            <div style={{ height: 2, background: 'var(--faint)', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--red)', transition: 'width .3s' }} />
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 1, marginTop: 4 }}>
              pág. {prog.current_page} / {prog.total_pages}
            </p>
          </div>
        )}

        {/* Access badge */}
        {!hasAccess && (
          <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>✦ Acervo/Adepto</span>
          </div>
        )}
      </div>
    </div>
  )
}
