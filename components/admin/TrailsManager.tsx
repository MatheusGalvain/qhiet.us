'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TrailEditor from './TrailEditor'

interface Trail {
  id: string
  title: string
  description: string | null
  category: string
  categories: string[]
  duration_days: number
  xp_reward: number
  is_published: boolean
  is_free: boolean
  order_index: number
  trail_transmissoes: [{ count: number }] | null
}

interface Category { slug: string; label: string }

interface Props {
  initialTrails: Trail[]
  categories: Category[]
}

export default function TrailsManager({ initialTrails, categories }: Props) {
  const [trails, setTrails] = useState(initialTrails)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing]   = useState<Trail | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const router = useRouter()

  // Form state for new trail
  const [form, setForm] = useState({
    title: '',
    description: '',
    categories: categories[0]?.slug ? [categories[0].slug] : [] as string[],
    duration_days: 30,
    xp_reward: 500,
    is_published: false,
    is_free: false,
    order_index: 0,
  })

  function txCount(t: Trail) {
    return t.trail_transmissoes?.[0]?.count ?? 0
  }

  function toggleCategory(slug: string) {
    setForm(f => {
      const cats = f.categories.includes(slug)
        ? f.categories.filter(c => c !== slug)
        : [...f.categories, slug]
      return { ...f, categories: cats }
    })
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/admin/trilhas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        category: form.categories[0] ?? '',  // backward compat
      }),
    })
    if (!res.ok) { setError((await res.json()).error); return }
    setCreating(false)
    router.refresh()
  }

  async function togglePublish(trail: Trail) {
    await fetch(`/api/admin/trilhas/${trail.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: !trail.is_published }),
    })
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Deletar esta trilha e todas as suas transmissões?')) return
    await fetch(`/api/admin/trilhas/${id}`, { method: 'DELETE' })
    setTrails(t => t.filter(x => x.id !== id))
  }

  if (editing) {
    return (
      <TrailEditor
        trail={editing}
        categories={categories}
        onBack={() => { setEditing(null); router.refresh() }}
      />
    )
  }

  return (
    <div>
      {/* New Trail button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
        <button
          onClick={() => setCreating(c => !c)}
          className="btn-primary"
          style={{ fontSize: 12 }}
        >
          {creating ? 'Cancelar' : '+ Nova Trilha'}
        </button>
      </div>

      {/* New Trail form */}
      {creating && (
        <form onSubmit={handleCreate} style={{
          border: '1px solid var(--faint)', padding: '28px 32px', marginBottom: 32,
          background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 4 }}>
            Nova Trilha
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Título</label>
              <input className="form-input" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>Categorias</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {categories.map(c => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => toggleCategory(c.slug)}
                    style={{
                      background: 'none',
                      border: `1px solid ${form.categories.includes(c.slug) ? 'var(--gold-dim)' : 'var(--faint)'}`,
                      color: form.categories.includes(c.slug) ? 'var(--gold)' : 'var(--muted)',
                      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2,
                      textTransform: 'uppercase', padding: '3px 8px', cursor: 'pointer',
                    }}
                  >
                    {form.categories.includes(c.slug) ? '✓ ' : ''}{c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea className="form-input" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3} style={{ width: '100%', resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Duração (dias)</label>
              <input className="form-input" type="number" min={1} value={form.duration_days}
                onChange={e => setForm(f => ({ ...f, duration_days: +e.target.value }))}
                style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>XP da Trilha</label>
              <input className="form-input" type="number" min={0} value={form.xp_reward}
                onChange={e => setForm(f => ({ ...f, xp_reward: +e.target.value }))}
                style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>Ordem</label>
              <input className="form-input" type="number" min={0} value={form.order_index}
                onChange={e => setForm(f => ({ ...f, order_index: +e.target.value }))}
                style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 24 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_published}
                onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))} />
              Publicar
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: form.is_free ? 'var(--gold)' : 'var(--muted)', textTransform: 'uppercase', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_free}
                onChange={e => setForm(f => ({ ...f, is_free: e.target.checked }))} />
              Trilha Gratuita
            </label>
          </div>

          {error && <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{error}</p>}

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
            Criar Trilha →
          </button>
        </form>
      )}

      {/* Trails list */}
      {trails.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)', textAlign: 'center', padding: '60px 0' }}>
          Nenhuma trilha criada ainda.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {trails.map((trail, i) => (
            <div key={trail.id} style={{
              border: '1px solid var(--faint)',
              borderBottom: i < trails.length - 1 ? 'none' : '1px solid var(--faint)',
              padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 20,
              background: trail.is_published ? 'transparent' : 'rgba(176,42,30,0.04)',
            }}>
              {/* Status dot */}
              <span style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: trail.is_published ? 'var(--gold)' : 'var(--faint)',
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--cream)', letterSpacing: 1 }}>
                  {trail.title}
                  {trail.is_free && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', marginLeft: 12, border: '1px solid var(--gold-dim)', padding: '1px 6px', verticalAlign: 'middle' }}>
                      GRÁTIS
                    </span>
                  )}
                </p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 }}>
                  {(trail.categories?.length > 0 ? trail.categories : [trail.category]).join(' · ')} · {trail.duration_days}d · {txCount(trail)} tx · {trail.xp_reward} XP
                  {!trail.is_published && <span style={{ color: 'var(--red)', marginLeft: 10 }}>RASCUNHO</span>}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button onClick={() => setEditing(trail)} style={actionBtnStyle}>Editar →</button>
                <button
                  onClick={() => togglePublish(trail)}
                  style={{ ...actionBtnStyle, color: trail.is_published ? 'var(--muted)' : 'var(--gold)' }}
                >
                  {trail.is_published ? 'Despublicar' : 'Publicar'}
                </button>
                <button
                  onClick={() => handleDelete(trail.id)}
                  style={{ ...actionBtnStyle, color: 'var(--red)', borderColor: 'var(--red-dim)' }}
                >
                  Deletar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: 2,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  marginBottom: 6,
}

const actionBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--faint)',
  color: 'var(--muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: 2,
  textTransform: 'uppercase',
  padding: '6px 12px',
  cursor: 'pointer',
}
