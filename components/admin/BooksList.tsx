'use client'

import { useState } from 'react'

interface Book {
  id: string
  title: string
  author: string
  month: string
  file_url: string
  plan?: string
}

export default function BooksList({ books: initial }: { books: Book[] }) {
  const [books, setBooks] = useState(initial)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Deletar "${title}"?`)) return
    setDeleting(id)
    await fetch(`/api/admin/livros?id=${id}`, { method: 'DELETE' })
    setBooks(bs => bs.filter(b => b.id !== id))
    setDeleting(null)
  }

  if (!books.length) {
    return (
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--faint)', textTransform: 'uppercase' }}>
        Nenhum livro cadastrado.
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 120px 80px 100px', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--faint)' }}>
        {['Título', 'Autor', 'Mês', 'Plano', ''].map(h => (
          <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</span>
        ))}
      </div>
      {books.map(book => (
        <div key={book.id} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 120px 80px 100px', gap: 16, padding: '14px 0', borderBottom: '1px solid var(--faint)', alignItems: 'center' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1, color: 'var(--cream)', marginBottom: 2 }}>{book.title}</p>
            <a href={book.file_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
              Ver PDF ↗
            </a>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>{book.author || '—'}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>{book.month}</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
            color: book.plan === 'iniciado' ? 'var(--gold)' : 'var(--muted)',
            border: `1px solid ${book.plan === 'iniciado' ? 'var(--gold-dim)' : 'var(--faint)'}`,
            padding: '3px 8px',
          }}>
            {book.plan === 'iniciado' ? 'Iniciado' : 'Profano'}
          </span>
          <button
            onClick={() => handleDelete(book.id, book.title)}
            disabled={deleting === book.id}
            style={{ background: 'none', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '5px 10px', cursor: 'pointer' }}
          >
            {deleting === book.id ? '…' : 'Deletar'}
          </button>
        </div>
      ))}
    </div>
  )
}
