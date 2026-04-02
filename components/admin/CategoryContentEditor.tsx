'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TimelineItem { date: string; title: string }
interface FigureItem   { name: string; period: string; desc: string; symbol: string; image_url?: string }

interface CategoryContent {
  category:      string
  desc_col1_html: string
  desc_col2_html: string
  timeline:      TimelineItem[]
  figures:       FigureItem[]
}

interface CategoryMeta {
  label:      string
  symbol:     string
  color:      string
  sort_order: number
  tags:       string[]
}

interface Props {
  slug:           string
  categoryId:     string
  initialContent: CategoryContent | null
  initialMeta:    CategoryMeta
}

const BLANK_CONTENT: CategoryContent = {
  category:      '',
  desc_col1_html: '',
  desc_col2_html: '',
  timeline:      [],
  figures:       [],
}

const PRESET_SYMBOLS = ['☿', '✡', '⊕', '☽', '⊗', '△', '◈', '◉', '◎', '✦', '⊛', '⊜', '☼', '☯', '⚶', '♄', '♃', '♂']

const PRESET_COLORS = [
  '#b02a1e', '#8b6914', '#4a7a5e', '#7a4e8b',
  '#2a6e8b', '#6e2a4a', '#8b5e2a', '#3a2a8b',
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--paper)',
  border: '1px solid var(--faint)',
  color: 'var(--cream)',
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  letterSpacing: 1,
  padding: '10px 14px',
  outline: 'none',
  resize: 'vertical',
  lineHeight: 1.6,
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: 3,
  color: 'var(--muted)',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: 8,
}

const sectionStyle: React.CSSProperties = {
  border: '1px solid var(--faint)',
  padding: '28px 24px',
  marginBottom: 20,
}

function slugify(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

export default function CategoryContentEditor({ slug, categoryId, initialContent, initialMeta }: Props) {
  /* ── Meta (categories table) ── */
  const [meta, setMeta] = useState<CategoryMeta>(initialMeta)
  const [editedSlug, setEditedSlug] = useState(slug)
  const [newTag, setNewTag] = useState('')

  const updateMeta = <K extends keyof CategoryMeta>(k: K, v: CategoryMeta[K]) =>
    setMeta(m => ({ ...m, [k]: v }))

  const addTag = () => {
    const t = newTag.trim().toUpperCase()
    if (t && !meta.tags.includes(t)) {
      updateMeta('tags', [...meta.tags, t])
    }
    setNewTag('')
  }

  const removeTag = (i: number) =>
    updateMeta('tags', meta.tags.filter((_, idx) => idx !== i))

  /* ── Content (category_content table) ── */
  const [content, setContent] = useState<CategoryContent>({
    ...BLANK_CONTENT,
    ...initialContent,
    category: slug,
  })

  const update = useCallback(<K extends keyof CategoryContent>(key: K, val: CategoryContent[K]) => {
    setContent(c => ({ ...c, [key]: val }))
    setSaved(false)
  }, [])

  /* ── Save state ── */
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const slugChanged = editedSlug !== slug

      // 1. Save meta + optional slug rename via PATCH on [id]
      const metaRes = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...meta,
          slug: editedSlug,
          ...(slugChanged ? { originalSlug: slug } : {}),
        }),
      })
      if (!metaRes.ok) {
        const d = await metaRes.json()
        throw new Error(d.error ?? 'Erro ao salvar categoria')
      }

      // 2. Save content → category_content table (use current slug for FK)
      const supabase = createClient()
      const { error: err } = await supabase
        .from('category_content')
        .upsert({ ...content, category: slugChanged ? editedSlug : slug }, { onConflict: 'category' })
      if (err) throw err

      setSaved(true)

      // If slug changed, redirect to new URL
      if (slugChanged) {
        window.location.href = `/admin/categorias/${editedSlug}`
        return
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  /* ── Timeline helpers ── */
  const addTimelineItem = () =>
    update('timeline', [...content.timeline, { date: '', title: '' }])

  const updateTimeline = (i: number, field: keyof TimelineItem, val: string) =>
    update('timeline', content.timeline.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const removeTimeline = (i: number) =>
    update('timeline', content.timeline.filter((_, idx) => idx !== i))

  /* ── Figure helpers ── */
  const addFigure = () =>
    update('figures', [...content.figures, { name: '', period: '', desc: '', symbol: '', image_url: '' }])

  const updateFigure = (i: number, field: keyof FigureItem, val: string) =>
    update('figures', content.figures.map((fig, idx) => idx === i ? { ...fig, [field]: val } : fig))

  const removeFigure = (i: number) =>
    update('figures', content.figures.filter((_, idx) => idx !== i))

  const btnSmall: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase',
    background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)',
    padding: '6px 14px', cursor: 'pointer',
  }

  const btnIcon: React.CSSProperties = {
    background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)',
    cursor: 'pointer', height: 36, width: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'var(--font-mono)', fontSize: 14, flexShrink: 0,
  }

  return (
    <div>

      {/* ══════════════════════════════════════════
          CONFIGURAÇÕES DA CATEGORIA
      ══════════════════════════════════════════ */}
      <div style={{ ...sectionStyle, borderColor: meta.color, borderLeftWidth: 3 }}>
        <p style={{ ...labelStyle, fontSize: 11, color: 'var(--red)', marginBottom: 24 }}>
          Configurações da Categoria
        </p>

        {/* Preview */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 20px', marginBottom: 28,
          border: `1px solid ${meta.color}`, background: `${meta.color}18`,
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: meta.color }}>{meta.symbol}</span>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 2, color: 'var(--cream)' }}>
              {meta.label || 'Nome'}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
              /categorias/{slug}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Nome */}
          <div>
            <span style={labelStyle}>Nome</span>
            <input
              type="text"
              value={meta.label}
              onChange={e => updateMeta('label', e.target.value)}
              style={{ ...inputStyle, resize: undefined }}
              placeholder="Ex: Hermetismo"
            />
          </div>

          {/* Ordem */}
          <div>
            <span style={labelStyle}>Ordem de exibição</span>
            <input
              type="number"
              min={1}
              value={meta.sort_order}
              onChange={e => updateMeta('sort_order', Number(e.target.value))}
              style={{ ...inputStyle, resize: undefined, width: '100%' }}
            />
          </div>
        </div>

        {/* Slug editável */}
        <div style={{ marginTop: 20 }}>
          <span style={labelStyle}>Slug (URL)</span>
          <input
            type="text"
            value={editedSlug}
            onChange={e => setEditedSlug(slugify(e.target.value))}
            style={{ ...inputStyle, resize: undefined, fontFamily: 'var(--font-mono)', fontSize: 12 }}
            placeholder="ex: hermetismo"
          />
          {editedSlug !== slug && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red-dim)', marginTop: 4, letterSpacing: 1 }}>
              ⚠ Slug alterado: todas as transmissões vinculadas serão atualizadas ao salvar.
            </p>
          )}
        </div>

        {/* Símbolo */}
        <div style={{ marginTop: 20 }}>
          <span style={labelStyle}>Símbolo</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {PRESET_SYMBOLS.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => updateMeta('symbol', s)}
                style={{
                  width: 38, height: 38,
                  background: meta.symbol === s ? meta.color : 'var(--surface)',
                  border: `1px solid ${meta.symbol === s ? meta.color : 'var(--faint)'}`,
                  color: meta.symbol === s ? '#fff' : 'var(--cream)',
                  fontFamily: 'var(--font-mono)', fontSize: 18, cursor: 'pointer',
                }}
              >{s}</button>
            ))}
          </div>
          <input
            type="text"
            value={meta.symbol}
            onChange={e => updateMeta('symbol', e.target.value)}
            placeholder="ou qualquer caractere"
            maxLength={4}
            style={{ ...inputStyle, resize: undefined, width: 160, textAlign: 'center', fontSize: 18 }}
          />
        </div>

        {/* Cor */}
        <div style={{ marginTop: 20 }}>
          <span style={labelStyle}>Cor</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => updateMeta('color', c)}
                style={{
                  width: 32, height: 32, background: c,
                  border: meta.color === c ? '2px solid var(--cream)' : '2px solid transparent',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Native color picker — any color */}
            <label style={{ position: 'relative', width: 44, height: 44, cursor: 'pointer', flexShrink: 0 }}>
              <div style={{
                width: 44, height: 44,
                background: meta.color,
                border: '2px solid var(--faint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18,
              }}>🎨</div>
              <input
                type="color"
                value={meta.color}
                onChange={e => updateMeta('color', e.target.value)}
                style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', top: 0, left: 0, cursor: 'pointer' }}
              />
            </label>
            <input
              type="text"
              value={meta.color}
              onChange={e => updateMeta('color', e.target.value)}
              placeholder="#b02a1e"
              style={{ ...inputStyle, resize: undefined, width: 140, fontSize: 13 }}
            />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', letterSpacing: 1 }}>
              qualquer cor hex
            </span>
          </div>
        </div>

        {/* Tags / itens da categoria */}
        <div style={{ marginTop: 20 }}>
          <span style={labelStyle}>Tags / Itens visíveis na página de categorias</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {meta.tags.map((tag, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
                  textTransform: 'uppercase', color: meta.color,
                  border: `1px solid ${meta.color}66`, padding: '5px 12px',
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(i)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1, marginTop: -1 }}
                >×</button>
              </span>
            ))}
            {meta.tags.length === 0 && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase' }}>
                Nenhum item — adicione abaixo
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="Ex: Árvore da Vida"
              style={{ ...inputStyle, resize: undefined, flex: 1 }}
            />
            <button type="button" onClick={addTag} style={btnSmall}>
              + Adicionar
            </button>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)', letterSpacing: 1, marginTop: 6 }}>
            Pressione Enter ou clique em Adicionar. As tags aparecem como chips embaixo do nome da categoria.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          DESCRIÇÃO
      ══════════════════════════════════════════ */}
      <div style={sectionStyle}>
        <p style={{ ...labelStyle, fontSize: 11, color: 'var(--red)', marginBottom: 20 }}>
          Descrição · 2 Colunas (HTML)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <span style={labelStyle}>Coluna 1</span>
            <textarea
              rows={10}
              value={content.desc_col1_html}
              onChange={e => update('desc_col1_html', e.target.value)}
              placeholder="<p>Introdução à categoria...</p>"
              style={inputStyle}
            />
          </div>
          <div>
            <span style={labelStyle}>Coluna 2</span>
            <textarea
              rows={10}
              value={content.desc_col2_html}
              onChange={e => update('desc_col2_html', e.target.value)}
              placeholder="<p>Continuação ou contexto histórico...</p>"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          LINHA DO TEMPO
      ══════════════════════════════════════════ */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ ...labelStyle, fontSize: 11, color: 'var(--red)', marginBottom: 0 }}>
            Linha do Tempo · {content.timeline.length} eventos
          </p>
          <button type="button" onClick={addTimelineItem} style={btnSmall}>+ Adicionar</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {content.timeline.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <span style={labelStyle}>Ano / Período</span>
                <input
                  value={item.date}
                  onChange={e => updateTimeline(i, 'date', e.target.value)}
                  placeholder="Séc. II"
                  style={{ ...inputStyle, resize: undefined }}
                />
              </div>
              <div>
                <span style={labelStyle}>Evento</span>
                <textarea
                  rows={2}
                  value={item.title}
                  onChange={e => updateTimeline(i, 'title', e.target.value)}
                  placeholder="Descrição do evento histórico..."
                  style={inputStyle}
                />
              </div>
              <button type="button" onClick={() => removeTimeline(i)} style={{ ...btnIcon, marginTop: 26 }} title="Remover">×</button>
            </div>
          ))}
          {content.timeline.length === 0 && (
            <p style={{ ...labelStyle, fontSize: 11 }}>Nenhum evento adicionado</p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FIGURAS NOTÁVEIS
      ══════════════════════════════════════════ */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ ...labelStyle, fontSize: 11, color: 'var(--red)', marginBottom: 0 }}>
            Figuras Notáveis · {content.figures.length} pessoas
          </p>
          <button type="button" onClick={addFigure} style={btnSmall}>+ Adicionar</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {content.figures.map((fig, i) => (
            <div key={i} style={{ border: '1px solid var(--faint)', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Row 1: nome, era, contribuição, remove */}
              <div style={{ display: 'grid', gridTemplateColumns: '180px 80px 1fr 40px', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <span style={labelStyle}>Nome</span>
                  <input value={fig.name} onChange={e => updateFigure(i, 'name', e.target.value)} placeholder="Hermes Trismegisto" style={{ ...inputStyle, resize: undefined }} />
                </div>
                <div>
                  <span style={labelStyle}>Símbolo</span>
                  <input value={fig.symbol ?? ''} onChange={e => updateFigure(i, 'symbol', e.target.value)} placeholder="☿" style={{ ...inputStyle, resize: undefined, textAlign: 'center', fontSize: 18 }} />
                </div>
                <div>
                  <span style={labelStyle}>Época / Período</span>
                  <input value={fig.period} onChange={e => updateFigure(i, 'period', e.target.value)} placeholder="Séc. II d.C." style={{ ...inputStyle, resize: undefined }} />
                </div>
                <button type="button" onClick={() => removeFigure(i)} style={{ ...btnIcon, marginTop: 26 }} title="Remover">×</button>
              </div>
              <div>
                <span style={labelStyle}>Descrição / Contribuição</span>
                <textarea rows={2} value={fig.desc} onChange={e => updateFigure(i, 'desc', e.target.value)} placeholder="Desenvolveu o hermetismo e é considerado pai da alquimia..." style={inputStyle} />
              </div>
              {/* Row 2: imagem */}
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <span style={labelStyle}>Imagem (URL) — opcional</span>
                  <input
                    value={fig.image_url ?? ''}
                    onChange={e => updateFigure(i, 'image_url', e.target.value)}
                    placeholder="https://upload.wikimedia.org/wikipedia/commons/..."
                    style={{ ...inputStyle, resize: undefined }}
                  />
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, color: 'var(--faint)', marginTop: 4 }}>
                    Cole a URL direta de uma imagem (Wikimedia, etc.). Será exibida no card público com sobreposição gradiente.
                  </p>
                </div>
                {fig.image_url && (
                  <div style={{
                    width: 72, height: 72, flexShrink: 0,
                    backgroundImage: `url(${fig.image_url})`,
                    backgroundSize: 'cover', backgroundPosition: 'center top',
                    border: '1px solid var(--faint)',
                    marginTop: 22,
                  }} />
                )}
              </div>
            </div>
          ))}
          {content.figures.length === 0 && (
            <p style={{ ...labelStyle, fontSize: 11 }}>Nenhuma figura adicionada</p>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════
          SALVAR
      ══════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px 0' }}>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
            background: saving ? 'var(--muted)' : 'var(--red)',
            border: 'none', color: '#fff',
            padding: '14px 36px', cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1, transition: 'all .2s',
          }}
        >
          {saving ? 'Salvando…' : 'Salvar Tudo'}
        </button>

        <a
          href="/admin/categorias"
          style={{ padding: '14px 20px', background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', textDecoration: 'none' }}
        >
          ← Voltar
        </a>

        {saved && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--gold)', textTransform: 'uppercase' }}>
            ✦ Salvo com sucesso
          </span>
        )}
        {error && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--red)' }}>
            Erro: {error}
          </span>
        )}
      </div>
    </div>
  )
}
