'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const COOLDOWN_DAYS = 20

interface Props {
  currentNick: string | null
  currentName: string
  nickUpdatedAt: string | null
}

function daysUntilUnlock(updatedAt: string | null): number {
  if (!updatedAt) return 0
  const updatedMs = new Date(updatedAt).getTime()
  const nowMs = Date.now()
  const diffDays = (nowMs - updatedMs) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.ceil(COOLDOWN_DAYS - diffDays))
}

export default function NickForm({ currentNick, currentName, nickUpdatedAt }: Props) {
  const [nick, setNick] = useState(currentNick ?? '')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const daysLeft = daysUntilUnlock(nickUpdatedAt)
  const locked = daysLeft > 0
  const isUnchanged = nick.trim() === (currentNick ?? '')

  function validate(value: string): string | null {
    const v = value.trim()
    if (v.length < 2)  return 'Nick deve ter ao menos 2 caracteres.'
    if (v.length > 24) return 'Nick deve ter no máximo 24 caracteres.'
    if (/\s{2,}/.test(v)) return 'Nick não pode ter espaços duplos.'
    if (!/^[a-zA-Z0-9 _\-\.àáâãéêíóôõúüçÀÁÂÃÉÊÍÓÔÕÚÜÇ]+$/.test(v))
      return 'Nick só pode ter letras, números, espaço, _ - .'
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSuccess(false)
    setError(null)

    if (locked) {
      setError(`Você poderá alterar seu nick em ${daysLeft} dia${daysLeft > 1 ? 's' : ''}.`)
      return
    }

    const validationError = validate(nick)
    if (validationError) { setError(validationError); return }

    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Sessão expirada. Faça login novamente.'); return }

      // Check uniqueness (case-insensitive) before saving
      const trimmed = nick.trim()
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .ilike('nick', trimmed)
        .neq('id', user.id)
        .maybeSingle()

      if (existing) {
        setError('Este nick já está em uso. Escolha outro.')
        return
      }

      const { error: dbError } = await supabase
        .from('profiles')
        .update({ nick: trimmed, nick_updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (dbError) {
        if (dbError.code === '23505') {
          setError('Este nick já está em uso. Escolha outro.')
        } else {
          setError(dbError.message)
        }
        return
      }

      setSuccess(true)
      router.refresh()
    })
  }

  const charCount = nick.trim().length

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 20 }}>
        <label style={{
          display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 6,
        }}>
          Nick de ranking
        </label>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--muted)',
          lineHeight: 1.6, marginBottom: 12,
        }}>
          Nome público exibido na tabela de ranking. Máximo 24 caracteres.
          Após salvar, só pode ser alterado novamente em {COOLDOWN_DAYS} dias.
        </p>

        <div style={{ position: 'relative', maxWidth: 320 }}>
          <input
            type="text"
            value={nick}
            onChange={e => { setNick(e.target.value); setError(null); setSuccess(false) }}
            maxLength={24}
            placeholder={currentNick ?? currentName}
            disabled={locked || isPending}
            className="form-input"
            style={{
              width: '100%',
              opacity: locked ? 0.5 : 1,
              cursor: locked ? 'not-allowed' : 'text',
            }}
          />
        </div>

        {/* Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 320, marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--faint)' }}>
            {charCount} / 24
          </span>
          {locked && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--gold)', textTransform: 'uppercase' }}>
              ○ Bloqueado · {daysLeft}d restantes
            </span>
          )}
          {!locked && nickUpdatedAt && (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--faint)' }}>
              Último: {new Date(nickUpdatedAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      {/* Cooldown info bar */}
      {locked && (
        <div style={{
          border: '1px solid var(--gold-dim)', background: 'rgba(200,150,10,0.06)',
          padding: '10px 16px', marginBottom: 16,
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--gold)',
          textTransform: 'uppercase',
        }}>
          ◈ Nick bloqueado por mais {daysLeft} dia{daysLeft > 1 ? 's' : ''}.
          Poderá ser alterado em{' '}
          {new Date(new Date(nickUpdatedAt!).getTime() + COOLDOWN_DAYS * 86400000).toLocaleDateString('pt-BR')}.
        </div>
      )}

      {success && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--gold)', textTransform: 'uppercase', marginBottom: 16 }}>
          ✦ Nick atualizado — aparecerá no ranking em instantes.
        </p>
      )}
      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--red)', marginBottom: 16, borderLeft: '2px solid var(--red)', paddingLeft: 10 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        className="btn-primary"
        disabled={locked || isPending || isUnchanged}
        style={{ opacity: locked || isUnchanged ? 0.45 : 1, cursor: locked || isUnchanged ? 'not-allowed' : 'pointer' }}
      >
        {isPending ? 'Salvando…' : locked ? `Bloqueado · ${daysLeft}d` : 'Salvar nick →'}
      </button>
    </form>
  )
}
