'use client'

import { useState, useTransition } from 'react'

interface Question {
  question: string
  options: [string, string, string, string]
  correct_index: number
  explanation: string
}

interface Props {
  transmissaoId: string
  initialQuiz: { id?: string; questions: Question[]; xp_reward: number } | null
}

const emptyQuestion = (): Question => ({
  question: '',
  options: ['', '', '', ''],
  correct_index: 0,
  explanation: '',
})

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--surface)',
  border: '1px solid var(--faint)',
  color: 'var(--cream)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  padding: '10px 14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: 3,
  textTransform: 'uppercase' as const,
  color: 'var(--muted)',
  marginBottom: 6,
}

export default function QuizEditor({ transmissaoId, initialQuiz }: Props) {
  const [questions, setQuestions] = useState<Question[]>(
    initialQuiz?.questions?.length ? initialQuiz.questions : [emptyQuestion()]
  )
  const [xpReward, setXpReward] = useState(initialQuiz?.xp_reward ?? 50)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'generating'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [deletePending, startDelete] = useTransition()

  function updateQuestion(i: number, field: keyof Question, value: any) {
    setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  function updateOption(qi: number, oi: number, value: string) {
    setQuestions(qs => qs.map((q, idx) => {
      if (idx !== qi) return q
      const opts = [...q.options] as [string, string, string, string]
      opts[oi] = value
      return { ...q, options: opts }
    }))
  }

  function addQuestion() {
    setQuestions(qs => [...qs, emptyQuestion()])
  }

  function removeQuestion(i: number) {
    setQuestions(qs => qs.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    // Basic validation
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) { setStatus('error'); setErrorMsg(`Questão ${i + 1}: enunciado obrigatório.`); return }
      if (q.options.some(o => !o.trim())) { setStatus('error'); setErrorMsg(`Questão ${i + 1}: todas as alternativas são obrigatórias.`); return }
    }

    setStatus('saving')
    setErrorMsg('')

    const res = await fetch('/api/admin/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transmissao_id: transmissaoId, questions, xp_reward: xpReward }),
    })

    if (!res.ok) {
      const data = await res.json()
      setStatus('error')
      setErrorMsg(data.error ?? 'Erro ao salvar.')
    } else {
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  async function handleGenerateAI() {
    if (!confirm('Isso vai substituir as questões atuais com questões geradas por IA. Continuar?')) return
    setStatus('generating')
    setErrorMsg('')

    // Delete existing quiz first so the generate endpoint creates a new one
    await fetch(`/api/admin/quiz?transmissao_id=${transmissaoId}`, { method: 'DELETE' })

    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transmissaoId }),
    })

    if (!res.ok) {
      setStatus('error')
      setErrorMsg('Erro ao gerar quiz com IA. Verifique a chave OpenAI.')
      return
    }

    const data = await res.json()
    if (data.questions) {
      setQuestions(data.questions)
      setXpReward(data.xp_reward ?? 50)
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 3000)
    } else {
      setStatus('error')
      setErrorMsg('Resposta inválida da IA.')
    }
  }

  async function handleDelete() {
    if (!confirm('Deletar todo o quiz desta transmissão?')) return
    startDelete(async () => {
      await fetch(`/api/admin/quiz?transmissao_id=${transmissaoId}`, { method: 'DELETE' })
      setQuestions([emptyQuestion()])
      setStatus('idle')
    })
  }

  const hasExisting = !!initialQuiz

  return (
    <div style={{ marginTop: 48 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--faint)', paddingTop: 32, marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: 2, color: 'var(--cream)', lineHeight: 1 }}>Quiz</h2>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase', marginTop: 6 }}>
            {hasExisting ? `${initialQuiz.questions.length} questão(ões) cadastrada(s)` : 'Nenhum quiz ainda'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleGenerateAI}
            disabled={status === 'generating'}
            style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--gold)', color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer', opacity: status === 'generating' ? 0.5 : 1 }}
          >
            {status === 'generating' ? 'Gerando…' : '✦ Gerar com IA'}
          </button>
          {hasExisting && (
            <button
              onClick={handleDelete}
              disabled={deletePending}
              style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--red-dim)', color: 'var(--red-dim)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer' }}
            >
              Deletar Quiz
            </button>
          )}
        </div>
      </div>

      {/* XP Reward */}
      <div style={{ marginBottom: 32, maxWidth: 200 }}>
        <label style={labelStyle}>XP por questão acertada</label>
        <input
          type="number"
          min={1}
          max={500}
          value={xpReward}
          onChange={e => setXpReward(Number(e.target.value))}
          style={inputStyle}
        />
      </div>

      {/* Questions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        {questions.map((q, qi) => (
          <div key={qi} style={{ background: 'var(--surface)', border: '1px solid var(--faint)', padding: '24px 24px 28px' }}>

            {/* Question header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, color: 'var(--gold)', textTransform: 'uppercase' }}>
                Questão {qi + 1}
              </span>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qi)}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}
                >
                  ✕ Remover
                </button>
              )}
            </div>

            {/* Enunciado */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Enunciado</label>
              <textarea
                rows={2}
                value={q.question}
                onChange={e => updateQuestion(qi, 'question', e.target.value)}
                placeholder="Ex: Qual é o princípio hermético do ritmo?"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>

            {/* Alternativas */}
            <div style={{ marginBottom: 20 }}>
              <label style={labelStyle}>Alternativas — selecione a correta</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['A', 'B', 'C', 'D'] as const).map((letter, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Correct radio */}
                    <button
                      type="button"
                      onClick={() => updateQuestion(qi, 'correct_index', oi)}
                      style={{
                        flexShrink: 0,
                        width: 28,
                        height: 28,
                        border: `2px solid ${q.correct_index === oi ? 'var(--gold)' : 'var(--faint)'}`,
                        background: q.correct_index === oi ? 'var(--gold)' : 'transparent',
                        color: q.correct_index === oi ? '#000' : 'var(--muted)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all .15s',
                      }}
                      title="Marcar como correta"
                    >
                      {letter}
                    </button>
                    <input
                      type="text"
                      value={q.options[oi]}
                      onChange={e => updateOption(qi, oi, e.target.value)}
                      placeholder={`Alternativa ${letter}`}
                      style={{ ...inputStyle, border: q.correct_index === oi ? '1px solid var(--gold)' : '1px solid var(--faint)' }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 1, color: 'var(--muted)', marginTop: 8 }}>
                Clique na letra para marcar a alternativa correta.
              </p>
            </div>

            {/* Explicação */}
            <div>
              <label style={labelStyle}>Explicação (mostrada após responder)</label>
              <textarea
                rows={2}
                value={q.explanation}
                onChange={e => updateQuestion(qi, 'explanation', e.target.value)}
                placeholder="Ex: O Princípio do Ritmo diz que tudo flui e reflui…"
                style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Add question */}
      <button
        onClick={addQuestion}
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, background: 'none', border: '1px dashed var(--faint)', color: 'var(--muted)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', padding: '12px 20px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}
      >
        + Adicionar questão
      </button>

      {/* Error */}
      {status === 'error' && (
        <div style={{ marginTop: 16, padding: '12px 16px', borderLeft: '3px solid var(--red)', background: 'var(--red-faint)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--red)', letterSpacing: 1 }}>
          {errorMsg}
        </div>
      )}

      {/* Save button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
        <button
          onClick={handleSave}
          disabled={status === 'saving' || status === 'generating'}
          style={{
            padding: '12px 28px',
            background: status === 'saved' ? 'transparent' : 'var(--red)',
            border: status === 'saved' ? '1px solid var(--gold)' : '1px solid var(--red)',
            color: status === 'saved' ? 'var(--gold)' : '#fff',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: 3,
            textTransform: 'uppercase',
            cursor: status === 'saving' ? 'wait' : 'pointer',
            opacity: status === 'saving' ? 0.6 : 1,
            transition: 'all .3s',
          }}
        >
          {status === 'saving' ? 'Salvando…' : status === 'saved' ? '✓ Salvo' : 'Salvar Quiz →'}
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: 2, color: 'var(--muted)', textTransform: 'uppercase' }}>
          {questions.length} questão(ões) · {xpReward} XP cada
        </span>
      </div>
    </div>
  )
}
