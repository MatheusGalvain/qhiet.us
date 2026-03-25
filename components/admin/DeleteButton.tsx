'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface DeleteProps {
  id: string | number;
  title: string;
  endpoint: 'categories' | 'transmissoes';
}

export default function DeleteButton({ id, title, endpoint }: DeleteProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      // Agora a URL é dinâmica baseada na prop 'endpoint'
      const response = await fetch(`/api/admin/${endpoint}/${id}`, { 
        method: 'DELETE' 
      })

      if (!response.ok) {
        throw new Error('Falha ao deletar item')
      }

      setConfirming(false)
      router.refresh() // Atualiza a lista na tela
    } catch (error) {
      console.error(error)
      alert('Erro ao excluir. Verifique se existem dependências ligadas a este item.')
    } finally {
      setLoading(false)
    }
  }

  if (confirming) {
    return (
      <span style={{ display: 'flex',  gap: 6, alignItems: 'start', flexDirection: 'column' }}>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          {loading ? '...' : 'Confirmar'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          Cancelar
        </button>
      </span>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      style={{ fontFamily: 'var(--font-mono)', display:'flex', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, opacity: 0.5 }}
    >
      delete
    </button>
  )
}
