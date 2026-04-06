'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

/* ══════════════════════════════════════
   CONFETTI ENGINE (zero external deps)
══════════════════════════════════════ */
const CONFETTI_COLORS = [
  '#c8960a', '#d4af37', '#f5d060', '#e8c840', // gold
  '#b02a1e', '#e03020', '#ff7060',             // red
  '#ede5d8', '#c8c4bc', '#ffffff',             // cream/white
]

interface Particle {
  x: number; y: number
  vx: number; vy: number
  color: string
  w: number; h: number
  rotation: number; rotSpeed: number
  opacity: number; decay: number
}

function mkParticle(cw: number): Particle {
  return {
    x: Math.random() * cw,
    y: -12,
    vx: (Math.random() - 0.5) * 5,
    vy: Math.random() * 3 + 2,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    w: Math.random() * 10 + 5,
    h: Math.random() * 5 + 3,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.18,
    opacity: 1,
    decay: 0.003 + Math.random() * 0.003,
  }
}

function ConfettiCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number
    let particles: Particle[] = []
    let frame = 0

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame++

      // spawn burst for first ~3s (180 frames @ 60fps)
      if (frame < 180 && frame % 2 === 0) {
        for (let i = 0; i < 8; i++) particles.push(mkParticle(canvas.width))
      }

      particles = particles.filter(p => p.opacity > 0.01)

      for (const p of particles) {
        p.x  += p.vx
        p.y  += p.vy
        p.vy += 0.06
        p.vx *= 0.995
        p.rotation += p.rotSpeed
        p.opacity  -= p.decay

        ctx.save()
        ctx.globalAlpha = Math.max(p.opacity, 0)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }

      if (particles.length > 0 || frame < 180) raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 50 }}
    />
  )
}

/* ══════════════════════════════════════
   PLAN META
══════════════════════════════════════ */
const PLAN_META: Record<string, { label: string; symbol: string; color: string; tagline: string; desc: string }> = {
  iniciado: {
    label:   'INICIADO',
    symbol:  '◈',
    color:   'var(--red)',
    tagline: 'O Véu foi rasgado',
    desc:    'Acesso às transmissões exclusivas, trilhas e grimório.',
  },
  adepto: {
    label:   'ADEPTO',
    symbol:  '✦',
    color:   'var(--gold)',
    tagline: 'Portador da Chave de Ouro',
    desc:    'Acesso total à plataforma — transmissões, trilhas, grimório e acervo completo.',
  },
  acervo: {
    label:   'ACERVO',
    symbol:  '◉',
    color:   '#b8a07a',
    tagline: 'Guardião do Acervo',
    desc:    'Acesso exclusivo à Biblioteca Oculta — obras raras do esoterismo ocidental.',
  },
}

const REDIRECT_SECS = 10

/* ══════════════════════════════════════
   INNER PAGE (needs useSearchParams)
══════════════════════════════════════ */
function SucessoInner() {
  const router      = useRouter()
  const params      = useSearchParams()
  const planKey     = params.get('plan') ?? 'iniciado'
  const sessionId   = params.get('session_id') ?? ''
  const meta        = PLAN_META[planKey] ?? PLAN_META['iniciado']

  const [shown,       setShown]       = useState(false)
  const [countdown,   setCountdown]   = useState(REDIRECT_SECS)
  const [activating,  setActivating]  = useState(false)
  const [activated,   setActivated]   = useState(false)
  const [activateErr, setActivateErr] = useState('')

  // ── Ativar plano imediatamente via API (não depende de webhook) ──────
  useEffect(() => {
    if (!sessionId) return   // sem session_id não há como verificar
    if (activated || activating) return

    setActivating(true)
    fetch('/api/checkout/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) setActivated(true)
        else setActivateErr(data.error ?? 'Erro desconhecido')
      })
      .catch(e => setActivateErr(e.message))
      .finally(() => setActivating(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  // fade-in
  useEffect(() => { const t = setTimeout(() => setShown(true), 150); return () => clearTimeout(t) }, [])

  // countdown + redirect
  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(iv); router.push('/perfil'); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--ink)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: '2rem',
    }}>
      <ConfettiCanvas />

      {/* radial glow behind card */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -60%)',
        width: 700, height: 700,
        background: `radial-gradient(circle, ${
          planKey === 'adepto' ? 'rgba(200,150,10,0.10)' :
          planKey === 'acervo' ? 'rgba(184,160,122,0.08)' :
          'rgba(176,42,30,0.08)'
        } 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* card */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        textAlign: 'center',
        maxWidth: 520,
        width: '100%',
        padding: 'clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 4vw, 3rem)',
        border: `1px solid ${meta.color}44`,
        background: 'var(--surface)',
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        {/* symbol */}
        <div style={{
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          color: meta.color,
          textShadow: `0 0 30px ${meta.color}99`,
          marginBottom: '1.2rem',
          animation: 'sucesso-pulse 2.5s ease-in-out infinite',
          lineHeight: 1,
        }}>
          {meta.symbol}
        </div>

        {/* headline */}
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2rem, 7vw, 4rem)',
          letterSpacing: '0.06em',
          color: 'var(--cream)',
          lineHeight: 1,
          marginBottom: '0.3rem',
        }}>
          PARABÉNS
        </h1>

        {/* plan badge */}
        <p style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
          letterSpacing: '0.25em',
          color: meta.color,
          marginBottom: '1.8rem',
        }}>
          {meta.symbol}&nbsp;&nbsp;{meta.label}&nbsp;&nbsp;—&nbsp;&nbsp;{meta.tagline}
        </p>

        {/* divider */}
        <div style={{
          width: 56,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
          margin: '0 auto 1.8rem',
        }} />

        {/* description */}
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(0.9rem, 2vw, 1.05rem)',
          color: 'var(--text-secondary)',
          lineHeight: 1.75,
          marginBottom: '1.4rem',
        }}>
          Sua assinatura foi confirmada com sucesso.<br />
          {meta.desc}
        </p>

        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          letterSpacing: '0.18em',
          color: 'var(--muted)',
          textTransform: 'uppercase',
          marginBottom: '2rem',
        }}>
          ✦ &nbsp; Bem-vindo ao círculo interno &nbsp; ✦
        </p>

        {/* CTA */}
        <Link
          href="/perfil"
          style={{
            display: 'inline-block',
            padding: '0.85rem 2.8rem',
            background: 'transparent',
            border: `1px solid ${meta.color}`,
            color: meta.color,
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.2em',
            fontSize: '0.95rem',
            textDecoration: 'none',
            transition: 'background 0.2s, color 0.2s',
            marginBottom: '1.5rem',
          }}
          onMouseEnter={e => {
            ;(e.currentTarget as HTMLElement).style.background = meta.color
            ;(e.currentTarget as HTMLElement).style.color = 'var(--ink)'
          }}
          onMouseLeave={e => {
            ;(e.currentTarget as HTMLElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLElement).style.color = meta.color
          }}
        >
          VER MEU PERFIL
        </Link>

        {/* activation status */}
        {sessionId && (
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem',
            color: activated ? '#4caf50' : activateErr ? '#e57373' : 'var(--muted)',
          }}>
            {activating  && '⏳  Ativando plano…'}
            {activated   && '✅  Plano ativado com sucesso'}
            {activateErr && `⚠  ${activateErr}`}
            {!sessionId  && ''}
          </p>
        )}

        {/* countdown */}
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          letterSpacing: '0.1em',
          color: 'var(--faint-col)',
          textTransform: 'uppercase',
        }}>
          Redirecionando em{' '}
          <span style={{ color: 'var(--muted)' }}>{countdown}s</span>
        </p>
      </div>

      <style>{`
        @keyframes sucesso-pulse {
          0%, 100% { opacity: 1;    transform: scale(1); }
          50%       { opacity: 0.72; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

/* ══════════════════════════════════════
   EXPORT — Suspense wraps useSearchParams
══════════════════════════════════════ */
export default function CheckoutSucessoPage() {
  return (
    <Suspense fallback={null}>
      <SucessoInner />
    </Suspense>
  )
}
