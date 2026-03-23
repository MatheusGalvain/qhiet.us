'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CATEGORY_META, type Transmissao } from '@/types'

interface Props {
  initial?: Partial<Transmissao>
  mode: 'create' | 'edit'
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function TransmissaoForm({ initial = {}, mode }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugManual, setSlugManual] = useState(!!initial.slug)

  const [form, setForm] = useState({
    title:             initial.title            ?? '',
    slug:              initial.slug             ?? '',
    excerpt:           initial.excerpt          ?? '',
    content:           initial.content          ?? '',
    categories:        initial.categories       ?? [] as string[],
    access:            initial.access           ?? 'free',
    status:            initial.status           ?? 'draft',
    read_time_minutes: initial.read_time_minutes ?? 5,
    xp_reward:         initial.xp_reward        ?? 30,
  })

  // Auto-generate slug from title (unless manually edited)
  useEffect(() => {
    if (!slugManual && form.title) {
      setForm(f => ({ ...f, slug: slugify(f.title) }))
    }
  }, [form.title, slugManual])

  function toggle(cat: string) {
    setForm(f => ({
      ...f,
      categories: f.categories.includes(cat)
        ? f.categories.filter(c => c !== cat)
        : [...f.categories, cat],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const url = mode === 'create'
      ? '/api/admin/transmissoes'
      : `/api/admin/transmissoes/${initial.id}`

    const res = await fetch(url, {
      method: mode === 'create' ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const { error: msg } = await res.json()
      setError(msg ?? 'Erro desconhecido')
      setSaving(false)
      return
    }

    router.push('/admin/transmissoes')
    router.refresh()
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--faint)',
    color: 'var(--cream)',
    fontFamily: 'var(--font-body)',
    fontSize: 15,
    padding: '12px 14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
    color: 'var(--muted)',
    display: 'block',
    marginBottom: 8,
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ border: '1px solid var(--red-dim)', background: 'var(--red-faint)', padding: '12px 16px', marginBottom: 24, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--red)' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

        {/* Left column — main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Title */}
          <div>
            <label style={labelStyle}>Título</label>
            <input
              required
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="O Grande Trabalho Alquímico"
              style={inputStyle}
            />
          </div>

          {/* Slug */}
          <div>
            <label style={labelStyle}>Slug (URL)</label>
            <input
              required
              value={form.slug}
              onChange={e => { setSlugManual(true); setForm(f => ({ ...f, slug: slugify(e.target.value) })) }}
              placeholder="o-grande-trabalho-alquimico"
              style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, color: 'var(--muted)', marginTop: 6 }}>
              /artigo/{form.slug || '…'}
            </p>
          </div>

          {/* Excerpt */}
          <div>
            <label style={labelStyle}>Resumo (excerpt)</label>
            <textarea
              required
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Breve descrição exibida nos cards…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
            />
          </div>

          {/* Content */}
          <div>
            <label style={labelStyle}>Conteúdo</label>
            <textarea
              required
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Escreva o texto completo da transmissão aqui. Markdown e HTML são suportados…"
              rows={24}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.8, fontFamily: 'var(--font-mono)', fontSize: 13 }}
            />
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 1, color: 'var(--muted)', marginTop: 6 }}>
              {form.content.split(/\s+/).filter(Boolean).length} palavras · ~{Math.max(1, Math.round(form.content.split(/\s+/).filter(Boolean).length / 200))} min de leitura
            </p>
          </div>
        </div>

        {/* Right column — metadata */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 24 }}>

          {/* Status */}
          <div style={{ border: '1px solid var(--faint)', padding: 20 }}>
            <label style={labelStyle}>Status</label>
            <div style={{ display: 'flex', gap: 0 }}>
              {(['draft', 'published'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, status: s }))}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    background: form.status === s ? (s === 'published' ? 'var(--gold)' : 'var(--red-faint)') : 'transparent',
                    color: form.status === s ? (s === 'published' ? '#000' : 'var(--cream)') : 'var(--muted)',
                    border: `1px solid ${form.status === s ? (s === 'published' ? 'var(--gold)' : 'var(--red-dim)') : 'var(--faint)'}`,
                    borderLeft: s === 'published' ? 'none' : undefined,
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {s === 'draft' ? 'Rascunho' : 'Publicado'}
                </button>
              ))}
            </div>
          </div>

          {/* Access */}
          <div style={{ border: '1px solid var(--faint)', padding: 20 }}>
            <label style={labelStyle}>Acesso</label>
            <div style={{ display: 'flex', gap: 0 }}>
              {(['free', 'locked'] as const).map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, access: a }))}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    letterSpacing: 3,
                    textTransform: 'uppercase',
                    background: form.access === a ? (a === 'free' ? 'rgba(255,255,255,0.06)' : 'var(--red-faint)') : 'transparent',
                    color: form.access === a ? 'var(--cream)' : 'var(--muted)',
                    border: `1px solid ${form.access === a ? (a === 'free' ? 'var(--faint)' : 'var(--red-dim)') : 'var(--faint)'}`,
                    borderLeft: a === 'locked' ? 'none' : undefined,
                    cursor: 'pointer',
                    transition: 'all .15s',
                  }}
                >
                  {a === 'free' ? 'Livre' : 'Assinante'}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div style={{ border: '1px solid var(--faint)', padding: 20 }}>
            <label style={labelStyle}>Categorias</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(CATEGORY_META).map(([key, meta]) => {
                const selected = form.categories.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: selected ? 'var(--red-faint)' : 'transparent',
                      border: `1px solid ${selected ? 'var(--red-dim)' : 'var(--faint)'}`,
                      cursor: 'pointer',
                      transition: 'all .15s',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: selected ? 'var(--red)' : 'var(--muted)', width: 20 }}>
                      {meta.symbol}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: selected ? 'var(--cream)' : 'var(--muted)' }}>
                      {meta.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Read time + XP */}
          <div style={{ border: '1px solid var(--faint)', padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={labelStyle}>Leitura (min)</label>
              <input
                type="number"
                min={1}
                max={120}
                value={form.read_time_minutes}
                onChange={e => setForm(f => ({ ...f, read_time_minutes: +e.target.value }))}
                style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 18, textAlign: 'center', padding: '10px 8px' }}
              />
            </div>
            <div>
              <label style={labelStyle}>XP Reward</label>
              <input
                type="number"
                min={5}
                max={500}
                step={5}
                value={form.xp_reward}
                onChange={e => setForm(f => ({ ...f, xp_reward: +e.target.value }))}
                style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 18, textAlign: 'center', padding: '10px 8px' }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ width: '100%', opacity: saving ? 0.6 : 1 }}
          >
            {saving ? 'Salvando…' : mode === 'create' ? 'Criar Transmissão →' : 'Salvar Alterações →'}
          </button>

          {mode === 'edit' && (
            <a
              href={`/artigo/${form.slug}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', textDecoration: 'none', textAlign: 'center', display: 'block' }}
            >
              Ver no portal ↗
            </a>
          )}
        </div>
      </div>
    </form>
  )
}
