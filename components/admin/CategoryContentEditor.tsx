'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface TimelineItem { year: string; event: string }
interface FigureItem { name: string; era: string; contribution: string }

interface CategoryContent {
  category: string
  desc_col1_html: string
  desc_col2_html: string
  timeline: TimelineItem[]
  figures: FigureItem[]
}

interface Props {
  slug: string
  initialContent: CategoryContent | null
}

const BLANK: CategoryContent = {
  category: '',
  desc_col1_html: '',
  desc_col2_html: '',
  timeline: [],
  figures: [],
}

export default function CategoryContentEditor({ slug, initialContent }: Props) {
  const [content, setContent] = useState<CategoryContent>({
    ...BLANK,
    ...initialContent,
    category: slug,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = useCallback(<K extends keyof CategoryContent>(key: K, val: CategoryContent[K]) => {
    setContent(c => ({ ...c, [key]: val }))
    setSaved(false)
  }, [])

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: err } = await supabase
        .from('category_content')
        .upsert({ ...content, category: slug }, { onConflict: 'category' })
      if (err) throw err
      setSaved(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  /* ── Timeline helpers ── */
  const addTimelineItem = () =>
    update('timeline', [...content.timeline, { year: '', event: '' }])

  const updateTimeline = (i: number, field: keyof TimelineItem, val: string) =>
    update('timeline', content.timeline.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const removeTimeline = (i: number) =>
    update('timeline', content.timeline.filter((_, idx) => idx !== i))

  /* ── Figures helpers ── */
  const addFigure = () =>
    update('figures', [...content.figures, { name: '', era: '', contribution: '' }])

  const updateFigure = (i: number, field: keyof FigureItem, val: string) =>
    update('figures', content.figures.map((fig, idx) => idx === i ? { ...fig, [field]: val } : fig))

  const removeFigure = (i: number) =>
    update('figures', content.figures.filter((_, idx) => idx !== i))

  const inputStyle = {
    width: '100%',
    background: 'var(--paper)',
    border: '1px solid var(--faint)',
    color: 'var(--cream)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: 1,
    padding: '10px 14px',
    outline: 'none',
    resize: 'vertical' as const,
    lineHeight: 1.6,
  }

  const labelStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: 3,
    color: 'var(--muted)',
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: 8,
  }

  const sectionStyle = {
    border: '1px solid var(--faint)',
    padding: '28px 24px',
    marginBottom: 20,
  }

  return (
    <div>
      {/* DESCRIPTION */}
      <div style={sectionStyle}>
        <p style={{ ...labelStyle, fontSize: 11, color: 'var(--red)', marginBottom: 20 }}>Descrição · 2 Colunas (HTML)</p>
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

      {/* TIMELINE */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ ...labelStyle, fontSize: 11, color: 'var(--red)', marginBottom: 0 }}>
            Linha do Tempo · {content.timeline.length} eventos
          </p>
          <button
            onClick={addTimelineItem}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', padding: '6px 14px', cursor: 'pointer' }}
          >
            + Adicionar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {content.timeline.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <span style={labelStyle}>Ano / Período</span>
                <input
                  value={item.year}
                  onChange={e => updateTimeline(i, 'year', e.target.value)}
                  placeholder="Séc. II"
                  style={{ ...inputStyle, resize: undefined }}
                />
              </div>
              <div>
                <span style={labelStyle}>Evento</span>
                <textarea
                  rows={2}
                  value={item.event}
                  onChange={e => updateTimeline(i, 'event', e.target.value)}
                  placeholder="Descrição do evento histórico..."
                  style={inputStyle}
                />
              </div>
              <button
                onClick={() => removeTimeline(i)}
                style={{ marginTop: 26, background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', cursor: 'pointer', height: 36, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 14, flexShrink: 0 }}
                title="Remover"
              >×</button>
            </div>
          ))}
          {content.timeline.length === 0 && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Nenhum evento adicionado
            </p>
          )}
        </div>
      </div>

      {/* FIGURES */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <p style={{ ...labelStyle, fontSize: 11, color: 'var(--red)', marginBottom: 0 }}>
            Figuras Notáveis · {content.figures.length} pessoas
          </p>
          <button
            onClick={addFigure}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', padding: '6px 14px', cursor: 'pointer' }}
          >
            + Adicionar
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {content.figures.map((fig, i) => (
            <div key={i} style={{ border: '1px solid var(--faint)', padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <span style={labelStyle}>Nome</span>
                <input value={fig.name} onChange={e => updateFigure(i, 'name', e.target.value)} placeholder="Hermes Trismegisto" style={{ ...inputStyle, resize: undefined }} />
              </div>
              <div>
                <span style={labelStyle}>Época / Era</span>
                <input value={fig.era} onChange={e => updateFigure(i, 'era', e.target.value)} placeholder="Séc. II d.C." style={{ ...inputStyle, resize: undefined }} />
              </div>
              <div>
                <span style={labelStyle}>Contribuição</span>
                <input value={fig.contribution} onChange={e => updateFigure(i, 'contribution', e.target.value)} placeholder="Desenvolveu o hermetismo..." style={{ ...inputStyle, resize: undefined }} />
              </div>
              <button
                onClick={() => removeFigure(i)}
                style={{ marginTop: 26, background: 'transparent', border: '1px solid var(--faint)', color: 'var(--muted)', cursor: 'pointer', height: 36, width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 14, flexShrink: 0 }}
                title="Remover"
              >×</button>
            </div>
          ))}
          {content.figures.length === 0 && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Nenhuma figura adicionada
            </p>
          )}
        </div>
      </div>

      {/* SAVE */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '24px 0' }}>
        <button
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
          {saving ? 'Salvando…' : 'Salvar Conteúdo'}
        </button>

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
