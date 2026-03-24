'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ChangePasswordForm({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?redirect=/redefinir-senha`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setSent(true)
  }

  return (
    <div style={{ marginTop: 40 }}>
      <p style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4,
        color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 8,
      }}>
        <span style={{ color: 'var(--red-dim)' }}>// </span>Segurança
      </p>

      {sent ? (
        <div style={{
          padding: '16px 20px',
          border: '1px solid var(--faint)',
          fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2,
          color: 'var(--gold)', textTransform: 'uppercase', lineHeight: 1.7,
        }}>
          <span style={{ color: 'var(--gold)', marginRight: 8 }}>✦</span>
          Link enviado para <span style={{ color: 'var(--cream)' }}>{email}</span>
          <br />
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>
            Verifique sua caixa de entrada.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
            color: 'var(--faint)', textTransform: 'uppercase',
          }}>
            Conta: {email}
          </p>
          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              alignSelf: 'flex-start',
              background: 'transparent',
              border: '1px solid var(--faint)',
              color: loading ? 'var(--muted)' : 'var(--cream)',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              letterSpacing: 3, textTransform: 'uppercase',
              padding: '12px 24px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
            }}
            onMouseEnter={e => {
              if (!loading) {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--red)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--red)'
              }
            }}
            onMouseLeave={e => {
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--faint)'
              ;(e.currentTarget as HTMLButtonElement).style.color = loading ? 'var(--muted)' : 'var(--cream)'
            }}
          >
            {loading ? 'Enviando...' : 'Redefinir senha →'}
          </button>
          {error && (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: 1 }}>
              {error}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
