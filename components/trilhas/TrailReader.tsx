'use client'

import { useState, useEffect, useRef } from 'react'

interface Tx {
  id: string
  title: string
  content: string
  read_time_minutes: number
}

interface Props {
  tx: Tx
  trailId: string
  isCompleted: boolean
  isUnlocked: boolean
  onMarkComplete: (txId: string) => Promise<void>
  onClose: () => void
  totalCount: number
  currentIndex: number
  onNavigate: (dir: 'prev' | 'next') => void
  canNavigateNext: boolean
  canNavigatePrev: boolean
  isSubscriber: boolean
  sectionTitle?: string | null
  onBackToSection?: () => void
}

const PER_TRAIL_LIMIT = 7500

export default function TrailReader({
  tx,
  trailId,
  isCompleted,
  onMarkComplete,
  onClose,
  totalCount,
  currentIndex,
  onNavigate,
  canNavigateNext,
  canNavigatePrev,
  isSubscriber,
  sectionTitle,
  onBackToSection,
}: Props) {
  const [marking, setMarking] = useState(false)
  const [grimoire, setGrimoire] = useState('')
  const [grimoireSaved, setGrimoireSaved] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isSubscriber) return
    setGrimoire('')
    setGrimoireSaved(false)
    fetch(`/api/grimorio?trail_id=${trailId}`)
      .then(r => r.json())
      .then(d => { if (d?.content) setGrimoire(d.content) })
      .catch(() => {})
  }, [trailId, isSubscriber])

  function handleGrimoireChange(value: string) {
    const trimmed = value.slice(0, PER_TRAIL_LIMIT)
    setGrimoire(trimmed)
    setGrimoireSaved(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch('/api/grimorio', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trail_id: trailId, content: trimmed }),
        })
        const data = await res.json()
        if (data.success) setGrimoireSaved(true)
      } catch (_) {}
    }, 1000)
  }

  async function handleComplete() {
    setMarking(true)
    await onMarkComplete(tx.id)
    setMarking(false)
  }

  // Renderiza markdown básico
  function renderContent(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      if (line.startsWith('### ')) return (
        <h3 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--cream)', letterSpacing: 2, marginTop: 24, marginBottom: 8 }}>
          {line.slice(4)}
        </h3>
      )
      if (line.startsWith('## ')) return (
        <h2 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--cream)', letterSpacing: 2, marginTop: 32, marginBottom: 10 }}>
          {line.slice(3)}
        </h2>
      )
      if (line.startsWith('# ')) return (
        <h1 key={i} style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--cream)', letterSpacing: 3, marginTop: 32, marginBottom: 12 }}>
          {line.slice(2)}
        </h1>
      )
      if (line.startsWith('---')) return (
        <hr key={i} style={{ border: 'none', borderTop: '1px solid var(--faint)', margin: '24px 0' }} />
      )
      if (line.trim() === '') return <div key={i} style={{ height: 12 }} />

      const formatted = line
        .replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--cream)">$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code style="fontFamily:monospace;background:rgba(255,255,255,0.06);padding:1px 6px;fontSize:13px">$1</code>')

      return (
        <p key={i}
          style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--muted)', lineHeight: 1.9, marginBottom: 0 }}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      )
    })
  }

  return (
    <div style={{ border: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 640, minHeight: 400 }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          {onBackToSection && (
            <button onClick={onBackToSection} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1, padding: 0, flexShrink: 0 }}>
              ←
            </button>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', flexShrink: 0 }}>
            {sectionTitle ? `${sectionTitle} · ` : ''}{String(currentIndex + 1).padStart(2, '0')}/{String(totalCount).padStart(2, '0')}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--cream)', letterSpacing: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tx.title}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)', letterSpacing: 2 }}>
            ~{tx.read_time_minutes}min
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px' }}>
        {renderContent(tx.content)}
      </div>

      {/* Grimório — exclusivo assinante, aparece somente na página /perfil/grimorio */}
      {isSubscriber && (
        <div style={{ borderTop: '1px solid var(--faint)', padding: '14px 20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
              ◈ Grimório da Trilha
            </span>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {grimoireSaved && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>
                  Salvo
                </span>
              )}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: grimoire.length > PER_TRAIL_LIMIT * 0.9 ? 'var(--red)' : 'var(--faint)' }}>
                {grimoire.length}/{PER_TRAIL_LIMIT}
              </span>
            </div>
          </div>
          <textarea
            value={grimoire}
            onChange={e => handleGrimoireChange(e.target.value)}
            placeholder="Suas anotações sobre esta trilha..."
            style={{
              width: '100%',
              minHeight: 72,
              resize: 'vertical',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--faint)',
              color: 'var(--muted)',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: 1.6,
              padding: '10px 14px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {/* Footer nav + complete */}
      <div style={{ borderTop: '1px solid var(--faint)', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => onNavigate('prev')}
            disabled={!canNavigatePrev}
            style={{ background: 'none', border: '1px solid var(--faint)', color: canNavigatePrev ? 'var(--muted)' : 'var(--faint)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 12px', cursor: canNavigatePrev ? 'pointer' : 'default' }}
          >
            ← Anterior
          </button>
          <button
            onClick={() => onNavigate('next')}
            disabled={!canNavigateNext}
            style={{ background: 'none', border: '1px solid var(--faint)', color: canNavigateNext ? 'var(--muted)' : 'var(--faint)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', padding: '6px 12px', cursor: canNavigateNext ? 'pointer' : 'default' }}
          >
            Próxima →
          </button>
        </div>

        {isCompleted ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>
            ✦ Concluída
          </span>
        ) : (
          <button
            onClick={handleComplete}
            disabled={marking}
            className="btn-primary"
            style={{ fontSize: 11, opacity: marking ? 0.6 : 1 }}
          >
            {marking ? 'Salvando…' : 'Marcar como concluída →'}
          </button>
        )}
      </div>
    </div>
  )
}
