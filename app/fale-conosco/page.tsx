'use client'

import { useState } from 'react'

type Status = 'idle' | 'sending' | 'success' | 'error'

export default function FaleConoscoPage() {
  const [name, setName]       = useState('')
  const [email, setEmail]     = useState('')
  const [title, setTitle]     = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus]   = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const canSubmit = name.trim() && email.trim() && title.trim() && message.trim() && status !== 'sending'

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

      if (!res.ok) {
        setErrorMsg(data.error ?? 'Erro ao enviar. Tente novamente.')
        setStatus('error')
        return
      }

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
      <main style={{ padding: '80px 24px', maxWidth: 640, margin: '0 auto', minHeight: '70vh' }}>
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
              setName(''); setEmail(''); setTitle(''); setMessage('')
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
      </main>
    )
  }

  return (
    <main style={{ padding: '80px 24px', maxWidth: 640, margin: '0 auto', minHeight: '70vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 48 }}>
        <p style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      10,
          letterSpacing: 4,
          color:         'var(--red)',
          textTransform: 'uppercase',
          marginBottom:  16,
        }}>
          // Suporte
        </p>
        <h1 style={{
          fontFamily:    'var(--font-display)',
          fontSize:      'clamp(32px, 5vw, 48px)',
          letterSpacing: 4,
          color:         'var(--cream)',
          margin:        0,
          marginBottom:  16,
        }}>
          Fale Conosco
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize:   15,
          color:      'var(--muted)',
          lineHeight: 1.8,
          margin:     0,
        }}>
          Dúvidas, sugestões ou problemas com o portal? Preencha o formulário abaixo
          e responderemos pelo seu e-mail o mais breve possível.
        </p>
      </div>

      {/* Form */}
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
          <label style={labelStyle}>E-mail</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            maxLength={254}
            autoComplete="email"
            style={inputStyle}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--muted)')}
            onBlur={e  => (e.currentTarget.style.borderColor = 'var(--faint)')}
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
            {status === 'sending' ? 'Enviando...' : 'Enviar mensagem →'}
          </button>
        </div>
      </form>
    </main>
  )
}
