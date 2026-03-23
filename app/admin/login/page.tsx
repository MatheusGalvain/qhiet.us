'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.get('email') as string,
      password: form.get('password') as string,
    })

    if (authError) {
      setError('E-mail ou senha inválidos.')
      setLoading(false)
      return
    }

    // Verify the user is actually an admin before entering
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', data.user.id)
        .single()

      if (!profile?.is_admin) {
        await supabase.auth.signOut()
        setError('Acesso negado. Este portal é restrito a administradores.')
        setLoading(false)
        return
      }
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 420, padding: '0 24px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, letterSpacing: 6, color: 'var(--cream)', marginBottom: 8 }}>
            QHIETH<span style={{ color: 'var(--red)' }}>US</span>
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, color: 'var(--red)', textTransform: 'uppercase' }}>
            Acesso Administrativo
          </p>
        </div>

        {/* Form card */}
        <div style={{ border: '1px solid var(--faint)', padding: '36px 32px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 28 }}>
            Identificação
          </p>

          {error && (
            <div style={{
              border: '1px solid var(--red-dim)',
              background: 'var(--red-faint)',
              padding: '10px 14px',
              marginBottom: 20,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: 2,
              color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)' }}>
                E-mail
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="form-input"
                placeholder="admin@exemplo.com"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Senha
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="form-input"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: 8, opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Verificando…' : 'Entrar no painel →'}
            </button>
          </form>
        </div>

        {/* Back link */}
        <p style={{ textAlign: 'center', marginTop: 24, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
          <a href="/" style={{ color: 'var(--muted)', textDecoration: 'none' }}>← Voltar ao portal</a>
        </p>
      </div>
    </div>
  )
}
