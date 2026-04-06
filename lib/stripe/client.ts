import Stripe from 'stripe'
import type { Plan } from '@/types'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const STRIPE_PRICE_INICIADO = process.env.STRIPE_PRICE_ID_INICIADO!
export const STRIPE_PRICE_ADEPTO   = process.env.STRIPE_PRICE_ID_ADEPTO!
export const STRIPE_PRICE_ACERVO   = process.env.STRIPE_PRICE_ID_ACERVO!

/** Map plan name → Stripe price ID */
export const PLAN_TO_PRICE: Record<string, string> = {
  iniciado: STRIPE_PRICE_INICIADO,
  adepto:   STRIPE_PRICE_ADEPTO,
  acervo:   STRIPE_PRICE_ACERVO,
}

/** Create Stripe Checkout Session for any plan */
export async function createCheckoutSession({
  userId,
  userEmail,
  plan = 'iniciado',
  successUrl,
  cancelUrl,
}: {
  userId: string
  userEmail: string
  plan?: string
  successUrl: string
  cancelUrl: string
}) {
  const priceId = PLAN_TO_PRICE[plan] ?? STRIPE_PRICE_INICIADO

  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: userEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { userId, plan },
    success_url: successUrl,
    cancel_url: cancelUrl,
    locale: 'pt-BR',
  })
}

/** Create Stripe Customer Portal session */
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
}
