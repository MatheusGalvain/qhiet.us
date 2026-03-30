'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CategoryData {
  slug: string
  label: string
  symbol: string
  color: string
  description: string
  sort_order: number
}

interface Props {
  mode: 'create' | 'edit'
  initial?: Partial<CategoryData>
  categoryId?: string   // needed for PATCH (edit mode)
}

const PRESET_SYMBOLS = ['☿', '✡', '⊕', '☽', '⊗', '△', '◈', '◉', '◎', '✦', '⊛', '⊜', '☼', '☯', '⚶', '♄', '♃', '♂']
const PRESET_COLORS = [
  { label: 'Vermelho', value: '#b02a1e' },
  { label: 'Dourado', value: '#8b6914' },
  { label: 'Verde', value: '#4a7a5e' },
  { label: 'Roxo', value: '#7a4e8b' },
  { label: 'Azul', value: '#2a6e8b' },
  { label: 'Vinho', value: '#6e2a4a' },
  { label: 'Bronze', value: '#8b5e2a' },
  { label: 'Índigo', value: '#3a2a8b' },
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--faint)',
  color: 'var(--cream)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  padding: '10px 14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: 3,
  textTransform: 'uppercase' as const,
  color: 'var(--muted)',
  marginBottom: 6,
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export default function CategoryForm({ mode, initial = {}, categoryId }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugManual, setSlugManual] = useState(mode === 'edit')
  const originalSlug = initial.slug ?? ''

  const [form, setForm] = useState<CategoryData>({
    slug:        initial.slug        ?? '',
    label:       initial.label       ?? '',
    symbol:      initial.symbol      ?? '◉',
    color:       initial.color       ?? '#b02a1e',
    description: initial.description ?? '',
    sort_order:  initial.sort_order  ?? 99,
  })

  function set<K extends keyof CategoryData>(k: K, v: CategoryData[K]) {
    setForm(f => {
      const next = { ...f, [k]: v }
      if (k === 'label' && !slugManual) {
        next.slug = slugify(v as string)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const isSlugChanged = mode === 'edit' && form.slug !== originalSlug

    const res = mode === 'edit' && categoryId
      ? await fetch(`/api/admin/categories/${categoryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, originalSlug: isSlugChanged ? originalSlug : undefined }),
        })
      : await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Erro ao salvar.')
      setSaving(false)
      return
    }

    router.push('/admin/categorias')
    router.refresh()
  }

  const preview = { ...form }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32, maxWidth: 680 }}>

      {/* Preview chip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', border: `1px solid ${preview.color}`, background: `${preview.color}18` }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: preview.color }}>{preview.symbol}</span>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 2, color: 'var(--cream)' }}>{preview.label || 'Nome da Categoria'}</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>/categorias/{preview.slug || 'slug'}</p>
        </div>
      </div>

      {/* Label */}
      <div>
        <label style={labelStyle}>Nome</label>
        <input
          required
          type="text"
          value={form.label}
          onChange={e => set('label', e.target.value)}
          placeholder="Ex: Magia Cerimonial"
          style={inputStyle}
        />
      </div>

      {/* Slug */}
      <div>
        <label style={labelStyle}>Slug (URL) {slugManual && <span style={{ color: 'var(--red-dim)' }}>— editando manualmente</span>}</label>
        <input
          required
          type="text"
          value={form.slug}
          onChange={e => { setSlugManual(true); set('slug', slugify(e.target.value)) }}
          placeholder="magia-cerimonial"
          style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 13 }}
          />
        {mode === 'edit' && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red-dim)', marginTop: 4 }}>⚠ Alterar o slug atualiza automaticamente todas as transmissões vinculadas.</p>}
      </div>

      {/* Symbol */}
      <div>
        <label style={labelStyle}>Símbolo</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {PRESET_SYMBOLS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => set('symbol', s)}
              style={{
                width: 40, height: 40,
                background: form.symbol === s ? form.color : 'var(--surface)',
                border: `1px solid ${form.symbol === s ? form.color : 'var(--faint)'}`,
                color: form.symbol === s ? '#fff' : 'var(--cream)',
                fontFamily: 'var(--font-mono)', fontSize: 18,
                cursor: 'pointer',
              }}
            >{s}</button>
          ))}
        </div>
        <input
          type="text"
          value={form.symbol}
          onChange={e => set('symbol', e.target.value)}
          placeholder="ou digite qualquer caractere"
          style={{ ...inputStyle, width: 200, fontFamily: 'var(--font-mono)', fontSize: 18, textAlign: 'center' }}
          maxLength={4}
        />
      </div>

      {/* Color */}
      <div>
        <label style={labelStyle}>Cor</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {PRESET_COLORS.map(({ label, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => set('color', value)}
              title={label}
              style={{
                width: 32, height: 32,
                background: value,
                border: form.color === value ? '2px solid var(--cream)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="color"
            value={form.color}
            onChange={e => set('color', e.target.value)}
            style={{ width: 40, height: 40, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
          />
          <input
            type="text"
            value={form.color}
            onChange={e => set('color', e.target.value)}
            placeholder="#b02a1e"
            style={{ ...inputStyle, width: 140, fontFamily: 'var(--font-mono)', fontSize: 13 }}
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Descrição curta (opcional)</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Uma breve descrição da categoria..."
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
        />
      </div>

      {/* Sort order */}
      <div>
        <label style={labelStyle}>Ordem de exibição</label>
        <input
          type="number"
          min={1}
          value={form.sort_order}
          onChange={e => set('sort_order', Number(e.target.value))}
          style={{ ...inputStyle, width: 120 }}
        />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderLeft: '3px solid var(--red)', background: 'var(--red-faint)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="submit"
          disabled={saving}
          style={{ padding: '12px 28px', background: 'var(--red)', border: '1px solid var(--red)', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.6 : 1 }}
        >
          {saving ? 'Salvando…' : mode === 'create' ? 'Criar Categoria →' : 'Salvar →'}
        </button>
        <a href="/admin/categorias" style={{ padding: '12px 20px', background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
          Cancelar
        </a>
      </div>
    </form>
  )
}
