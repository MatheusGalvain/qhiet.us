'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Categoria {
  id: string
  name: string
  order_index: number
}

interface Props {
  initialCategorias: Categoria[]
}

export default function BibliotecaCategoriasManager({ initialCategorias }: Props) {
  const router = useRouter()
  const [categorias, setCategorias] = useState<Categoria[]>(initialCategorias)
  const [newName, setNewName]       = useState('')
  const [saving,  setSaving]        = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [editing,  setEditing]      = useState<string | null>(null)
  const [editName, setEditName]     = useState('')
  const [error,   setError]         = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/biblioteca/categorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, order_index: categorias.length + 1 }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao criar categoria.')
      setCategorias(prev => [...prev, json])
      setNewName('')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    setError(null)
    try {
      const res = await fetch(`/api/admin/biblioteca/categorias?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao remover.')
      setCategorias(prev => prev.filter(c => c.id !== id))
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  async function handleRename(id: string) {
    const name = editName.trim()
    if (!name) return
    setError(null)
    try {
      const res = await fetch('/api/admin/biblioteca/categorias', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao renomear.')
      setCategorias(prev => prev.map(c => c.id === id ? { ...c, name: json.name } : c))
      setEditing(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Lista */}
      <div style={{ border: '1px solid var(--faint)', marginBottom: 24 }}>
        {categorias.length === 0 && (
          <p style={{ padding: '24px 20px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)', letterSpacing: 2, textTransform: 'uppercase' }}>
            Nenhuma categoria cadastrada.
          </p>
        )}
        {categorias.map((cat, i) => (
          <div
            key={cat.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 16px',
              borderBottom: i < categorias.length - 1 ? '1px solid var(--faint)' : 'none',
            }}
          >
            {/* Order badge */}
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2,
              color: 'var(--faint)', minWidth: 20, textAlign: 'right',
            }}>
              {String(cat.order_index).padStart(2, '0')}
            </span>

            {/* Name / edit input */}
            {editing === cat.id ? (
              <input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename(cat.id)
                  if (e.key === 'Escape') setEditing(null)
                }}
                className="form-input"
                style={{ flex: 1, padding: '4px 10px', fontSize: 13 }}
              />
            ) : (
              <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--cream)' }}>
                {cat.name}
              </span>
            )}

            {/* Actions */}
            {editing === cat.id ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleRename(cat.id)}
                  style={btnSt('var(--red)')}
                >
                  ✓ Salvar
                </button>
                <button onClick={() => setEditing(null)} style={btnSt('var(--muted)')}>
                  Cancelar
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setEditing(cat.id); setEditName(cat.name) }}
                  style={btnSt('var(--muted)')}
                >
                  Renomear
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  disabled={deleting === cat.id}
                  style={btnSt('var(--red)', deleting === cat.id)}
                >
                  {deleting === cat.id ? '…' : 'Remover'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <label style={labelSt}>Nova categoria</label>
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Ex: Martinismo, Cabalismo…"
            className="form-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ paddingTop: 22 }}>
          <button
            type="submit"
            disabled={saving || !newName.trim()}
            className="btn-primary"
            style={{ opacity: saving || !newName.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}
          >
            {saving ? 'Adicionando…' : '+ Adicionar'}
          </button>
        </div>
      </form>

      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: 1, marginTop: 12, borderLeft: '2px solid var(--red)', paddingLeft: 10 }}>
          {error}
        </p>
      )}
    </div>
  )
}

function btnSt(color: string, disabled = false): React.CSSProperties {
  return {
    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase',
    padding: '5px 12px', border: `1px solid ${disabled ? 'var(--faint)' : color}`,
    color: disabled ? 'var(--faint)' : color,
    background: 'transparent', cursor: disabled ? 'default' : 'pointer',
    whiteSpace: 'nowrap',
  }
}

const labelSt: React.CSSProperties = {
  display: 'block', fontFamily: 'var(--font-mono)', fontSize: 10,
  letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6,
}
