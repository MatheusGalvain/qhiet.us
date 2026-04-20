/**
 * POST /api/checkout/upgrade
 *
 * Faz upgrade de uma assinatura existente para o Adepto usando proration do Stripe.
 * O Stripe calcula automaticamente a diferença proporcional ao período restante
 * e cria uma fatura imediata — o usuário NÃO paga o preço cheio.
 *
 * Ex: Iniciado (R$19,99) → Adepto (R$29,99) com 15 dias restantes no ciclo:
 *   Stripe cobra ~R$5,00 (metade da diferença de R$10,00).
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const PRICE_MAP: Record<string, string | undefined> = {
  adepto: process.env.STRIPE_PRICE_ID_ADEPTO,
  acervo: process.env.STRIPE_PRICE_ID_ACERVO,
}

export async function POST(request: NextRequest) {
  try {
    // ── 1. Usuário autenticado ────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/login?redirect=/perfil', request.url), { status: 303 })
    }

    // ── 2. Plano alvo ─────────────────────────────────────────────────────
    const body    = await request.formData().catch(() => null)
    const toPlan  = (body?.get('plan') as string) ?? 'adepto'
    const priceId = PRICE_MAP[toPlan]
    if (!priceId) {
      return NextResponse.redirect(new URL('/perfil?error=plano_invalido', request.url), { status: 303 })
    }

    // ── 3. Buscar assinatura atual do perfil ──────────────────────────────
    const service = createServiceClient()
    const { data: profile } = await service
      .from('profiles')
      .select('plan, plans, stripe_subscription_id, stripe_customer_id')
      .eq('id', user.id)
      .single()

    const subscriptionId = (profile as any)?.stripe_subscription_id as string | null

    if (!subscriptionId) {
      // Sem assinatura ativa — manda para a página de membros comprar normalmente
      return NextResponse.redirect(
        new URL(`/membros?upgrade=${toPlan}`, request.url),
        { status: 303 },
      )
    }

    // ── 4. Buscar assinatura no Stripe ────────────────────────────────────
    let subscription
    try {
      subscription = await stripe.subscriptions.retrieve(subscriptionId)
    } catch (err: any) {
      // Assinatura não encontrada (ex: sub de teste com chave live, ou expirada)
      console.error('[upgrade] retrieve error:', err?.message)
      return NextResponse.redirect(
        new URL(`/membros?upgrade=${toPlan}`, request.url),
        { status: 303 },
      )
    }

    if (subscription.status !== 'active') {
      return NextResponse.redirect(
        new URL(`/membros?upgrade=${toPlan}`, request.url),
        { status: 303 },
      )
    }

    // ── 5. Atualizar assinatura com proration ─────────────────────────────
    // proration_behavior: 'always_invoice' → Stripe gera uma fatura imediata
    // com o valor proporcional (diferença × dias restantes ÷ dias do ciclo).
    // A fatura é cobrada automaticamente no cartão salvo do cliente.
    const currentItemId = subscription.items.data[0]?.id
    await stripe.subscriptions.update(subscriptionId, {
      items: [{ id: currentItemId, price: priceId }],
      proration_behavior: 'always_invoice',
    })

    // ── 6. O webhook customer.subscription.updated vai atualizar o plano ──
    // Mas atualizamos também aqui para resposta imediata na UI
    await service
      .from('profiles')
      .update({
        plan:  toPlan,
        plans: [...(((profile as any)?.plans as string[]) ?? []).filter((p: string) => p !== 'iniciado' && p !== 'acervo'), toPlan],
      })
      .eq('id', user.id)

    return NextResponse.redirect(
      new URL('/perfil?upgrade=ok', request.url),
      { status: 303 },
    )
  } catch (err: any) {
    console.error('[upgrade] erro:', err)
    return NextResponse.redirect(
      new URL(`/perfil?error=upgrade_falhou`, request.url),
      { status: 303 },
    )
  }
}
