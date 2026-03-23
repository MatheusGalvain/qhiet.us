'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  transmissaoId: string
  xpReward?: number
}

export default function ReadingCompleteButton({ transmissaoId, xpReward = 50 }: Props) {
  const router = useRouter()
  const [alreadyRead, setAlreadyRead] = useState(false)
  const [loading, setLoading] = useState(false)
  const [xpToast, setXpToast] = useState<{ show: boolean; xp: number }>({ show: false, xp: 0 })
  const completedRef = useRef(false)
  const checkedRef = useRef(false)

  // Check if already read on mount
  useEffect(() => {
    if (checkedRef.current) return
    checkedRef.current = true
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('reading_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('transmissao_id', transmissaoId)
        .maybeSingle()
      if (data) {
        setAlreadyRead(true)
        completedRef.current = true
      }
    })()
  }, [transmissaoId])

  const handleComplete = useCallback(async () => {
    if (completedRef.current || loading) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setLoading(true)
    completedRef.current = true

    try {
      const { data, error } = await supabase.rpc('complete_reading', {
        p_transmissao_id: transmissaoId,
        p_xp: xpReward,
      })

      if (!error && data?.success) {
        setAlreadyRead(true)
        if (data.xp_earned > 0) {
          setXpToast({ show: true, xp: data.xp_earned })
          setTimeout(() => setXpToast(prev => ({ ...prev, show: false })), 4000)
        }
      }
    } catch {
      // silent — XP failure should not break reading experience
      completedRef.current = false
    } finally {
      setLoading(false)
    }
  }, [transmissaoId, xpReward, loading, router])

  return (
    <>
      {/* "Concluir Leitura" button — placed at the bottom of article content */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        margin: '0px 0 32px',
      }}>
        <button
          onClick={handleComplete}
          disabled={alreadyRead || loading}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: 4,
            textTransform: 'uppercase',
            padding: '16px 40px',
            border: '1px solid',
            borderColor: alreadyRead ? 'var(--gold-dim)' : 'var(--red)',
            background: alreadyRead ? 'transparent' : 'var(--red-faint)',
            color: alreadyRead ? 'var(--gold)' : 'var(--cream)',
            cursor: alreadyRead ? 'default' : 'pointer',
            transition: 'all .2s',
            opacity: loading ? 0.6 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {alreadyRead ? (
            <>✦ Leitura concluída</>
          ) : loading ? (
            <>Registrando…</>
          ) : (
            <>Concluir Leitura · +{xpReward} XP</>
          )}
        </button>
      </div>

      {/* XP toast — bottom-left */}
      <div
        role="status"
        aria-live="polite"
        style={{
          position: 'fixed',
          bottom: 32,
          left: 32,
          zIndex: 9999,
          transform: xpToast.show ? 'translateY(0)' : 'translateY(120%)',
          opacity: xpToast.show ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#0a0704',
          border: '1px solid var(--gold-dim)',
          padding: '14px 20px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gold)', lineHeight: 1 }}>✦</span>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: 3, color: 'var(--gold)', lineHeight: 1, marginBottom: 4 }}>
            +{xpToast.xp} XP
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase' }}>
            Leitura concluída
          </p>
        </div>
      </div>
    </>
  )
}
