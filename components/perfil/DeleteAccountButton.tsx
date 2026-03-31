'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Step = 'idle' | 'warn' | 'confirm' | 'deleting' | 'done'

interface Props {
  email: string
}

export default function DeleteAccountButton({ email }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('idle')
  const [inputEmail, setInputEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (inputEmail.trim().toLowerCase() !== email.trim().toLowerCase()) {
      setError('O e-mail digitado não confere com sua conta.')
      return
    }

    setError(null)
    setStep('deleting')

    try {
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: inputEmail.trim() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Erro ao excluir conta.')
        setStep('confirm')
        return
      }

      setStep('done')
      // Give user a moment to read the message before redirecting
      setTimeout(() => router.push('/'), 2500)
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setStep('confirm')
    }
  }

  function reset() {
    setStep('idle')
    setInputEmail('')
    setError(null)
  }

  // ── Idle: just the trigger button ──
  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('warn')}
        style={{
          background: 'transparent',
          border: '1px solid var(--cream)',
          color: 'var(--cream)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 3,
          textTransform: 'uppercase',
          padding: '10px 18px',
          cursor: 'pointer',
          transition: 'color .15s, border-color .15s',
        }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLButtonElement).style.color = '#8b1a10'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = '#8b1a10'
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--cream)'
        }}
      >
        Excluir conta →
      </button>
    )
  }

  // ── Warning ──
  if (step === 'warn') {
    return (
      <div style={{
        border: '1px solid var(--faint)',
        borderLeft: '2px solid #8b1a10',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: 3, color: '#8b1a10', textTransform: 'uppercase',
        }}>
          ⚠ Atenção — ação irreversível
        </p>
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 15,
          color: 'var(--muted)', lineHeight: 1.8,
        }}>
          Ao excluir sua conta você perderá permanentemente todo seu XP, histórico de leitura,
          rank e acesso ao portal. Esta ação <span style={{ color: 'var(--cream)' }}>não pode ser desfeita</span>.
          {' '}Se você tem uma assinatura ativa, ela será cancelada automaticamente.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={() => setStep('confirm')}
            style={{
              background: 'transparent',
              border: '1px solid #8b1a10',
              color: '#8b1a10',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: 3, textTransform: 'uppercase',
              padding: '10px 18px', cursor: 'pointer',
              transition: 'color .15s, border-color .15s',
            }}
          >
            Continuar com a exclusão
          </button>
          <button
            onClick={reset}
            style={{
              background: 'transparent',
              border: '1px solid var(--faint)',
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: 3, textTransform: 'uppercase',
              padding: '10px 18px', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // ── Email confirmation ──
  if (step === 'confirm') {
    return (
      <div style={{
        border: '1px solid #8b1a10',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: 3, color: '#8b1a10', textTransform: 'uppercase',
        }}>
          Confirme sua identidade
        </p>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          letterSpacing: 1, color: 'var(--muted)', lineHeight: 1.8,
        }}>
          Digite seu e-mail <span style={{ color: 'var(--cream)' }}>{email}</span>{' '}
          para confirmar a exclusão da conta.
        </p>
        <input
          type="email"
          value={inputEmail}
          onChange={e => { setInputEmail(e.target.value); setError(null) }}
          placeholder="seu@email.com"
          autoComplete="off"
          style={{
            background: 'transparent',
            border: '1px solid var(--faint)',
            color: 'var(--cream)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            letterSpacing: 1,
            padding: '12px 16px',
            outline: 'none',
            width: '100%',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--muted)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--faint)')}
          onKeyDown={e => { if (e.key === 'Enter') handleDelete() }}
        />
        {error && (
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--red)', letterSpacing: 1,
          }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={handleDelete}
            disabled={!inputEmail.trim()}
            style={{
              background: 'transparent',
              border: `1px solid ${inputEmail.trim() ? '#8b1a10' : 'var(--faint)'}`,
              color: inputEmail.trim() ? '#8b1a10' : 'var(--faint)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: 3, textTransform: 'uppercase',
              padding: '10px 18px',
              cursor: inputEmail.trim() ? 'pointer' : 'not-allowed',
              transition: 'color .15s, border-color .15s',
            }}
          >
            Excluir minha conta
          </button>
          <button
            onClick={reset}
            style={{
              background: 'transparent',
              border: '1px solid var(--faint)',
              color: 'var(--muted)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: 3, textTransform: 'uppercase',
              padding: '10px 18px', cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  // ── Deleting ──
  if (step === 'deleting') {
    return (
      <div style={{
        border: '1px solid var(--faint)',
        padding: '20px 24px',
        fontFamily: 'var(--font-mono)', fontSize: 11,
        letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase',
      }}>
        Excluindo conta...
      </div>
    )
  }

  // ── Done ──
  return (
    <div style={{
      border: '1px solid var(--faint)',
      padding: '20px 24px',
      fontFamily: 'var(--font-mono)', fontSize: 11,
      letterSpacing: 3, color: 'var(--gold)', textTransform: 'uppercase',
    }}>
      ✦ Conta excluída. Redirecionando...
    </div>
  )
}
