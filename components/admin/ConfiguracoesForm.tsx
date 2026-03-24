'use client'

import { useState, useTransition } from 'react'

interface Props {
  nextPostAt: string
}

export default function ConfiguracoesForm({ nextPostAt }: Props) {
  const [date, setDate] = useState(nextPostAt)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'next_post_at', value: date }),
        })
        if (!res.ok) throw new Error(await res.text())
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } catch (e: any) {
        setError(e.message)
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={{
          display: 'block',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
          textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8,
        }}>
          Data da próxima postagem
        </label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--faint)',
            color: 'var(--cream)',
            fontFamily: 'var(--font-mono)',
            fontSize: 14,
            letterSpacing: 2,
            padding: '10px 14px',
            width: '100%',
            outline: 'none',
            colorScheme: 'dark',
          }}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={isPending || !date}
        style={{
          background: saved ? 'var(--red-faint)' : 'transparent',
          border: `1px solid ${saved ? 'var(--red-dim)' : 'var(--faint)'}`,
          color: saved ? 'var(--red)' : 'var(--cream)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 3,
          textTransform: 'uppercase',
          padding: '12px 24px',
          cursor: isPending ? 'default' : 'pointer',
          opacity: isPending ? 0.6 : 1,
          transition: 'all .2s',
          alignSelf: 'flex-start',
        }}
      >
        {isPending ? 'Salvando...' : saved ? '✓ Salvo' : 'Salvar'}
      </button>

      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: 1 }}>
          Erro: {error}
        </p>
      )}
    </div>
  )
}
