'use client'

import { useState } from 'react'

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
}

interface TrailTx {
  id: string
  trail_id: string
  title: string
  content: string
  order_index: number
  read_time_minutes: number
  section_title: string | null
}

interface Category { slug: string; label: string }

interface Props {
  trail: Trail
  categories: Category[]
  onBack: () => void
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

export default function TrailEditor({ trail: initialTrail, categories, onBack }: Props) {
  const [trail, setTrail] = useState({
    ...initialTrail,
    categories: initialTrail.categories?.length > 0
      ? initialTrail.categories
      : (initialTrail.category ? [initialTrail.category] : []),
  })
  const [transmissoes, setTransmissoes] = useState<TrailTx[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [addingTx, setAddingTx] = useState(false)
  const [txForm, setTxForm] = useState({ title: '', content: '', read_time_minutes: 8, section_title: '' })
  const [txError, setTxError] = useState<string | null>(null)
  const [editingTx, setEditingTx] = useState<TrailTx | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/trilhas/${trail.id}`)
    const json = await res.json()
    setTransmissoes(json.transmissoes ?? [])
    setLoaded(true)
    setLoading(false)
  }

  if (!loaded && !loading) { load() }

  function toggleCategory(slug: string) {
    setTrail(t => {
      const cats = t.categories.includes(slug)
        ? t.categories.filter(c => c !== slug)
        : [...t.categories, slug]
      return { ...t, categories: cats }
    })
  }

  async function saveTrail(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    const res = await fetch(`/api/admin/trilhas/${trail.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...trail,
        category: trail.categories[0] ?? '',  // backward compat
      }),
    })
    setSaving(false)
    if (!res.ok) { setError((await res.json()).error); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function addTx(e: React.FormEvent) {
    e.preventDefault()
    setTxError(null)
    const res = await fetch(`/api/admin/trilhas/${trail.id}/transmissoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...txForm, section_title: txForm.section_title.trim() || null }),
    })
    if (!res.ok) { setTxError((await res.json()).error); return }
    const created = await res.json()
    setTransmissoes(t => [...t, created])
    setTxForm({ title: '', content: '', read_time_minutes: 8, section_title: '' })
    setAddingTx(false)
  }

  async function saveTx(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTx) return
    const res = await fetch(`/api/admin/trilhas/${trail.id}/transmissoes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        txId: editingTx.id,
        ...editingTx,
        section_title: editingTx.section_title?.trim() || null,
      }),
    })
    if (!res.ok) return
    const updated = await res.json()
    setTransmissoes(ts => ts.map(t => t.id === updated.id ? updated : t))
    setEditingTx(null)
  }

  async function deleteTx(id: string) {
    if (!confirm('Deletar esta transmissão?')) return
    await fetch(`/api/admin/trilhas/${trail.id}/transmissoes?txId=${id}`, { method: 'DELETE' })
    setTransmissoes(ts => ts.filter(t => t.id !== id))
  }

  async function moveOrder(tx: TrailTx, dir: 'up' | 'down') {
    const idx = transmissoes.findIndex(t => t.id === tx.id)
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    if (swapIdx < 0 || swapIdx >= transmissoes.length) return

    const swap = transmissoes[swapIdx]
    const newList = [...transmissoes]
    newList[idx] = { ...swap, order_index: tx.order_index }
    newList[swapIdx] = { ...tx, order_index: swap.order_index }
    setTransmissoes(newList.sort((a, b) => a.order_index - b.order_index))

    await Promise.all([
      fetch(`/api/admin/trilhas/${trail.id}/transmissoes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId: tx.id, order_index: swap.order_index }),
      }),
      fetch(`/api/admin/trilhas/${trail.id}/transmissoes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId: swap.id, order_index: tx.order_index }),
      }),
    ])
  }

  return (
    <div>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: 'var(--muted)',
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
        textTransform: 'uppercase', cursor: 'pointer', marginBottom: 32, padding: 0,
      }}>
        ← Voltar às trilhas
      </button>

      {/* Trail meta form */}
      <form onSubmit={saveTrail} style={{ border: '1px solid var(--faint)', padding: '28px 32px', marginBottom: 40, background: 'var(--surface)' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)', marginBottom: 20 }}>
          Dados da Trilha
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Título</label>
            <input className="form-input" value={trail.title}
              onChange={e => setTrail(t => ({ ...t, title: e.target.value }))}
              required style={{ width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>Categorias (selecione uma ou mais)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {categories.map(c => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggleCategory(c.slug)}
                  style={{
                    background: 'none',
                    border: `1px solid ${trail.categories.includes(c.slug) ? 'var(--gold-dim)' : 'var(--faint)'}`,
                    color: trail.categories.includes(c.slug) ? 'var(--gold)' : 'var(--muted)',
                    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2,
                    textTransform: 'uppercase', padding: '3px 8px', cursor: 'pointer',
                  }}
                >
                  {trail.categories.includes(c.slug) ? '✓ ' : ''}{c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Descrição</label>
          <textarea className="form-input" value={trail.description ?? ''}
            onChange={e => setTrail(t => ({ ...t, description: e.target.value }))}
            rows={3} style={{ width: '100%', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Duração (dias)</label>
            <input className="form-input" type="number" min={1} value={trail.duration_days}
              onChange={e => setTrail(t => ({ ...t, duration_days: +e.target.value }))}
              style={{ width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>XP</label>
            <input className="form-input" type="number" min={0} value={trail.xp_reward}
              onChange={e => setTrail(t => ({ ...t, xp_reward: +e.target.value }))}
              style={{ width: '100%' }} />
          </div>
          <div>
            <label style={labelStyle}>Ordem</label>
            <input className="form-input" type="number" min={0} value={trail.order_index}
              onChange={e => setTrail(t => ({ ...t, order_index: +e.target.value }))}
              style={{ width: '100%' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', cursor: 'pointer' }}>
              <input type="checkbox" checked={trail.is_published}
                onChange={e => setTrail(t => ({ ...t, is_published: e.target.checked }))} />
              Publicada
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 2 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: trail.is_free ? 'var(--gold)' : 'var(--muted)', textTransform: 'uppercase', cursor: 'pointer' }}>
              <input type="checkbox" checked={trail.is_free}
                onChange={e => setTrail(t => ({ ...t, is_free: e.target.checked }))} />
              Gratuita
            </label>
          </div>
        </div>

        {error && <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 12 }}>{error}</p>}
        {saved && <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>✦ Salvo</p>}

        <button type="submit" className="btn-primary" style={{ fontSize: 12 }} disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar alterações →'}
        </button>
      </form>

      {/* Transmissões */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)' }}>
          Transmissões ({transmissoes.length})
        </p>
        <button onClick={() => setAddingTx(a => !a)} className="btn-primary" style={{ fontSize: 11 }}>
          {addingTx ? 'Cancelar' : '+ Adicionar transmissão'}
        </button>
      </div>

      {addingTx && (
        <form onSubmit={addTx} style={{ border: '1px solid var(--faint)', padding: '24px 28px', marginBottom: 20, background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--red)' }}>Nova Transmissão</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16 }}>
            <div>
              <label style={labelStyle}>Título</label>
              <input className="form-input" value={txForm.title}
                onChange={e => setTxForm(f => ({ ...f, title: e.target.value }))}
                required style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>Seção (opcional)</label>
              <input className="form-input" value={txForm.section_title}
                onChange={e => setTxForm(f => ({ ...f, section_title: e.target.value }))}
                placeholder="Ex: Capítulo I, Introdução..."
                style={{ width: '100%' }} />
            </div>
            <div>
              <label style={labelStyle}>Leitura (min)</label>
              <input className="form-input" type="number" min={1} value={txForm.read_time_minutes}
                onChange={e => setTxForm(f => ({ ...f, read_time_minutes: +e.target.value }))}
                style={{ width: 100 }} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Conteúdo (Markdown)</label>
            <textarea className="form-input" value={txForm.content}
              onChange={e => setTxForm(f => ({ ...f, content: e.target.value }))}
              rows={10} required style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-body)', lineHeight: 1.8 }} />
          </div>

          {txError && <p style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{txError}</p>}

          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start', fontSize: 11 }}>
            Adicionar →
          </button>
        </form>
      )}

      {loading ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', letterSpacing: 2 }}>Carregando...</p>
      ) : transmissoes.length === 0 ? (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '40px 0' }}>
          Nenhuma transmissão ainda.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {transmissoes.sort((a, b) => a.order_index - b.order_index).map((tx, i) => (
            <div key={tx.id}>
              {editingTx?.id === tx.id ? (
                <form onSubmit={saveTx} style={{ border: '1px solid var(--gold-dim)', padding: '20px 24px', background: 'rgba(200,150,10,0.04)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12 }}>
                    <input className="form-input" value={editingTx.title}
                      onChange={e => setEditingTx(t => t ? ({ ...t, title: e.target.value }) : t)}
                      placeholder="Título" style={{ width: '100%' }} />
                    <input className="form-input" value={editingTx.section_title ?? ''}
                      onChange={e => setEditingTx(t => t ? ({ ...t, section_title: e.target.value || null }) : t)}
                      placeholder="Seção (opcional)" style={{ width: '100%' }} />
                    <input className="form-input" type="number" min={1} value={editingTx.read_time_minutes}
                      onChange={e => setEditingTx(t => t ? ({ ...t, read_time_minutes: +e.target.value }) : t)}
                      style={{ width: 90 }} />
                  </div>
                  <textarea className="form-input" value={editingTx.content}
                    onChange={e => setEditingTx(t => t ? ({ ...t, content: e.target.value }) : t)}
                    rows={12} style={{ width: '100%', resize: 'vertical', fontFamily: 'var(--font-body)', lineHeight: 1.8 }} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn-primary" style={{ fontSize: 11 }}>Salvar →</button>
                    <button type="button" onClick={() => setEditingTx(null)} style={{ background: 'none', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 14px', cursor: 'pointer' }}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div style={{
                  border: '1px solid var(--faint)',
                  borderBottom: i < transmissoes.length - 1 ? 'none' : '1px solid var(--faint)',
                  padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', width: 24, textAlign: 'right', flexShrink: 0 }}>
                    {tx.order_index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--cream)', letterSpacing: 1 }}>{tx.title}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginTop: 3 }}>
                      {tx.read_time_minutes} min · {tx.content.length} chars
                      {tx.section_title && (
                        <span style={{ color: 'var(--gold)', marginLeft: 8 }}>◈ {tx.section_title}</span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <button onClick={() => moveOrder(tx, 'up')} disabled={i === 0}
                      style={{ background: 'none', border: 'none', color: i === 0 ? 'var(--faint)' : 'var(--muted)', cursor: i === 0 ? 'default' : 'pointer', fontSize: 12, lineHeight: 1 }}>▲</button>
                    <button onClick={() => moveOrder(tx, 'down')} disabled={i === transmissoes.length - 1}
                      style={{ background: 'none', border: 'none', color: i === transmissoes.length - 1 ? 'var(--faint)' : 'var(--muted)', cursor: i === transmissoes.length - 1 ? 'default' : 'pointer', fontSize: 12, lineHeight: 1 }}>▼</button>
                  </div>
                  <button onClick={() => setEditingTx(tx)}
                    style={{ background: 'none', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', padding: '5px 10px', cursor: 'pointer' }}>
                    Editar
                  </button>
                  <button onClick={() => deleteTx(tx.id)}
                    style={{ background: 'none', border: '1px solid var(--red-dim)', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', padding: '5px 10px', cursor: 'pointer' }}>
                    Del
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
