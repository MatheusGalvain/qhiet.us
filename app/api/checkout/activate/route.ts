/**
 * POST /api/checkout/activate
 *
 * Ativação de plano após checkout bem-sucedido.
 *
 * Por que isso existe:
 *   O webhook Stripe (`checkout.session.completed`) é a forma canônica de ativar
 *   o plano — mas em localhost ele nunca dispara porque o Stripe não consegue
 *   atingir 127.0.0.1. Este endpoint funciona como fallback: a página /checkout/sucesso
 *   chama-o diretamente passando o `session_id` que o Stripe inclui na successUrl.
 *
 *   Em produção o webhook continua sendo o mecanismo principal; este endpoint
 *   garante que o plano seja ativado mesmo que o webhook demore ou falhe.
 *
 * Segurança:
 *   - Requer usuário autenticado (Supabase session).
 *   - Busca a sessão diretamente na API Stripe — não confia em dados do cliente.
 *   - Verifica que `session.metadata.userId === user.id` antes de alterar.
 *   - Verifica `payment_status === 'paid'`.
 *   - Idempotente: pode ser chamado múltiplas vezes sem efeito colateral.
 */

import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { addPlan, resolvePlans } from '@/lib/plans'
import type { Plan } from '@/lib/plans'
import { sendWelcomeEmail } from '@/lib/resend/client'

const VALID_PLANS = ['iniciado', 'adepto', 'acervo'] as const
type ValidPlan = typeof VALID_PLANS[number]

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId obrigatório' }, { status: 400 })
    }

    // ── 1. Verificar usuário autenticado ─────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // ── 2. Buscar sessão direto na Stripe (não confia no cliente) ─────────
    let session
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId)
    } catch {
      return NextResponse.json({ error: 'Sessão Stripe não encontrada' }, { status: 404 })
    }

    // ── 3. Validações de segurança ────────────────────────────────────────
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Pagamento ainda não confirmado', status: session.payment_status },
        { status: 402 }
      )
    }

    const metaUserId = session.metadata?.userId
    if (!metaUserId || metaUserId !== user.id) {
      return NextResponse.json({ error: 'Sessão não pertence ao usuário' }, { status: 403 })
    }

    // ── 4. Determinar novo plano ──────────────────────────────────────────
    const planRaw = session.metadata?.plan ?? 'iniciado'
    const newPlan: ValidPlan = VALID_PLANS.includes(planRaw as ValidPlan)
      ? (planRaw as ValidPlan)
      : 'iniciado'

    // ── 5. Buscar planos actuais do perfil ────────────────────────────────
    const service = createServiceClient()
    const { data: profileData } = await service
      .from('profiles')
      .select('plan, plans')
      .eq('id', user.id)
      .single()

    const currentPlans = resolvePlans(
      (profileData as any)?.plans as string[] | null,
      (profileData as any)?.plan as Plan | null,
    )

    // ── 6. Combinar planos (não sobrescreve — soma) ───────────────────────
    const mergedPlans = addPlan(currentPlans, newPlan)

    // "primary plan" = o mais abrangente (adepto > iniciado > acervo)
    const primaryPlan: Plan =
      mergedPlans.includes('adepto')   ? 'adepto'   :
      mergedPlans.includes('iniciado') ? 'iniciado' :
      mergedPlans.includes('acervo')   ? 'acervo'   : 'profano'

    const isSubscriber = mergedPlans.includes('adepto') || mergedPlans.includes('iniciado')

    // ── 7. Persistir ──────────────────────────────────────────────────────
    const { error: updateError } = await service
      .from('profiles')
      .update({
        plan:                   primaryPlan,
        plans:                  mergedPlans,
        is_subscriber:          isSubscriber,
        stripe_customer_id:     session.customer     as string | null,
        stripe_subscription_id: session.subscription as string | null,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('[activate] Supabase update error:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
    }

    console.log(`[activate] Plans activated: userId=${user.id} plans=${mergedPlans.join(',')} primary=${primaryPlan}`)

    // Envia e-mail de boas-vindas para o plano recém-ativado (fire-and-forget)
    const email = user.email
    if (email && VALID_PLANS.includes(newPlan)) {
      const { data: profileForEmail } = await service
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()
      const name = (profileForEmail as any)?.name ?? email.split('@')[0]
      sendWelcomeEmail({ to: email, name, plan: newPlan }).catch(err =>
        console.error('[activate] welcome email error:', err)
      )
    }

    return NextResponse.json({ ok: true, plan: primaryPlan, plans: mergedPlans })

  } catch (err: any) {
    console.error('[activate] Unexpected error:', err)
    return NextResponse.json({ error: err.message ?? 'Erro interno' }, { status: 500 })
  }
}
