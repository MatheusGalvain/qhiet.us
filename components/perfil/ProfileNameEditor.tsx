'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || '?'
}

interface Props {
  initialName: string
  size?: 'sm' | 'lg'
}

const sizeMap = {
  sm: { box: '32px', font: '14px' },
  lg: { box: '64px', font: '28px' },
}

export default function ProfileNameEditor({ initialName, size = 'lg' }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [draft, setDraft] = useState(initialName)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const { box, font } = sizeMap[size]

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  function openEdit() {
    setDraft(name)
    setError(null)
    setSuccess(false)
    setEditing(true)
  }

  function cancel() {
    setEditing(false)
    setDraft(name)
    setError(null)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = draft.trim()
    if (trimmed.length < 2) { setError('Nome deve ter ao menos 2 caracteres.'); return }
    if (trimmed.length > 60) { setError('Nome muito longo.'); return }

    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Sessão expirada.'); return }

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ name: trimmed })
        .eq('id', user.id)

      if (dbError) { setError(dbError.message); return }

      setName(trimmed)
      setEditing(false)
      setSuccess(true)
      router.refresh()
    })
  }

  // ─── Avatar (reactive to draft while editing) ───────────────────────
  const displayInitial = editing ? getInitial(draft) : getInitial(name)

  return (
    <div>
      {/* Avatar com botão de editar */}
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
        <div
          className="avatar"
          style={{ width: box, height: box, fontSize: font }}
          title={name}
        >
          {displayInitial}
        </div>

        {/* Lápis de editar */}
        <button
          onClick={openEdit}
          title="Editar nome"
          style={{
            position: 'absolute',
            bottom: -4,
            right: -4,
            width: 22,
            height: 22,
            background: 'var(--bg)',
            border: '1px solid var(--faint)',
            color: 'var(--muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            borderRadius: 2,
            transition: 'color .15s, border-color .15s',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--faint)'
          }}
        >
          ✎
        </button>
      </div>

      {/* Nome ou formulário inline */}
      {!editing ? (
        <>
          <p
            onClick={openEdit}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: size === 'lg' ? 28 : 20,
              letterSpacing: 3,
              color: 'var(--cream)',
              cursor: 'pointer',
              userSelect: 'none',
            }}
            title="Clique para editar nome"
          >
            {name}
          </p>
          {success && (
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: 2, color: 'var(--gold)',
              textTransform: 'uppercase', marginTop: 4,
            }}>
              ✦ Nome atualizado
            </p>
          )}
        </>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            ref={inputRef}
            type="text"
            value={draft}
            onChange={e => { setDraft(e.target.value); setError(null) }}
            maxLength={60}
            className="form-input"
            style={{ width: '100%', fontSize: 13 }}
            placeholder="Seu nome"
            disabled={isPending}
          />

          {error && (
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: 1, color: 'var(--red)',
              borderLeft: '2px solid var(--red)', paddingLeft: 8,
            }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="submit"
              disabled={isPending || draft.trim() === name || draft.trim().length < 2}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid var(--red-dim)',
                color: 'var(--red)',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                letterSpacing: 2, textTransform: 'uppercase',
                padding: '7px 0',
                cursor: 'pointer',
                opacity: isPending || draft.trim() === name ? 0.45 : 1,
                transition: 'border-color .15s, color .15s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red-dim)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'
              }}
            >
              {isPending ? 'Salvando…' : 'Salvar'}
            </button>

            <button
              type="button"
              onClick={cancel}
              disabled={isPending}
              style={{
                flex: 1,
                background: 'transparent',
                border: '1px solid var(--faint)',
                color: 'var(--muted)',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                letterSpacing: 2, textTransform: 'uppercase',
                padding: '7px 0',
                cursor: 'pointer',
                transition: 'border-color .15s, color .15s',
              }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--faint)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
