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

const PER_TX_LIMIT = 10000
const DEBOUNCE_MS = 1000

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
  const [marking, setMarking]       = useState(false)
  const [grimoire, setGrimoire]     = useState('')
  const [saved, setSaved]           = useState(false)
  const [saveError, setSaveError]   = useState(false)
  const [hasNote, setHasNote]       = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isMobile, setIsMobile]     = useState(false)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  // refs para capturar valores atuais no flush (evita closure stale)
  const pendingRef   = useRef<{ txId: string; content: string } | null>(null)

  // Detecta mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Persiste nota imediatamente (usado no flush e no debounce)
  async function persistNote(trailIdArg: string, content: string) {
    try {
      const res = await fetch('/api/grimorio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trail_id: trailIdArg, content }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('[Grimório] save error', res.status, err)
        setSaveError(true)
        return false
      }
      const data = await res.json()
      if (data.success) {
        setSaved(true)
        setSaveError(false)
        setHasNote(content.trim().length > 0)
        return true
      }
    } catch (e) {
      console.error('[Grimório] network error', e)
      setSaveError(true)
    }
    return false
  }

  // Ao trocar de tx: flush qualquer save pendente da tx anterior, depois carrega nova
  useEffect(() => {
    if (!isSubscriber) return

    // Flush pendente da tx anterior antes de trocar
    if (pendingRef.current) {
      const { content } = pendingRef.current
      pendingRef.current = null
      if (debounceRef.current) { clearTimeout(debounceRef.current); debounceRef.current = null }
      persistNote(trailId, content) // fire and forget — não bloqueia a troca
    }

    setGrimoire('')
    setSaved(false)
    setSaveError(false)
    setHasNote(false)

    fetch(`/api/grimorio?trail_id=${trailId}`)
      .then(r => r.json())
      .then(d => {
        const c = d?.content ?? ''
        setGrimoire(c)
        setHasNote(c.trim().length > 0)
        if (c) setSaved(true)
      })
      .catch(e => console.error('[Grimório] load error', e))
  }, [trailId, tx.id, isSubscriber]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleGrimoireChange(value: string) {
    const trimmed = value.slice(0, PER_TX_LIMIT)
    setGrimoire(trimmed)
    setSaved(false)
    setSaveError(false)
    // Guarda para flush caso o usuário navegue antes do debounce
    pendingRef.current = { txId: tx.id, content: trimmed }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      pendingRef.current = null
      persistNote(trailId, trimmed)
    }, DEBOUNCE_MS)
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
          style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 0 }}
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      )
    })
  }

  const GrimoireBody = (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      {/* Subheader: tx name */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid #1a1410',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        letterSpacing: 2,
        color: 'rgba(200,150,10,0.45)',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {tx.title}
      </div>

      {/* Textarea */}
      <textarea
        value={grimoire}
        onChange={e => handleGrimoireChange(e.target.value)}
        placeholder="Registre suas percepções, insights e conexões..."
        style={{
          flex: 1,
          minHeight: isMobile ? 200 : undefined,
          resize: 'none',
          background: '#080503',
          border: '1px solid #1a1410',
          borderRadius: 0,
          margin: 12,
          color: 'rgba(232,213,176,0.9)',
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          lineHeight: 1.7,
          padding: '12px 14px',
          outline: 'none',
          boxSizing: 'border-box',
          fontStyle: 'normal',
          transition: 'border-color .2s',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#c8960a' }}
        onBlur={e => { e.currentTarget.style.borderColor = '#1a1410' }}
      />

      {/* Footer body: counter + status */}
      <div style={{
        padding: '6px 16px 10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid #1a1410',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: grimoire.length > PER_TX_LIMIT * 0.9 ? '#b02a1e' : 'rgba(255,255,255,0.2)', letterSpacing: 1 }}>
          {grimoire.length} / {PER_TX_LIMIT}
        </span>
        {saveError && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: '#b02a1e', textTransform: 'uppercase' }}>
            ✕ Erro ao salvar
          </span>
        )}
        {saved && !saveError && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: '#c8960a', textTransform: 'uppercase' }}>
            ● Salvo
          </span>
        )}
      </div>
    </div>
  )

  const DrawerFooter = (
    <div style={{
      padding: '10px 12px',
      borderTop: '1px solid #1a1410',
      display: 'flex',
      gap: 6,
      alignItems: 'center',
    }}>
      <button
        onClick={() => onNavigate('prev')}
        disabled={!canNavigatePrev}
        style={{
          flex: 1,
          background: 'none',
          border: '1px solid #1a1410',
          color: canNavigatePrev ? 'rgba(200,180,140,0.6)' : '#1a1410',
          fontFamily: 'var(--font-mono)',
          fontSize: 9, letterSpacing: 2,
          textTransform: 'uppercase',
          padding: '7px 4px',
          cursor: canNavigatePrev ? 'pointer' : 'default',
        }}
      >
        ← Ant.
      </button>

      {isCompleted ? (
        <span style={{
          flex: 1, textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 9,
          letterSpacing: 2, color: '#c8960a', textTransform: 'uppercase',
        }}>
          ✦ Conc.
        </span>
      ) : (
        <button
          onClick={handleComplete}
          disabled={marking}
          style={{
            flex: 1,
            background: 'none',
            border: '1px solid #b02a1e',
            color: '#b02a1e',
            fontFamily: 'var(--font-mono)',
            fontSize: 9, letterSpacing: 2,
            textTransform: 'uppercase',
            padding: '7px 4px',
            cursor: marking ? 'default' : 'pointer',
            opacity: marking ? 0.5 : 1,
            transition: 'background .15s, color .15s',
          }}
          onMouseEnter={e => {
            if (!marking) {
              (e.currentTarget as HTMLButtonElement).style.background = '#b02a1e'
              ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
            }
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#b02a1e'
          }}
        >
          {marking ? '...' : 'Concluída ✓'}
        </button>
      )}

      <button
        onClick={() => onNavigate('next')}
        disabled={!canNavigateNext}
        style={{
          flex: 1,
          background: 'none',
          border: '1px solid #1a1410',
          color: canNavigateNext ? 'rgba(200,180,140,0.6)' : '#1a1410',
          fontFamily: 'var(--font-mono)',
          fontSize: 9, letterSpacing: 2,
          textTransform: 'uppercase',
          padding: '7px 4px',
          cursor: canNavigateNext ? 'pointer' : 'default',
        }}
      >
        Próx. →
      </button>
    </div>
  )

  return (
    <>
      {/* ── Reader box ── */}
      <div style={{ border: '1px solid var(--faint)', display: 'flex', flexDirection: 'column', height: '100%', maxHeight: 640, minHeight: 400, position: 'relative' }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--faint)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0, flex: 1 }}>
            {onBackToSection && (
              <button onClick={onBackToSection} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 16, padding: 0, flexShrink: 0, marginTop: 1 }}>
                ←
              </button>
            )}
            <div style={{ minWidth: 0 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
                {sectionTitle ? `${sectionTitle} · ` : ''}{String(currentIndex + 1).padStart(2, '0')}/{String(totalCount).padStart(2, '0')}
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--cream)', letterSpacing: 1, display: 'block', lineHeight: 1.3, wordBreak: 'break-word' }}>
                {tx.title}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: 2 }}>
              ~{tx.read_time_minutes}min
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>✕</button>
          </div>
        </div>

        {/* Content */}
        <div className="trail-reader-content" style={{ flex: 1, overflowY: 'auto' }}>
          {renderContent(tx.content)}
        </div>

        {/* Footer nav + complete */}
        <div className="trail-reader-footer">
          <div style={{ display: 'flex', gap: 8 }}>
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
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase', flexShrink: 0 }}>
              ✦ Concluída
            </span>
          ) : (
            <button
              onClick={handleComplete}
              disabled={marking}
              className="btn-primary trail-complete-btn"
              style={{ opacity: marking ? 0.6 : 1 }}
            >
              {marking ? 'Salvando…' : 'Marcar como concluída →'}
            </button>
          )}
        </div>

        {/* ── Grimório button — desktop: canto inferior direito do reader ── */}
        {isSubscriber && !isMobile && (
          <button
            onClick={() => setDrawerOpen(o => !o)}
            style={{
              position: 'absolute',
              bottom: 52,
              right: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: '#0a0806',
              border: '1px solid #c8960a',
              color: '#c8960a',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: 3,
              textTransform: 'uppercase',
              padding: '6px 12px',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'background .15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(200,150,10,0.08)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#0a0806' }}
          >
            {hasNote && (
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: '#b02a1e', display: 'inline-block', flexShrink: 0,
              }} />
            )}
            ✦ Grimório
          </button>
        )}
      </div>

      {/* ── Desktop Drawer — desliza da esquerda para direita ── */}
      {isSubscriber && !isMobile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 320,
          background: '#0a0806',
          borderRight: '1px solid #c8960a',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 300,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 300ms cubic-bezier(.4,0,.2,1)',
        }}>
          {/* Drawer header */}
          <div style={{
            padding: '16px 16px 12px',
            borderBottom: '1px solid #1a1410',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: '#c8960a', textTransform: 'uppercase' }}>
              ✦ Grimório
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              style={{ background: 'none', border: 'none', color: 'rgba(200,150,10,0.5)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4 }}
            >✕</button>
          </div>

          {GrimoireBody}
          {DrawerFooter}
        </div>
      )}

      {/* ── Mobile: botão fixo no rodapé ── */}
      {isSubscriber && isMobile && (
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#0a0806',
            border: 'none',
            borderTop: '1px solid #c8960a',
            color: '#c8960a',
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: 3,
            textTransform: 'uppercase',
            padding: '14px 0',
            cursor: 'pointer',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {hasNote && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#b02a1e', display: 'inline-block' }} />
          )}
          ✦ Abrir grimório
        </button>
      )}

      {/* ── Mobile Modal ── */}
      {isSubscriber && isMobile && drawerOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(8,5,3,0.9)',
              zIndex: 200,
            }}
          />

          {/* Modal container */}
          <div style={{
            position: 'fixed',
            inset: '10%',
            background: '#0a0806',
            border: '1px solid #c8960a',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 201,
            animation: 'fadeSlideUp 300ms ease',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #1a1410',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: '#c8960a', textTransform: 'uppercase' }}>
                ✦ Grimório
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(200,150,10,0.5)', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
              >✕</button>
            </div>

            {GrimoireBody}
            {DrawerFooter}
          </div>
        </>
      )}
    </>
  )
}
