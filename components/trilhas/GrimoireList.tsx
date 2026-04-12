'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface TrailEntry {
  trail_id: string
  trail_title: string
  content: string
  updated_at: string | null
}

const PER_TX_LIMIT = 10000

function formatDate(iso: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d atrás`
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ─── Card editor (detalhe) ─────────────────────────────────────────────── */
function GrimoireEditor({
  entry,
  onBack,
  onUpdate,
}: {
  entry: TrailEntry
  onBack: () => void
  onUpdate: (trailId: string, newContent: string) => void
}) {
  const [content, setContent]     = useState(entry.content ?? '')
  const [saved, setSaved]         = useState(false)
  const [saveError, setSaveError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(value: string) {
    const trimmed = value.slice(0, PER_TX_LIMIT)
    setContent(trimmed)
    setSaved(false)
    setSaveError(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/grimorio', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trail_id: entry.trail_id, content: trimmed }),
        })
        if (!res.ok) { setSaveError(true); return }
        const data = await res.json()
        if (data.success) {
          setSaved(true)
          onUpdate(entry.trail_id, trimmed)
        } else {
          setSaveError(true)
        }
      } catch (_) { setSaveError(true) }
    }, 800)
  }

  const nearLimit = content.length > PER_TX_LIMIT * 0.9

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #1a1410',
        background: '#0a0806',
        gap: 12,
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: 'var(--font-mono)', fontSize: 9,
            letterSpacing: 3, color: 'rgba(200,150,10,0.45)',
            textTransform: 'uppercase', cursor: 'pointer',
            padding: 0, transition: 'color .15s', flexShrink: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#c8960a' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(200,150,10,0.45)' }}
        >
          ← Grimório
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveError && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#b02a1e', letterSpacing: 2, textTransform: 'uppercase' }}>
              ✕ Erro ao salvar
            </span>
          )}
          {saved && !saveError && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#c8960a', letterSpacing: 2, textTransform: 'uppercase' }}>
              ● Salvo
            </span>
          )}
          <Link
            href={`/perfil/trilhas/${entry.trail_id}`}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              letterSpacing: 2, color: 'rgba(200,150,10,0.35)',
              textTransform: 'uppercase', textDecoration: 'none',
              transition: 'color .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#c8960a' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(200,150,10,0.35)' }}
          >
            Ver trilha →
          </Link>
        </div>
      </div>

      {/* Trail title */}
      <div style={{
        padding: '24px 20px 16px',
        borderBottom: '1px solid #1a1410',
        background: 'rgba(200,150,10,0.02)',
      }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 8,
          letterSpacing: 4, color: 'rgba(200,150,10,0.35)',
          textTransform: 'uppercase', marginBottom: 8,
        }}>
          ✦ Trilha
        </p>
        <h2 style={{
          fontFamily: 'var(--font-display)', fontSize: 'clamp(18px,3vw,26px)',
          letterSpacing: 2, color: 'rgba(232,213,176,0.9)',
          lineHeight: 1.2,
        }}>
          {entry.trail_title}
        </h2>
      </div>

      {/* Editor */}
      <div style={{ position: 'relative', background: '#080503' }}>
        <textarea
          value={content}
          onChange={e => handleChange(e.target.value)}
          placeholder={`Suas anotações sobre "${entry.trail_title}"...\n\nUse este espaço para registrar percepções, insights, conexões e reflexões sobre a trilha.`}
          autoFocus
          style={{
            width: '100%',
            minHeight: 480,
            resize: 'vertical',
            background: 'transparent',
            border: 'none',
            color: 'rgba(232,213,176,0.85)',
            fontFamily: 'var(--font-body)',
            fontSize: 15,
            lineHeight: 1.8,
            padding: '24px 20px 48px',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {/* Counter + date */}
        <div style={{
          position: 'absolute', bottom: 12, left: 20, right: 20,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          pointerEvents: 'none',
        }}>
          {entry.updated_at && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.12)', letterSpacing: 1 }}>
              Última edição: {formatDate(entry.updated_at)}
            </span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 8,
            color: nearLimit ? '#b02a1e' : 'rgba(255,255,255,0.15)',
            letterSpacing: 1, marginLeft: 'auto',
          }}>
            {content.length.toLocaleString('pt-BR')} / {PER_TX_LIMIT.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ─── Card de lista ─────────────────────────────────────────────────────── */
function TrailCard({ entry, onClick }: { entry: TrailEntry; onClick: () => void }) {
  const [hovered, setHovered] = useState(false)
  const preview = entry.content?.trim().slice(0, 140) ?? ''
  const hasNote = preview.length > 0
  const wordCount = entry.content?.trim().split(/\s+/).filter(Boolean).length ?? 0

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: hovered ? 'rgba(200,150,10,0.04)' : '#0a0806',
        border: `1px solid ${hovered ? 'rgba(200,150,10,0.4)' : '#1a1410'}`,
        padding: 0,
        cursor: 'pointer',
        transition: 'background .2s, border-color .2s',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '16px 20px 14px',
        borderBottom: `1px solid ${hovered ? '#1a1410' : '#0f0c09'}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 7,
            letterSpacing: 3, color: hovered ? 'rgba(200,150,10,0.5)' : 'rgba(200,150,10,0.25)',
            textTransform: 'uppercase', marginBottom: 6,
            transition: 'color .2s',
          }}>
            ✦ Trilha
          </p>
          <p style={{
            fontFamily: 'var(--font-display)', fontSize: 16,
            letterSpacing: 1, color: hovered ? 'rgba(232,213,176,0.95)' : 'rgba(232,213,176,0.75)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'color .2s',
          }}>
            {entry.trail_title}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
          {entry.updated_at && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,0.18)', letterSpacing: 1 }}>
              {formatDate(entry.updated_at)}
            </span>
          )}
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 7,
            letterSpacing: 2, textTransform: 'uppercase',
            color: hasNote ? 'rgba(200,150,10,0.4)' : 'rgba(255,255,255,0.1)',
          }}>
            {wordCount} palavras
          </span>
        </div>
      </div>

      {/* Preview — já expandido */}
      <div style={{ padding: '14px 20px 18px', background: '#080503' }}>
        {hasNote ? (
          <>
            <p style={{
              fontFamily: 'var(--font-body)', fontSize: 13,
              color: 'rgba(232,213,176,0.45)', lineHeight: 1.7,
              margin: 0, fontStyle: 'italic',
            }}>
              {preview}{entry.content.length > 140 ? '…' : ''}
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 8,
              color: hovered ? 'rgba(200,150,10,0.5)' : 'rgba(200,150,10,0.2)',
              letterSpacing: 2, textTransform: 'uppercase',
              marginTop: 12, transition: 'color .2s',
            }}>
              Editar anotação →
            </p>
          </>
        ) : (
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 9,
            color: 'rgba(255,255,255,0.15)', letterSpacing: 2,
            textTransform: 'uppercase', margin: 0,
          }}>
            Nenhuma anotação — clique para escrever
          </p>
        )}
      </div>
    </button>
  )
}

/* ─── Root component ────────────────────────────────────────────────────── */
interface Props {
  initialEntries: TrailEntry[]
}

export default function GrimoireList({ initialEntries }: Props) {
  const [entries, setEntries]     = useState(initialEntries)
  const [selected, setSelected]   = useState<string | null>(null)

  function handleUpdate(trailId: string, newContent: string) {
    setEntries(prev => prev.map(e =>
      e.trail_id === trailId
        ? { ...e, content: newContent, updated_at: new Date().toISOString() }
        : e
    ))
  }

  if (entries.length === 0) {
    return (
      <div style={{
        border: '1px solid rgba(200,150,10,0.15)',
        background: '#0a0806',
        padding: '64px 32px',
        textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: 'rgba(200,150,10,0.3)', textTransform: 'uppercase', marginBottom: 16 }}>◈</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: 2, color: 'rgba(232,213,176,0.4)', marginBottom: 10 }}>
          Grimório vazio
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.15)', textTransform: 'uppercase', marginBottom: 28 }}>
          Nenhuma anotação salva ainda
        </p>
        <Link href="/perfil/trilhas" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 3, color: '#c8960a', textTransform: 'uppercase', textDecoration: 'none' }}>
          → Começar trilhas
        </Link>
      </div>
    )
  }

  /* Detalhe */
  if (selected) {
    const entry = entries.find(e => e.trail_id === selected)
    if (!entry) return null
    return (
      <div style={{ border: '1px solid #1a1410', background: '#080503' }}>
        <GrimoireEditor
          entry={entry}
          onBack={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      </div>
    )
  }

  /* Lista */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 8,
        letterSpacing: 3, color: 'rgba(255,255,255,0.18)',
        textTransform: 'uppercase', marginBottom: 4,
      }}>
        {entries.length} {entries.length === 1 ? 'trilha anotada' : 'trilhas anotadas'}
      </p>
      {entries.map(entry => (
        <TrailCard
          key={entry.trail_id}
          entry={entry}
          onClick={() => setSelected(entry.trail_id)}
        />
      ))}
    </div>
  )
}
