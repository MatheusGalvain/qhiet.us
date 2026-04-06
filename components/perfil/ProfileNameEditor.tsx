'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

interface Props {
  initialName: string
  size?: 'sm' | 'lg'
}

const sizeMap = {
  sm: { box: '32px', font: '14px', nameSize: 18 },
  lg: { box: '64px', font: '28px', nameSize: 28 },
}

/* ─────────────────────────────────────
   Modal de edição de nome
───────────────────────────────────── */
function EditModal({
  name,
  onClose,
  onSaved,
}: {
  name: string
  onClose: () => void
  onSaved: (n: string) => void
}) {
  const [draft, setDraft] = useState(name)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (trimmed.length < 2) { setError('Mínimo 2 caracteres.'); return }
    if (trimmed.length > 60) { setError('Máximo 60 caracteres.'); return }
    if (trimmed === name) { onClose(); return }

    startTransition(async () => {
      const res = await fetch('/api/profile/name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Erro ao salvar.'); return }
      onSaved(trimmed)
      router.refresh()
    })
  }

  const initial = getInitial(draft || name)
  const changed  = draft.trim() !== name && draft.trim().length >= 2

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'fadeIn .18s ease',
        }}
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-label="Editar nome"
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 901,
          width: 'min(400px, calc(100vw - 32px))',
          background: '#111110',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          animation: 'slideUp .2s cubic-bezier(.22,1,.36,1)',
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }} />

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Editar nome
            </p>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0, transition: 'color .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--faint)' }}
              title="Fechar"
            >
              ×
            </button>
          </div>

          {/* Avatar preview — reactive ao que o usuário digita */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div
              className="avatar"
              style={{
                width: 68, height: 68, fontSize: 30,
                border: `1px solid ${changed ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: changed ? '0 0 24px rgba(255,255,255,0.07)' : 'none',
                transition: 'border-color .25s, box-shadow .25s',
              }}
            >
              {initial}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={e => { setDraft(e.target.value); setError(null) }}
                maxLength={60}
                placeholder="Seu nome"
                disabled={isPending}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${error ? 'var(--red-dim)' : changed ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.09)'}`,
                  color: 'var(--cream)', fontFamily: 'var(--font-display)',
                  fontSize: 20, letterSpacing: 2, padding: '12px 48px 12px 14px',
                  outline: 'none', transition: 'border-color .2s',
                }}
                onFocus={e => { if (!error) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.28)' }}
                onBlur={e => { if (!error) e.currentTarget.style.borderColor = changed ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.09)' }}
              />
              <span style={{
                position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 1,
                color: draft.length > 50 ? 'var(--red)' : 'var(--faint)',
                pointerEvents: 'none',
              }}>
                {draft.length}/60
              </span>
            </div>

            {error && (
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1.5, color: 'var(--red)' }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              <button
                type="submit"
                disabled={isPending || !changed}
                style={{
                  flex: 1, padding: '11px',
                  background: changed && !isPending ? 'rgba(255,255,255,0.07)' : 'transparent',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: changed && !isPending ? 'var(--cream)' : 'var(--faint)',
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3,
                  textTransform: 'uppercase',
                  cursor: changed && !isPending ? 'pointer' : 'default',
                  transition: 'all .18s',
                }}
                onMouseEnter={e => { if (changed && !isPending) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.12)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.30)' } }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = changed && !isPending ? 'rgba(255,255,255,0.07)' : 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.14)' }}
              >
                {isPending ? 'Salvando…' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                style={{
                  padding: '11px 18px', background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.07)',
                  color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 10,
                  letterSpacing: 3, textTransform: 'uppercase', cursor: 'pointer',
                  transition: 'border-color .18s, color .18s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.20)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)' }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>

        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)' }} />
      </div>
    </>,
    document.body,
  )
}

/* ─────────────────────────────────────
   Componente principal
───────────────────────────────────── */
export default function ProfileNameEditor({ initialName, size = 'lg' }: Props) {
  const [name, setName]       = useState(initialName)
  const [open, setOpen]       = useState(false)
  const [justSaved, setSaved] = useState(false)

  const { box, font, nameSize } = sizeMap[size]

  function handleSaved(newName: string) {
    setName(newName)
    setOpen(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        title="Clique para editar seu nome"
        style={{ display: 'flex', alignItems: 'center', gap: size === 'lg' ? 14 : 10, cursor: 'pointer' }}
      >
        {/* Avatar */}
        <div className="avatar" style={{ width: box, height: box, fontSize: font, flexShrink: 0 }}>
          {getInitial(name)}
        </div>

        {/* Name */}
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: nameSize, letterSpacing: size === 'lg' ? 3 : 2,
            color: 'var(--cream)', lineHeight: 1.1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {name}
          </p>
          {size === 'lg' && (
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: 2,
              color: justSaved ? 'var(--gold)' : 'var(--cream-dim)',
              textTransform: 'uppercase', marginTop: 4,
              transition: 'color .3s',
            }}>
              {justSaved ? '✦ Atualizado' : '✎ editar nome'}
            </p>
          )}
        </div>
      </div>

      {open && (
        <EditModal name={name} onClose={() => setOpen(false)} onSaved={handleSaved} />
      )}
    </>
  )
}
