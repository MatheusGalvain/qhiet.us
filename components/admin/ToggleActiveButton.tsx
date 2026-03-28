'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  active: boolean
}

export default function ToggleActiveButton({ id, active: initialActive }: Props) {
  const router = useRouter()
  const [active, setActive] = useState(initialActive)
  const [isPending, startTransition] = useTransition()

  async function toggle() {
    const next = !active
    setActive(next) // optimistic

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: next }),
      })

      if (!res.ok) {
        setActive(!next) // rollback
        alert('Erro ao alterar status da categoria.')
        return
      }

      startTransition(() => router.refresh())
    } catch {
      setActive(!next)
      alert('Erro de conexão.')
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      style={{
        fontFamily:    'var(--font-mono)',
        fontSize:      12,
        letterSpacing: 2,
        textTransform: 'uppercase',
        color:         active ? 'var(--gold)' : 'var(--muted)',
        background:    'none',
        border:        `1px solid ${active ? 'var(--gold)' : 'var(--faint)'}`,
        padding:       '2px 8px',
        cursor:        isPending ? 'wait' : 'pointer',
        opacity:       isPending ? 0.6 : 1,
        transition:    'color .15s, border-color .15s',
      }}
    >
      {active ? '● Ativa' : '○ Inativa'}
    </button>
  )
}
