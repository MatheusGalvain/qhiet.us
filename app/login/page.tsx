'use client'

import { Suspense } from 'react'
import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Sigil from '@/components/ui/Sigil'
import type { Metadata } from 'next'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/perfil'
  const defaultTab = (searchParams.get('tab') as 'login' | 'register') ?? 'login'

  const [tab, setTab] = useState<'login' | 'register'>(defaultTab)
  const [mode, setMode] = useState<'form' | 'forgot'>('form')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [plan, setPlan] = useState<'profano' | 'iniciado'>('profano')
  const [success, setSuccess] = useState<string | null>(null)
  const urlError = searchParams.get('error')
  const [error, setError] = useState<string | null>(
    urlError === 'schema_missing'
      ? 'O banco de dados ainda não foi configurado. Rode o arquivo supabase/schema.sql no SQL Editor do Supabase.'
      : urlError === 'auth_failed'
      ? 'Falha na autenticação. Tente novamente.'
      : null
  )
  const [, startTransition] = useTransition()

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({
      email: form.get('email') as string,
      password: form.get('password') as string,
    })
    if (error) { setError(error.message); return }
    router.push(redirect)
    router.refresh()
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    setError(null)
    setSuccess(null)

    const { data, error } = await supabase.auth.signUp({
      email: form.get('email') as string,
      password: form.get('password') as string,
      options: {
        data: {
          name: form.get('name') as string,
          plan,
        },
      },
    })
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('user already registered') || msg.includes('already been registered') || msg.includes('already exists')) {
        setError('Este e-mail já possui uma conta. Faça login ou use outro endereço.')
      } else if (msg.includes('sending confirmation email') || msg.includes('email rate limit')) {
        setError('Erro ao enviar e-mail de confirmação. Limite do serviço atingido. Configure SMTP em Supabase → Authentication → Settings.')
      } else {
        setError(error.message)
      }
      return
    }

    // When email confirmation is ON and email already exists, Supabase returns
    // data.user with identities=[] (no error). Detect this case.
    if (data.user && data.user.identities && data.user.identities.length === 0) {
      setError('Este e-mail já possui uma conta. Faça login ou use outro endereço.')
      return
    }

    // Supabase requires email confirmation by default.
    // If there's no session yet, the user needs to confirm their email first.
    if (data.user && !data.session) {
      setSuccess('Conta criada! Verifique seu e-mail e clique no link de confirmação para ativar o acesso.')
      return
    }

    // Session created immediately (email confirmation disabled in Supabase)
    if (plan === 'iniciado') {
      router.push('/api/checkout')
    } else {
      router.push(redirect)
      router.refresh()
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/api/auth/callback?redirect=/redefinir-senha`,
    })
    if (error) { setError(error.message); return }
    setForgotSent(true)
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?redirect=${redirect}`,
      },
    })
  }

  return (
    <div className="login-layout" style={{ minHeight: 'calc(100vh - 68px)' }}>

      {/* LEFT — visual (hidden on mobile) */}
      <div className="login-visual-panel">
        <div>
          <p className="eyebrow" style={{ marginBottom: 20 }}>Portal Oculto · Est. MMXXVI</p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px, 7vw, 96px)', letterSpacing: 2, lineHeight: 0.88, color: 'var(--cream)' }}>
            ALÉM<br />DO <span style={{ color: 'var(--red)' }}>VÉU</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 18, color: 'var(--muted)', lineHeight: 1.8, maxWidth: 400, marginTop: 24 }}>
            Conhecimento gnóstico, cabalístico e hermético para os que buscam além da superfície das coisas.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0' }}>
          <Sigil size={240} opacity={0.4} />
        </div>

        <blockquote style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, borderLeft: '1px solid var(--red-dim)', paddingLeft: 16 }}>
          "A ignorância é a mãe de todos os males — e o conhecimento, a única redenção possível."
          <cite style={{ display: 'block', marginTop: 6, fontStyle: 'normal', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--faint)' }}>
            — Evangelhos Gnósticos · Nag Hammadi
          </cite>
        </blockquote>
      </div>

      {/* RIGHT — form */}
      <div className="login-form-panel">

        {/* TABS */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--faint)', marginBottom: 40 }}>
          {(['login', 'register'] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null) }}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase',
                color: tab === t ? 'var(--cream)' : 'var(--muted)', background: 'transparent', border: 'none',
                padding: '14px 28px 14px 0', marginRight: 28, cursor: 'pointer', position: 'relative', transition: 'color .2s',
                borderBottom: tab === t ? '1px solid var(--red)' : '1px solid transparent',
                marginBottom: -1,
              }}
            >
              {t === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          ))}
        </div>

        {success && (
          <div style={{ border: '1px solid var(--gold)', background: 'rgba(200,150,10,0.08)', padding: '12px 16px', marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--gold)' }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ border: '1px solid var(--red-dim)', background: 'var(--red-faint)', padding: '12px 16px', marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--red)' }}>
            {error}
          </div>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {forgotSent ? (
              <div style={{ border: '1px solid var(--gold)', background: 'rgba(200,150,10,0.08)', padding: '16px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--gold)', lineHeight: 1.9 }}>
                Link enviado para <strong>{forgotEmail}</strong>.<br />
                Verifique seu e-mail e clique no link para redefinir sua senha.
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', lineHeight: 1.8, margin: 0 }}>
                  Digite seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label className="form-label">E-mail</label>
                  <input
                    type="email"
                    required
                    className="form-input"
                    placeholder="seu@email.com"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                  Enviar link de redefinição →
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={() => { setMode('form'); setForgotSent(false); setForgotEmail(''); setError(null) }}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              ← Voltar ao login
            </button>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'form' && tab === 'login' && (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="form-label">E-mail</label>
              <input name="email" type="email" required className="form-input" placeholder="seu@email.com" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="form-label">Senha</label>
              <input name="password" type="password" required className="form-input" placeholder="••••••••" />
              <button type="button" onClick={() => { setMode('forgot'); setError(null) }} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>
                Esqueci minha senha →
              </button>
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 8, width: '100%' }}>
              Entrar no portal →
            </button>
            <Divider />
            {/* <GoogleButton onClick={handleGoogle} label="Continuar com Google" /> */}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginTop: 8 }}>
              Não tem conta?{' '}
              <button type="button" onClick={() => setTab('register')} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2 }}>
                Cadastre-se gratuitamente
              </button>
            </p>
          </form>
        )}

        {/* REGISTER FORM */}
        {mode === 'form' && tab === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="form-label">Nome</label>
              <input name="name" type="text" required className="form-input" placeholder="Seu nome" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="form-label">E-mail</label>
              <input name="email" type="email" required className="form-input" placeholder="seu@email.com" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label className="form-label">Senha</label>
              <input name="password" type="password" required minLength={8} className="form-input" placeholder="Mínimo 8 caracteres" />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: 8, width: '100%' }}>
              Iniciar jornada →
            </button>
            <Divider />
            {/* <GoogleButton onClick={handleGoogle} label="Cadastrar com Google" /> */}
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--faint)', textTransform: 'uppercase', textAlign: 'center', marginTop: 8 }}>
              Já tem conta?{' '}
              <button type="button" onClick={() => setTab('login')} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2 }}>
                Entrar
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, color: 'var(--faint)', textTransform: 'uppercase', margin: '4px 0' }}>
      <span style={{ flex: 1, height: 1, background: 'var(--faint)', display: 'block' }} />
      ou
      <span style={{ flex: 1, height: 1, background: 'var(--faint)', display: 'block' }} />
    </div>
  )
}

function GoogleButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', background: 'transparent', color: 'var(--muted)', border: '1px solid var(--faint)', padding: 14, cursor: 'pointer', transition: 'all .2s', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" opacity=".6"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" opacity=".6"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" opacity=".6"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" opacity=".6"/>
      </svg>
      {label}
    </button>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
