/**
 * Diagnóstico de Preços Stripe
 * Execute na raiz do projeto: node scripts/check-stripe-prices.mjs
 *
 * Verifica se os price IDs do .env.local existem e são recorrentes.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── lê o .env.local ──────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local')
let envContent = ''
try { envContent = readFileSync(envPath, 'utf8') } catch {
  console.error('❌  .env.local não encontrado. Execute na raiz do projeto.')
  process.exit(1)
}

function getEnv(key) {
  // ignora linhas comentadas (#)
  const match = envContent.split('\n')
    .find(l => !l.trim().startsWith('#') && l.startsWith(key + '='))
  return match?.split('=').slice(1).join('=').trim() ?? ''
}

const SK        = getEnv('STRIPE_SECRET_KEY')
const PRICES    = {
  iniciado: getEnv('STRIPE_PRICE_ID_INICIADO'),
  adepto:   getEnv('STRIPE_PRICE_ID_ADEPTO'),
  acervo:   getEnv('STRIPE_PRICE_ID_ACERVO'),
}

if (!SK) { console.error('❌  STRIPE_SECRET_KEY não encontrada no .env.local'); process.exit(1) }

const mode = SK.startsWith('sk_live_') ? '🔴 LIVE' : '🟢 TEST'
console.log(`\nStripe key mode: ${mode}`)
console.log('─'.repeat(60))

// ── chama Stripe API ──────────────────────────────────────────────────────
async function fetchStripe(path) {
  const creds = Buffer.from(SK + ':').toString('base64')
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    headers: { Authorization: `Basic ${creds}` },
  })
  return res.json()
}

for (const [plan, priceId] of Object.entries(PRICES)) {
  if (!priceId) {
    console.log(`[${plan.toUpperCase().padEnd(8)}]  ❌  Price ID não configurado`)
    continue
  }

  process.stdout.write(`[${plan.toUpperCase().padEnd(8)}]  ${priceId}  →  `)

  try {
    const p = await fetchStripe(`/prices/${priceId}`)

    if (p.error) {
      console.log(`❌  ERRO: ${p.error.message}`)
      if (p.error.code === 'resource_missing') {
        const hint = SK.startsWith('sk_test_')
          ? '  ⚠  Esse price foi criado em modo LIVE — não existe no modo TEST'
          : '  ⚠  Esse price não existe nessa conta Stripe'
        console.log(hint)
      }
      continue
    }

    const typeOk = p.type === 'recurring'
    const activeOk = p.active === true
    const amount = (p.unit_amount / 100).toLocaleString('pt-BR', { style: 'currency', currency: p.currency?.toUpperCase() ?? 'BRL' })

    const status = (typeOk && activeOk) ? '✅' : '⚠ '
    console.log(`${status}  type: ${p.type}  |  ${p.recurring?.interval ?? '—'}  |  ${amount}  |  active: ${p.active}`)

    if (!typeOk) console.log('         ⛔  PROBLEMA: type é "one_time" — precisa ser "recurring" para assinaturas')
    if (!activeOk) console.log('         ⛔  PROBLEMA: price está inativo/arquivado')

  } catch (e) {
    console.log(`❌  Falha na chamada: ${e.message}`)
  }
}

console.log('\n' + '─'.repeat(60))
console.log('Como corrigir:')
console.log('  1. Acesse dashboard.stripe.com/test/products')
console.log('  2. Para cada plano, crie um preço com Tipo = "Recorrente" (Recurring)')
console.log('  3. Copie os price IDs e atualize o .env.local')
console.log('  4. Certifique-se de estar em modo TEST ao criar os preços de teste')
console.log('')
