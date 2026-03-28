'use client'

import { useState, useTransition } from 'react'
import { openBillingPortal } from '@/app/perfil/actions'

export default function BillingPortalButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      try {
        await openBillingPortal()
      } catch (err: any) {
        // redirect() throws internally — ignore NEXT_REDIRECT
        if (err?.digest?.startsWith('NEXT_REDIRECT')) return
        setError('Não foi possível abrir o portal. Tente novamente.')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <button
        onClick={handleClick}
        disabled={isPending}
        style={{
          background: 'transparent',
          border: '1px solid var(--faint)',
          color: isPending ? 'var(--faint)' : 'var(--muted)',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 3,
          textTransform: 'uppercase',
          padding: '10px 18px',
          cursor: isPending ? 'not-allowed' : 'pointer',
          whiteSpace: 'nowrap',
          transition: 'color .15s, border-color .15s',
        }}
        onMouseEnter={e => {
          if (!isPending) {
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--cream)'
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)'
          }
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'
          ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--faint)'
        }}
      >
        {isPending ? 'Aguarde...' : 'Gerenciar assinatura →'}
      </button>
      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', letterSpacing: 1 }}>
          {error}
        </p>
      )}
    </div>
  )
}
