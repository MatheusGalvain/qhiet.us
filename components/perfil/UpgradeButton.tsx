'use client'

import { useState } from 'react'

interface Props {
  fromPlan: 'iniciado' | 'acervo'
}

const PLAN_LABELS: Record<string, string> = {
  iniciado: 'Iniciado',
  acervo:   'Acervo',
}

const FROM_PLAN_DESC: Record<string, string> = {
  iniciado: 'transmissões exclusivas',
  acervo:   'acesso à biblioteca',
}

export default function UpgradeButton({ fromPlan }: Props) {
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <>
      {/* Botão que abre o modal */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'block', width: '100%', padding: '12px',
          textAlign: 'center', fontFamily: 'var(--font-mono)',
          fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
          background: 'transparent', border: '1px solid var(--gold-dim)',
          color: 'var(--gold)', cursor: 'pointer', marginBottom: 16,
        }}
      >
        ✦ Fazer upgrade para Adepto — pague só a diferença →
      </button>

      {/* Modal */}
      {open && (
        <div
          onClick={() => { if (!loading) setOpen(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--gold-dim)',
              padding: '36px 32px',
              maxWidth: 460, width: '100%',
            }}
          >
            {/* Título */}
            <p style={{
              fontFamily: 'var(--font-display)', fontSize: 22,
              letterSpacing: 3, color: 'var(--gold)', marginBottom: 8,
            }}>
              ✦ Upgrade para Adepto
            </p>
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              letterSpacing: 3, color: 'var(--muted)',
              textTransform: 'uppercase', marginBottom: 28,
            }}>
              Como funciona a cobrança
            </p>

            {/* Explicação */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 12,
              letterSpacing: 1, color: 'var(--cream)', lineHeight: 2,
              marginBottom: 28,
            }}>
              <p style={{ marginBottom: 16 }}>
                Você está no plano <strong style={{ color: 'var(--gold)' }}>{PLAN_LABELS[fromPlan]}</strong> e vai passar para o <strong style={{ color: 'var(--gold)' }}>Adepto</strong>, que inclui {FROM_PLAN_DESC[fromPlan]} + o restante dos benefícios.
              </p>
              <p style={{ marginBottom: 16 }}>
                <strong style={{ color: 'var(--cream)' }}>Você não paga o preço cheio.</strong> A Stripe calcula automaticamente o valor proporcional aos dias que restam no seu ciclo atual e cobra apenas essa diferença no seu cartão já cadastrado.
              </p>
              <p style={{
                padding: '12px 16px',
                border: '1px solid var(--faint)',
                color: 'var(--muted)',
                fontSize: 11, lineHeight: 1.8,
              }}>
                Exemplo: se faltam 15 dias no ciclo e a diferença de plano é R$10,00 — você paga ~R$5,00 agora. No próximo ciclo já é cobrado o valor normal do Adepto.
              </p>
            </div>

            {/* Botões */}
            <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
              <form
                action="/api/checkout/upgrade"
                method="POST"
                onSubmit={() => setLoading(true)}
              >
                <input type="hidden" name="plan" value="adepto" />
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'block', width: '100%', padding: '13px',
                    textAlign: 'center', fontFamily: 'var(--font-mono)',
                    fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
                    background: loading ? 'var(--faint)' : 'var(--gold)',
                    border: 'none', color: '#000',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Processando...' : '✦ Confirmar upgrade →'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                style={{
                  display: 'block', width: '100%', padding: '13px',
                  textAlign: 'center', fontFamily: 'var(--font-mono)',
                  fontSize: 11, letterSpacing: 3, textTransform: 'uppercase',
                  background: 'transparent', border: '1px solid var(--faint)',
                  color: 'var(--muted)', cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
