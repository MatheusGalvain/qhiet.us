'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  initialName?: string
  initialEmail?: string
  emailLocked?: boolean
}

type Status = 'idle' | 'sending' | 'success' | 'error' | 'cooldown'

export default function ContactForm({ initialName = '', initialEmail = '', emailLocked = false }: Props) {
  const [name, setName]       = useState(initialName)
  const [email, setEmail]     = useState(initialEmail)
  const [cooldown, setCooldown] = useState(0) // segundos restantes
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [title, setTitle]     = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus]   = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canSubmit = name.trim() && email.trim() && title.trim() && message.trim() && status !== 'sending' && cooldown === 0

  // Limpa o timer ao desmontar
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function startCooldown(seconds: number) {
    setCooldown(seconds)
    timerRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    setStatus('sending')
    setErrorMsg(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:    name.trim(),
          email:   email.trim(),
          title:   title.trim(),
          message: message.trim(),
        }),
      })

      const data = await res.json()

      if (res.status === 429) {
        // Extrai os segundos do erro e inicia contagem regressiva
        const match = data.error?.match(/(\d+)s/)
        const secs = match ? parseInt(match[1]) : 60
        startCooldown(secs)
        setErrorMsg(null)
        setStatus('idle')
        return
      }

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erro ao enviar. Tente novamente.')
        setStatus('error')
        return
      }

      startCooldown(60)
      setStatus('success')
    } catch {
      setErrorMsg('Erro de conexão. Tente novamente.')
      setStatus('error')
    }
  }

  const inputStyle: React.CSSProperties = {
    background:  'transparent',
    border:      '1px solid var(--faint)',
    color:       'var(--cream)',
    fontFamily:  'var(--font-mono)',
    fontSize:    13,
    letterSpacing: 1,
    padding:     '12px 16px',
    outline:     'none',
    width:       '100%',
    boxSizing:   'border-box',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily:    'var(--font-mono)',
    fontSize:      10,
    letterSpacing: 3,
    color:         'var(--muted)',
    textTransform: 'uppercase',
    display:       'block',
    marginBottom:  8,
  }

  if (status === 'success') {
    return (
      <div style={{
        border:     '1px solid var(--faint)',
        borderLeft: '2px solid var(--gold)',
        padding:    '40px 32px',
        display:    'flex',
        flexDirection: 'column',
        gap:        20,
      }}>
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      11,
          letterSpacing: 4,
          color:         'var(--gold)',
          textTransform: 'uppercase',
        }}>
          ✦ Mensagem enviada
        </p>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize:   16,
          color:      'var(--muted)',
          lineHeight: 1.8,
        }}>
          Recebemos sua mensagem e responderemos em breve pelo e-mail informado.
        </p>
        <button
          onClick={() => {
            setTitle(''); setMessage('')
            setStatus('idle'); setErrorMsg(null)
          }}
          style={{
            alignSelf:     'flex-start',
            background:    'transparent',
            border:        '1px solid var(--faint)',
            color:         'var(--muted)',
            fontFamily:    'var(--font-mono)',
            fontSize:      10,
            letterSpacing: 3,
            textTransform: 'uppercase',
            padding:       '10px 18px',
            cursor:        'pointer',
          }}
        >
          Enviar outra mensagem
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Name */}
      <div>
        <label style={labelStyle}>Nome</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Seu nome"
          maxLength={100}
          autoComplete="name"
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--muted)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'var(--faint)')}
        />
      </div>

      {/* Email */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>E-mail</label>
          {emailLocked && (
            <span style={{
              fontFamily:    'var(--font-mono)',
              fontSize:      9,
              letterSpacing: 2,
              color:         'var(--faint)',
              textTransform: 'uppercase',
            }}>
              vinculado à conta
            </span>
          )}
        </div>
        <input
          type="email"
          value={email}
          onChange={emailLocked ? undefined : e => setEmail(e.target.value)}
          readOnly={emailLocked}
          placeholder="seu@email.com"
          maxLength={254}
          autoComplete="email"
          style={{
            ...inputStyle,
            color:    emailLocked ? 'var(--muted)' : 'var(--cream)',
            cursor:   emailLocked ? 'default'      : 'text',
            opacity:  emailLocked ? 0.7            : 1,
          }}
          onFocus={e => { if (!emailLocked) e.currentTarget.style.borderColor = 'var(--muted)' }}
          onBlur={e  => { if (!emailLocked) e.currentTarget.style.borderColor = 'var(--faint)' }}
        />
      </div>

      {/* Title */}
      <div>
        <label style={labelStyle}>Título</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Assunto da sua mensagem"
          maxLength={200}
          style={inputStyle}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--muted)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'var(--faint)')}
        />
      </div>

      {/* Message */}
      <div>
        <label style={labelStyle}>Dúvida / Mensagem</label>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Descreva sua dúvida ou mensagem..."
          maxLength={5000}
          rows={7}
          style={{
            ...inputStyle,
            resize:     'vertical',
            lineHeight: 1.7,
            minHeight:  140,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--muted)')}
          onBlur={e  => (e.currentTarget.style.borderColor = 'var(--faint)')}
        />
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          letterSpacing: 1,
          color:         'var(--faint)',
          marginTop:     6,
          textAlign:     'right',
        }}>
          {message.length}/5000
        </p>
      </div>

      {/* Error */}
      {errorMsg && (
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      11,
          letterSpacing: 1,
          color:         'var(--red)',
        }}>
          {errorMsg}
        </p>
      )}

      {/* Submit */}
      <div>
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            background:    'transparent',
            border:        `1px solid ${canSubmit ? 'var(--gold)' : 'var(--faint)'}`,
            color:         canSubmit ? 'var(--gold)' : 'var(--faint)',
            fontFamily:    'var(--font-mono)',
            fontSize:      11,
            letterSpacing: 3,
            textTransform: 'uppercase',
            padding:       '14px 28px',
            cursor:        canSubmit ? 'pointer' : 'not-allowed',
            transition:    'color .15s, border-color .15s',
          }}
        >
          {status === 'sending'
            ? 'Enviando...'
            : cooldown > 0
            ? `Aguarde ${cooldown}s...`
            : 'Enviar mensagem →'}
        </button>
      </div>
    </form>
  )
}
