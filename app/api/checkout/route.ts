import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Read plan from form body (default: 'iniciado')
    const body = await request.formData().catch(() => null)
    const plan = (body?.get('plan') as string) || 'iniciado'

    const PRICE_MAP: Record<string, string | undefined> = {
      iniciado: process.env.STRIPE_PRICE_ID_INICIADO,
      adepto:   process.env.STRIPE_PRICE_ID_ADEPTO,
      acervo:   process.env.STRIPE_PRICE_ID_ACERVO,
    }

    if (!process.env.STRIPE_SECRET_KEY || !PRICE_MAP[plan]) {
      console.error(`[checkout] Missing Stripe env var for plan: ${plan}`)
      return NextResponse.redirect(new URL('/membros?error=config', request.url))
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL(`/login?redirect=/membros`, request.url))
    }

    const { data: profile } = await supabase
      .from('profiles').select('email, name, plan').eq('id', user.id).single()

    // Guard: already on this plan or a higher one
    const currentPlan = (profile as any)?.plan ?? 'profano'
    if (currentPlan === plan) {
      return NextResponse.redirect(new URL('/perfil', request.url))
    }

    // Always derive the base URL from the incoming request so that:
    //   • in development (localhost) → redirects back to localhost
    //   • in production → redirects back to the production domain
    // Do NOT use NEXT_PUBLIC_APP_URL for Stripe callbacks — it may point to the
    // wrong environment and Stripe would reject it if not in the allowed list.
    const appUrl = request.nextUrl.origin

    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: (profile as any)?.email ?? user.email!,
      plan,
      // {CHECKOUT_SESSION_ID} é um template literal do Stripe — ele substitui
      // pelo ID real da sessão antes de redirecionar. A página de sucesso usa
      // esse ID para chamar /api/checkout/activate e ativar o plano diretamente,
      // sem depender de webhook (que não funciona em localhost).
      successUrl: `${appUrl}/checkout/sucesso?plan=${plan}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl:  `${appUrl}/membros`,
    })

    if (!session.url) {
      console.error('[checkout] Stripe session has no URL')
      return NextResponse.redirect(new URL('/membros?error=stripe', request.url))
    }

    return NextResponse.redirect(session.url, { status: 303 })
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error('[checkout] Stripe error:', msg)
    // Encode the Stripe error message so we can show it on the page
    const params = new URLSearchParams({ error: 'stripe', detail: msg })
    return NextResponse.redirect(new URL(`/membros?${params}`, request.url))
  }
}
