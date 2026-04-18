'use client'

import { useState } from 'react'

interface Book {
  id: string
  title: string
  author: string
  month: string
  file_url: string
  cover_url?: string | null
  plan?: string
  plan_access?: string[]
  order_index?: number | null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--faint)',
  color: 'var(--cream)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  padding: '8px 12px',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: 3,
  textTransform: 'uppercase',
  color: 'var(--muted)',
  marginBottom: 4,
}

function getPlan(book: Book): string {
  if (book.plan) return book.plan
  if (book.plan_access?.includes('profano')) return 'profano'
  if (book.plan_access?.length) return book.plan_access[0]
  return 'profano'
}

export default function BooksList({ books: initial }: { books: Book[] }) {
  // Garante ordem por order_index (nulls vão pro final, fallback array index)
  const sorted = [...initial].sort((a, b) => {
    const ai = a.order_index ?? Infinity
    const bi = b.order_index ?? Infinity
    return ai - bi
  })
  const [books, setBooks] = useState(sorted)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')
  const [reordering, setReordering] = useState(false)

  async function moveBook(id: string, dir: -1 | 1) {
    const i = books.findIndex(b => b.id === id)
    const j = i + dir
    if (j < 0 || j >= books.length) return

    // Renumera todos a partir da posição atual para evitar gaps
    const reindexed = books.map((b, idx) => ({ ...b, order_index: idx }))
    ;[reindexed[i], reindexed[j]] = [reindexed[j], reindexed[i]]
    const result = reindexed.map((b, idx) => ({ ...b, order_index: idx }))
    setBooks(result)

    setReordering(true)
    try {
      await Promise.all([
        fetch(`/api/admin/livros?id=${result[i].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: i }),
        }),
        fetch(`/api/admin/livros?id=${result[j].id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: j }),
        }),
      ])
    } finally {
      setReordering(false)
    }
  }

  // edit form state
  const [editTitle, setEditTitle]     = useState('')
  const [editAuthor, setEditAuthor]   = useState('')
  const [editMonth, setEditMonth]     = useState('')
  const [editCover, setEditCover]     = useState('')
  const [editPlan, setEditPlan]       = useState<'profano' | 'iniciado'>('profano')

  function startEdit(book: Book) {
    setEditing(book.id)
    setEditTitle(book.title)
    setEditAuthor(book.author ?? '')
    setEditMonth(book.month ?? '')
    setEditCover(book.cover_url ?? '')
    setEditPlan((getPlan(book) as 'profano' | 'iniciado') ?? 'profano')
    setEditError('')
  }

  function cancelEdit() {
    setEditing(null)
    setEditError('')
  }

  async function handleSave(id: string) {
    setSaving(true)
    setEditError('')
    const res = await fetch(`/api/admin/livros?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editTitle,
        author: editAuthor,
        month: editMonth,
        cover_url: editCover.trim() || null,
        plan: editPlan,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setEditError(d.error ?? 'Erro ao salvar.')
      return
    }
    const updated = await res.json()
    setBooks(bs => bs.map(b => b.id === id ? { ...b, ...updated } : b))
    setEditing(null)
  }

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

  const COLS = '40px 1fr 150px 110px 90px 190px'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'grid', gridTemplateColumns: COLS, gap: 16, padding: '10px 0', borderBottom: '1px solid var(--faint)' }}>
        {['#', 'Título', 'Autor', 'Mês', 'Plano', ''].map(h => (
          <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</span>
        ))}
      </div>

      {books.map((book, idx) => {
        const plan = getPlan(book)
        const isEditing = editing === book.id

        if (isEditing) {
          return (
            <div key={book.id} style={{ padding: '20px 0', borderBottom: '1px solid var(--faint)', borderLeft: '3px solid var(--red)', paddingLeft: 20 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, color: 'var(--red)', textTransform: 'uppercase', marginBottom: 16 }}>
                // Editando: {book.title}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Título</label>
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Autor</label>
                  <input value={editAuthor} onChange={e => setEditAuthor(e.target.value)} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={labelStyle}>Mês</label>
                  <input type="month" value={editMonth} onChange={e => setEditMonth(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
                </div>
                <div>
                  <label style={labelStyle}>Plano</label>
                  <select value={editPlan} onChange={e => setEditPlan(e.target.value as 'profano' | 'iniciado')} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="profano">Profano (todos)</option>
                    <option value="iniciado">Iniciado (assinante)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>URL da capa</label>
                  <input value={editCover} onChange={e => setEditCover(e.target.value)} placeholder="https://..." style={inputStyle} />
                </div>
              </div>

              {editError && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', marginBottom: 12, letterSpacing: 1 }}>{editError}</p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => handleSave(book.id)}
                  disabled={saving}
                  style={{ background: 'var(--red)', border: '1px solid var(--red)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '7px 16px', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}
                >
                  {saving ? 'Salvando…' : 'Salvar →'}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  style={{ background: 'none', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '7px 16px', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )
        }

        return (
          <div key={book.id} style={{ display: 'grid', gridTemplateColumns: COLS, gap: 16, padding: '14px 0', borderBottom: '1px solid var(--faint)', alignItems: 'center' }}>
            {/* Ordem */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center' }}>
              <button
                onClick={() => moveBook(book.id, -1)}
                disabled={idx === 0 || reordering}
                title="Mover para cima"
                style={{ background: 'none', border: 'none', color: idx === 0 ? 'var(--faint)' : 'var(--muted)', cursor: idx === 0 ? 'default' : 'pointer', fontSize: 12, lineHeight: 1, padding: '2px 4px' }}
              >
                ▲
              </button>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)', letterSpacing: 1 }}>
                {idx + 1}
              </span>
              <button
                onClick={() => moveBook(book.id, 1)}
                disabled={idx === books.length - 1 || reordering}
                title="Mover para baixo"
                style={{ background: 'none', border: 'none', color: idx === books.length - 1 ? 'var(--faint)' : 'var(--muted)', cursor: idx === books.length - 1 ? 'default' : 'pointer', fontSize: 12, lineHeight: 1, padding: '2px 4px' }}
              >
                ▼
              </button>
            </div>

            <div>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, letterSpacing: 1, color: 'var(--cream)', marginBottom: 2 }}>{book.title}</p>
              <a href={book.file_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase' }}>
                Ver arquivo ↗
              </a>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>{book.author || '—'}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase' }}>{book.month}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
              color: plan === 'iniciado' ? 'var(--gold)' : 'var(--muted)',
              border: `1px solid ${plan === 'iniciado' ? 'var(--gold-dim)' : 'var(--faint)'}`,
              padding: '3px 8px',
            }}>
              {plan === 'iniciado' ? 'Iniciado' : 'Profano'}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => startEdit(book)}
                style={{ background: 'none', border: '1px solid var(--faint)', color: 'var(--cream)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '5px 10px', cursor: 'pointer' }}
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(book.id, book.title)}
                disabled={deleting === book.id}
                style={{ background: 'none', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '5px 10px', cursor: 'pointer' }}
              >
                {deleting === book.id ? '…' : 'Deletar'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
