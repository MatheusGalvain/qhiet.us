'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createPortalSession } from '@/lib/stripe/client'

/**
 * Opens the Stripe Billing Portal for the current user.
 * The portal allows cancellation, plan change, and payment method updates.
 */
export async function openBillingPortal() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_subscription_id, is_subscriber')
    .eq('id', user.id)
    .single()

  if (!profile?.is_subscriber) {
    redirect('/membros')
  }

  let customerId = profile?.stripe_customer_id as string | null

  // Se não tiver o customer_id salvo mas tiver subscription_id,
  // busca o customer_id direto na Stripe e salva para o futuro.
  if (!customerId && profile?.stripe_subscription_id) {
    try {
      const { stripe } = await import('@/lib/stripe/client')
      const sub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)
      customerId = sub.customer as string
      if (customerId) {
        const { createServiceClient } = await import('@/lib/supabase/server')
        await createServiceClient()
          .from('profiles')
          .update({ stripe_customer_id: customerId })
          .eq('id', user.id)
      }
    } catch (_) {}
  }

  if (!customerId) {
    redirect('/perfil?erro=sem_customer_id')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.qhiethus.com.br'

  const session = await createPortalSession({
    customerId,
    returnUrl: `${appUrl}/perfil`,
  })

  redirect(session.url)
}
