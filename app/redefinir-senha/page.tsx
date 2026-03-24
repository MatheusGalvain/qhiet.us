'use client'

import { Suspense, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sigil from '@/components/ui/Sigil'

function RedefinirSenhaContent() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    // After callback route exchanges the code, the user has an active recovery session
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session)
      setChecking(false)
    })
  }, [supabase.auth])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/perfil'), 2500)
  }

  if (checking) return null

  return (
    <div className="login-layout" style={{ minHeight: 'calc(100vh - 68px)' }}>

      {/* LEFT — visual */}
      <div className="login-visual-panel">
        <div>
          <p className="eyebrow" style={{ marginBottom: 20 }}>Portal Oculto · Est. MMXXVI</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px, 7vw, 96px)', letterSpacing: 2, lineHeight: 0.88, color: 'var(--cream)' }}>
            NOVA<br /><span style={{ color: 'var(--red)' }}>CHAVE</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--muted)', lineHeight: 1.8, maxWidth: 400, marginTop: 24 }}>
            Defina uma nova senha para retomar seu acesso ao portal.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0' }}>
          <Sigil size={240} opacity={0.4} />
        </div>

        <blockquote style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, borderLeft: '1px solid var(--red-dim)', paddingLeft: 16 }}>
          "Todo iniciado que se perde no caminho encontra sempre uma nova porta de entrada."
          <cite style={{ display: 'block', marginTop: 6, fontStyle: 'normal', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--faint)' }}>
            — Tradição Hermética
          </cite>
        </blockquote>
      </div>

      {/* RIGHT — form */}
      <div className="login-form-panel">
        <div style={{ borderBottom: '1px solid var(--faint)', marginBottom: 40, paddingBottom: 14 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--cream)' }}>
            Redefinir Senha
          </span>
        </div>

        {!hasSession ? (
          /* Link inválido ou expirado */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ border: '1px solid var(--red-dim)', background: 'var(--red-faint)', padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--red)', lineHeight: 1.9 }}>
              Link inválido ou expirado.<br />
              Solicite um novo link de redefinição de senha.
            </div>
            <button
              onClick={() => router.push('/login')}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              ← Voltar ao login
            </button>
          </div>

        ) : success ? (
          /* Sucesso */
          <div style={{ border: '1px solid var(--gold)', background: 'rgba(200,150,10,0.08)', padding: '20px 24px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--gold)', lineHeight: 1.9 }}>
            Senha redefinida com sucesso.<br />
            Redirecionando para o portal...
          </div>

        ) : (
          /* Formulário de nova senha */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {error && (
              <div style={{ border: '1px solid var(--red-dim)', background: 'var(--red-faint)', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="form-label">Nova senha</label>
              <input
                type="password"
                required
                minLength={8}
                className="form-input"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="form-label">Confirmar nova senha</label>
              <input
                type="password"
                required
                className="form-input"
                placeholder="Repita a senha"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ marginTop: 8, width: '100%', opacity: loading ? 0.6 : 1 }}
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar nova senha →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={null}>
      <RedefinirSenhaContent />
    </Suspense>
  )
}
