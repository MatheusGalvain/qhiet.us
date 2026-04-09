'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createPortalSession, stripe } from '@/lib/stripe/client'

/**
 * Retorna a URL do Stripe Billing Portal ou um erro descritivo.
 * O redirect é feito no cliente para evitar conflito com NEXT_REDIRECT.
 */
export async function openBillingPortal(): Promise<{ url: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_subscription_id, is_subscriber')
    .eq('id', user.id)
    .single()

  if (!profile?.is_subscriber) return { error: 'Conta sem assinatura ativa.' }

  let customerId = profile?.stripe_customer_id as string | null

  // Se não tiver customer_id, tenta recuperar pelo subscription_id
  if (!customerId && profile?.stripe_subscription_id) {
    try {
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      customerId = sub.customer as string
      if (customerId) {
        await createServiceClient()
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      }
    } catch (err: any) {
      return { error: `Erro ao buscar assinatura na Stripe: ${err?.message ?? String(err)}` }
    }
  }

  if (!customerId) {
    return { error: 'ID de cliente Stripe não encontrado. Entre em contato com o suporte.' }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.qhiethus.com.br'
  const service = createServiceClient()

  try {
    const session = await createPortalSession({
      customerId,
      returnUrl: `${appUrl}/perfil`,
    })
    return { url: session.url }
  } catch (err: any) {
    const msg: string = err?.message ?? String(err)

    // Detecta customer de test mode sendo usado em live mode (ou vice-versa)
    // Tenta recuperar buscando o cliente pelo e-mail do usuário no modo correto
    if (msg.includes('similar object exists in test mode') || msg.includes('similar object exists in live mode')) {
      try {
        const { data: userData } = await supabase.auth.getUser()
        const email = userData.user?.email
        if (email) {
          const customers = await stripe.customers.list({ email, limit: 1 })
          const liveCustomer = customers.data[0]
          if (liveCustomer) {
            // Salva o customer correto e tenta criar a sessão
            await service
              .from('profiles')
              .update({ stripe_customer_id: liveCustomer.id })
              .eq('id', userData.user!.id)

            const session = await createPortalSession({
              customerId: liveCustomer.id,
              returnUrl: `${appUrl}/perfil`,
            })
            return { url: session.url }
          }
        }
        // Customer não existe em live mode — limpa o ID inválido
        await service
          .from('profiles')
          .update({ stripe_customer_id: null })
          .eq('id', (await supabase.auth.getUser()).data.user!.id)

        return { error: 'Sua assinatura foi cadastrada em ambiente de testes e não existe em produção. Entre em contato pelo suporte para regularizar.' }
      } catch (inner: any) {
        return { error: `Erro ao recuperar cliente Stripe: ${inner?.message ?? String(inner)}` }
      }
    }

    return { error: `Stripe: ${msg}` }
  }
}
