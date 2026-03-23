'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { QuizQuestion } from '@/types'

interface HermesQuizProps {
  transmissaoId: string
  questions: QuizQuestion[]
  xpReward: number
  hasAccess?: boolean
  onComplete?: (xpEarned: number) => void
}

type QuizState = 'idle' | 'answering' | 'complete'

const RANKS = [
  { sym: '○', title: 'NEÓFITO',  sub: 'Rank I',  desc: 'O início de toda sabedoria é reconhecer o quanto ainda não se sabe. Releia este texto — o caminho ficará mais claro.' },
  { sym: '◈', title: 'INICIADO', sub: 'Rank II', desc: 'Sua compreensão é sólida. Você absorveu os conceitos centrais, mas há camadas mais profundas a explorar.' },
  { sym: '✦', title: 'ADEPTO',   sub: 'Rank III', desc: 'Você demonstrou compreensão profunda. Os conceitos deste texto já não são apenas palavras — são coordenadas de um mapa.' },
]

export default function HermesQuiz({ transmissaoId, questions, xpReward, hasAccess = true, onComplete }: HermesQuizProps) {
  const [state, setState] = useState<QuizState>('idle')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [xpEarned, setXpEarned] = useState(0)
  const [, startTransition] = useTransition()

  const q = questions[current]
  const isLast = current === questions.length - 1
  const answered = answers[current] !== undefined
  const correct = answered ? answers[current] === q?.correct_index : null

  function startQuiz() {
    setState('answering')
    setCurrent(0)
    setAnswers([])
    setScore(0)
  }

  function selectAnswer(idx: number) {
    if (answers[current] !== undefined) return
    const next = [...answers]
    next[current] = idx
    setAnswers(next)
  }

  function next() {
    if (isLast) {
      const correctCount = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0)
      const earned = Math.round((correctCount / questions.length) * xpReward)
      setScore(correctCount)
      setXpEarned(earned)
      setState('complete')
      startTransition(async () => {
        try {
          await fetch('/api/xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transmissaoId, type: 'quiz', xp: earned }),
          })
          onComplete?.(earned)
        } catch { /* ignore */ }
      })
    } else {
      setCurrent(c => c + 1)
    }
  }

  const rankIdx = Math.min(Math.floor((score / questions.length) * 3), 2)
  const rank = RANKS[rankIdx]

  return (
    <div style={{ marginTop: 72, borderTop: '1px solid var(--faint)', paddingTop: 56 }}>

      {/* Section header */}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 5, color: 'var(--red)', textTransform: 'uppercase', marginBottom: 14 }}>
        // Conhecimento Verificado
      </p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,44px)', letterSpacing: 4, color: 'var(--cream)', marginBottom: 8 }}>
        TESTE SEU NÍVEL
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
        Hermes analisou este texto e preparou {questions.length} perguntas. Responda para receber seu rank de conhecimento neste domínio.
      </p>

      {/* Step track */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40, maxWidth: 400 }}>
        {[
          { label: 'Leitura', sym: '✓', done: true, current: false },
          { label: 'Teste',   sym: '?', done: state === 'complete', current: state !== 'complete' },
          { label: 'Rank',    sym: '◈', done: false, current: state === 'complete' },
        ].map((step, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, position: 'relative' }}>
            {i < 2 && (
              <div style={{ position: 'absolute', top: 14, left: '50%', right: '-50%', height: 1, background: 'var(--faint)', zIndex: 0 }} />
            )}
            <div style={{
              width: 28, height: 28, borderRadius: '50%', zIndex: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 11,
              border: `1px solid ${step.done ? 'var(--red-dim)' : step.current ? 'var(--gold)' : 'var(--faint)'}`,
              background: step.done ? 'var(--red-faint)' : step.current ? 'rgba(200,150,10,0.08)' : 'var(--ink)',
              color: step.done ? 'var(--red)' : step.current ? 'var(--gold)' : 'var(--muted)',
              boxShadow: step.current ? '0 0 8px rgba(200,150,10,0.25)' : 'none',
              transition: 'all .3s',
            }}>
              {step.sym}
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2,
              textTransform: 'uppercase',
              color: step.done ? 'var(--red-dim)' : step.current ? 'var(--gold)' : 'var(--muted)',
            }}>
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* LOCKED STATE */}
      {!hasAccess && (
        <div style={{
          border: '1px solid var(--faint)', padding: '40px 32px',
          textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          maxWidth: 560,
        }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 52, color: 'var(--faint)', letterSpacing: 4 }}>?</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 6, color: 'var(--muted)' }}>QUIZ BLOQUEADO</p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 380 }}>
            Este quiz é exclusivo para assinantes. Torne-se um iniciado para desbloquear, acumular XP e subir no ranking global.
          </p>
          <Link href="/membros" className="btn-primary" style={{ marginTop: 8 }}>
            Ascender → Iniciado
          </Link>
        </div>
      )}

      {/* IDLE STATE */}
      {hasAccess && state === 'idle' && (
        <button onClick={startQuiz} className="btn-primary">
          Iniciar Quiz Hermes →
        </button>
      )}

      {/* ANSWERING STATE */}
      {hasAccess && state === 'answering' && q && (
        <div style={{ maxWidth: 640 }}>
          {/* Counter + progress bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3,
            color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12,
          }}>
            <span>Hermes · Pergunta {current + 1} de {questions.length}</span>
            <span style={{ color: 'var(--gold)' }}>+{xpReward} xp</span>
          </div>
          <div style={{ height: 2, background: 'var(--faint)', marginBottom: 32 }}>
            <div style={{
              height: '100%',
              width: `${((current + 1) / questions.length) * 100}%`,
              background: 'var(--red)', transition: 'width .3s',
            }} />
          </div>

          {/* Question */}
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 19, color: 'var(--cream)', lineHeight: 1.6, marginBottom: 28 }}>
            {q.question}
          </p>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.options.map((opt, idx) => {
              let border = 'var(--faint)'
              let color  = 'var(--muted)'
              let bg     = 'transparent'
              let cursor: string = answered ? 'default' : 'pointer'
              if (answered) {
                if (idx === q.correct_index)           { border = 'var(--red-dim)'; color = 'var(--cream)'; bg = 'var(--red-faint)' }
                else if (idx === answers[current])     { border = '#3a1a10'; color = '#3a2a20' }
              }
              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(idx)}
                  disabled={answered}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 18px', border: `1px solid ${border}`,
                    background: bg, cursor, transition: 'all .2s', textAlign: 'left',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: border === 'var(--faint)' ? 'var(--faint)' : color, minWidth: 20, flexShrink: 0 }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, color, lineHeight: 1.5 }}>{opt}</span>
                </button>
              )
            })}
          </div>

          {/* Feedback + next */}
          {answered && (
            <div style={{ marginTop: 20 }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 15, lineHeight: 1.7,
                color: correct ? 'var(--gold)' : 'var(--muted)',
                borderLeft: '2px solid var(--red)', paddingLeft: 16, marginBottom: 16,
              }}>
                {correct ? '✦ Correto. ' : '○ Incorreto. '}{q.explanation}
              </p>
              <button onClick={next} className="btn-primary">
                {isLast ? 'Ver meu rank →' : 'Próxima pergunta →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* COMPLETE STATE */}
      {hasAccess && state === 'complete' && (
        <div style={{ maxWidth: 560 }}>
          {/* Result card */}
          <div style={{
            border: '1px solid var(--gold-dim)', padding: '32px 28px',
            background: 'linear-gradient(135deg, var(--surface), rgba(200,150,10,0.04))',
            textAlign: 'center', marginBottom: 24,
          }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 64, letterSpacing: 8, color: 'var(--gold)', opacity: 0.6, lineHeight: 1, marginBottom: 8 }}>
              {rank.sym}
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 48, letterSpacing: 6, color: 'var(--cream)', marginBottom: 4 }}>
              {rank.title}
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>
              {rank.sub} · {score}/{questions.length} acertos
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 16 }}>
              {rank.desc}
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--gold)', letterSpacing: 3 }}>
              +{xpEarned} XP
            </p>
          </div>
          <button onClick={() => { setState('idle'); setCurrent(0); setAnswers([]) }} className="btn-secondary">
            Refazer Quiz
          </button>
        </div>
      )}
    </div>
  )
}
