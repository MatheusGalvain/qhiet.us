'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Transmissao } from '@/types'

interface Props {
  transmissao: Transmissao
  hasAccess: boolean
  isFree?: boolean
  quizXpReward?: number | null
  questionCount?: number
  hasQuiz?: boolean
}

export default function ArticleSidebarClient({ transmissao: t, hasAccess, isFree = false, quizXpReward = null, questionCount = 0, hasQuiz = false }: Props) {
  const [pct, setPct] = useState(0)

  useEffect(() => {
    function onScroll() {
      const marker = document.getElementById('article-end')
      const scrollTop = window.scrollY || document.documentElement.scrollTop
      const viewportH = window.innerHeight

      if (marker) {
        // Progress = how far the viewport bottom has reached the marker top
        const markerTop = marker.getBoundingClientRect().top + scrollTop
        const target = markerTop - viewportH
        if (target <= 0) { setPct(100); return }
        setPct(Math.min(100, Math.round((scrollTop / target) * 100)))
      } else {
        // Fallback: full page scroll
        const scrollHeight = document.documentElement.scrollHeight - viewportH
        if (scrollHeight <= 0) return
        setPct(Math.min(100, Math.round((scrollTop / scrollHeight) * 100)))
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // calc on mount
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // XP real: leitura usa t.xp_reward; quiz usa quiz.xp_reward dividido proporcionalmente por acertos
  const readXP = t.xp_reward
  const totalMax = readXP + (quizXpReward ?? 0)

  // Gera linhas dinâmicas do quiz: 1 acerto até N acertos
  const quizRows = hasQuiz && quizXpReward && questionCount > 0
    ? Array.from({ length: questionCount }, (_, i) => {
        const k = i + 1
        const xp = Math.round((k / questionCount) * quizXpReward)
        return { k, xp, isMax: k === questionCount }
      })
    : []

  const barColor = pct >= 100 ? 'var(--gold)' : 'var(--red)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Reading progress tracker */}
      <div style={{ border: '1px solid var(--faint)', padding: 20 }}>
        <p style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4,
          color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 14,
        }}>
          <span style={{ color: 'var(--red-dim)' }}>// </span>Progresso de leitura
        </p>
        <div style={{ height: 2, background: 'var(--faint)', marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, transition: 'width .2s' }} />
        </div>
        <p style={{
          fontFamily: 'var(--font-display)', fontSize: 40, color: 'var(--cream)',
          letterSpacing: 2, lineHeight: 1,
        }}>
          {pct}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginLeft: 2 }}>%</span>
        </p>
      </div>

      {/* XP breakdown — only for subscriber-only articles */}
      {!isFree && (
        <div style={{ border: '1px solid var(--faint)', padding: 20 }}>
          <p style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4,
            color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16,
          }}>
            <span style={{ color: 'var(--red-dim)' }}>// </span>Conhecimento disponível
          </p>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Linha de leitura */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0',
              borderBottom: '1px solid var(--faint)',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>
                Leitura completa
              </span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--muted)', letterSpacing: 1 }}>
                +{readXP}{' '}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>xp</span>
              </span>
            </div>

            {/* Linhas dinâmicas do quiz */}
            {hasQuiz ? (
              quizRows.length > 0 ? quizRows.map(({ k, xp, isMax }) => (
                <div key={k} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: isMax ? 'none' : '1px solid var(--faint)',
                  borderTop: isMax ? '1px solid var(--faint)' : 'none',
                  marginTop: isMax ? 2 : 0,
                }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--muted)', textTransform: 'uppercase' }}>
                    Quiz — {k} {k === 1 ? 'acerto' : 'acertos'}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 18,
                    color: isMax ? 'var(--gold)' : 'var(--muted)', letterSpacing: 1,
                  }}>
                    +{xp}{' '}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>xp</span>
                  </span>
                </div>
              )) : null
            ) : (
              /* Sem quiz */
              <div style={{
                padding: '10px 0',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: 'var(--cream)', fontSize: 12 }}>○</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: 2, color: 'var(--cream)', textTransform: 'uppercase' }}>
                  Não há quiz para esta transmissão
                </span>
              </div>
            )}
          </div>

          {/* Total máximo */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--faint)',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
              Máximo neste texto
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--cream)', letterSpacing: 2 }}>
              {totalMax} xp
            </span>
          </div>
        </div>
      )}

      {/* Article meta */}
      <div style={{ border: '1px solid var(--faint)', padding: 20 }}>
        {[
          ['Categoria', t.categories?.[0]?.charAt(0).toUpperCase() + t.categories?.[0]?.slice(1) || '—'],
          ['Nível', t.access === 'free' ? '◉ Leitura Livre' : '◈ Iniciados'],
        ].map(([label, val], i, arr) => (
          <div key={label as string} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 0',
            borderBottom: i < arr.length - 1 ? '1px solid var(--faint)' : 'none',
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>{label as string}</span>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: 18, letterSpacing: 1,
              color: t.access === 'free' ? 'var(--red-dim)' : 'var(--gold)',
            }}>
              {val as string}
            </span>
          </div>
        ))}
      </div>

      {/* CTA if locked */}
      {!hasAccess && (
        <Link href="/membros" className="btn-primary" style={{ display: 'block', textAlign: 'center' }}>
          Consulte nossos planos →
        </Link>
      )}
    </div>
  )
}
