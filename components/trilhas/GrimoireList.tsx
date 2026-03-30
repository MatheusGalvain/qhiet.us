'use client'

import { useState, useRef } from 'react'

interface TrailEntry {
  trail_id: string
  trail_title: string | null
  content: string
  updated_at: string | null
}

const PER_TRAIL_LIMIT = 7500

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function GrimoireEntry({ entry, onUpdate }: {
  entry: TrailEntry
  onUpdate: (trailId: string, newContent: string) => void
}) {
  const [content, setContent] = useState(entry.content ?? '')
  const [saved, setSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    const trimmed = value.slice(0, PER_TRAIL_LIMIT)
    setContent(trimmed)
    setSaved(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/grimorio', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trail_id: entry.trail_id, content: trimmed }),
        })
        const data = await res.json()
        if (data.success) {
          setSaved(true)
          onUpdate(entry.trail_id, trimmed)
        }
      } catch (_) {}
    }, 1000)
  }

  const pct = Math.round((content.length / PER_TRAIL_LIMIT) * 100)
  const nearLimit = content.length > PER_TRAIL_LIMIT * 0.9

  return (
    <div style={{ border: '1px solid var(--faint)', padding: '24px 28px', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--cream)', letterSpacing: 1, marginBottom: 4 }}>
            {entry.trail_title ?? 'Trilha'}
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Anotações da trilha
          </p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          {entry.updated_at && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cream)', letterSpacing: 1 }}>
              {formatDate(entry.updated_at)}
            </p>
          )}
          <a
            href={`/perfil/trilhas/${entry.trail_id}`}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', textDecoration: 'none' }}
          >
            Ver trilha →
          </a>
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <textarea
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder={`Suas anotações sobre "${entry.trail_title}"...`}
          style={{
            width: '100%',
            minHeight: 110,
            resize: 'vertical',
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--faint)',
            color: 'var(--muted)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            lineHeight: 1.7,
            padding: '12px 16px 28px',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color .2s',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'var(--muted)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--faint)' }}
        />
        <div style={{
          position: 'absolute', bottom: 10, right: 14,
          fontFamily: 'var(--font-mono)', fontSize: 9,
          display: 'flex', gap: 12, alignItems: 'center',
        }}>
          {saved && <span style={{ color: 'var(--gold)', letterSpacing: 2, textTransform: 'uppercase' }}>Salvo</span>}
          <span style={{ color: nearLimit ? 'var(--red)' : 'var(--faint)', letterSpacing: 1 }}>
            {content.length}/{PER_TRAIL_LIMIT}
          </span>
        </div>
      </div>

      {/* Per-entry progress bar */}
      <div style={{ height: 1, background: 'var(--faint)', marginTop: 8 }}>
        <div style={{
          height: '100%',
          width: `${Math.min(100, pct)}%`,
          background: nearLimit ? '#b02a1e' : pct > 70 ? '#c8960a' : '#4a6a4a',
          transition: 'width .3s ease',
        }} />
      </div>
    </div>
  )
}

interface Props {
  initialEntries: TrailEntry[]
}

export default function GrimoireList({ initialEntries }: Props) {
  const [entries, setEntries] = useState(initialEntries)

  function handleUpdate(trailId: string, newContent: string) {
    setEntries(prev =>
      prev.map(e => e.trail_id === trailId ? { ...e, content: newContent, updated_at: new Date().toISOString() } : e)
    )
  }

  if (entries.length === 0) {
    return (
      <div style={{ padding: '48px 0', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
          Nenhuma trilha iniciada ainda
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {entries.map(entry => (
        <GrimoireEntry key={entry.trail_id} entry={entry} onUpdate={handleUpdate} />
      ))}
    </div>
  )
}
