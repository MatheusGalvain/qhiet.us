'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

const REDIRECT_DELAY = 8 // seconds

export default function CheckoutSucessoPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(REDIRECT_DELAY)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          router.push('/perfil')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [router])

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'clamp(32px, 6vw, 80px) var(--px)',
      textAlign: 'center',
    }}>

      {/* Symbol */}
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(64px, 10vw, 96px)',
        color: 'var(--gold)',
        lineHeight: 1,
        marginBottom: 32,
        letterSpacing: 8,
        animation: 'pulse 3s ease-in-out infinite',
      }}>
        ◈
      </div>

      {/* Title */}
      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(32px, 6vw, 64px)',
        letterSpacing: 4,
        color: 'var(--cream)',
        lineHeight: 1,
        marginBottom: 8,
      }}>
        BEM-VINDO,{' '}
        <span style={{ color: 'var(--red)' }}>INICIADO</span>
      </h1>

      {/* Divider */}
      <div style={{
        width: 64,
        height: 1,
        background: 'var(--gold)',
        margin: '24px auto',
        opacity: 0.6,
      }} />

      {/* Message */}
      <p style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'clamp(15px, 2vw, 18px)',
        color: '#b8b8b8',
        lineHeight: 1.8,
        maxWidth: 520,
        marginBottom: 12,
      }}>
        Seu acesso ao Plano Iniciado foi ativado com sucesso. A partir de agora
        você tem acesso irrestrito a todas as transmissões, quizzes e ao acervo
        completo de livros mensais.
      </p>

      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 13,
        letterSpacing: 2,
        color: 'var(--muted)',
        textTransform: 'uppercase',
        marginBottom: 40,
      }}>
        ✦ &nbsp; O véu foi removido &nbsp; ✦
      </p>

      {/* XP bonus badge */}
      <div style={{
        border: '1px solid var(--gold)',
        padding: '14px 28px',
        marginBottom: 40,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--gold)' }}>+50</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
          XP de bônus pela iniciação
        </span>
      </div>

      {/* CTA buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 32 }}>
        <Link
          href="/perfil"
          className="btn-primary"
          style={{ minWidth: 200, textAlign: 'center' }}
        >
          Ver meu perfil →
        </Link>
        <Link
          href="/transmissoes?tab=locked"
          style={{
            display: 'inline-block',
            minWidth: 200,
            textAlign: 'center',
            padding: '12px 24px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: 3,
            textTransform: 'uppercase',
            color: 'var(--muted)',
            border: '1px solid var(--faint)',
            textDecoration: 'none',
            transition: 'color .2s, border-color .2s',
          }}
        >
          Explorar transmissões ◈
        </Link>
      </div>

      {/* Auto-redirect notice */}
      <p style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: 2,
        color: 'var(--faint)',
        textTransform: 'uppercase',
      }}>
        Redirecionando para o perfil em{' '}
        <span style={{ color: 'var(--red-dim)' }}>{countdown}s</span>
      </p>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}
