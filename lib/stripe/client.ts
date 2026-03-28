import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const STRIPE_PRICE_INICIADO = process.env.STRIPE_PRICE_ID_INICIADO!

/** Create Stripe Checkout Session for Iniciado plan */
export async function createCheckoutSession({
  userId,
  userEmail,
  successUrl,
  cancelUrl,
}: {
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
}) {
  return stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    customer_email: userEmail,
    line_items: [
      {
        price: STRIPE_PRICE_INICIADO,
        quantity: 1,
      },
    ],
    metadata: { userId },
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
