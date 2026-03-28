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
    .select('stripe_customer_id, is_subscriber')
    .eq('id', user.id)
    .single()

  if (!profile?.is_subscriber) {
    redirect('/membros')
  }

  if (!profile?.stripe_customer_id) {
    // stripe_customer_id not stored yet — redirect with a help message
    redirect('/perfil?erro=sem_customer_id')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://qhiethus.com.br'

  const session = await createPortalSession({
    customerId: profile.stripe_customer_id,
    returnUrl: `${appUrl}/perfil`,
  })

  redirect(session.url)
}
