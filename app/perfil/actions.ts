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

  try {
    const session = await createPortalSession({
      customerId,
      returnUrl: `${appUrl}/perfil`,
    })
    return { url: session.url }
  } catch (err: any) {
    // Expõe a mensagem real da Stripe para diagnóstico
    return { error: `Stripe: ${err?.message ?? JSON.stringify(err)}` }
  }
}
