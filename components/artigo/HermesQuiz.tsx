'use client'

import { useState, useTransition } from 'react'
import type { QuizQuestion } from '@/types'

interface HermesQuizProps {
  transmissaoId: string
  questions: QuizQuestion[]
  xpReward: number
  onComplete?: (xpEarned: number) => void
}

type QuizState = 'idle' | 'answering' | 'reviewing' | 'complete'

export default function HermesQuiz({ transmissaoId, questions, xpReward, onComplete }: HermesQuizProps) {
  const [state, setState] = useState<QuizState>('idle')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [score, setScore] = useState(0)
  const [, startTransition] = useTransition()

  const q = questions[current]
  const isLast = current === questions.length - 1

  function startQuiz() {
    setState('answering')
    setCurrent(0)
    setAnswers([])
    setScore(0)
  }

  function selectAnswer(idx: number) {
    if (answers[current] !== undefined) return
    const newAnswers = [...answers]
    newAnswers[current] = idx
    setAnswers(newAnswers)
  }

  function next() {
    if (isLast) {
      // Calculate score
      const correct = questions.reduce((acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0), 0)
      const xpEarned = Math.round((correct / questions.length) * xpReward)
      setScore(correct)
      setState('reviewing')

      // Submit to API
      startTransition(async () => {
        try {
          await fetch('/api/xp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transmissaoId, type: 'quiz', xp: xpEarned }),
          })
          onComplete?.(xpEarned)
        } catch { /* ignore */ }
      })
    } else {
      setCurrent(c => c + 1)
    }
  }

  const answered = answers[current] !== undefined
  const correct = answered ? answers[current] === q?.correct_index : null

  return (
    <div style={{ marginTop: 64, borderTop: '1px solid var(--faint)', paddingTop: 48 }}>
      {/* Header */}
      <p className="eyebrow" style={{ marginBottom: 16 }}>Hermes · Quiz de Compreensão</p>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 40, letterSpacing: 4, color: 'var(--cream)', marginBottom: 8 }}>
        TESTE SEU <span style={{ color: 'var(--red)' }}>CONHECIMENTO</span>
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 32, maxWidth: 480 }}>
        Complete o quiz para ganhar <span style={{ color: 'var(--gold)' }}>{xpReward} XP</span> e subir no ranking global.
      </p>

      {state === 'idle' && (
        <button onClick={startQuiz} className="btn-primary">
          Iniciar Quiz Hermes →
        </button>
      )}

      {state === 'answering' && q && (
        <div style={{ maxWidth: 640 }}>
          {/* Progress */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 3, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 16 }}>
            <span>Questão {current + 1} de {questions.length}</span>
            <span style={{ color: 'var(--gold)' }}>+{xpReward} XP</span>
          </div>
          <div style={{ height: 2, background: 'var(--faint)', marginBottom: 32 }}>
            <div style={{ height: '100%', width: `${((current + 1) / questions.length) * 100}%`, background: 'var(--red)', transition: 'width .3s' }} />
          </div>

          <p style={{ fontFamily: 'var(--font-body)', fontSize: 20, color: 'var(--cream)', lineHeight: 1.6, marginBottom: 28 }}>
            {q.question}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {q.options.map((opt, idx) => {
              let borderColor = 'var(--faint)'
              let color = 'var(--muted)'
              let bg = 'transparent'
              if (answered) {
                if (idx === q.correct_index) { borderColor = 'var(--red-dim)'; color = 'var(--cream)'; bg = 'var(--red-faint)' }
                else if (idx === answers[current]) { borderColor = '#3a1a10'; color = 'var(--muted)' }
              }
              return (
                <button
                  key={idx}
                  onClick={() => selectAnswer(idx)}
                  disabled={answered}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 20px', border: `1px solid ${borderColor}`,
                    background: bg, cursor: answered ? 'default' : 'pointer',
                    transition: 'all .2s', textAlign: 'left',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', minWidth: 20 }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 16, color, lineHeight: 1.5 }}>{opt}</span>
                </button>
              )
            })}
          </div>

          {answered && (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: correct ? 'var(--gold)' : 'var(--muted)', marginBottom: 16, borderLeft: '2px solid var(--red)', paddingLeft: 16 }}>
                {correct ? '✦ Correto. ' : '○ Incorreto. '}{q.explanation}
              </p>
              <button onClick={next} className="btn-primary">
                {isLast ? 'Ver resultado →' : 'Próxima →'}
              </button>
            </div>
          )}
        </div>
      )}

      {state === 'reviewing' && (
        <div style={{ maxWidth: 480 }}>
          <div style={{ border: '1px solid var(--faint)', padding: 32, marginBottom: 24 }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: 4, color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 12 }}>Resultado Final</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 64, color: 'var(--cream)', letterSpacing: 4, lineHeight: 1 }}>
              {score}<span style={{ fontSize: 32, color: 'var(--muted)' }}>/{questions.length}</span>
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--gold)', letterSpacing: 3, marginTop: 8 }}>
              +{Math.round((score / questions.length) * xpReward)} XP
            </p>
          </div>
          <button onClick={() => setState('idle')} className="btn-secondary">
            Refazer Quiz
          </button>
        </div>
      )}
    </div>
  )
}
