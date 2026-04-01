'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const COOLDOWN_DAYS = 20

interface Props {
  currentNick: string | null
  currentName: string
  nickUpdatedAt: string | null
}

function daysUntilUnlock(updatedAt: string | null): number {
  if (!updatedAt) return 0
  const diffDays = (Date.now() - new Date(updatedAt).getTime()) / 86400000
  return Math.max(0, Math.ceil(COOLDOWN_DAYS - diffDays))
}

function unlockDate(updatedAt: string): string {
  const d = new Date(new Date(updatedAt).getTime() + COOLDOWN_DAYS * 86400000)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
}

export default function NickForm({ currentNick, currentName, nickUpdatedAt }: Props) {
  const [nick, setNick] = useState(currentNick ?? '')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const daysLeft = daysUntilUnlock(nickUpdatedAt)
  const locked = daysLeft > 0
  const trimmed = nick.trim()
  const isUnchanged = trimmed === (currentNick ?? '')
  const charCount = trimmed.length

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(false)
    setError(null)

    startTransition(async () => {
      const res = await fetch('/api/profile/nick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error ?? 'Erro ao salvar.')
        return
      }

      setSuccess(true)
      router.refresh()
    })
  }

  return (
    <div>
      {/* Label */}
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3,
        color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6,
      }}>
        Nick público
      </p>
      <p style={{
        fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--muted)',
        lineHeight: 1.6, marginBottom: 16,
      }}>
        Nome exibido no ranking e no perfil público. Máximo 24 caracteres. Após salvar, só pode ser alterado em {COOLDOWN_DAYS} dias.
      </p>

      {/* Cooldown bar */}
      {locked && (
        <div style={{
          border: '1px solid var(--gold-dim)', background: 'rgba(200,150,10,0.05)',
          padding: '10px 16px', marginBottom: 16,
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
          color: 'var(--gold)', textTransform: 'uppercase',
        }}>
          ◈ Bloqueado · libera em {unlockDate(nickUpdatedAt!)} ({daysLeft}d)
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Input + button inline */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', maxWidth: 400, marginBottom: 8 }}>
          <input
            type="text"
            value={nick}
            onChange={e => { setNick(e.target.value); setError(null); setSuccess(false) }}
            maxLength={24}
            placeholder={currentNick ?? currentName}
            disabled={locked || isPending}
            autoComplete="off"
            spellCheck={false}
            className="form-input"
            style={{
              flex: 1,
              opacity: locked ? 0.45 : 1,
              cursor: locked ? 'not-allowed' : 'text',
            }}
          />
          <button
            type="submit"
            className="btn-primary"
            disabled={locked || isPending || isUnchanged || charCount < 2}
            style={{
              opacity: locked || isUnchanged || charCount < 2 ? 0.35 : 1,
              cursor: locked || isUnchanged || charCount < 2 ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {isPending ? 'Salvando…' : 'Salvar →'}
          </button>
        </div>

        {/* Counter */}
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 1,
          color: 'var(--cream-dim)', marginBottom: 16,
        }}>
          {charCount}/24
        </p>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '10px 14px', marginBottom: 12,
            border: '1px solid var(--red-dim)',
            background: 'rgba(180,30,20,0.06)',
          }}>
            <span style={{ color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginTop: 1 }}>✕</span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--red)', lineHeight: 1.6 }}>
              {error}
            </p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            border: '1px solid var(--gold-dim)',
            background: 'rgba(200,150,10,0.06)',
          }}>
            <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>✦</span>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>
              Nick atualizado — aparecerá no ranking em instantes.
            </p>
          </div>
        )}
      </form>
    </div>
  )
}
