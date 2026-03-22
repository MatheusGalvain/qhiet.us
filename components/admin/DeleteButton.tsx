'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    await fetch(`/api/admin/transmissoes/${id}`, { method: 'DELETE' })
    router.refresh()
  }

  if (confirming) {
    return (
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {loading ? '...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Cancelar
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.5 }}
    >
      Deletar
    </button>
  )
}
