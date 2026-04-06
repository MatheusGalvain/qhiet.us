'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteButton({ bookId, bookTitle }: { bookId: string; bookTitle: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/biblioteca?id=${bookId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro ao deletar.')
      router.push('/control/biblioteca')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setDeleting(false)
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3,
          textTransform: 'uppercase', padding: '10px 18px',
          border: '1px solid var(--faint)', color: 'var(--muted)',
          background: 'transparent', cursor: 'pointer',
        }}
      >
        Deletar obra
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--red)', lineHeight: 1.6 }}>
        Tem certeza? Esta ação remove <strong>"{bookTitle}"</strong> do banco de dados e apaga o PDF do armazenamento. Não pode ser desfeita.
      </p>
      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', borderLeft: '2px solid var(--red)', paddingLeft: 10 }}>
          {error}
        </p>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={handleDelete}
          disabled={deleting}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3,
            textTransform: 'uppercase', padding: '10px 18px',
            border: '1px solid var(--red)', color: 'var(--red)',
            background: 'transparent', cursor: 'pointer',
            opacity: deleting ? 0.6 : 1,
          }}
        >
          {deleting ? 'Deletando…' : 'Confirmar exclusão'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 3,
            textTransform: 'uppercase', padding: '10px 18px',
            border: '1px solid var(--faint)', color: 'var(--muted)',
            background: 'transparent', cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
