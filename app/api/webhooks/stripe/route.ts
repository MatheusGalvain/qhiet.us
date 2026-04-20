import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { PRICE_TO_PLAN, addPlan, resolvePlans } from '@/lib/plans'
import type { Plan } from '@/lib/plans'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

/** Merge a new plan into the existing plans array and compute primary plan — lookup by user id */
async function mergePlanForUser(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  newPlan: Plan,
  extraFields: Record<string, unknown> = {},
) {
  const { data: profileData } = await supabase
    .from('profiles').select('plan, plans').eq('id', userId).single()

  const currentPlans = resolvePlans(
    (profileData as any)?.plans as string[] | null,
    (profileData as any)?.plan as Plan | null,
  )
  const mergedPlans = addPlan(currentPlans, newPlan)

  const primaryPlan: Plan =
    mergedPlans.includes('adepto')   ? 'adepto'   :
    mergedPlans.includes('iniciado') ? 'iniciado' :
    mergedPlans.includes('acervo')   ? 'acervo'   : 'profano'

  await supabase
    .from('profiles')
    .update({
      plan:         primaryPlan,
      plans:        mergedPlans,
      is_subscriber: mergedPlans.includes('adepto') || mergedPlans.includes('iniciado') || mergedPlans.includes('acervo'),
      ...extraFields,
    })
    .eq('id', userId)

  return { primaryPlan, mergedPlans }
}

/** Merge a new plan into the existing plans array — lookup by stripe_customer_id */
async function mergePlanForCustomer(
  supabase: ReturnType<typeof createServiceClient>,
  customerId: string,
  newPlan: Plan,
) {
  const { data: profileData } = await supabase
    .from('profiles').select('plan, plans').eq('stripe_customer_id', customerId).single()
  if (!profileData) return

  const currentPlans = resolvePlans(
    (profileData as any)?.plans as string[] | null,
    (profileData as any)?.plan as Plan | null,
  )
  const mergedPlans = addPlan(currentPlans, newPlan)

  const primaryPlan: Plan =
    mergedPlans.includes('adepto')   ? 'adepto'   :
    mergedPlans.includes('iniciado') ? 'iniciado' :
    mergedPlans.includes('acervo')   ? 'acervo'   : 'profano'

  await supabase
    .from('profiles')
    .update({
      plan:          primaryPlan,
      plans:         mergedPlans,
      is_subscriber: mergedPlans.includes('adepto') || mergedPlans.includes('iniciado') || mergedPlans.includes('acervo'),
    })
    .eq('stripe_customer_id', customerId)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature invalid' }, { status: 400 })
  }

  const supabase = createServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      if (!userId) break

      let plan = (session.metadata?.plan ?? 'iniciado') as Plan
      if (!['iniciado', 'adepto', 'acervo'].includes(plan)) plan = 'iniciado'

      await mergePlanForUser(supabase, userId, plan, {
        stripe_customer_id:     session.customer     as string,
        stripe_subscription_id: session.subscription as string,
      })
      break
    }

    case 'customer.subscription.updated': {
      // Handle plan change (e.g. upgrade from Iniciado to Adepto via Stripe portal)
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const priceId = subscription.items.data[0]?.price?.id
      const newPlan = priceId ? (PRICE_TO_PLAN[priceId] ?? 'iniciado') : 'iniciado'

      // Use mergePlanForCustomer so plans[] stays in sync
      await mergePlanForCustomer(supabase, customerId, newPlan)
      break
    }

    case 'customer.subscription.deleted': {
      // Remove the specific cancelled plan from plans[] instead of blowing everything away
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const priceId = subscription.items.data[0]?.price?.id
      const cancelledPlan = priceId ? (PRICE_TO_PLAN[priceId] ?? null) : null

      // Fetch current profile by customer ID
      const { data: profileData } = await supabase
        .from('profiles').select('plan, plans').eq('stripe_customer_id', customerId).single()
      if (!profileData) break

      const currentPlans = resolvePlans(
        (profileData as any)?.plans as string[] | null,
        (profileData as any)?.plan as Plan | null,
      )

      // Remove cancelled plan (or clear all if plan can't be determined)
      const newPlans: Plan[] = cancelledPlan
        ? currentPlans.filter(p => p !== cancelledPlan)
        : []

      const primaryPlan: Plan =
        newPlans.includes('adepto')   ? 'adepto'   :
        newPlans.includes('iniciado') ? 'iniciado' :
        newPlans.includes('acervo')   ? 'acervo'   : 'profano'

      await supabase
        .from('profiles')
        .update({
          plan:          primaryPlan,
          plans:         newPlans,
          is_subscriber: newPlans.includes('adepto') || newPlans.includes('iniciado') || newPlans.includes('acervo'),
        })
        .eq('stripe_customer_id', customerId)
      break
    }

    case 'customer.subscription.resumed':
    case 'invoice.payment_succeeded': {
      const obj = event.data.object as any
      const subscriptionId = obj.subscription ?? obj.id
      if (subscriptionId) {
        // Re-fetch subscription to get the current price/plan
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          const customerId = sub.customer as string
          const priceId = sub.items.data[0]?.price?.id
          const plan = priceId ? (PRICE_TO_PLAN[priceId] ?? 'iniciado') : 'iniciado'

          await mergePlanForCustomer(supabase, customerId, plan)
        } catch {
          // fallback: no-op — don't make assumptions about plan
        }
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
