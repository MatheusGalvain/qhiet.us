'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Book {
  id: string
  title: string
  author: string
  cover_url: string | null
}

interface ProgressMap {
  [bookId: string]: { current_page: number; total_pages: number; last_read_at: string }
}

export default function BibliotecaProgressList({
  initialBooks,
  initialProgress,
}: {
  initialBooks: Book[]
  initialProgress: ProgressMap
}) {
  const [books, setBooks]       = useState<Book[]>(initialBooks)
  const [progress, setProgress] = useState<ProgressMap>(initialProgress)
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleRemove(bookId: string) {
    if (removing) return
    setRemoving(bookId)
    try {
      const res = await fetch(`/api/biblioteca/${bookId}/progress`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao remover')
      // Optimistic removal
      setBooks(prev => prev.filter(b => b.id !== bookId))
      setProgress(prev => { const copy = { ...prev }; delete copy[bookId]; return copy })
    } catch {
      // silently fail — keep the item
    } finally {
      setRemoving(null)
    }
  }

  if (books.length === 0) {
    return (
      <div style={{ padding: '48px 0' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16 }}>
          Nenhum livro em leitura.
        </p>
        <Link href="/biblioteca" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--red)', textTransform: 'uppercase', textDecoration: 'none' }}>
          Explorar biblioteca →
        </Link>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {books.map((book) => {
        const prog = progress[book.id]
        const pct = prog?.total_pages > 0
          ? Math.round((prog.current_page / prog.total_pages) * 100)
          : 0
        const lastRead = prog?.last_read_at
          ? new Date(prog.last_read_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
          : ''
        const isRemoving = removing === book.id

        return (
          <div key={book.id} style={{
            display: 'flex', alignItems: 'center', gap: 20,
            padding: '20px 0', borderBottom: '1px solid var(--faint)',
            flexWrap: 'wrap', opacity: isRemoving ? 0.4 : 1, transition: 'opacity .2s',
          }}>
            {/* Cover */}
            <div style={{ width: 52, height: 72, flexShrink: 0, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--faint)' }}>
              {book.cover_url
                ? <img src={book.cover_url} alt={book.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--faint)' }}>◉</div>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 180 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--cream)', marginBottom: 4 }}>{book.title}</p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8 }}>{book.author}</p>

              {prog?.total_pages > 0 && (
                <div style={{ marginBottom: 6 }}>
                  <div style={{ height: 2, background: 'var(--faint)', borderRadius: 1, overflow: 'hidden', maxWidth: 240 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--red)' }} />
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--muted)', marginTop: 4 }}>
                    Pág. {prog.current_page} de {prog.total_pages} · {pct}%
                  </p>
                </div>
              )}

              {lastRead && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--cream)' }}>
                  Último acesso: {lastRead}
                </p>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
              <Link
                href={`/biblioteca/${book.id}`}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase',
                  padding: '10px 18px', border: '1px solid var(--red-dim)', color: 'var(--red)',
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                {prog?.current_page > 1 ? 'Continuar lendo →' : 'Começar leitura →'}
              </Link>
              <button
                onClick={() => handleRemove(book.id)}
                disabled={!!removing}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
                  padding: '7px 14px', border: '1px solid var(--faint)',
                  color: 'var(--muted)', background: 'transparent',
                  cursor: removing ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap', transition: 'color .15s, border-color .15s',
                }}
                onMouseEnter={e => { if (!removing) { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red-dim)' } }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--faint)' }}
              >
                {isRemoving ? '◌ Removendo…' : '× Remover da lista'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
